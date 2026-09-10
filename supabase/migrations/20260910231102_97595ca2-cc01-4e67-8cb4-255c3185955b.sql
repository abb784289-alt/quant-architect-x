CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'::app_role)
$$;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

CREATE TABLE public.pro_max_chapter_settings (
  slug TEXT PRIMARY KEY,
  title TEXT,
  parts INTEGER NOT NULL DEFAULT 2 CHECK (parts BETWEEN 1 AND 8),
  hidden BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pro_max_chapter_settings TO authenticated;
GRANT ALL ON public.pro_max_chapter_settings TO service_role;
ALTER TABLE public.pro_max_chapter_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pro_max_chapters_read" ON public.pro_max_chapter_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "pro_max_chapters_admin" ON public.pro_max_chapter_settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.pro_max_question_settings (
  question_id TEXT PRIMARY KEY,
  chapter_slug TEXT NOT NULL,
  correct_index SMALLINT CHECK (correct_index BETWEEN 0 AND 3),
  hidden BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pro_max_question_settings TO authenticated;
GRANT ALL ON public.pro_max_question_settings TO service_role;
ALTER TABLE public.pro_max_question_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pro_max_questions_read" ON public.pro_max_question_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "pro_max_questions_admin" ON public.pro_max_question_settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));