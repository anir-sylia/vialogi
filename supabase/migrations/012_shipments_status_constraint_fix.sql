-- ============================================================
-- ViaLogi: Aligner shipments.status sur les valeurs attendues par l’app
-- (corrige violations de shipments_status_check si la prod a dérivé.)
-- ============================================================

ALTER TABLE public.shipments
  DROP CONSTRAINT IF EXISTS shipments_status_check;

ALTER TABLE public.shipments
  ADD CONSTRAINT shipments_status_check
  CHECK (status IN ('open', 'assigned', 'completed', 'removed'));

ALTER TABLE public.shipments
  ALTER COLUMN status SET DEFAULT 'open';
