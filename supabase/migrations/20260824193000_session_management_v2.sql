-- Device-aware session management for the canonical DAW-fi identity.
--
-- auth.sessions remains the source of truth.  The public functions below are
-- deliberately narrow wrappers: authenticated users can only inspect and
-- revoke their own non-current sessions.  The current device must use the
-- normal GoTrue local sign-out flow so that its local refresh token is cleared
-- as well.

create or replace function hollow_private.get_active_sessions_for_current_user_v2()
returns table(
  id uuid,
  user_agent text,
  ip inet,
  created_at timestamp with time zone,
  last_active timestamp with time zone,
  tag text,
  is_current boolean
)
language sql
security definer
set search_path = ''
as $$
  with current_session as (
    select case
      when coalesce(auth.jwt() ->> 'session_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (auth.jwt() ->> 'session_id')::uuid
      else null
    end as id
  )
  select
    s.id,
    s.user_agent,
    s.ip,
    s.created_at,
    coalesce(s.refreshed_at, s.updated_at, s.created_at) as last_active,
    s.tag,
    s.id = current_session.id as is_current
  from auth.sessions s
  cross join current_session
  where s.user_id = auth.uid()
    and (s.not_after is null or s.not_after > now())
  order by
    (s.id = current_session.id) desc,
    coalesce(s.refreshed_at, s.updated_at, s.created_at) desc,
    s.created_at desc;
$$;

create or replace function public.get_active_sessions_v2()
returns table(
  id uuid,
  user_agent text,
  ip inet,
  created_at timestamp with time zone,
  last_active timestamp with time zone,
  tag text,
  is_current boolean
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from hollow_private.get_active_sessions_for_current_user_v2();
$$;

create or replace function hollow_private.revoke_device_session_for_current_user_v2(
  target_session_id uuid
)
returns table(
  revoked boolean,
  reason text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_session_id uuid;
begin
  if v_user_id is null then
    return query select false, 'authentication_required'::text;
    return;
  end if;

  if target_session_id is null then
    return query select false, 'invalid_session'::text;
    return;
  end if;

  v_current_session_id := case
    when coalesce(auth.jwt() ->> 'session_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then (auth.jwt() ->> 'session_id')::uuid
    else null
  end;

  if target_session_id = v_current_session_id then
    return query select false, 'current_session_requires_local_signout'::text;
    return;
  end if;

  delete from auth.sessions s
  where s.id = target_session_id
    and s.user_id = v_user_id;

  if found then
    return query select true, 'revoked'::text;
  else
    return query select false, 'not_found'::text;
  end if;
end;
$$;

create or replace function public.revoke_device_session_v2(target_session_id uuid)
returns table(
  revoked boolean,
  reason text
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from hollow_private.revoke_device_session_for_current_user_v2(target_session_id);
$$;

revoke all on function public.get_active_sessions_v2() from public, anon, authenticated;
revoke all on function public.revoke_device_session_v2(uuid) from public, anon, authenticated;
revoke all on function hollow_private.get_active_sessions_for_current_user_v2() from public, anon, authenticated;
revoke all on function hollow_private.revoke_device_session_for_current_user_v2(uuid) from public, anon, authenticated;

grant execute on function public.get_active_sessions_v2() to authenticated, service_role;
grant execute on function public.revoke_device_session_v2(uuid) to authenticated, service_role;
grant execute on function hollow_private.get_active_sessions_for_current_user_v2() to authenticated, service_role;
grant execute on function hollow_private.revoke_device_session_for_current_user_v2(uuid) to authenticated, service_role;
