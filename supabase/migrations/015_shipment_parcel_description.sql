-- Description textuelle du colis (annonce)
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS parcel_description text;

COMMENT ON COLUMN public.shipments.parcel_description IS 'Détails sur le colis (facultatif).';
