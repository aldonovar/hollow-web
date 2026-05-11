create or replace function public.hb_is_uuid(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
$$;

create or replace function public.hb_storage_workspace_id(object_name text)
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  parts text[];
begin
  parts := storage.foldername(object_name);

  if array_length(parts, 1) >= 2
    and parts[1] = 'workspaces'
    and public.hb_is_uuid(parts[2])
  then
    return parts[2]::uuid;
  end if;

  return null;
end;
$$;

create or replace function public.hb_storage_is_user_scoped(object_name text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((storage.foldername(object_name))[1], '') = auth.uid()::text
$$;

create or replace function public.hb_storage_is_workspace_member(object_name text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = public.hb_storage_workspace_id(object_name)
      and wm.user_id = auth.uid()
  )
$$;

create or replace function public.hb_storage_is_workspace_editor(object_name text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = public.hb_storage_workspace_id(object_name)
      and wm.user_id = auth.uid()
      and coalesce(wm.role, 'viewer') in ('owner', 'admin', 'editor')
  )
$$;
