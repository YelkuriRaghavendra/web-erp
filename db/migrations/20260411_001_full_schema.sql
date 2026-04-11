-- ============================================================
-- Gas Agency ERP — Full Schema
-- Timestamp: 2026-04-11
--
-- Single consolidated migration containing:
--   - All tables (items, stock, customers, bills, purchases, etc.)
--   - item_prices (multi-price per item)
--   - bundle_components (multi-component bundles for linked items)
--   - Audit columns + triggers on all tables
--   - Login RPC (server-side password verification)
--   - exec_sql RPC (for auto-migrations)
--   - Row-level security policies
--   - Seed data (default items, stock, admin account)
-- ============================================================

-- Enable pgcrypto for SHA-256 password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- DROP existing tables (reverse FK order) — safe for fresh installs
-- ============================================================
DROP TABLE IF EXISTS bundle_components    CASCADE;
DROP TABLE IF EXISTS item_prices          CASCADE;
DROP TABLE IF EXISTS bill_lines           CASCADE;
DROP TABLE IF EXISTS purchase_lines       CASCADE;
DROP TABLE IF EXISTS bills                CASCADE;
DROP TABLE IF EXISTS purchases            CASCADE;
DROP TABLE IF EXISTS stock                CASCADE;
DROP TABLE IF EXISTS customers            CASCADE;
DROP TABLE IF EXISTS items                CASCADE;
DROP TABLE IF EXISTS transactions         CASCADE;
DROP TABLE IF EXISTS opening_balances     CASCADE;
DROP TABLE IF EXISTS staff                CASCADE;
DROP TABLE IF EXISTS _migrations          CASCADE;
DROP TABLE IF EXISTS deposit_settlements  CASCADE;

-- ============================================================
-- 1. ITEMS
-- ============================================================
CREATE TABLE public.items (
  item_id     bigserial    PRIMARY KEY,
  name        text         NOT NULL,
  unit        text         NOT NULL DEFAULT 'Nos',
  active      boolean      NOT NULL DEFAULT true,
  item_type   text         NOT NULL DEFAULT 'regular',
  -- audit
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  created_by  text         NOT NULL DEFAULT '',
  updated_by  text         NOT NULL DEFAULT ''
);

-- ============================================================
-- 2. ITEM PRICES (multiple prices per item)
-- ============================================================
CREATE TABLE public.item_prices (
  id          bigserial    PRIMARY KEY,
  item_id     bigint       NOT NULL REFERENCES public.items(item_id) ON DELETE CASCADE,
  price       numeric      NOT NULL CHECK (price >= 0),
  deposit     numeric      NOT NULL DEFAULT 0,
  sort_order  int          NOT NULL DEFAULT 0,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_item_prices_item_sort ON public.item_prices (item_id, sort_order);

-- ============================================================
-- 3. BUNDLE COMPONENTS (linked items deduct multiple stock items)
-- ============================================================
CREATE TABLE public.bundle_components (
  id                 bigserial    PRIMARY KEY,
  bundle_item_id     bigint       NOT NULL REFERENCES public.items(item_id) ON DELETE CASCADE,
  component_item_id  bigint       NOT NULL REFERENCES public.items(item_id) ON DELETE RESTRICT,
  qty                numeric      NOT NULL CHECK (qty > 0),
  created_at         timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (bundle_item_id, component_item_id)
);

-- ============================================================
-- 4. STOCK (one row per item)
-- ============================================================
CREATE TABLE public.stock (
  item_id     bigint       PRIMARY KEY REFERENCES public.items(item_id) ON DELETE CASCADE,
  qty         numeric      NOT NULL DEFAULT 0,
  -- audit
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  created_by  text         NOT NULL DEFAULT '',
  updated_by  text         NOT NULL DEFAULT ''
);

-- ============================================================
-- 5. CUSTOMERS
-- ============================================================
CREATE TABLE public.customers (
  customer_id  bigserial    PRIMARY KEY,
  name         text         NOT NULL,
  phone        text         NOT NULL DEFAULT '',
  address      text         NOT NULL DEFAULT '',
  credit       boolean      NOT NULL DEFAULT false,
  outstanding  numeric      NOT NULL DEFAULT 0,
  join_date    text         NOT NULL DEFAULT '',
  ledger       jsonb        NOT NULL DEFAULT '[]',
  -- audit
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),
  created_by   text         NOT NULL DEFAULT '',
  updated_by   text         NOT NULL DEFAULT ''
);

-- ============================================================
-- 6. BILLS (text PK: "INV-YYMMDD-NNN")
-- ============================================================
CREATE TABLE public.bills (
  bill_id        text         PRIMARY KEY,
  date           text         NOT NULL,
  customer_id    bigint       REFERENCES public.customers(customer_id) ON DELETE SET NULL,
  customer_name  text         NOT NULL DEFAULT '',
  payment        text         NOT NULL,
  total          numeric      NOT NULL DEFAULT 0,
  note           text         NOT NULL DEFAULT '',
  -- audit
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now(),
  created_by     text         NOT NULL DEFAULT '',
  updated_by     text         NOT NULL DEFAULT ''
);

