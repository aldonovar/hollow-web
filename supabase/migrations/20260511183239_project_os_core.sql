create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('project-audio', 'project-audio', false, 104857600, array['audio/wav', 'audio/x-wav', 'audio/flac', 'audio/mpeg', 'audio/ogg', 'audio/aiff', 'audio/x-aiff', 'audio/mp4', 'audio/webm']),
  ('project-stems', 'project-stems', false, 209715200, array['audio/wav', 'audio/x-wav', 'audio/flac', 'audio/mpeg', 'audio/ogg', 'audio/aiff', 'audio/x-aiff']),
  ('project-exports', 'project-exports', false, 524288000, array['audio/wav', 'audio/x-wav', 'audio/flac', 'audio/mpeg', 'audio/ogg', 'audio/aiff', 'audio/x-aiff', 'application/zip']),
  ('asset-library', 'asset-library', false, 262144000, array['audio/wav', 'audio/x-wav', 'audio/flac', 'audio/mpeg', 'audio/ogg', 'audio/aiff', 'audio/x-aiff', 'audio/mp4', 'audio/webm', 'application/zip']),
  ('user-avatars', 'user-avatars', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.project_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  label text,
  schema_version text not null default '3.0-reference',
  data jsonb not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_snapshots_project_created_idx
  on public.project_snapshots(project_id, created_at desc);

create index if not exists project_snapshots_workspace_created_idx
  on public.project_snapshots(workspace_id, created_at desc);

create index if not exists project_snapshots_created_by_idx
  on public.project_snapshots(created_by);

create table if not exists public.project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  bucket text not null check (bucket in ('project-audio', 'project-stems', 'project-exports', 'asset-library', 'user-avatars')),
  path text not null,
  hash text,
  size_bytes bigint not null default 0,
  duration_seconds numeric,
  format text,
  sample_rate integer,
  license_state text not null default 'unknown',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, path)
);

create index if not exists project_assets_project_idx
  on public.project_assets(project_id);

create index if not exists project_assets_workspace_idx
  on public.project_assets(workspace_id);

create index if not exists project_assets_owner_idx
  on public.project_assets(owner_id);

create table if not exists public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'master' check (kind in ('master', 'stems', 'preview')),
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  format text not null default 'wav' check (format in ('wav', 'aiff', 'flac', 'mp3')),
  bit_depth integer not null default 24 check (bit_depth in (16, 24, 32)),
  sample_rate integer not null default 48000 check (sample_rate in (44100, 48000, 88200, 96000, 192000)),
  input jsonb not null default '{}'::jsonb,
  output_asset_id uuid references public.project_assets(id) on delete set null,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists render_jobs_project_created_idx
  on public.render_jobs(project_id, created_at desc);

create index if not exists render_jobs_workspace_status_idx
  on public.render_jobs(workspace_id, status);

create index if not exists render_jobs_requested_by_idx
  on public.render_jobs(requested_by);

create index if not exists render_jobs_output_asset_idx
  on public.render_jobs(output_asset_id);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  metric text not null check (metric in ('storage_bytes', 'ai_action', 'render_minutes', 'sample_claim', 'collaborator_seat', 'snapshot')),
  quantity numeric not null default 1,
  period_start date not null default date_trunc('month', now())::date,
  tier_at_event text not null default 'free' check (tier_at_event in ('free', 'pro', 'studio')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_metric_period_idx
  on public.usage_events(user_id, metric, period_start);

create index if not exists usage_events_workspace_metric_period_idx
  on public.usage_events(workspace_id, metric, period_start);

alter table public.project_snapshots enable row level security;
alter table public.project_assets enable row level security;
alter table public.render_jobs enable row level security;
alter table public.usage_events enable row level security;

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
