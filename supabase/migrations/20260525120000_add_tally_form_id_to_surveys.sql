-- Add Tally.so form ID to surveys for webhook routing
alter table public.surveys add column if not exists tally_form_id text;
create index if not exists idx_surveys_tally_form_id on public.surveys (tally_form_id);