-- ============================================================
-- 7. BILL LINES
-- ============================================================
CREATE TABLE public.bill_lines (
  bill_lines_id  bigserial  PRIMARY KEY,
  bill_id        text       NOT NULL REFERENCES public.bills(bill_id) ON DELETE CASCADE,
  item_id        bigint     REFERENCES public.items(item_id) ON DELETE SET NULL,
  item_name      text       NOT NULL,
  qty            numeric    NOT NULL,
  price          numeric    NOT NULL,
  amount         numeric    NOT NULL,
  deposit        numeric    NOT NULL DEFAULT 0,
  -- audit
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  created_by     text        NOT NULL DEFAULT '',
  updated_by     text        NOT NULL DEFAULT ''
);

CREATE INDEX bill_lines_bill_id_idx ON public.bill_lines(bill_id);

-- ============================================================
-- 8. PURCHASES (text PK: "PO-YYMMDD-NNN")
-- ============================================================
CREATE TABLE public.purchases (
  purchase_id  text         PRIMARY KEY,
  date         text         NOT NULL,
  note            text         NOT NULL DEFAULT '',
  vehicle_no      text         NOT NULL DEFAULT '',
  sales_order_ref text         NOT NULL DEFAULT '',
  grand_total     numeric      NOT NULL DEFAULT 0,
  -- audit
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),
  created_by   text         NOT NULL DEFAULT '',
  updated_by   text         NOT NULL DEFAULT ''
);

-- ============================================================
-- 9. PURCHASE LINES
-- ============================================================
CREATE TABLE public.purchase_lines (
  purchase_lines_id  bigserial  PRIMARY KEY,
  purchase_id        text       NOT NULL REFERENCES public.purchases(purchase_id) ON DELETE CASCADE,
  item_id            bigint     REFERENCES public.items(item_id) ON DELETE SET NULL,
  item_name          text       NOT NULL,
  qty                numeric    NOT NULL,
  rate               numeric    NOT NULL,
  total              numeric    NOT NULL,
  -- audit
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  created_by         text        NOT NULL DEFAULT '',
  updated_by         text        NOT NULL DEFAULT ''
);

CREATE INDEX purchase_lines_purchase_id_idx ON public.purchase_lines(purchase_id);

-- ============================================================
-- 10. TRANSACTIONS (cash/bank movements & expenses)
-- ============================================================
CREATE TABLE public.transactions (
  transaction_id  bigserial    PRIMARY KEY,
  date            text         NOT NULL,
  type            text         NOT NULL,
  amount          numeric      NOT NULL DEFAULT 0,
  note            text         NOT NULL DEFAULT '',
  -- audit
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now(),
  created_by      text         NOT NULL DEFAULT '',
  updated_by      text         NOT NULL DEFAULT ''
);

-- ============================================================
-- 11. OPENING BALANCES (keyed by "YYYY-MM")
-- ============================================================
CREATE TABLE public.opening_balances (
  month       text         PRIMARY KEY,
  cash        numeric      NOT NULL DEFAULT 0,
  bank        numeric      NOT NULL DEFAULT 0,
  -- audit
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  created_by  text         NOT NULL DEFAULT '',
  updated_by  text         NOT NULL DEFAULT ''
);

-- ============================================================
-- 12. STAFF (SHA-256 hashed passwords)
-- ============================================================
CREATE TABLE public.staff (
  staff_id    bigserial    PRIMARY KEY,
  username    text         NOT NULL UNIQUE,
  name        text         NOT NULL,
  role        text         NOT NULL,
  active      boolean      NOT NULL DEFAULT true,
  password    text         NOT NULL,
  -- audit
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  created_by  text         NOT NULL DEFAULT '',
  updated_by  text         NOT NULL DEFAULT ''
);

-- ============================================================
-- 13. MIGRATIONS TRACKING
-- ============================================================
CREATE TABLE public._migrations (
  version     int          PRIMARY KEY,
  name        text         NOT NULL,
  applied_at  timestamptz  NOT NULL DEFAULT now()
);

-- ============================================================
-- 14. DEPOSIT SETTLEMENTS
-- ============================================================
CREATE TABLE public.deposit_settlements (
  id          bigserial    PRIMARY KEY,
  date        text         NOT NULL,
  amount      numeric      NOT NULL CHECK (amount > 0),
  note        text         NOT NULL DEFAULT '',
  created_at  timestamptz  NOT NULL DEFAULT now(),
  created_by  text         NOT NULL DEFAULT ''
);

-- ============================================================
-- AUDIT TRIGGERS
-- ============================================================

