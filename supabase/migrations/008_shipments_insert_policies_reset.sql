-- ============================================================
-- ViaLogi: Reset shipments INSERT RLS policies (production fix)
-- Run once in Supabase → SQL Editor if publish still fails with RLS.
-- Recreates authenticated (profile role) + anon fallback inserts.
-- ============================================================

DROP POLICY IF EXISTS "shipments_insert_anon" ON public.shipments;
DROP POLICY IF EXISTS "shipments_insert_authenticated" ON public.shipments;
DROP POLICY IF EXISTS "shipments_insert_anon_compat" ON public.shipments;

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

CREATE POLICY "shipments_insert_anon_compat"
  ON public.shipments FOR INSERT
  TO anon
  WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.shipments TO anon, authenticated;
