-- Adds the `price` column that was missing from the live table.
-- Run in Supabase → SQL Editor if it wasn't applied automatically.

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS price numeric(14, 2) NOT NULL DEFAULT 0 CHECK (price >= 0);

-- Re-grant to make sure the new column is accessible
GRANT SELECT, INSERT ON TABLE public.shipments TO anon, authenticated;
