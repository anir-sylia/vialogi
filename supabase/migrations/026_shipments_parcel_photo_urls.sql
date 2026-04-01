-- Plusieurs photos par annonce (max 3 côté application).

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS parcel_photo_urls text[];

COMMENT ON COLUMN public.shipments.parcel_photo_urls IS 'URLs publiques des photos du colis (ordre), jusqu''à 3 côté app.';

UPDATE public.shipments
SET parcel_photo_urls = ARRAY[parcel_photo_url]::text[]
WHERE parcel_photo_url IS NOT NULL
  AND btrim(parcel_photo_url) <> ''
  AND (parcel_photo_urls IS NULL OR cardinality(parcel_photo_urls) = 0);
