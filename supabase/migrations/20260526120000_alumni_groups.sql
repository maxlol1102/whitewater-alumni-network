-- Alumni Groups: named, manually-managed lists for campaign targeting

-- 1. Groups table
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.groups enable row level security;

create policy "authenticated can read groups"
  on public.groups for select to authenticated using (true);

create policy "authenticated can insert groups"
  on public.groups for insert to authenticated with check (true);

create policy "authenticated can update groups"
  on public.groups for update to authenticated using (true);

create policy "authenticated can delete groups"
  on public.groups for delete to authenticated using (true);

-- 2. Many-to-many join table
create table if not exists public.alumni_groups (
  alumni_id  uuid not null references public.alumni(id) on delete cascade,
  group_id   uuid not null references public.groups(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (alumni_id, group_id)
);

alter table public.alumni_groups enable row level security;

create policy "authenticated can read alumni_groups"
  on public.alumni_groups for select to authenticated using (true);

create policy "authenticated can insert alumni_groups"
  on public.alumni_groups for insert to authenticated with check (true);

create policy "authenticated can delete alumni_groups"
  on public.alumni_groups for delete to authenticated using (true);

create index if not exists idx_alumni_groups_group_id on public.alumni_groups (group_id);
create index if not exists idx_alumni_groups_alumni_id on public.alumni_groups (alumni_id);

-- 3. Add group targeting to campaigns
alter table public.campaigns
  add column if not exists filter_group_ids uuid[] not null default '{}';
