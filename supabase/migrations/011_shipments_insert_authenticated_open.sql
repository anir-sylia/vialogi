-- ============================================================
-- ViaLogi: secours publication — INSERT pour tout JWT authentifié
--
-- Les politiques RLS permissives sont en OR : si celle-ci passe,
-- l’insert est accepté même si user_can_post_shipment() échoue
-- (profil manquant, décalage auth.users ↔ profiles, etc.).
--
-- À exécuter dans Supabase → SQL Editor si 010 ne suffit pas.
-- ============================================================

DROP POLICY IF EXISTS "shipments_insert_authenticated_open" ON public.shipments;

CREATE POLICY "shipments_insert_authenticated_open"
  ON public.shipments FOR INSERT
  TO authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON TABLE public.shipments TO authenticated;
