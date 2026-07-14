
CREATE TABLE public.question_bank (
  section_number integer PRIMARY KEY CHECK (section_number BETWEEN 1 AND 500),
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.question_bank TO authenticated;
GRANT ALL ON public.question_bank TO service_role;

ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read bank"
  ON public.question_bank FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin write bank"
  ON public.question_bank FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER question_bank_touch
  BEFORE UPDATE ON public.question_bank
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
