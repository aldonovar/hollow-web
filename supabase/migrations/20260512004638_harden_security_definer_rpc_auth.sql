-- Harden exposed SECURITY DEFINER RPCs without changing app routes or project models.
-- Product exception: guest share-token links remain callable by anon/authenticated.

create schema if not exists hollow_private;

revoke all on schema hollow_private from public, anon, authenticated;
grant usage on schema hollow_private to authenticated, service_role;

create or replace function public.create_project_with_limit(
  p_name text,
  p_workspace_id uuid,
  p_bpm integer default 120,
  p_sample_rate integer default 44100,
  p_is_public boolean default false
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select public.create_project_with_limit(
    p_name,
    p_workspace_id,
    p_bpm,
    p_sample_rate,
    p_is_public,
    '{}'::jsonb
  );
$$;

create or replace function public.create_project_with_limit(
  p_name text,
  p_workspace_id uuid,
  p_bpm integer default 120,
  p_sample_rate integer default 44100,
  p_is_public boolean default false,
  p_data jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_tier text := 'free';
  v_project_count integer := 0;
  v_new_project_id uuid;
  v_max_free_projects integer := 3;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if p_workspace_id is null then
    raise exception 'Workspace is required'
      using errcode = '22023';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'Project name is required'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = v_user_id
      and lower(coalesce(wm.role, '')) in ('owner', 'admin', 'editor')
  ) then
    raise exception 'Workspace editor access required'
      using errcode = '42501';
  end if;

  select lower(coalesce(nullif(p.tier, ''), 'free'))
  into v_tier
  from public.profiles p
  where p.id = v_user_id;

  v_tier := coalesce(v_tier, 'free');

  if v_tier = 'free' then
    select count(*)
    into v_project_count
    from public.projects p
    join public.workspaces w on p.workspace_id = w.id
    where w.created_by = v_user_id;

    if v_project_count >= v_max_free_projects then
      raise exception 'Project limit reached for Free tier (Max %)', v_max_free_projects
        using errcode = 'P0001';
    end if;
  end if;

  insert into public.projects (
    name,
    workspace_id,
    bpm,
    sample_rate,
    is_public,
    data
  )
  values (
    btrim(p_name),
    p_workspace_id,
    coalesce(p_bpm, 120),
    coalesce(p_sample_rate, 44100),
    coalesce(p_is_public, false),
    coalesce(p_data, '{}'::jsonb)
  )
  returning id into v_new_project_id;

  return v_new_project_id;
end;
$$;

create or replace function hollow_private.get_active_sessions_for_current_user()
returns table(
  id uuid,
  user_agent text,
  ip inet,
  created_at timestamp with time zone,
  last_active timestamp without time zone
)
language sql
security definer
set search_path = ''
as $$
  select
    s.id,
    s.user_agent,
    s.ip,
    s.created_at,
    s.refreshed_at as last_active
  from auth.sessions s
  where s.user_id = auth.uid()
  order by s.refreshed_at desc;
$$;

create or replace function public.get_active_sessions()
returns table(
  id uuid,
  user_agent text,
  ip inet,
  created_at timestamp with time zone,
  last_active timestamp without time zone
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from hollow_private.get_active_sessions_for_current_user();
$$;

create or replace function hollow_private.revoke_device_session_for_current_user(target_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted boolean := false;
begin
  if v_user_id is null or target_session_id is null then
    return false;
  end if;

  delete from auth.sessions s
  where s.id = target_session_id
    and s.user_id = v_user_id
  returning true into v_deleted;

  return coalesce(v_deleted, false);
end;
$$;

create or replace function public.revoke_device_session(target_session_id uuid)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select hollow_private.revoke_device_session_for_current_user(target_session_id);
$$;

drop function if exists public.get_project_by_share_token(text);

create function public.get_project_by_share_token(p_token text)
returns table(
  project_id uuid,
  name text,
  bpm integer,
  sample_rate integer,
  yjs_room_id text,
  access_level text,
  data jsonb
)
language sql
security definer
set search_path = ''
as $$
  select
    p.id,
    p.name::text,
    p.bpm,
    p.sample_rate,
    p.yjs_room_id::text,
    ps.access_level,
    p.data
  from public.project_shares ps
  join public.projects p on p.id = ps.project_id
  where p_token ~ '^[0-9a-f]{32}$'
    and ps.token = p_token
    and (
      ps.invited_email is null
      or lower(ps.invited_email) = lower(coalesce(auth.email(), ''))
    );
$$;

create or replace function public.handle_new_license()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.licenses (user_id, tier, status)
  values (new.id, 'free', 'active')
  on conflict do nothing;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_workspace_id uuid;
  base_username varchar;
  user_avatar text;
  user_full_name text;
begin
  base_username := coalesce(
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'preferred_username',
    split_part(new.email, '@', 1),
    new.id::text
  );

  user_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    base_username
  );

  user_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  insert into public.profiles (id, username, full_name, avatar_url)
  values (new.id, base_username, user_full_name, user_avatar);

  insert into public.workspaces (name, slug, created_by)
  values ('Personal Workspace', new.id::text || '-personal', new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$;

create or replace function public.sync_license_to_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set tier = new.tier
  where id = new.user_id;

  return new;
end;
$$;

create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cmd record;
begin
  for cmd in
    select *
    from pg_catalog.pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name is not null
       and cmd.schema_name in ('public')
       and cmd.schema_name not in ('pg_catalog', 'information_schema')
       and cmd.schema_name not like 'pg_toast%'
       and cmd.schema_name not like 'pg_temp%' then
      begin
        execute pg_catalog.format(
          'alter table if exists %s enable row level security',
          cmd.object_identity
        );
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception
        when others then
          raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    else
      raise log 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)',
        cmd.object_identity,
        cmd.schema_name;
    end if;
  end loop;
end;
$$;

revoke all on function public.create_project_with_limit(text, uuid, integer, integer, boolean) from public, anon, authenticated;
revoke all on function public.create_project_with_limit(text, uuid, integer, integer, boolean, jsonb) from public, anon, authenticated;
revoke all on function public.get_active_sessions() from public, anon, authenticated;
revoke all on function public.revoke_device_session(uuid) from public, anon, authenticated;
revoke all on function public.get_project_by_share_token(text) from public, anon, authenticated;
revoke all on function public.handle_new_license() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_license_to_profile() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function hollow_private.get_active_sessions_for_current_user() from public, anon, authenticated;
revoke all on function hollow_private.revoke_device_session_for_current_user(uuid) from public, anon, authenticated;

grant execute on function public.create_project_with_limit(text, uuid, integer, integer, boolean) to authenticated, service_role;
grant execute on function public.create_project_with_limit(text, uuid, integer, integer, boolean, jsonb) to authenticated, service_role;
grant execute on function public.get_active_sessions() to authenticated, service_role;
grant execute on function public.revoke_device_session(uuid) to authenticated, service_role;
grant execute on function public.get_project_by_share_token(text) to anon, authenticated, service_role;
grant execute on function public.handle_new_license() to service_role;
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.sync_license_to_profile() to service_role;
grant execute on function public.rls_auto_enable() to service_role;
grant execute on function hollow_private.get_active_sessions_for_current_user() to authenticated, service_role;
grant execute on function hollow_private.revoke_device_session_for_current_user(uuid) to authenticated, service_role;
