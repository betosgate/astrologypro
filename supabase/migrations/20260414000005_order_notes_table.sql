-- order_notes: multi-note log per order
-- Each row is one note added by the diviner (or admin) on an order.
-- Replaces the single orders.notes text field for per-order note history.
CREATE TABLE IF NOT EXISTS public.order_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  diviner_id  UUID        NOT NULL REFERENCES public.diviners(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_by_name TEXT    NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_notes_order_id_idx ON public.order_notes (order_id, created_at DESC);

-- RLS: diviner can only see/manage notes on their own orders
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diviner_select_own_order_notes"
  ON public.order_notes FOR SELECT
  USING (diviner_id = (
    SELECT id FROM public.diviners WHERE user_id = auth.uid() LIMIT 1
  ));

CREATE POLICY "diviner_insert_own_order_notes"
  ON public.order_notes FOR INSERT
  WITH CHECK (diviner_id = (
    SELECT id FROM public.diviners WHERE user_id = auth.uid() LIMIT 1
  ));

CREATE POLICY "diviner_delete_own_order_notes"
  ON public.order_notes FOR DELETE
  USING (diviner_id = (
    SELECT id FROM public.diviners WHERE user_id = auth.uid() LIMIT 1
  ));
