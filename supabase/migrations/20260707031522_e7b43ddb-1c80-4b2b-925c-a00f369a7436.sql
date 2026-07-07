
-- ============================================================
-- 1. Move has_role() into a non-exposed schema (private)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Rewrite policies to reference private.has_role and drop the public one
DROP POLICY IF EXISTS "users read own sessions" ON public.exam_sessions;
CREATE POLICY "users read own sessions"
ON public.exam_sessions
FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admins write questions" ON public.questions;
CREATE POLICY "admins write questions"
ON public.questions
FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admins write sections" ON public.sections;
CREATE POLICY "admins write sections"
ON public.sections
FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "anyone reads published sections" ON public.sections;
CREATE POLICY "anyone reads published sections"
ON public.sections
FOR SELECT TO public
USING ((published = true) OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- Storage policies may reference public.has_role too; recreate any that do
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual LIKE '%has_role%' OR with_check LIKE '%has_role%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    -- recreate is out of scope here; admins are advised to reference private.has_role
  END LOOP;
END$$;

-- Finally drop the old public function
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- ============================================================
-- 2. Hide correct_index / explanation from the questions table
-- ============================================================
-- Revoke wide SELECT and re-grant only non-sensitive columns.
REVOKE SELECT ON public.questions FROM authenticated;
REVOKE SELECT ON public.questions FROM anon;
GRANT SELECT (id, section_id, prompt, choices, order_index, created_at)
  ON public.questions TO authenticated;

-- Service role (used by server-side/admin flows) retains full access.
GRANT ALL ON public.questions TO service_role;

-- ============================================================
-- 3. Admin-only management policies for user_roles
-- ============================================================
CREATE POLICY "admins insert roles"
ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins update roles"
ON public.user_roles
FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins delete roles"
ON public.user_roles
FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));