-- Auto-bump updated_at on every UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Preserve original creator on UPDATE
CREATE OR REPLACE FUNCTION public.preserve_created_audit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.created_by IS NOT NULL AND OLD.created_by <> '' THEN
      NEW.created_by := OLD.created_by;
    END IF;
    IF OLD.created_at IS NOT NULL THEN
      NEW.created_at := OLD.created_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Apply triggers to all tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'items', 'stock', 'customers',
    'bills', 'bill_lines',
    'purchases', 'purchase_lines',
    'transactions', 'opening_balances',
    'staff'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at       ON %I', tbl, tbl);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_preserve_created ON %I', tbl, tbl);

    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      tbl, tbl
    );

    EXECUTE format(
      'CREATE TRIGGER trg_%I_preserve_created
         BEFORE INSERT OR UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION public.preserve_created_audit()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- LOGIN RPC (server-side password verification)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_staff_login(
  p_username       text,
  p_password_hash  text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.staff%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM   public.staff
  WHERE  lower(username) = lower(p_username);

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF v_row.password <> p_password_hash THEN
    RETURN json_build_object('ok', false, 'reason', 'wrong_password');
  END IF;

  IF NOT v_row.active THEN
    RETURN json_build_object('ok', false, 'reason', 'inactive');
  END IF;

  RETURN json_build_object(
    'ok',         true,
    'staff_id',   v_row.staff_id,
    'username',   v_row.username,
    'name',       v_row.name,
    'role',       v_row.role,
    'active',     v_row.active,
    'created_at', v_row.created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_staff_login(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_staff_login(text, text) TO authenticated;

-- Revoke direct SELECT on password column
REVOKE SELECT (password) ON public.staff FROM anon;
REVOKE SELECT (password) ON public.staff FROM authenticated;

-- ============================================================
-- EXEC_SQL RPC (for auto-migrations from the app)
-- ============================================================
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_prices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_components   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_lines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_lines      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_balances    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._migrations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_settlements ENABLE ROW LEVEL SECURITY;

-- Full access for anon key (single-user internal ERP)
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'items', 'item_prices', 'bundle_components',
    'stock', 'customers',
    'bills', 'bill_lines',
    'purchases', 'purchase_lines',
    'transactions', 'opening_balances',
    'staff', '_migrations', 'deposit_settlements'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anon_all" ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY "anon_all" ON %I FOR ALL TO anon USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END;
$$;

-- Staff read policy (safe columns only — password revoked above)
DROP POLICY IF EXISTS "staff_read_safe" ON public.staff;
CREATE POLICY "staff_read_safe"
  ON public.staff FOR SELECT
  USING (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default items
INSERT INTO public.items (name, unit, active, item_type) VALUES
  ('14.2 KG Cylinder',          'Piece', true, 'cylinder'),
  ('19 KG Cylinder',            'Piece', true, 'cylinder'),
  ('5 KG Cylinder',             'Piece', true, 'cylinder'),
  ('Big Gas Stove',             'Piece', true, 'regular'),
  ('Big Suraksha Gas Pipe',     'Piece', true, 'regular'),
  ('Glass Stove',               'Piece', true, 'regular'),
  ('HPCL Smart Card',           'Piece', true, 'regular'),
  ('Lighter',                   'Piece', true, 'regular'),
  ('New Connection (Deepam)',   'Piece', true, 'linked'),
  ('New Connection (Regular)',  'Piece', true, 'linked'),
  ('Pass Book',                 'Piece', true, 'regular'),
  ('RC (Refill)',               'Piece', true, 'regular'),
  ('Regulator',                 'Piece', true, 'regular');

-- Seed prices for each item
INSERT INTO public.item_prices (item_id, price, sort_order)
SELECT item_id,
  CASE name
    WHEN '14.2 KG Cylinder'          THEN 925
    WHEN '19 KG Cylinder'            THEN 1,828
    WHEN '5 KG Red Cylinder'         THEN 345
    WHEN '5 KG FTL Cylinder'         THEN 496
    WHEN 'Big Gas Stove'             THEN 2200
    WHEN 'Big Suraksha Gas Pipe'     THEN 380
    WHEN 'Glass Stove'               THEN 750
    WHEN 'HPCL Smart Card'           THEN 0
    WHEN 'Lighter'                   THEN 80
    WHEN 'New Connection (Deepam)'   THEN 0
    WHEN 'New Connection (Regular)'  THEN 1200
    WHEN 'Pass Book'                 THEN 0
    WHEN 'RC (Refill)'               THEN 925
    WHEN 'Regulator'                 THEN 500
    ELSE 0
  END,
  0
FROM public.items;

-- Seed bundle components: New Connection items → 14.2 KG Cylinder
INSERT INTO public.bundle_components (bundle_item_id, component_item_id, qty)
SELECT nc.item_id, cyl.item_id, 1
FROM public.items nc, public.items cyl
WHERE nc.name LIKE 'New Connection%'
  AND cyl.name = '14.2 KG Cylinder';

-- Seed stock rows (qty = 0) for all items
INSERT INTO public.stock (item_id, qty)
SELECT item_id, 0 FROM public.items;

-- Admin account
INSERT INTO public.staff (username, name, role, active, password)
VALUES (
  'ramkumar',
  'Yelkur Ramkumar',
  'Admin',
  true,
  encode(digest('Ramkumar@645', 'sha256'), 'hex')
);
