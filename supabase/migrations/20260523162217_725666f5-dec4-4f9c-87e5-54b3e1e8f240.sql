
-- =========================================
-- Helper: updated_at trigger function
-- =========================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =========================================
-- profiles
-- =========================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null unique,
  account_role text not null default 'user' check (account_role in ('admin','user')),
  user_category text check (user_category in ('faculty','student')),
  status text not null default 'invited' check (status in ('invited','active','disabled','deleted')),
  invited_at timestamptz,
  accepted_at timestamptz,
  disabled_at timestamptz,
  deleted_at timestamptz,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_category_required_for_user
    check (account_role = 'admin' or user_category is not null)
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Security-definer helper to avoid recursive RLS
create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = _user_id
      and account_role = 'admin'
      and status = 'active'
  );
$$;

create policy "profiles_self_select"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_self_update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and account_role = (select account_role from public.profiles where id = auth.uid()));

create policy "profiles_admin_all"
  on public.profiles for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, status, account_role, user_category, invited_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'invited',
    'user',
    nullif(new.raw_user_meta_data->>'user_category', ''),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================
-- audit_logs
-- =========================================
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  entity_label text,
  before jsonb,
  after jsonb,
  summary text not null default '',
  severity text not null default 'info' check (severity in ('info','warning','critical')),
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

alter table public.audit_logs enable row level security;

create policy "audit_logs_admin_select"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- No client-side INSERT/UPDATE/DELETE policies. Writes go through server fns
-- with the service role.

-- =========================================
-- alumni
-- =========================================
create table public.alumni (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  linkedin_url text,
  graduation_year int,
  degree_program text,
  company text,
  job_title text,
  industry text,
  location text,
  technical_skills text[] not null default '{}',
  mentorship_interest boolean not null default false,
  mentorship_categories text[] not null default '{}',
  tags text[] not null default '{}',
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index alumni_grad_year_idx on public.alumni (graduation_year);
create index alumni_archived_idx on public.alumni (archived);

create trigger alumni_set_updated_at
  before update on public.alumni
  for each row execute function public.set_updated_at();

alter table public.alumni enable row level security;

create policy "alumni_active_user_select"
  on public.alumni for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.status = 'active'
    )
  );

create policy "alumni_admin_all"
  on public.alumni for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- =========================================
-- campaigns
-- =========================================
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null default '',
  body text not null default '',
  status text not null default 'draft' check (status in ('draft','scheduled','sending','sent','failed')),
  filter_mentorship_only boolean not null default false,
  filter_tags text[] not null default '{}',
  filter_grad_years int[] not null default '{}',
  recipient_count int not null default 0,
  sent_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

alter table public.campaigns enable row level security;

create policy "campaigns_admin_all"
  on public.campaigns for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- =========================================
-- surveys
-- =========================================
create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  form_url text not null default '',
  campaign_id uuid references public.campaigns(id) on delete set null,
  response_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger surveys_set_updated_at
  before update on public.surveys
  for each row execute function public.set_updated_at();

alter table public.surveys enable row level security;

create policy "surveys_admin_all"
  on public.surveys for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- =========================================
-- survey_responses
-- =========================================
create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  email text not null,
  alumni_id uuid references public.alumni(id) on delete set null,
  submitted_at timestamptz not null default now(),
  payload jsonb,
  created_at timestamptz not null default now()
);

create index survey_responses_survey_idx on public.survey_responses (survey_id);

alter table public.survey_responses enable row level security;

create policy "survey_responses_admin_all"
  on public.survey_responses for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
