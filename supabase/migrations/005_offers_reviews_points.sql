-- ============================================================
-- ViaLogi: Offers, Reviews, Points, Shipment status
-- Run in Supabase → SQL Editor
-- ============================================================

-- 1) Add columns to profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='points') THEN
    ALTER TABLE public.profiles ADD COLUMN points integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='total_transactions') THEN
    ALTER TABLE public.profiles ADD COLUMN total_transactions integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='avg_rating') THEN
    ALTER TABLE public.profiles ADD COLUMN avg_rating numeric(3,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 2) Add columns to shipments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='shipments' AND column_name='status') THEN
    ALTER TABLE public.shipments ADD COLUMN status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','completed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='shipments' AND column_name='assigned_transporteur_id') THEN
    ALTER TABLE public.shipments ADD COLUMN assigned_transporteur_id uuid REFERENCES public.profiles(id);
  END IF;
END $$;

-- 3) Offers table
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  transporteur_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  price numeric(14,2) NOT NULL CHECK (price > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','refused')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS offers_shipment_idx ON public.offers (shipment_id, created_at);
CREATE INDEX IF NOT EXISTS offers_transporteur_idx ON public.offers (transporteur_id);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offers_select" ON public.offers;
DROP POLICY IF EXISTS "offers_insert" ON public.offers;
DROP POLICY IF EXISTS "offers_update" ON public.offers;

CREATE POLICY "offers_select" ON public.offers FOR SELECT TO authenticated
  USING (
    transporteur_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.shipments WHERE shipments.id = offers.shipment_id AND shipments.user_id = auth.uid())
  );

CREATE POLICY "offers_insert" ON public.offers FOR INSERT TO authenticated
  WITH CHECK (
    transporteur_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'transporteur')
  );

CREATE POLICY "offers_update" ON public.offers FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.shipments WHERE shipments.id = offers.shipment_id AND shipments.user_id = auth.uid())
  );

GRANT SELECT, INSERT, UPDATE ON TABLE public.offers TO authenticated;

-- 4) Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, shipment_id)
);

CREATE INDEX IF NOT EXISTS reviews_to_user_idx ON public.reviews (to_user_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;

CREATE POLICY "reviews_select" ON public.reviews FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (from_user_id = auth.uid());

GRANT SELECT ON TABLE public.reviews TO anon, authenticated;
GRANT INSERT ON TABLE public.reviews TO authenticated;

-- Allow authenticated users to update shipments they own (for status changes)
DROP POLICY IF EXISTS "shipments_update_owner" ON public.shipments;
CREATE POLICY "shipments_update_owner" ON public.shipments FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
GRANT UPDATE ON TABLE public.shipments TO authenticated;

-- RPC to increment points/transactions (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.increment_profile_stats(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET points = points + 1,
      total_transactions = total_transactions + 1
  WHERE id = target_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_profile_stats(uuid) TO authenticated;

-- RPC to recalculate avg_rating (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.recalc_avg_rating(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_avg numeric(3,2);
BEGIN
  SELECT COALESCE(AVG(rating)::numeric(3,2), 0)
  INTO new_avg
  FROM public.reviews
  WHERE to_user_id = target_id;

  UPDATE public.profiles
  SET avg_rating = new_avg
  WHERE id = target_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalc_avg_rating(uuid) TO authenticated;
