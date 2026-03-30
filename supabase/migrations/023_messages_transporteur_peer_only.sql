-- ============================================================
-- ViaLogi: Chat — un transporteur ne voit que le client + lui-même
-- Sur une même annonce, plusieurs transporteurs peuvent écrire ;
-- sans cette règle, chacun voyait tout l’historique (autres TPE).
-- Le client (propriétaire) continue de voir tous les messages.
-- count_unread : pour un TPE, seuls les messages du client comptent.
-- ============================================================

DROP POLICY IF EXISTS "messages_select_involved" ON public.messages;

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
          messages.sender_id = auth.uid()
          OR messages.sender_id = s.user_id
        )
        AND (
          s.assigned_transporteur_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.offers o
            WHERE o.shipment_id = s.id AND o.transporteur_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.messages m2
            WHERE m2.shipment_id = s.id
              AND m2.sender_id = auth.uid()
          )
        )
    )
  );

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
          AND s.user_id = m.sender_id
          AND s.status IN ('open', 'assigned', 'completed')
          AND (
            s.assigned_transporteur_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.offers o
              WHERE o.shipment_id = s.id AND o.transporteur_id = auth.uid()
            )
            OR EXISTS (
              SELECT 1 FROM public.messages m2
              WHERE m2.shipment_id = s.id
                AND m2.sender_id = auth.uid()
            )
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
