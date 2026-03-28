-- ============================================================
-- ViaLogi: Messages — images et audio (Messenger-style)
-- ============================================================

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_kind text NOT NULL DEFAULT 'text';

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_message_kind_check;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_message_kind_check
  CHECK (message_kind IN ('text', 'image', 'audio'));

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS media_url text;

COMMENT ON COLUMN public.messages.message_kind IS 'text | image | audio';
COMMENT ON COLUMN public.messages.media_url IS 'URL publique (bucket chat-media) si image ou audio';

-- Bucket chat (lecture publique pour affichage dans le fil)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  true,
  10485760,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "chat_media_select_public" ON storage.objects;
DROP POLICY IF EXISTS "chat_media_insert_authenticated" ON storage.objects;

CREATE POLICY "chat_media_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'chat-media');

CREATE POLICY "chat_media_insert_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-media');
