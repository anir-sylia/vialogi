-- ============================================================
-- ViaLogi: Photo de profil + photo type de transport (Storage)
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS transport_photo_url text;

COMMENT ON COLUMN public.profiles.avatar_url IS 'URL publique (bucket profile-photos).';
COMMENT ON COLUMN public.profiles.transport_photo_url IS 'Photo du véhicule / type de transport (transporteurs).';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  4194304,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "profile_photos_select_public" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_insert_own_folder" ON storage.objects;

CREATE POLICY "profile_photos_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-photos');

-- Un fichier par utilisateur : premier segment du chemin = auth.uid()
CREATE POLICY "profile_photos_insert_own_folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );
