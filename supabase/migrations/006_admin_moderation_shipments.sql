-- ============================================================
-- ViaLogi: Admin moderation for shipments (annonces)
-- ============================================================

-- 1) Allow "admin" role in profiles.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('client', 'transporteur', 'admin'));

-- 2) Add moderation columns on shipments.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shipments'
      AND column_name = 'removed_by'
  ) THEN
    ALTER TABLE public.shipments
      ADD COLUMN removed_by uuid REFERENCES public.profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shipments'
      AND column_name = 'removed_at'
  ) THEN
    ALTER TABLE public.shipments
      ADD COLUMN removed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shipments'
      AND column_name = 'removal_reason'
  ) THEN
    ALTER TABLE public.shipments
      ADD COLUMN removal_reason text;
  END IF;
END $$;

-- 3) Extend shipment status with "removed".
ALTER TABLE public.shipments
  DROP CONSTRAINT IF EXISTS shipments_status_check;

ALTER TABLE public.shipments
  ADD CONSTRAINT shipments_status_check
  CHECK (status IN ('open', 'assigned', 'completed', 'removed'));

-- 4) Moderation logs table.
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('remove')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moderation_logs_annonce_idx
  ON public.moderation_logs (annonce_id, created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_logs_admin_idx
  ON public.moderation_logs (admin_id, created_at DESC);

ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moderation_logs_select_admin" ON public.moderation_logs;
DROP POLICY IF EXISTS "moderation_logs_insert_admin" ON public.moderation_logs;

CREATE POLICY "moderation_logs_select_admin"
  ON public.moderation_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

CREATE POLICY "moderation_logs_insert_admin"
  ON public.moderation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

GRANT SELECT, INSERT ON TABLE public.moderation_logs TO authenticated;
