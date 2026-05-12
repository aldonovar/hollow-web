revoke select on table
  public.project_snapshots,
  public.project_assets,
  public.render_jobs,
  public.usage_events
from public, anon;

grant select on table
  public.project_snapshots,
  public.project_assets,
  public.render_jobs,
  public.usage_events
to authenticated, service_role;
