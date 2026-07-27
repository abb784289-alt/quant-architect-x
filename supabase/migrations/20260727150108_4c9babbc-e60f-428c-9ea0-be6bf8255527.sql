
CREATE TABLE public.access_codes (
  code text PRIMARY KEY,
  expires_at timestamptz,
  disabled boolean NOT NULL DEFAULT false,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_codes TO authenticated;
GRANT ALL ON public.access_codes TO service_role;

ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage access_codes"
  ON public.access_codes FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.code_redemptions (
  user_id uuid PRIMARY KEY,
  code text NOT NULL REFERENCES public.access_codes(code) ON DELETE RESTRICT,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.code_redemptions TO authenticated;
GRANT ALL ON public.code_redemptions TO service_role;

ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own redemption"
  ON public.code_redemptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins manage redemptions"
  ON public.code_redemptions FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- Server-side redemption: validates code, enforces one-per-user, atomic insert.
CREATE OR REPLACE FUNCTION public.redeem_access_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
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
$$;

REVOKE ALL ON FUNCTION public.redeem_access_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_access_code(text) TO authenticated;
