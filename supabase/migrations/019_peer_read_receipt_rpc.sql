-- ============================================================
-- ViaLogi: Heure de dernière lecture de l’interlocuteur (accusés)
-- La table chat_read_state est lisible seulement par soi-même (RLS).
-- Cette RPC (SECURITY DEFINER) expose uniquement la ligne du *peer* pour l’UI.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_peer_last_read_at(p_shipment_id uuid)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.last_read_at
  FROM public.shipments s
  LEFT JOIN public.chat_read_state r
    ON r.shipment_id = s.id
    AND r.user_id = CASE
      WHEN auth.uid() = s.user_id THEN s.assigned_transporteur_id
      ELSE s.user_id
    END
  WHERE s.id = p_shipment_id
    AND (
      s.user_id = auth.uid()
      OR (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'transporteur')
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
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_peer_last_read_at(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_peer_last_read_at(uuid) TO authenticated;
