
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('section','foundation')),
  track text NOT NULL DEFAULT 'quantitative',
  key text NOT NULL,
  video_path text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, track, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_assets_read_auth"
  ON public.media_assets FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "media_assets_admin_insert"
  ON public.media_assets FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "media_assets_admin_update"
  ON public.media_assets FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "media_assets_admin_delete"
  ON public.media_assets FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER media_assets_touch BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
