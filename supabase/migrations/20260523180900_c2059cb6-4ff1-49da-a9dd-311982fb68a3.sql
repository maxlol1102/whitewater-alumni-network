CREATE UNIQUE INDEX IF NOT EXISTS alumni_email_unique ON public.alumni (lower(email));
-- Drop & recreate as a real unique constraint usable by ON CONFLICT (email)
ALTER TABLE public.alumni DROP CONSTRAINT IF EXISTS alumni_email_key;
ALTER TABLE public.alumni ADD CONSTRAINT alumni_email_key UNIQUE (email);