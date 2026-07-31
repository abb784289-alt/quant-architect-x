-- 1) SECURITY DEFINER function no longer callable by anon/authenticated
DROP FUNCTION IF EXISTS public.redeem_access_code(text);

CREATE OR REPLACE FUNCTION public.redeem_access_code(_uid uuid, _code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _row public.access_codes%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF EXISTS (SELECT 1 FROM public.code_redemptions WHERE user_id = _uid) THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  SELECT * INTO _row FROM public.access_codes WHERE code = upper(trim(_code));
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid');
  END IF;
  IF _row.disabled THEN
    RETURN jsonb_build_object('ok', false, 'error', 'disabled');
  END IF;
  IF _row.expires_at IS NOT NULL AND _row.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  INSERT INTO public.code_redemptions(user_id, code) VALUES (_uid, _row.code);
  RETURN jsonb_build_object('ok', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.redeem_access_code(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_access_code(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2) media_assets: no unrestricted authenticated read
DROP POLICY IF EXISTS "media_assets_read_auth" ON public.media_assets;
CREATE POLICY "media_assets_admin_read" ON public.media_assets
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- 3) lecture-videos storage: strict per-video enrollment check
DROP POLICY IF EXISTS "lecture-videos entitled read" ON storage.objects;
DROP POLICY IF EXISTS "admins read lecture videos" ON storage.objects;
CREATE POLICY "lecture-videos entitled read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'lecture-videos'
    AND (
      private.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.sections s
        WHERE s.video_path = storage.objects.name
          AND (
            s.is_free = true
            OR EXISTS (
              SELECT 1 FROM public.section_enrollments se
              WHERE se.section_id = s.id AND se.user_id = auth.uid()
            )
          )
      )
    )
  );
