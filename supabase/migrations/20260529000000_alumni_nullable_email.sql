-- Allow alumni records without an email address (e.g. imported from historical records).
-- Replace the NOT NULL unique constraint with a partial unique index so NULL emails
-- are not compared against each other (NULL != NULL in SQL), only real emails must be unique.
ALTER TABLE public.alumni ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.alumni DROP CONSTRAINT alumni_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS alumni_email_unique ON public.alumni (email) WHERE email IS NOT NULL;
