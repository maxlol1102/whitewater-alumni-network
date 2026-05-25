-- Help content table: stores admin-editable help/documentation blocks
-- keyed by feature slug (e.g. email_campaign, survey_campaign, survey).
-- All writes go through server functions using the service role.
-- Authenticated users can read; no public read needed (app requires login).

CREATE TABLE public.help_content (
  key        text        PRIMARY KEY,
  title      text        NOT NULL DEFAULT '',
  body       text        NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid        REFERENCES auth.users(id)
);

ALTER TABLE public.help_content ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read help content
CREATE POLICY "authenticated users can read help_content"
  ON public.help_content
  FOR SELECT
  TO authenticated
  USING (true);

-- Writes bypass RLS via supabaseAdmin (service role) in server functions

-- Seed default content
INSERT INTO public.help_content (key, title, body) VALUES
  (
    'email_campaign',
    'Email campaigns',
    'Send personalized emails to a filtered segment of alumni. Each recipient receives the email with their first name and graduation year automatically filled in.

Use the audience filters on the right to target by tags, graduation year, or mentorship interest. The recipient count updates live as you adjust filters.'
  ),
  (
    'survey_campaign',
    'Survey campaigns',
    'Survey campaigns send each recipient a unique, trackable link to an embedded form. You can see who opened the email, who clicked the link, and who submitted a response — all from the campaign detail page.

Create your form in Tally.so first, then paste the form ID and URL into the campaign before sending.'
  ),
  (
    'survey',
    'Surveys',
    'Surveys collect structured feedback from alumni via Tally.so forms. When an alumni submits the form, their response is automatically captured and matched to their alumni record by email.

To set up a survey: create the form in Tally, add a survey record here with the Tally form ID, then create a survey campaign to send the links.'
  ),
  (
    'mentorship',
    'Mentorship program',
    'Alumni listed here have opted into mentoring current CS students. Use the campaigns section to reach out to mentors in bulk, or view individual profiles to contact them directly.'
  ),
  (
    'alumni_import',
    'Importing alumni',
    'Upload a CSV file to bulk-import alumni records. Required columns: full_name, email. Optional: company, job_title, graduation_year, industry, tags, mentorship_interest.

Existing records matched by email will be updated. New emails will be created as new records.'
  )
ON CONFLICT (key) DO NOTHING;
