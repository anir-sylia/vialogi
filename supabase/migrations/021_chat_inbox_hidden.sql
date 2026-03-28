-- ============================================================
-- ViaLogi: Masquer une conversation dans « Mes messages » (par utilisateur)
-- Ne supprime pas les messages ; réapparaît si un message est plus récent que hidden_at.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_inbox_hidden (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  hidden_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, shipment_id)
);

CREATE INDEX IF NOT EXISTS chat_inbox_hidden_user_idx ON public.chat_inbox_hidden (user_id);

ALTER TABLE public.chat_inbox_hidden ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_inbox_hidden_select_own" ON public.chat_inbox_hidden;
DROP POLICY IF EXISTS "chat_inbox_hidden_insert_own" ON public.chat_inbox_hidden;
DROP POLICY IF EXISTS "chat_inbox_hidden_update_own" ON public.chat_inbox_hidden;
DROP POLICY IF EXISTS "chat_inbox_hidden_delete_own" ON public.chat_inbox_hidden;

CREATE POLICY "chat_inbox_hidden_select_own"
  ON public.chat_inbox_hidden FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "chat_inbox_hidden_insert_own"
  ON public.chat_inbox_hidden FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_inbox_hidden_update_own"
  ON public.chat_inbox_hidden FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_inbox_hidden_delete_own"
  ON public.chat_inbox_hidden FOR DELETE TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_inbox_hidden TO authenticated;
