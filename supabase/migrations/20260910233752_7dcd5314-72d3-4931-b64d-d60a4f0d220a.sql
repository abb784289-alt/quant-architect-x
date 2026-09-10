CREATE TABLE public.skill_settings (
  skill_id integer PRIMARY KEY,
  title text,
  hidden boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skill_settings TO authenticated;
GRANT ALL ON public.skill_settings TO service_role;
ALTER TABLE public.skill_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_settings_read" ON public.skill_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "skill_settings_admin" ON public.skill_settings FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.skill_question_settings (
  question_id text PRIMARY KEY,
  skill_id integer NOT NULL,
  correct_index smallint,
  hidden boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skill_question_settings TO authenticated;
GRANT ALL ON public.skill_question_settings TO service_role;
ALTER TABLE public.skill_question_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_questions_read" ON public.skill_question_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "skill_questions_admin" ON public.skill_question_settings FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));