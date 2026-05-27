-- Security fix: tighten RLS on groups and alumni_groups tables.
-- Original migration used `using (true)` for all operations, allowing any
-- authenticated user to create, modify, and delete groups. All write operations
-- must be restricted to admins. Reads remain open to all authenticated users
-- because non-admin users need to load groups for the campaign audience picker.

-- ── groups ────────────────────────────────────────────────────────────────────

drop policy if exists "authenticated can insert groups" on public.groups;
drop policy if exists "authenticated can update groups" on public.groups;
drop policy if exists "authenticated can delete groups" on public.groups;

create policy "admins can insert groups"
  on public.groups for insert to authenticated
  with check (public.is_admin(auth.uid()));

create policy "admins can update groups"
  on public.groups for update to authenticated
  using (public.is_admin(auth.uid()));

create policy "admins can delete groups"
  on public.groups for delete to authenticated
  using (public.is_admin(auth.uid()));

-- ── alumni_groups ─────────────────────────────────────────────────────────────

drop policy if exists "authenticated can insert alumni_groups" on public.alumni_groups;
drop policy if exists "authenticated can delete alumni_groups" on public.alumni_groups;

create policy "admins can insert alumni_groups"
  on public.alumni_groups for insert to authenticated
  with check (public.is_admin(auth.uid()));

create policy "admins can delete alumni_groups"
  on public.alumni_groups for delete to authenticated
  using (public.is_admin(auth.uid()));
