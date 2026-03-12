-- ============================================================
-- Gas Agency ERP — Supabase Schema
-- Run this entire file in the Supabase SQL Editor (once).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. PROFILES  (extends auth.users with name + role)
-- ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text        not null default '',
  role       text        not null default 'Viewer'
               check (role in ('Admin','Billing Staff','Purchase Staff','Viewer')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',''), 'Viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 2. ITEMS
-- ────────────────────────────────────────────────────────────
create table if not exists public.items (
  id         bigserial   primary key,
  name       text        not null,
  unit       text        not null default 'Nos',
  price      numeric     not null default 0 check (price >= 0),
  active     boolean     not null default true,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 3. STOCK  (one row per item; tracks current qty on hand)
-- ────────────────────────────────────────────────────────────
create table if not exists public.stock (
  item_id    bigint      primary key references public.items(id) on delete cascade,
  qty        integer     not null default 0 check (qty >= 0),
  updated_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 4. CUSTOMERS
-- ────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id          bigserial   primary key,
  name        text        not null,
  phone       text        not null default '',
  address     text        not null default '',
  credit      boolean     not null default false,
  outstanding numeric     not null default 0,
  join_date   date        not null default current_date,
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 5. CREDIT LEDGER ENTRIES
-- ────────────────────────────────────────────────────────────
create table if not exists public.credit_ledger_entries (
  id          bigserial   primary key,
  customer_id bigint      not null references public.customers(id) on delete cascade,
  type        text        not null check (type in ('DEBIT','CREDIT')),
  date        date        not null,
  amount      numeric     not null check (amount > 0),
  description text        not null default '',
  balance     numeric     not null default 0,
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 6. BILLS  (invoice header)
-- ────────────────────────────────────────────────────────────
create table if not exists public.bills (
  id            text        primary key,   -- "B0001", "B0002", …
  date          date        not null,
  customer_id   bigint      references public.customers(id) on delete set null,
  customer_name text        not null default '',
  payment       text        not null check (payment in ('Cash','UPI','Credit')),
  total         numeric     not null default 0,
  note          text        not null default '',
  created_by    uuid        references auth.users(id),
  created_at    timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 7. BILL LINES
-- ────────────────────────────────────────────────────────────
create table if not exists public.bill_lines (
  id        bigserial primary key,
  bill_id   text      not null references public.bills(id) on delete cascade,
  item_id   bigint    references public.items(id) on delete set null,
  item_name text      not null,
  qty       numeric   not null check (qty > 0),
  price     numeric   not null check (price >= 0),
  amount    numeric   not null
);

-- ────────────────────────────────────────────────────────────
-- 8. PURCHASES  (stock-inward header)
-- ────────────────────────────────────────────────────────────
create table if not exists public.purchases (
  id          text        primary key,   -- "P001", "P002", …
  date        date        not null,
  note        text        not null default '',
  grand_total numeric     not null default 0,
  created_by  uuid        references auth.users(id),
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 9. PURCHASE LINES
-- ────────────────────────────────────────────────────────────
create table if not exists public.purchase_lines (
  id          bigserial primary key,
  purchase_id text      not null references public.purchases(id) on delete cascade,
  item_id     bigint    references public.items(id) on delete set null,
  item_name   text      not null,
  qty         numeric   not null check (qty > 0),
  rate        numeric   not null check (rate >= 0),
  total       numeric   not null
);

-- ────────────────────────────────────────────────────────────
-- 10. MONTHLY OPENING BALANCES
-- ────────────────────────────────────────────────────────────
create table if not exists public.monthly_opening_balances (
  month      text        primary key,   -- "YYYY-MM"
  cash       numeric     not null default 0,
  bank       numeric     not null default 0,
  updated_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 11. CASH / BANK TRANSACTIONS  (manual movements)
-- ────────────────────────────────────────────────────────────
create table if not exists public.cash_bank_transactions (
  id         bigserial   primary key,
  date       date        not null,
  type       text        not null
               check (type in ('CASH_TO_BANK','BANK_TO_CASH','EXPENSE_CASH','EXPENSE_BANK')),
  amount     numeric     not null check (amount > 0),
  note       text        not null default '',
  created_by uuid        references auth.users(id),
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- HELPER: returns the role of the current authenticated user
-- ────────────────────────────────────────────────────────────
create or replace function public.current_user_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;
