-- ============================================================
-- ViaLogi: Chat — Transporteur ne voit que (client + lui-même)
-- Fix v2: avoid infinite recursion in RLS policy.
--
-- Problem:
-- Migration 023 used EXISTS (...) on public.messages inside a policy
-- on public.messages, which can trigger infinite recursion.
--
-- Solution:
-- Do not reference public.messages in the SELECT policy/function.
-- Use shipments ownership/assignment + offers participation to decide.
-- ============================================================

DROP POLICY IF EXISTS "messages_select_involved" ON public.messages;

CREATE POLICY "messages_select_involved"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    -- Always allow reading your own messages
    sender_id = auth.uid()
    OR EXISTS (
      -- Client (shipment owner) can read all messages in their shipment
      SELECT 1 FROM public.shipments s
      WHERE s.id = messages.shipment_id
        AND s.user_id = auth.uid()
    )
    OR EXISTS (
      -- Transporteur can read only:
      -- - messages they sent
      -- - messages sent by the client of that shipment
      SELECT 1 FROM public.shipments s
      INNER JOIN public.profiles p
        ON p.id = auth.uid() AND p.role = 'transporteur'
      WHERE s.id = messages.shipment_id
        AND s.status IN ('open', 'assigned', 'completed')
        AND (
          s.assigned_transporteur_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.offers o
            WHERE o.shipment_id = s.id AND o.transporteur_id = auth.uid()
          )
        )
        AND (
          messages.sender_id = auth.uid()
          OR messages.sender_id = s.user_id
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
    AND EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = m.shipment_id
        AND (
          -- Client owner
          s.user_id = auth.uid()
          OR
          -- Transporteur participant
          (
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
            )
          )
        )
    )
    AND (
      NOT EXISTS (
        SELECT 1 FROM public.chat_read_state r
        WHERE r.user_id = auth.uid()
          AND r.shipment_id = m.shipment_id
      )
      OR m.created_at > (
        SELECT r.last_read_at
        FROM public.chat_read_state r
        WHERE r.user_id = auth.uid()
          AND r.shipment_id = m.shipment_id
      )
    );
$$;

REVOKE ALL ON FUNCTION public.count_unread_chat_messages() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_unread_chat_messages() TO authenticated;

