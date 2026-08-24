-- Allow project assets to use either the historical per-user namespace or the
-- shared workspace namespace already enforced by the storage.objects policies.
--
-- Accepted project paths:
--   <auth.uid()>/<project_id>/<asset...>
--   workspaces/<workspace_id>/<project_id>/<asset...>
--
-- The workspace_id used below is always resolved from public.projects. A caller
-- cannot widen access by supplying a different workspace_id or by embedding a
-- workspace/project identifier belonging to another project in p_path.
-- Access remains unchanged: owner/admin/editor members may register assets;
-- viewer members and users outside the workspace are rejected by
-- project_os_project_workspace -> project_os_ensure_workspace_editor.

create or replace function hollow_private.register_project_asset_with_limit(
  p_bucket text,
  p_path text,
  p_project_id uuid default null,
  p_workspace_id uuid default null,
  p_hash text default null,
  p_size_bytes bigint default 0,
  p_duration_seconds numeric default null,
  p_format text default null,
  p_sample_rate integer default null,
  p_license_state text default 'unknown',
  p_metadata jsonb default '{}'::jsonb
)
returns table(
  id uuid,
  project_id uuid,
  workspace_id uuid,
  owner_id uuid,
  bucket text,
  path text,
  hash text,
  size_bytes bigint,
  duration_seconds numeric,
  format text,
  sample_rate integer,
  license_state text,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := hollow_private.project_os_user_id();
  v_workspace_id uuid := p_workspace_id;
  v_tier text := coalesce(hollow_private.project_os_tier_for_user(v_user_id), 'free');
  v_limit_bytes bigint := hollow_private.project_os_storage_limit_bytes(coalesce(hollow_private.project_os_tier_for_user(v_user_id), 'free'));
  v_current_bytes bigint := 0;
  v_old_size bigint := 0;
  v_next_bytes bigint;
  v_asset_id uuid;
  v_size_bytes bigint := greatest(coalesce(p_size_bytes, 0), 0);
  v_license_state text := coalesce(nullif(p_license_state, ''), 'unknown');
  v_path text := p_path;
  v_path_parts text[];
  v_is_legacy_project_path boolean := false;
  v_is_workspace_project_path boolean := false;
begin
  if p_bucket not in ('project-audio', 'project-stems', 'project-exports', 'asset-library', 'user-avatars') then
    raise exception 'Unsupported storage bucket: %', p_bucket
      using errcode = '22023';
  end if;

  if v_path is null or v_path = '' or v_path <> btrim(v_path) then
    raise exception 'Asset path is required and must not contain surrounding whitespace'
      using errcode = '22023';
  end if;

  v_path_parts := string_to_array(v_path, '/');

  if v_path like '/%'
    or v_path like '%/'
    or v_path like '%//%'
    or strpos(v_path, E'\\') > 0
    or exists (
      select 1
      from pg_catalog.unnest(v_path_parts) as path_part(value)
      where path_part.value in ('', '.', '..')
        or path_part.value ~ '[[:cntrl:]]'
    )
  then
    raise exception 'Asset path contains unsafe segments'
      using errcode = '22023';
  end if;

  if v_license_state not in ('unknown', 'owned', 'royalty-free', 'marketplace-licensed', 'restricted') then
    v_license_state := 'unknown';
  end if;

  if p_project_id is not null then
    -- Resolves the canonical workspace and rejects viewer/outsider access before
    -- any quota lookup or project_assets mutation occurs.
    v_workspace_id := hollow_private.project_os_project_workspace(p_project_id, v_user_id);

    if p_workspace_id is not null and p_workspace_id <> v_workspace_id then
      raise exception 'Asset workspace does not match project workspace'
        using errcode = '22023';
    end if;

    v_is_legacy_project_path := coalesce(
      cardinality(v_path_parts) >= 3
      and v_path_parts[1] = v_user_id::text
      and v_path_parts[2] = p_project_id::text,
      false
    );

    v_is_workspace_project_path := coalesce(
      cardinality(v_path_parts) >= 4
      and v_path_parts[1] = 'workspaces'
      and v_path_parts[2] = v_workspace_id::text
      and v_path_parts[3] = p_project_id::text,
      false
    );

    if not (v_is_legacy_project_path or v_is_workspace_project_path) then
      raise exception 'Asset path does not match the authenticated project scope'
        using errcode = '42501';
    end if;
  else
    -- Preserve the existing non-project contract: library/avatar assets remain
    -- private to the authenticated user's namespace.
    perform hollow_private.project_os_ensure_workspace_editor(v_workspace_id, v_user_id);

    if cardinality(v_path_parts) < 2 or v_path_parts[1] <> v_user_id::text then
      raise exception 'Asset path outside user scope'
        using errcode = '42501';
    end if;
  end if;

  select coalesce(pa.size_bytes, 0)
  into v_old_size
  from public.project_assets pa
  where pa.bucket = p_bucket
    and pa.path = v_path;

  select coalesce(sum(pa.size_bytes), 0)
  into v_current_bytes
  from public.project_assets pa
  where (
    v_workspace_id is not null
    and pa.workspace_id = v_workspace_id
  ) or (
    v_workspace_id is null
    and pa.workspace_id is null
    and pa.owner_id = v_user_id
  );

  v_next_bytes := greatest(v_current_bytes - coalesce(v_old_size, 0), 0) + v_size_bytes;

  if v_limit_bytes <> -1 and v_next_bytes > v_limit_bytes then
    raise exception 'Storage quota exceeded'
      using errcode = 'P0001',
            hint = 'upgrade:storage_bytes';
  end if;

  insert into public.project_assets (
    project_id,
    workspace_id,
    owner_id,
    bucket,
    path,
    hash,
    size_bytes,
    duration_seconds,
    format,
    sample_rate,
    license_state,
    metadata,
    updated_at
  )
  values (
    p_project_id,
    v_workspace_id,
    v_user_id,
    p_bucket,
    v_path,
    nullif(p_hash, ''),
    v_size_bytes,
    p_duration_seconds,
    nullif(p_format, ''),
    p_sample_rate,
    v_license_state,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  on conflict on constraint project_assets_bucket_path_key do update
  set
    project_id = excluded.project_id,
    workspace_id = excluded.workspace_id,
    owner_id = excluded.owner_id,
    hash = excluded.hash,
    size_bytes = excluded.size_bytes,
    duration_seconds = excluded.duration_seconds,
    format = excluded.format,
    sample_rate = excluded.sample_rate,
    license_state = excluded.license_state,
    metadata = excluded.metadata,
    updated_at = now()
  returning public.project_assets.id into v_asset_id;

  perform hollow_private.project_os_record_usage(
    v_user_id,
    v_workspace_id,
    'storage_bytes',
    greatest(v_size_bytes - coalesce(v_old_size, 0), 0),
    v_tier,
    jsonb_build_object('bucket', p_bucket, 'path', v_path, 'projectId', p_project_id)
  );

  return query
  select
    pa.id,
    pa.project_id,
    pa.workspace_id,
    pa.owner_id,
    pa.bucket,
    pa.path,
    pa.hash,
    pa.size_bytes,
    pa.duration_seconds,
    pa.format,
    pa.sample_rate,
    pa.license_state,
    pa.metadata,
    pa.created_at,
    pa.updated_at
  from public.project_assets pa
  where pa.id = v_asset_id;
end;
$$;

-- Reassert the established privilege boundary after replacing the function.
-- The public SECURITY INVOKER wrapper still delegates to this exact signature.
revoke all on function hollow_private.register_project_asset_with_limit(text, text, uuid, uuid, text, bigint, numeric, text, integer, text, jsonb)
  from public, anon, authenticated;

grant execute on function hollow_private.register_project_asset_with_limit(text, text, uuid, uuid, text, bigint, numeric, text, integer, text, jsonb)
  to authenticated, service_role;
