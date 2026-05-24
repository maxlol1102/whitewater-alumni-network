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