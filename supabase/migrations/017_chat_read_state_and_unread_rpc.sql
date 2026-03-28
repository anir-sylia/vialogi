-- ============================================================
-- ViaLogi: Messages non lus + fonction SECURITY DEFINER
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_read_state (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, shipment_id)
);

CREATE INDEX IF NOT EXISTS chat_read_state_user_idx ON public.chat_read_state (user_id);

ALTER TABLE public.chat_read_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_read_select_own" ON public.chat_read_state;
DROP POLICY IF EXISTS "chat_read_insert_own" ON public.chat_read_state;
DROP POLICY IF EXISTS "chat_read_update_own" ON public.chat_read_state;

CREATE POLICY "chat_read_select_own"
  ON public.chat_read_state FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "chat_read_insert_own"
  ON public.chat_read_state FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_read_update_own"
  ON public.chat_read_state FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.chat_read_state TO authenticated;

-- Compte les messages reçus (autre expéditeur) non couverts par last_read_at
CREATE OR REPLACE FUNCTION public.count_unread_chat_messages()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.messages m
  WHERE m.sender_id <> auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.shipments s
        WHERE s.id = m.shipment_id AND s.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.shipments s
        INNER JOIN public.profiles p ON p.id = auth.uid() AND p.role = 'transporteur'
        WHERE s.id = m.shipment_id
          AND s.status IN ('open', 'assigned', 'completed')
          AND (
            s.assigned_transporteur_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.offers o
              WHERE o.shipment_id = s.id AND o.transporteur_id = auth.uid()
            )
            OR s.status = 'open'
          )
      )
    )
    AND (
      NOT EXISTS (
        SELECT 1 FROM public.chat_read_state r
        WHERE r.user_id = auth.uid() AND r.shipment_id = m.shipment_id
      )
      OR m.created_at > (
        SELECT r.last_read_at
        FROM public.chat_read_state r
        WHERE r.user_id = auth.uid() AND r.shipment_id = m.shipment_id
      )
    );
$$;

REVOKE ALL ON FUNCTION public.count_unread_chat_messages() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_unread_chat_messages() TO authenticated;
