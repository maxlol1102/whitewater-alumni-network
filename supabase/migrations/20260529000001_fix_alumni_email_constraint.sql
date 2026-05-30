-- The previous migration replaced the unique constraint with a partial index,
-- but ON CONFLICT (email) requires a named constraint, not just an index.
-- PostgreSQL's UNIQUE constraint already allows multiple NULLs (NULL != NULL),
-- so a partial index was unnecessary. Restore the named constraint.
DROP INDEX IF EXISTS public.alumni_email_unique;
ALTER TABLE public.alumni ADD CONSTRAINT alumni_email_key UNIQUE (email);
