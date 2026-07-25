
CREATE TABLE public.study_state (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_state TO authenticated;
GRANT ALL ON public.study_state TO service_role;

ALTER TABLE public.study_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own study state"
  ON public.study_state
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER study_state_touch_updated_at
  BEFORE UPDATE ON public.study_state
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.study_state REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_state;
