alter function public.create_project_snapshot_with_limit(uuid, text, jsonb) security invoker;
alter function public.register_project_asset_with_limit(text, text, uuid, uuid, text, bigint, numeric, text, integer, text, jsonb) security invoker;
alter function public.create_render_job_with_limit(uuid, text, text, integer, integer, jsonb) security invoker;
alter function public.update_render_job_status_with_scope(uuid, text, uuid, text) security invoker;
alter function public.get_project_os_usage(uuid, date) security invoker;

grant usage on schema hollow_private to authenticated, service_role;

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

revoke all on function public.create_project_snapshot_with_limit(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.register_project_asset_with_limit(text, text, uuid, uuid, text, bigint, numeric, text, integer, text, jsonb) from public, anon, authenticated;
revoke all on function public.create_render_job_with_limit(uuid, text, text, integer, integer, jsonb) from public, anon, authenticated;
revoke all on function public.update_render_job_status_with_scope(uuid, text, uuid, text) from public, anon, authenticated;
revoke all on function public.get_project_os_usage(uuid, date) from public, anon, authenticated;

grant execute on function public.create_project_snapshot_with_limit(uuid, text, jsonb) to authenticated, service_role;
grant execute on function public.register_project_asset_with_limit(text, text, uuid, uuid, text, bigint, numeric, text, integer, text, jsonb) to authenticated, service_role;
grant execute on function public.create_render_job_with_limit(uuid, text, text, integer, integer, jsonb) to authenticated, service_role;
grant execute on function public.update_render_job_status_with_scope(uuid, text, uuid, text) to authenticated, service_role;
grant execute on function public.get_project_os_usage(uuid, date) to authenticated, service_role;
