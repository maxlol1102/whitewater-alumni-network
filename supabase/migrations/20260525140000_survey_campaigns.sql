-- Add campaign type + Tally fields to campaigns table
alter table public.campaigns
  add column if not exists type text not null default 'email'
    check (type in ('email', 'survey')),
  add column if not exists tally_form_id text,
  add column if not exists tally_form_url text;

create index if not exists idx_campaigns_type
  on public.campaigns (type);
create index if not exists idx_campaigns_tally_form_id
  on public.campaigns (tally_form_id);

-- Per-recipient tracking for survey campaigns
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

create index if not exists idx_survey_recipients_campaign
  on public.survey_recipients (campaign_id);
create index if not exists idx_survey_recipients_token
  on public.survey_recipients (token);
create index if not exists idx_survey_recipients_email
  on public.survey_recipients (email);

alter table public.survey_recipients enable row level security;

create policy "survey_recipients_admin_all"
  on public.survey_recipients for all
  to authenticated
  using  (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
