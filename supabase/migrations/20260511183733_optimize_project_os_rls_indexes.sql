create index if not exists project_snapshots_created_by_idx
  on public.project_snapshots(created_by);

create index if not exists render_jobs_requested_by_idx
  on public.render_jobs(requested_by);

create index if not exists render_jobs_output_asset_idx
  on public.render_jobs(output_asset_id);

drop policy if exists project_snapshots_select_members on public.project_snapshots;
create policy project_snapshots_select_members on public.project_snapshots
for select using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = project_snapshots.workspace_id
      and wm.user_id = (select auth.uid())
  )
);

drop policy if exists project_snapshots_insert_editors on public.project_snapshots;
create policy project_snapshots_insert_editors on public.project_snapshots
for insert with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.projects p
    where p.id = project_snapshots.project_id
      and p.workspace_id = project_snapshots.workspace_id
  )
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = project_snapshots.workspace_id
      and wm.user_id = (select auth.uid())
      and coalesce(wm.role, 'viewer') in ('owner', 'admin', 'editor')
  )
);

drop policy if exists project_snapshots_delete_owners on public.project_snapshots;
create policy project_snapshots_delete_owners on public.project_snapshots
for delete using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = project_snapshots.workspace_id
      and wm.user_id = (select auth.uid())
      and coalesce(wm.role, 'viewer') in ('owner', 'admin')
  )
);

drop policy if exists project_assets_select_members on public.project_assets;
create policy project_assets_select_members on public.project_assets
for select using (
  owner_id = (select auth.uid())
  or exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = project_assets.workspace_id
      and wm.user_id = (select auth.uid())
  )
);

drop policy if exists project_assets_insert_owner_or_editor on public.project_assets;
create policy project_assets_insert_owner_or_editor on public.project_assets
for insert with check (
  owner_id = (select auth.uid())
  and (
    project_id is null
    or exists (
      select 1 from public.projects p
      where p.id = project_assets.project_id
        and p.workspace_id = project_assets.workspace_id
    )
  )
  and (
    workspace_id is null
    or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = project_assets.workspace_id
        and wm.user_id = (select auth.uid())
        and coalesce(wm.role, 'viewer') in ('owner', 'admin', 'editor')
    )
  )
);

drop policy if exists project_assets_update_owner_or_editor on public.project_assets;
create policy project_assets_update_owner_or_editor on public.project_assets
for update using (
  owner_id = (select auth.uid())
  or exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = project_assets.workspace_id
      and wm.user_id = (select auth.uid())
      and coalesce(wm.role, 'viewer') in ('owner', 'admin', 'editor')
  )
) with check (
  (
    project_id is null
    or exists (
      select 1 from public.projects p
      where p.id = project_assets.project_id
        and p.workspace_id = project_assets.workspace_id
    )
  )
  and (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = project_assets.workspace_id
        and wm.user_id = (select auth.uid())
        and coalesce(wm.role, 'viewer') in ('owner', 'admin', 'editor')
    )
  )
);

drop policy if exists render_jobs_select_members on public.render_jobs;
create policy render_jobs_select_members on public.render_jobs
for select using (
  requested_by = (select auth.uid())
  or exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = render_jobs.workspace_id
      and wm.user_id = (select auth.uid())
  )
);

drop policy if exists render_jobs_insert_editors on public.render_jobs;
create policy render_jobs_insert_editors on public.render_jobs
for insert with check (
  requested_by = (select auth.uid())
  and exists (
    select 1 from public.projects p
    where p.id = render_jobs.project_id
      and p.workspace_id = render_jobs.workspace_id
  )
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = render_jobs.workspace_id
      and wm.user_id = (select auth.uid())
      and coalesce(wm.role, 'viewer') in ('owner', 'admin', 'editor')
  )
);

drop policy if exists render_jobs_update_owner_or_worker on public.render_jobs;
create policy render_jobs_update_owner_or_worker on public.render_jobs
for update using (
  requested_by = (select auth.uid())
  or exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = render_jobs.workspace_id
      and wm.user_id = (select auth.uid())
      and coalesce(wm.role, 'viewer') in ('owner', 'admin')
  )
) with check (
  exists (
    select 1 from public.projects p
    where p.id = render_jobs.project_id
      and p.workspace_id = render_jobs.workspace_id
  )
  and (
    requested_by = (select auth.uid())
    or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = render_jobs.workspace_id
        and wm.user_id = (select auth.uid())
        and coalesce(wm.role, 'viewer') in ('owner', 'admin')
    )
  )
);

drop policy if exists usage_events_select_owner_or_workspace_admin on public.usage_events;
create policy usage_events_select_owner_or_workspace_admin on public.usage_events
for select using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = usage_events.workspace_id
      and wm.user_id = (select auth.uid())
      and coalesce(wm.role, 'viewer') in ('owner', 'admin')
  )
);

drop policy if exists usage_events_insert_self on public.usage_events;
create policy usage_events_insert_self on public.usage_events
for insert with check (
  user_id = (select auth.uid())
  and (
    workspace_id is null
    or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = usage_events.workspace_id
        and wm.user_id = (select auth.uid())
    )
  )
);
