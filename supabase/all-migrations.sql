-- ============================================================
-- ALL MIGRATIONS (run this once in Supabase SQL Editor)
-- ============================================================


-- ── Migration 1: Core tables ─────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

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


-- ── Migration 2: Security hardening ──────────────────────────

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

revoke execute on function public.is_admin(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;


-- ── Migration 3: Seed admin user ─────────────────────────────

create extension if not exists pgcrypto;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower('SubediD30@uww.edu');

  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'SubediD30@uww.edu',
      crypt('UWWhitewaterCS@2026!Dept', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Department Admin","user_category":"faculty"}'::jsonb,
      now(), now(),
      '', '', '', ''
    );
  end if;

  update public.profiles
     set account_role = 'admin',
         status = 'active',
         user_category = null,
         accepted_at = coalesce(accepted_at, now()),
         full_name = coalesce(nullif(full_name, ''), 'Department Admin')
   where id = v_uid;

  insert into public.profiles (id, email, full_name, account_role, status, accepted_at)
  select v_uid, 'SubediD30@uww.edu', 'Department Admin', 'admin', 'active', now()
  where not exists (select 1 from public.profiles where id = v_uid);
end $$;


-- ── Migration 4: Grant is_admin to authenticated ──────────────

grant execute on function public.is_admin(uuid) to authenticated;


-- ── Migration 5: Alumni email constraint fix ──────────────────

CREATE UNIQUE INDEX IF NOT EXISTS alumni_email_unique ON public.alumni (lower(email));
ALTER TABLE public.alumni DROP CONSTRAINT IF EXISTS alumni_email_key;
ALTER TABLE public.alumni ADD CONSTRAINT alumni_email_key UNIQUE (email);


-- ── Migration 6: Foreign key & index fixes ────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_responses_survey_id_fkey') THEN
    ALTER TABLE public.survey_responses
      ADD CONSTRAINT survey_responses_survey_id_fkey
      FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_responses_alumni_id_fkey') THEN
    ALTER TABLE public.survey_responses
      ADD CONSTRAINT survey_responses_alumni_id_fkey
      FOREIGN KEY (alumni_id) REFERENCES public.alumni(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_surveys_campaign_id ON public.surveys(campaign_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_alumni_id ON public.survey_responses(alumni_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);


-- ── Migration 7: Tally form ID on surveys ────────────────────

alter table public.surveys add column if not exists tally_form_id text;
create index if not exists idx_surveys_tally_form_id on public.surveys (tally_form_id);


-- ── Migration 8: Survey campaigns ────────────────────────────

alter table public.campaigns
  add column if not exists type text not null default 'email'
    check (type in ('email', 'survey')),
  add column if not exists tally_form_id text,
  add column if not exists tally_form_url text;

create index if not exists idx_campaigns_type on public.campaigns (type);
create index if not exists idx_campaigns_tally_form_id on public.campaigns (tally_form_id);

create table if not exists public.survey_recipients (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaigns(id) on delete cascade,
  alumni_id    uuid references public.alumni(id) on delete set null,
  email        text not null,
  name         text not null default '',
  token        text not null unique,
  sent_at      timestamptz,
  opened_at    timestamptz,
  submitted_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_survey_recipients_campaign on public.survey_recipients (campaign_id);
create index if not exists idx_survey_recipients_token on public.survey_recipients (token);
create index if not exists idx_survey_recipients_email on public.survey_recipients (email);

alter table public.survey_recipients enable row level security;

create policy "survey_recipients_admin_all"
  on public.survey_recipients for all
  to authenticated
  using  (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


-- ── Migration 9: Help content table ──────────────────────────

CREATE TABLE public.help_content (
  key        text        PRIMARY KEY,
  title      text        NOT NULL DEFAULT '',
  body       text        NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid        REFERENCES auth.users(id)
);

ALTER TABLE public.help_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read help_content"
  ON public.help_content
  FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO public.help_content (key, title, body) VALUES
  ('email_campaign', 'Email campaigns', 'Send personalized emails to a filtered segment of alumni. Each recipient receives the email with their first name and graduation year automatically filled in.

Use the audience filters on the right to target by tags, graduation year, or mentorship interest. The recipient count updates live as you adjust filters.'),
  ('survey_campaign', 'Survey campaigns', 'Survey campaigns send each recipient a unique, trackable link to an embedded form. You can see who opened the email, who clicked the link, and who submitted a response — all from the campaign detail page.

Create your form in Tally.so first, then paste the form ID and URL into the campaign before sending.'),
  ('survey', 'Surveys', 'Surveys collect structured feedback from alumni via Tally.so forms. When an alumni submits the form, their response is automatically captured and matched to their alumni record by email.

To set up a survey: create the form in Tally, add a survey record here with the Tally form ID, then create a survey campaign to send the links.'),
  ('mentorship', 'Mentorship program', 'Alumni listed here have opted into mentoring current CS students. Use the campaigns section to reach out to mentors in bulk, or view individual profiles to contact them directly.'),
  ('alumni_import', 'Importing alumni', 'Upload a CSV file to bulk-import alumni records. Required columns: full_name, email. Optional: company, job_title, graduation_year, industry, tags, mentorship_interest.

Existing records matched by email will be updated. New emails will be created as new records.')
ON CONFLICT (key) DO NOTHING;


-- ── Migration 10: Survey campaign picker ─────────────────────

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS survey_id uuid REFERENCES public.surveys(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_survey_id ON public.campaigns (survey_id);

CREATE POLICY "authenticated users can read surveys"
  ON public.surveys FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated users can read campaigns"
  ON public.campaigns FOR SELECT TO authenticated USING (true);


-- ── Migration 11: Alumni groups ───────────────────────────────

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

alter table public.campaigns
  add column if not exists filter_group_ids uuid[] not null default '{}';


-- ── Migration 12: Tighten groups RLS ─────────────────────────

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

drop policy if exists "authenticated can insert alumni_groups" on public.alumni_groups;
drop policy if exists "authenticated can delete alumni_groups" on public.alumni_groups;

create policy "admins can insert alumni_groups"
  on public.alumni_groups for insert to authenticated
  with check (public.is_admin(auth.uid()));

create policy "admins can delete alumni_groups"
  on public.alumni_groups for delete to authenticated
  using (public.is_admin(auth.uid()));
