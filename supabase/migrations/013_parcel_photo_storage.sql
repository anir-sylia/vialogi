-- ============================================================
-- ViaLogi: Photo du colis (URL publique Supabase Storage)
-- ============================================================

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS parcel_photo_url text;

COMMENT ON COLUMN public.shipments.parcel_photo_url IS 'URL publique de la photo du colis (bucket parcel-photos).';

-- Bucket Storage (public read pour affichage sur le site)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'parcel-photos',
  'parcel-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "parcel_photos_select_public" ON storage.objects;
DROP POLICY IF EXISTS "parcel_photos_insert_authenticated" ON storage.objects;

CREATE POLICY "parcel_photos_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'parcel-photos');

CREATE POLICY "parcel_photos_insert_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'parcel-photos');
