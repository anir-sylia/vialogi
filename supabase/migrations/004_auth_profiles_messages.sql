-- ============================================================
-- ViaLogi: Auth profiles, messages table, shipments user_id
-- Run in Supabase → SQL Editor
-- ============================================================

-- 1) Profiles table — linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('client', 'transporteur')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  transport_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles (needed for chat display names)
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO anon, authenticated;

-- 2) Add user_id to shipments (nullable for existing rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shipments'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.shipments ADD COLUMN user_id uuid REFERENCES public.profiles(id);
  END IF;
END $$;

-- Update shipments RLS: anon can read, only authenticated clients can insert
DROP POLICY IF EXISTS "shipments_select_anon" ON public.shipments;
DROP POLICY IF EXISTS "shipments_insert_anon" ON public.shipments;

CREATE POLICY "shipments_select_all"
  ON public.shipments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "shipments_insert_authenticated"
  ON public.shipments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'client')
  );

-- Also allow anon insert for backward compatibility during transition
CREATE POLICY "shipments_insert_anon_compat"
  ON public.shipments FOR INSERT
  TO anon
  WITH CHECK (true);

GRANT SELECT, INSERT ON TABLE public.shipments TO anon, authenticated;

-- 3) Messages table for real-time chat
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_shipment_created_idx
  ON public.messages (shipment_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read messages for shipments they're involved in
CREATE POLICY "messages_select_involved"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shipments
      WHERE shipments.id = messages.shipment_id
        AND shipments.user_id = auth.uid()
    )
  );

-- Authenticated users can insert messages
CREATE POLICY "messages_insert_authenticated"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

GRANT SELECT, INSERT ON TABLE public.messages TO authenticated;

-- 4) Enable Realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
