-- ============================================================
-- ViaLogi: RLS shipments — insert fiable + modération admin (UPDATE)
--
-- Problème résolu: le WITH CHECK qui fait EXISTS(...) sur profiles
-- peut échouer selon l’ordre d’évaluation RLS. La fonction SECURITY DEFINER
-- lit profiles avec les droits du propriétaire (pas de blocage croisé).
--
-- Exécuter dans Supabase → SQL Editor si la publication échoue encore (RLS).
-- ============================================================

-- 1) Supprimer toutes les politiques existantes sur shipments (noms variables selon l’historique)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shipments'
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.shipments', r.policyname);
  END LOOP;
END $$;

-- 2) Fonction utilisée par la politique INSERT (authenticated)
CREATE OR REPLACE FUNCTION public.user_can_post_shipment()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = auth.uid()
      AND p.role IN ('client', 'transporteur', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.user_can_post_shipment() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_post_shipment() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_post_shipment() TO anon;

-- 3) Politiques shipments
CREATE POLICY "shipments_select_all"
  ON public.shipments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "shipments_insert_authenticated"
  ON public.shipments FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can_post_shipment());

CREATE POLICY "shipments_insert_anon_compat"
  ON public.shipments FOR INSERT
  TO anon
  WITH CHECK (true);

-- Propriétaire de l’annonce (WITH CHECK implicite = USING, comme la migration 005)
CREATE POLICY "shipments_update_owner"
  ON public.shipments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admin: modération (statut removed, etc.) sur les annonces des autres
CREATE POLICY "shipments_update_admin"
  ON public.shipments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.shipments TO anon, authenticated;
