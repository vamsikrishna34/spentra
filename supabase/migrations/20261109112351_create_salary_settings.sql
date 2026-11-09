/*
# Create salary settings table

Plain-English summary: stores the user's monthly salary so it is saved in the
database instead of only in the browser. The amount is stored in USD, the same
base currency used for every other amount in the app, so it can be shown in any
display currency without being converted incorrectly.

1. New Tables
- `salary_settings`
  - `id` (text, primary key, defaults to 'default') - a single shared salary row
  - `monthly_amount_usd` (numeric(12,2), default 0, never negative) - monthly salary in USD
  - `updated_at` (timestamptz) - when the salary was last changed

2. Security
- Enable RLS on `salary_settings`.
- Grant SELECT, INSERT, UPDATE to `anon` and `authenticated` (single-tenant app with no sign-in).
- Four policies (select, insert, update, delete); delete is not granted, so it is blocked at the privilege level.

3. Notes
- No seed row is inserted; the app creates the row the first time a salary is saved.
*/

CREATE TABLE IF NOT EXISTS salary_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  monthly_amount_usd NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_amount_usd >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE salary_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON salary_settings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_salary_settings" ON salary_settings;
CREATE POLICY "anon_select_salary_settings" ON salary_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_salary_settings" ON salary_settings;
CREATE POLICY "anon_insert_salary_settings" ON salary_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_salary_settings" ON salary_settings;
CREATE POLICY "anon_update_salary_settings" ON salary_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_salary_settings" ON salary_settings;
CREATE POLICY "anon_delete_salary_settings" ON salary_settings FOR DELETE
  TO anon, authenticated USING (true);
