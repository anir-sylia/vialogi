-- Fenêtre de disponibilité / échéance pour les annonces (jours calendaires).

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS pickup_available_from date,
  ADD COLUMN IF NOT EXISTS deliver_by date;

COMMENT ON COLUMN public.shipments.pickup_available_from IS 'Premier jour où le colis peut être enlevé.';
COMMENT ON COLUMN public.shipments.deliver_by IS 'Dernier jour pour livrer (échéance).';
