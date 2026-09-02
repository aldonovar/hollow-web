-- Evaluate auth helpers once per statement and scope legacy policies to the
-- authenticated role. This preserves their row predicates while avoiding an
-- auth function call for every scanned row.

begin;

-- The legacy INSERT policy on workspace_members queried workspace_members
-- directly. PostgreSQL evaluates that nested SELECT through the same RLS
-- policy and aborts with "infinite recursion detected". Keep the membership
-- decision behind a narrowly granted SECURITY DEFINER helper so an existing
-- owner/admin can invite another member without recursively re-entering RLS.
create schema if not exists hollow_private;

revoke all on schema hollow_private from public, anon;
grant usage on schema hollow_private to authenticated, service_role;

create or replace function hollow_private.dawfi_can_add_workspace_member(
  p_workspace_id uuid,
  p_new_user_id uuid,
  p_new_role text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
begin
  if v_actor_id is null
    or p_workspace_id is null
    or p_new_user_id is null
    or p_new_role is null
  then
    return false;
  end if;

  return lower(p_new_role) in ('owner', 'admin', 'editor', 'viewer')
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = p_workspace_id
        and wm.user_id = v_actor_id
        and lower(coalesce(wm.role::text, 'viewer')) in ('owner', 'admin')
    );
end;
$$;

revoke all on function hollow_private.dawfi_can_add_workspace_member(uuid, uuid, text)
from public, anon, authenticated, service_role;
grant execute on function hollow_private.dawfi_can_add_workspace_member(uuid, uuid, text)
to authenticated;

-- Creating a workspace and its initial owner in two browser requests can leave
-- an inaccessible orphan when the second request is interrupted. Keep the
-- privileged implementation in a non-exposed schema; the public RPC below is
-- an invoker-only wrapper with no direct table access.
create or replace function hollow_private.dawfi_create_workspace_with_owner(
  p_name text,
  p_slug text,
  p_category text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  -- Allocate once so both rows share an auditable identifier without relying
  -- on a client-visible intermediate workspace row.
  v_workspace_id uuid := pg_catalog.gen_random_uuid();
  v_name text := btrim(coalesce(p_name, ''));
  v_slug text := lower(btrim(coalesce(p_slug, '')));
  v_category text := nullif(btrim(coalesce(p_category, '')), '');
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if length(v_name) < 1 or length(v_name) > 120 then
    raise exception 'Workspace name must contain between 1 and 120 characters'
      using errcode = '22023';
  end if;

  if length(v_slug) < 3
    or length(v_slug) > 128
    or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  then
    raise exception 'Workspace slug is invalid'
      using errcode = '22023';
  end if;

  if v_category is not null and length(v_category) > 64 then
    raise exception 'Workspace category is invalid'
      using errcode = '22023';
  end if;

  insert into public.workspaces (id, name, slug, created_by, category)
  values (v_workspace_id, v_name, v_slug, v_user_id, v_category);

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, v_user_id, 'owner');

  return v_workspace_id;
end;
$$;

revoke all on function hollow_private.dawfi_create_workspace_with_owner(text, text, text)
from public, anon, authenticated, service_role;
grant execute on function hollow_private.dawfi_create_workspace_with_owner(text, text, text)
to authenticated;

create or replace function public.create_workspace_with_owner(
  p_name text,
  p_slug text,
  p_category text default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select hollow_private.dawfi_create_workspace_with_owner($1, $2, $3);
$$;

revoke all on function public.create_workspace_with_owner(text, text, text)
from public, anon, authenticated, service_role;
grant execute on function public.create_workspace_with_owner(text, text, text)
to authenticated;

-- Workspace ownership drives project quota accounting. It is immutable after
-- creation so an owner/admin cannot reassign quota usage to another profile.
create or replace function hollow_private.dawfi_preserve_workspace_creator()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'Workspace creator cannot be changed'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function hollow_private.dawfi_preserve_workspace_creator()
from public, anon, authenticated, service_role;

drop trigger if exists dawfi_preserve_workspace_creator on public.workspaces;
create trigger dawfi_preserve_workspace_creator
before update of created_by on public.workspaces
for each row
execute function hollow_private.dawfi_preserve_workspace_creator();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Members can view their own workspace memberships" on public.workspace_members;
create policy "Members can view their own workspace memberships"
on public.workspace_members
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Owners and admins can add members" on public.workspace_members;
create policy "Owners and admins can add members"
on public.workspace_members
for insert
to authenticated
with check (hollow_private.dawfi_can_add_workspace_member(
  workspace_id,
  user_id,
  role::text
));

drop policy if exists "Authenticated users can create workspaces" on public.workspaces;
-- Deliberately not recreated. Authenticated clients must use the atomic
-- create_workspace_with_owner RPC; service_role keeps its native RLS bypass.

drop policy if exists "Users can view workspaces they are members of" on public.workspaces;
create policy "Users can view workspaces they are members of"
on public.workspaces
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = (select auth.uid())
  )
);

drop policy if exists "Owners and admins can update their workspaces" on public.workspaces;
create policy "Owners and admins can update their workspaces"
on public.workspaces
for update
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin')
  )
);

drop policy if exists "Users can view projects in their workspaces" on public.projects;
create policy "Users can view projects in their workspaces"
on public.projects
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = projects.workspace_id
      and wm.user_id = (select auth.uid())
  )
);

drop policy if exists "Editors and above can create projects in their workspaces" on public.projects;
create policy "Editors and above can create projects in their workspaces"
on public.projects
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = projects.workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'editor')
  )
);

drop policy if exists "Editors and above can update projects in their workspaces" on public.projects;
create policy "Editors and above can update projects in their workspaces"
on public.projects
for update
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = projects.workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = projects.workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'editor')
  )
);

drop policy if exists "Owners and admins can delete projects" on public.projects;
create policy "Owners and admins can delete projects"
on public.projects
for delete
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = projects.workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin')
  )
);

drop policy if exists "Users can view their own license" on public.licenses;
create policy "Users can view their own license"
on public.licenses
for select
to authenticated
using ((select auth.uid()) = user_id);

-- service_role bypasses RLS, so a permissive policy granted to PUBLIC is both
-- unnecessary and misleading. Removing it also eliminates duplicate SELECT
-- policies for ordinary roles without reducing service access.
drop policy if exists "Service role has full access to licenses" on public.licenses;

drop policy if exists "Workspace members can view project shares" on public.project_shares;
create policy "Workspace members can view project shares"
on public.project_shares
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = project_shares.project_id
      and wm.user_id = (select auth.uid())
  )
);

drop policy if exists "Workspace members can insert project shares" on public.project_shares;
create policy "Workspace members can insert project shares"
on public.project_shares
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = project_shares.project_id
      and wm.user_id = (select auth.uid())
  )
);

drop policy if exists "Workspace members can delete project shares" on public.project_shares;
create policy "Workspace members can delete project shares"
on public.project_shares
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = project_shares.project_id
      and wm.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can view their own notifications" on public.user_notifications;
create policy "Users can view their own notifications"
on public.user_notifications
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own notifications" on public.user_notifications;
create policy "Users can update their own notifications"
on public.user_notifications
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can insert notifications as sender" on public.user_notifications;
create policy "Users can insert notifications as sender"
on public.user_notifications
for insert
to authenticated
with check (sender_id = (select auth.uid()));

drop policy if exists "Users read own usage" on public.usage_tracking;
create policy "Users read own usage"
on public.usage_tracking
for select
to authenticated
using ((select auth.uid()) = user_id);

commit;
