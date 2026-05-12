-- Project OS v1: enforce snapshots, assets, usage, and render queue through RPCs.
-- Public RPCs stay SECURITY INVOKER; privileged checks and writes live in hollow_private.

create schema if not exists hollow_private;

revoke all on schema hollow_private from public, anon, authenticated;
grant usage on schema hollow_private to authenticated, service_role;

create or replace function hollow_private.project_os_user_id()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  return v_user_id;
end;
$$;

create or replace function hollow_private.project_os_tier_for_user(p_user_id uuid)
returns text
language sql
security definer
set search_path = ''
as $$
  select case
    when lower(coalesce(nullif(p.tier, ''), 'free')) in ('pro', 'studio')
      then lower(coalesce(nullif(p.tier, ''), 'free'))
    else 'free'
  end
  from public.profiles p
  where p.id = p_user_id;
$$;

create or replace function hollow_private.project_os_storage_limit_bytes(p_tier text)
returns bigint
language sql
security definer
set search_path = ''
as $$
  select case p_tier
    when 'studio' then 1024::bigint * 1024 * 1024 * 1024
    when 'pro' then 100::bigint * 1024 * 1024 * 1024
    else 5::bigint * 1024 * 1024 * 1024
  end;
$$;

create or replace function hollow_private.project_os_render_limit_minutes(p_tier text)
returns numeric
language sql
security definer
set search_path = ''
as $$
  select case p_tier
    when 'studio' then -1::numeric
    when 'pro' then 120::numeric
    else 0::numeric
  end;
$$;

create or replace function hollow_private.project_os_ensure_workspace_editor(
  p_workspace_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_workspace_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = p_user_id
      and lower(coalesce(wm.role, 'viewer')) in ('owner', 'admin', 'editor')
  ) then
    raise exception 'Workspace editor access required'
      using errcode = '42501';
  end if;
end;
$$;

