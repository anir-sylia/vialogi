-- ============================================================
-- ViaLogi: Allow authenticated shippers (and related roles) to post shipments
-- Previously only role = 'client' could INSERT, which blocked
-- transporteurs/admins who open /post and caused RLS failures.
-- ============================================================

DROP POLICY IF EXISTS "shipments_insert_authenticated" ON public.shipments;

CREATE POLICY "shipments_insert_authenticated"
  ON public.shipments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('client', 'transporteur', 'admin')
    )
  );
