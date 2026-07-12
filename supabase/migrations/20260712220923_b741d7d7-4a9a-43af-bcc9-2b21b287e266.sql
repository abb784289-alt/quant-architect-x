
-- Table: student_questions
CREATE TABLE public.student_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_text text,
  question_image_path text,
  reply_text text,
  reply_video_path text,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_questions_has_content CHECK (
    question_text IS NOT NULL OR question_image_path IS NOT NULL
  )
);

GRANT SELECT, INSERT, UPDATE ON public.student_questions TO authenticated;
GRANT ALL ON public.student_questions TO service_role;

ALTER TABLE public.student_questions ENABLE ROW LEVEL SECURITY;

-- Students can insert their own questions (only setting user_id = self, no reply fields)
CREATE POLICY "students insert own questions"
  ON public.student_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND reply_text IS NULL
    AND reply_video_path IS NULL
    AND replied_at IS NULL
  );

-- Students read their own; admins read all
CREATE POLICY "students read own or admin reads all"
  ON public.student_questions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update (to add replies)
CREATE POLICY "admins update questions"
  ON public.student_questions
  FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "admins delete questions"
  ON public.student_questions
  FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE TRIGGER student_questions_touch_updated_at
  BEFORE UPDATE ON public.student_questions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Index for admin listing
CREATE INDEX student_questions_created_at_idx ON public.student_questions (created_at DESC);
CREATE INDEX student_questions_user_id_idx ON public.student_questions (user_id, created_at DESC);

-- ============ Storage RLS: question-images ============
-- Path convention: <user_id>/<uuid>.<ext>
CREATE POLICY "students upload own question images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'question-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "students read own question images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'question-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR private.has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- ============ Storage RLS: reply-videos ============
-- Only admins can upload / read directly. Students get signed URLs from server functions.
CREATE POLICY "admins upload reply videos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reply-videos'
    AND private.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "admins read reply videos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reply-videos'
    AND private.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "admins delete reply videos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'reply-videos'
    AND private.has_role(auth.uid(), 'admin'::app_role)
  );