create or replace function hollow_private.project_os_project_workspace(
  p_project_id uuid,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace_id uuid;
begin
  select p.workspace_id
  into v_workspace_id
  from public.projects p
  where p.id = p_project_id;

  if v_workspace_id is null then
    raise exception 'Project not found'
      using errcode = 'P0002';
  end if;

  perform hollow_private.project_os_ensure_workspace_editor(v_workspace_id, p_user_id);
  return v_workspace_id;
end;
$$;

create or replace function hollow_private.project_os_record_usage(
  p_user_id uuid,
  p_workspace_id uuid,
  p_metric text,
  p_quantity numeric,
  p_tier text,
  p_metadata jsonb default '{}'::jsonb,
  p_period_start date default date_trunc('month', now())::date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_quantity is null or p_quantity <= 0 then
    return;
  end if;

  insert into public.usage_events (
    user_id,
    workspace_id,
    metric,
    quantity,
    period_start,
    tier_at_event,
    metadata
  )
  values (
    p_user_id,
    p_workspace_id,
    p_metric,
    p_quantity,
    coalesce(p_period_start, date_trunc('month', now())::date),
    case when p_tier in ('pro', 'studio') then p_tier else 'free' end,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function hollow_private.create_project_snapshot_with_limit(
  p_project_id uuid,
  p_label text default null,
  p_data jsonb default '{}'::jsonb
)
returns table(
  id uuid,
  project_id uuid,
  workspace_id uuid,
  created_by uuid,
  label text,
  schema_version text,
  data jsonb,
  size_bytes bigint,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := hollow_private.project_os_user_id();
  v_workspace_id uuid;
  v_tier text := coalesce(hollow_private.project_os_tier_for_user(v_user_id), 'free');
  v_snapshot_id uuid;
begin
  if p_project_id is null then
    raise exception 'Project is required'
      using errcode = '22023';
  end if;

  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'Project snapshot data must be a JSON object'
      using errcode = '22023';
  end if;

  if v_tier = 'free' then
    raise exception 'Project snapshots require Pro or Studio'
      using errcode = 'P0001',
            hint = 'upgrade:projectSnapshots';
  end if;

  v_workspace_id := hollow_private.project_os_project_workspace(p_project_id, v_user_id);

  insert into public.project_snapshots (
    project_id,
    workspace_id,
    created_by,
    label,
    schema_version,
    data,
    size_bytes
  )
  values (
    p_project_id,
    v_workspace_id,
    v_user_id,
    nullif(btrim(coalesce(p_label, '')), ''),
    coalesce(nullif(p_data->>'version', ''), '3.0-reference'),
    p_data,
    octet_length(convert_to(p_data::text, 'UTF8'))
  )
  returning public.project_snapshots.id into v_snapshot_id;

  perform hollow_private.project_os_record_usage(
    v_user_id,
    v_workspace_id,
    'snapshot',
    1,
    v_tier,
    jsonb_build_object('projectId', p_project_id, 'snapshotId', v_snapshot_id)
  );

  return query
  select
    ps.id,
    ps.project_id,
    ps.workspace_id,
    ps.created_by,
    ps.label,
    ps.schema_version,
    ps.data,
    ps.size_bytes,
    ps.created_at
  from public.project_snapshots ps
  where ps.id = v_snapshot_id;
end;
$$;

create or replace function public.create_project_snapshot_with_limit(
  p_project_id uuid,
  p_label text default null,
  p_data jsonb default '{}'::jsonb
)
returns table(
  id uuid,
  project_id uuid,
  workspace_id uuid,
  created_by uuid,
  label text,
  schema_version text,
  data jsonb,
  size_bytes bigint,
  created_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from hollow_private.create_project_snapshot_with_limit(p_project_id, p_label, p_data);
$$;

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
begin
  if p_bucket not in ('project-audio', 'project-stems', 'project-exports', 'asset-library', 'user-avatars') then
    raise exception 'Unsupported storage bucket: %', p_bucket
      using errcode = '22023';
  end if;

  if p_path is null or btrim(p_path) = '' then
    raise exception 'Asset path is required'
      using errcode = '22023';
  end if;

  if position(v_user_id::text || '/' in p_path) <> 1 then
    raise exception 'Asset path outside user scope'
      using errcode = '42501';
  end if;

  if v_license_state not in ('unknown', 'owned', 'royalty-free', 'marketplace-licensed', 'restricted') then
    v_license_state := 'unknown';
  end if;

  if p_project_id is not null then
    v_workspace_id := hollow_private.project_os_project_workspace(p_project_id, v_user_id);
    if p_workspace_id is not null and p_workspace_id <> v_workspace_id then
      raise exception 'Asset workspace does not match project workspace'
        using errcode = '22023';
    end if;
  else
    perform hollow_private.project_os_ensure_workspace_editor(v_workspace_id, v_user_id);
  end if;

  select coalesce(pa.size_bytes, 0)
  into v_old_size
  from public.project_assets pa
  where pa.bucket = p_bucket
    and pa.path = p_path;

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
    p_path,
    nullif(p_hash, ''),
    v_size_bytes,
    p_duration_seconds,
    nullif(p_format, ''),
    p_sample_rate,
    v_license_state,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  on conflict (bucket, path) do update
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
    jsonb_build_object('bucket', p_bucket, 'path', p_path, 'projectId', p_project_id)
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

create or replace function public.register_project_asset_with_limit(
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
language sql
security invoker
set search_path = ''
as $$
  select *
  from hollow_private.register_project_asset_with_limit(
    p_bucket,
    p_path,
    p_project_id,
    p_workspace_id,
    p_hash,
    p_size_bytes,
    p_duration_seconds,
    p_format,
    p_sample_rate,
    p_license_state,
    p_metadata
  );
$$;

create or replace function hollow_private.create_render_job_with_limit(
  p_project_id uuid,
  p_kind text default 'master',
  p_format text default 'wav',
  p_bit_depth integer default 24,
  p_sample_rate integer default 48000,
  p_input jsonb default '{}'::jsonb
)
returns table(
  id uuid,
  project_id uuid,
  workspace_id uuid,
  requested_by uuid,
  kind text,
  status text,
  format text,
  bit_depth integer,
  sample_rate integer,
  input jsonb,
  output_asset_id uuid,
  error text,
  created_at timestamptz,
  updated_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := hollow_private.project_os_user_id();
  v_workspace_id uuid;
  v_tier text := coalesce(hollow_private.project_os_tier_for_user(v_user_id), 'free');
  v_limit numeric := hollow_private.project_os_render_limit_minutes(coalesce(hollow_private.project_os_tier_for_user(v_user_id), 'free'));
  v_current numeric := 0;
  v_job_id uuid;
  v_kind text := coalesce(nullif(p_kind, ''), 'master');
  v_format text := coalesce(nullif(p_format, ''), 'wav');
begin
  if v_tier = 'free' then
    raise exception 'Cloud render requires Pro or Studio'
      using errcode = 'P0001',
            hint = 'upgrade:cloudRender';
  end if;

  if v_kind not in ('master', 'stems', 'preview') then
    raise exception 'Unsupported render kind: %', v_kind
      using errcode = '22023';
  end if;

  if v_format not in ('wav', 'aiff', 'flac', 'mp3') then
    raise exception 'Unsupported render format: %', v_format
      using errcode = '22023';
  end if;

  if p_bit_depth not in (16, 24, 32) then
    raise exception 'Unsupported bit depth: %', p_bit_depth
      using errcode = '22023';
  end if;

  if p_sample_rate not in (44100, 48000, 88200, 96000, 192000) then
    raise exception 'Unsupported sample rate: %', p_sample_rate
      using errcode = '22023';
  end if;

  v_workspace_id := hollow_private.project_os_project_workspace(p_project_id, v_user_id);

  select coalesce(sum(ue.quantity), 0)
  into v_current
  from public.usage_events ue
  where ue.workspace_id = v_workspace_id
    and ue.metric = 'render_minutes'
    and ue.period_start = date_trunc('month', now())::date;

  if v_limit <> -1 and v_current >= v_limit then
    raise exception 'Render minutes quota exceeded'
      using errcode = 'P0001',
            hint = 'upgrade:render_minutes';
  end if;

  insert into public.render_jobs (
    project_id,
    workspace_id,
    requested_by,
    kind,
    status,
    format,
    bit_depth,
    sample_rate,
    input
  )
  values (
    p_project_id,
    v_workspace_id,
    v_user_id,
    v_kind,
    'queued',
    v_format,
    coalesce(p_bit_depth, 24),
    coalesce(p_sample_rate, 48000),
    coalesce(p_input, '{}'::jsonb)
  )
  returning public.render_jobs.id into v_job_id;

  return query
  select
    rj.id,
    rj.project_id,
    rj.workspace_id,
    rj.requested_by,
    rj.kind,
    rj.status,
    rj.format,
    rj.bit_depth,
    rj.sample_rate,
    rj.input,
    rj.output_asset_id,
    rj.error,
    rj.created_at,
    rj.updated_at,
    rj.started_at,
    rj.completed_at
  from public.render_jobs rj
  where rj.id = v_job_id;
end;
$$;

create or replace function public.create_render_job_with_limit(
  p_project_id uuid,
  p_kind text default 'master',
  p_format text default 'wav',
  p_bit_depth integer default 24,
  p_sample_rate integer default 48000,
  p_input jsonb default '{}'::jsonb
)
returns table(
  id uuid,
  project_id uuid,
  workspace_id uuid,
  requested_by uuid,
  kind text,
  status text,
  format text,
  bit_depth integer,
  sample_rate integer,
  input jsonb,
  output_asset_id uuid,
  error text,
  created_at timestamptz,
  updated_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from hollow_private.create_render_job_with_limit(
    p_project_id,
    p_kind,
    p_format,
    p_bit_depth,
    p_sample_rate,
    p_input
  );
$$;

create or replace function hollow_private.update_render_job_status_with_scope(
  p_render_job_id uuid,
  p_status text,
  p_output_asset_id uuid default null,
  p_error text default null
)
returns table(
  id uuid,
  project_id uuid,
  workspace_id uuid,
  requested_by uuid,
  kind text,
  status text,
  format text,
  bit_depth integer,
  sample_rate integer,
  input jsonb,
  output_asset_id uuid,
  error text,
  created_at timestamptz,
  updated_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := hollow_private.project_os_user_id();
  v_workspace_id uuid;
  v_now timestamptz := now();
begin
  if p_status not in ('queued', 'running', 'succeeded', 'failed', 'cancelled') then
    raise exception 'Unsupported render status: %', p_status
      using errcode = '22023';
  end if;

  select rj.workspace_id
  into v_workspace_id
  from public.render_jobs rj
  where rj.id = p_render_job_id
    and (
      rj.requested_by = v_user_id
      or exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = rj.workspace_id
          and wm.user_id = v_user_id
          and lower(coalesce(wm.role, 'viewer')) in ('owner', 'admin')
      )
    );

  if v_workspace_id is null then
    raise exception 'Render job not found or not editable'
      using errcode = '42501';
  end if;

  update public.render_jobs rj
  set
    status = p_status,
    output_asset_id = case when p_output_asset_id is not null then p_output_asset_id else rj.output_asset_id end,
    error = case when p_error is not null then p_error else rj.error end,
    started_at = case when p_status = 'running' and rj.started_at is null then v_now else rj.started_at end,
    completed_at = case when p_status in ('succeeded', 'failed', 'cancelled') then v_now else rj.completed_at end,
    updated_at = v_now
  where rj.id = p_render_job_id;

  return query
  select
    rj.id,
    rj.project_id,
    rj.workspace_id,
    rj.requested_by,
    rj.kind,
    rj.status,
    rj.format,
    rj.bit_depth,
    rj.sample_rate,
    rj.input,
    rj.output_asset_id,
    rj.error,
    rj.created_at,
    rj.updated_at,
    rj.started_at,
    rj.completed_at
  from public.render_jobs rj
  where rj.id = p_render_job_id;
end;
$$;

create or replace function public.update_render_job_status_with_scope(
  p_render_job_id uuid,
  p_status text,
  p_output_asset_id uuid default null,
  p_error text default null
)
returns table(
  id uuid,
  project_id uuid,
  workspace_id uuid,
  requested_by uuid,
  kind text,
  status text,
  format text,
  bit_depth integer,
  sample_rate integer,
  input jsonb,
  output_asset_id uuid,
  error text,
  created_at timestamptz,
  updated_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from hollow_private.update_render_job_status_with_scope(
    p_render_job_id,
    p_status,
    p_output_asset_id,
    p_error
  );
$$;

create or replace function hollow_private.get_project_os_usage(
  p_workspace_id uuid default null,
  p_period_start date default date_trunc('month', now())::date
)
returns table(metric text, quantity numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := hollow_private.project_os_user_id();
  v_period_start date := coalesce(p_period_start, date_trunc('month', now())::date);
begin
  if p_workspace_id is not null and not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = v_user_id
  ) then
    raise exception 'Workspace access required'
      using errcode = '42501';
  end if;

  return query
  with metrics(metric) as (
    values
      ('storage_bytes'),
      ('ai_action'),
      ('render_minutes'),
      ('sample_claim'),
      ('collaborator_seat'),
      ('snapshot')
  ),
  event_usage as (
    select ue.metric, coalesce(sum(ue.quantity), 0)::numeric as quantity
    from public.usage_events ue
    where ue.period_start = v_period_start
      and (
        (p_workspace_id is not null and ue.workspace_id = p_workspace_id)
        or (p_workspace_id is null and ue.user_id = v_user_id)
      )
    group by ue.metric
  ),
  current_storage as (
    select coalesce(sum(pa.size_bytes), 0)::numeric as quantity
    from public.project_assets pa
    where (
      p_workspace_id is not null
      and pa.workspace_id = p_workspace_id
    ) or (
      p_workspace_id is null
      and pa.owner_id = v_user_id
    )
  )
  select
    m.metric,
    case
      when m.metric = 'storage_bytes' then (select quantity from current_storage)
      else coalesce(eu.quantity, 0)
    end as quantity
  from metrics m
  left join event_usage eu on eu.metric = m.metric
  order by m.metric;
end;
$$;

create or replace function public.get_project_os_usage(
  p_workspace_id uuid default null,
  p_period_start date default date_trunc('month', now())::date
)
returns table(metric text, quantity numeric)
language sql
security invoker
set search_path = ''
as $$
  select *
  from hollow_private.get_project_os_usage(p_workspace_id, p_period_start);
$$;

revoke insert, update, delete, truncate, references, trigger
  on public.project_snapshots, public.project_assets, public.render_jobs, public.usage_events
  from public, anon, authenticated;

revoke all on function public.create_project_snapshot_with_limit(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.register_project_asset_with_limit(text, text, uuid, uuid, text, bigint, numeric, text, integer, text, jsonb) from public, anon, authenticated;
revoke all on function public.create_render_job_with_limit(uuid, text, text, integer, integer, jsonb) from public, anon, authenticated;
revoke all on function public.update_render_job_status_with_scope(uuid, text, uuid, text) from public, anon, authenticated;
revoke all on function public.get_project_os_usage(uuid, date) from public, anon, authenticated;

revoke all on function hollow_private.project_os_user_id() from public, anon, authenticated;
revoke all on function hollow_private.project_os_tier_for_user(uuid) from public, anon, authenticated;
revoke all on function hollow_private.project_os_storage_limit_bytes(text) from public, anon, authenticated;
revoke all on function hollow_private.project_os_render_limit_minutes(text) from public, anon, authenticated;
revoke all on function hollow_private.project_os_ensure_workspace_editor(uuid, uuid) from public, anon, authenticated;
revoke all on function hollow_private.project_os_project_workspace(uuid, uuid) from public, anon, authenticated;
revoke all on function hollow_private.project_os_record_usage(uuid, uuid, text, numeric, text, jsonb, date) from public, anon, authenticated;
revoke all on function hollow_private.create_project_snapshot_with_limit(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function hollow_private.register_project_asset_with_limit(text, text, uuid, uuid, text, bigint, numeric, text, integer, text, jsonb) from public, anon, authenticated;
revoke all on function hollow_private.create_render_job_with_limit(uuid, text, text, integer, integer, jsonb) from public, anon, authenticated;
revoke all on function hollow_private.update_render_job_status_with_scope(uuid, text, uuid, text) from public, anon, authenticated;
revoke all on function hollow_private.get_project_os_usage(uuid, date) from public, anon, authenticated;

grant select on public.project_snapshots, public.project_assets, public.render_jobs, public.usage_events to authenticated, service_role;
grant all on public.project_snapshots, public.project_assets, public.render_jobs, public.usage_events to service_role;

grant execute on function public.create_project_snapshot_with_limit(uuid, text, jsonb) to authenticated, service_role;
grant execute on function public.register_project_asset_with_limit(text, text, uuid, uuid, text, bigint, numeric, text, integer, text, jsonb) to authenticated, service_role;
grant execute on function public.create_render_job_with_limit(uuid, text, text, integer, integer, jsonb) to authenticated, service_role;
grant execute on function public.update_render_job_status_with_scope(uuid, text, uuid, text) to authenticated, service_role;
grant execute on function public.get_project_os_usage(uuid, date) to authenticated, service_role;

grant execute on function hollow_private.project_os_user_id() to authenticated, service_role;
grant execute on function hollow_private.project_os_tier_for_user(uuid) to authenticated, service_role;
grant execute on function hollow_private.project_os_storage_limit_bytes(text) to authenticated, service_role;
grant execute on function hollow_private.project_os_render_limit_minutes(text) to authenticated, service_role;
grant execute on function hollow_private.project_os_ensure_workspace_editor(uuid, uuid) to authenticated, service_role;
grant execute on function hollow_private.project_os_project_workspace(uuid, uuid) to authenticated, service_role;
grant execute on function hollow_private.project_os_record_usage(uuid, uuid, text, numeric, text, jsonb, date) to authenticated, service_role;
grant execute on function hollow_private.create_project_snapshot_with_limit(uuid, text, jsonb) to authenticated, service_role;
grant execute on function hollow_private.register_project_asset_with_limit(text, text, uuid, uuid, text, bigint, numeric, text, integer, text, jsonb) to authenticated, service_role;
grant execute on function hollow_private.create_render_job_with_limit(uuid, text, text, integer, integer, jsonb) to authenticated, service_role;
grant execute on function hollow_private.update_render_job_status_with_scope(uuid, text, uuid, text) to authenticated, service_role;
grant execute on function hollow_private.get_project_os_usage(uuid, date) to authenticated, service_role;
