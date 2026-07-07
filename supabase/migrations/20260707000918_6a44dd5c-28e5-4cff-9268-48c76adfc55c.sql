
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Auto-assign user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Category enum
CREATE TYPE public.section_category AS ENUM ('algebra','geometry','arithmetic','statistics');

-- Sections
CREATE TABLE public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category public.section_category NOT NULL DEFAULT 'algebra',
  order_index integer NOT NULL DEFAULT 0,
  video_path text,
  timer_seconds integer NOT NULL DEFAULT 1500,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sections TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.sections TO authenticated;
GRANT ALL ON public.sections TO service_role;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads published sections" ON public.sections FOR SELECT USING (published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins write sections" ON public.sections FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Questions
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  choices jsonb NOT NULL,
  correct_index integer NOT NULL,
  explanation text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read questions" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write questions" ON public.questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Exam sessions
CREATE TABLE public.exam_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  auto_submitted boolean NOT NULL DEFAULT false,
  score integer,
  total_questions integer,
  time_taken_seconds integer,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_report jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.exam_sessions TO authenticated;
GRANT ALL ON public.exam_sessions TO service_role;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own sessions" ON public.exam_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users insert own sessions" ON public.exam_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own sessions" ON public.exam_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER sections_touch BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX sections_category_order_idx ON public.sections(category, order_index);
CREATE INDEX questions_section_idx ON public.questions(section_id, order_index);
CREATE INDEX exam_sessions_user_idx ON public.exam_sessions(user_id, created_at DESC);
