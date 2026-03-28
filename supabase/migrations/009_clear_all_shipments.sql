-- ============================================================
-- ViaLogi: Supprimer toutes les annonces (une fois, à l’application de la migration).
-- Les lignes liées (offers, messages, reviews, moderation_logs) sont
-- supprimées via ON DELETE CASCADE sur les FK vers shipments.
-- ============================================================

DELETE FROM public.shipments;
