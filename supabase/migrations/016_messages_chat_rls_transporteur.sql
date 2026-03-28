-- ============================================================
-- ViaLogi: Chat client ↔ transporteur — lecture des messages
-- Avant : seul l’expéditeur et le propriétaire de l’annonce pouvaient SELECT.
-- Les transporteurs ne voyaient pas les messages du client → Realtime vide.
-- ============================================================

DROP POLICY IF EXISTS "messages_select_involved" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_authenticated" ON public.messages;

CREATE POLICY "messages_select_involved"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = messages.shipment_id
        AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.shipments s
      INNER JOIN public.profiles p ON p.id = auth.uid() AND p.role = 'transporteur'
      WHERE s.id = messages.shipment_id
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
  );

CREATE POLICY "messages_insert_authenticated"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = messages.shipment_id
        AND (
          s.user_id = auth.uid()
          OR (
            EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid() AND p.role = 'transporteur'
            )
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
    )
  );
