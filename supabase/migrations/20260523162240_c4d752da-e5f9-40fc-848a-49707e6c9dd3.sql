
-- Set search_path on the trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Lock down security-definer functions: only the postgres role and
-- internal triggers should call them. RLS policies that reference
-- is_admin() still work because policy evaluation runs as the
-- table owner, not the calling role.
revoke execute on function public.is_admin(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
