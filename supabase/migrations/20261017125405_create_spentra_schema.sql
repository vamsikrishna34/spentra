/*
# Spentra — Core Database Schema

## Overview
Creates the four core tables for the Spentra AI finance tracker: users,
budgets_planned, transactions_actual, and goals. This is a single-tenant
app (no sign-in screen), so all policies allow both anon and authenticated
roles to perform CRUD operations.

## New Tables

1. **users** — Stores user profile information
   - `id` (uuid, primary key, defaults to gen_random_uuid())
   - `email` (text, unique, not null)
   - `name` (text, not null)
   - `default_currency` (text, default 'USD')
   - `created_at` / `updated_at` (timestamptz, defaults to now())

2. **budgets_planned** — Monthly budget limits per category
   - `id` (uuid, primary key)
   - `user_id` (uuid, references users, cascade delete)
   - `category` (text, not null) — e.g. food, transport, shopping
   - `planned_amount` (numeric(12,2), not null)
   - `period` (text, default 'monthly')
   - `created_at` / `updated_at` (timestamptz)

3. **transactions_actual** — Individual expense records
   - `id` (uuid, primary key)
   - `user_id` (uuid, references users, cascade delete)
   - `description` (text, not null)
   - `amount` (numeric(12,2), not null)
   - `currency` (text, default 'USD') — ISO code: USD, EUR, GBP, JPY, INR
   - `converted_amount` (numeric(12,2)) — amount converted to USD
   - `category` (text, default 'other')
   - `date` (date, default current date)
   - `merchant` (text, nullable)
   - `source` (text, default 'manual') — voice, text, ocr, manual, csv
   - `created_at` (timestamptz)

4. **goals** — Savings goals
   - `id` (uuid, primary key)
   - `user_id` (uuid, references users, cascade delete)
   - `title` (text, not null)
   - `target_amount` (numeric(12,2), not null)
   - `current_amount` (numeric(12,2), default 0)
   - `target_date` (date, nullable)
   - `created_at` / `updated_at` (timestamptz)

## Indexes
- `idx_transactions_user_id` — fast lookups by user
- `idx_transactions_date` — sorted by date (descending)
- `idx_transactions_category` — filter by category
- `idx_budgets_user_id` — budget lookups by user
- `idx_goals_user_id` — goal lookups by user

## Security
- RLS enabled on all four tables.
- All policies use `TO anon, authenticated` because this is a single-tenant
  app with no sign-in screen. The anon-key frontend client can read and
  write all data. `USING (true)` / `WITH CHECK (true)` is intentional here
  because the data is shared, not user-scoped.
- 4 policies per table (SELECT, INSERT, UPDATE, DELETE).

## Notes
1. All amount columns use numeric(12,2) for precise financial calculations.
2. Foreign keys cascade on delete — removing a user removes their data.
3. `converted_amount` on transactions stores the USD-converted value for
   multi-currency support.
*/

-- ==================== USERS ====================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  default_currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE
  TO anon, authenticated USING (true);

-- ==================== BUDGETS_PLANNED ====================
CREATE TABLE IF NOT EXISTS budgets_planned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  planned_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE budgets_planned ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_budgets" ON budgets_planned;
CREATE POLICY "anon_select_budgets" ON budgets_planned FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_budgets" ON budgets_planned;
CREATE POLICY "anon_insert_budgets" ON budgets_planned FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_budgets" ON budgets_planned;
CREATE POLICY "anon_update_budgets" ON budgets_planned FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_budgets" ON budgets_planned;
CREATE POLICY "anon_delete_budgets" ON budgets_planned FOR DELETE
  TO anon, authenticated USING (true);

-- ==================== TRANSACTIONS_ACTUAL ====================
CREATE TABLE IF NOT EXISTS transactions_actual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  converted_amount NUMERIC(12, 2),
  category TEXT NOT NULL DEFAULT 'other',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  merchant TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE transactions_actual ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions_actual;
CREATE POLICY "anon_select_transactions" ON transactions_actual FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions_actual;
CREATE POLICY "anon_insert_transactions" ON transactions_actual FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_transactions" ON transactions_actual;
CREATE POLICY "anon_update_transactions" ON transactions_actual FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions_actual;
CREATE POLICY "anon_delete_transactions" ON transactions_actual FOR DELETE
  TO anon, authenticated USING (true);

-- ==================== GOALS ====================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_goals" ON goals;
CREATE POLICY "anon_select_goals" ON goals FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_goals" ON goals;
CREATE POLICY "anon_insert_goals" ON goals FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_goals" ON goals;
CREATE POLICY "anon_update_goals" ON goals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_goals" ON goals;
CREATE POLICY "anon_delete_goals" ON goals FOR DELETE
  TO anon, authenticated USING (true);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions_actual(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions_actual(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions_actual(category);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets_planned(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
