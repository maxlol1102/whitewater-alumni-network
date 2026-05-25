-- Link campaigns to the survey whose form they distribute
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS survey_id uuid REFERENCES public.surveys(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_survey_id ON public.campaigns (survey_id);

-- Open surveys for reading by all authenticated users (survey picker in campaign form)
CREATE POLICY "authenticated users can read surveys"
  ON public.surveys FOR SELECT TO authenticated USING (true);

-- Open campaigns for reading by all authenticated users
CREATE POLICY "authenticated users can read campaigns"
  ON public.campaigns FOR SELECT TO authenticated USING (true);
