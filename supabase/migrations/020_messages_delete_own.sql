-- ============================================================
-- ViaLogi: Suppression de ses propres messages (chat)
-- ============================================================

GRANT DELETE ON TABLE public.messages TO authenticated;

DROP POLICY IF EXISTS "messages_delete_own" ON public.messages;

CREATE POLICY "messages_delete_own"
  ON public.messages FOR DELETE
  TO authenticated
  USING (
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
