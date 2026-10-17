-- Spentra Seed Data (applied to Supabase)
-- Run after schema.sql

-- Insert demo user
INSERT INTO users (email, name, default_currency)
VALUES ('demo@spentra.app', 'Demo User', 'USD')
ON CONFLICT (email) DO NOTHING;

-- Insert sample budgets (replace UUID with actual user ID from users table)
INSERT INTO budgets_planned (user_id, category, planned_amount, period)
SELECT id, cat, amt, 'monthly'
FROM users, (VALUES
  ('food', 600.00),
  ('transport', 200.00),
  ('shopping', 300.00),
  ('bills', 800.00),
  ('entertainment', 150.00),
  ('health', 150.00)
) AS t(cat, amt)
WHERE users.email = 'demo@spentra.app'
ON CONFLICT DO NOTHING;

-- Insert sample transactions with multi-currency data
INSERT INTO transactions_actual (user_id, description, amount, currency, converted_amount, category, date, merchant, source)
SELECT u.id, t.v_desc, t.v_amt, t.v_cur, t.v_conv, t.v_cat, t.v_dt, t.v_merch, t.v_src
FROM users u, (VALUES
  ('Groceries at Whole Foods', 85.50, 'USD', 85.50, 'food', CURRENT_DATE - 0, 'Whole Foods', 'voice'),
  ('Uber ride downtown', 18.75, 'USD', 18.75, 'transport', CURRENT_DATE - 0, 'Uber', 'text'),
  ('Lunch at Chipotle', 14.50, 'USD', 14.50, 'food', CURRENT_DATE - 0, 'Chipotle', 'voice'),
  ('Coffee at Starbucks', 6.25, 'USD', 6.25, 'food', CURRENT_DATE - 1, 'Starbucks', 'voice'),
  ('Netflix subscription', 15.99, 'USD', 15.99, 'entertainment', CURRENT_DATE - 1, 'Netflix', 'manual'),
  ('Electric bill', 120.00, 'USD', 120.00, 'bills', CURRENT_DATE - 2, 'Electric Co', 'ocr'),
  ('Running shoes at Nike', 95.00, 'USD', 95.00, 'shopping', CURRENT_DATE - 2, 'Nike', 'manual'),
  ('Pharmacy vitamins', 32.40, 'USD', 32.40, 'health', CURRENT_DATE - 3, 'CVS', 'text'),
  ('Dinner in Paris', 42.00, 'EUR', 45.65, 'food', CURRENT_DATE - 3, 'Bistro Paris', 'text'),
  ('Train ticket London', 15.50, 'GBP', 19.62, 'transport', CURRENT_DATE - 4, 'Tube', 'text'),
  ('Gas fill-up', 52.30, 'USD', 52.30, 'transport', CURRENT_DATE - 4, 'Shell', 'manual'),
  ('Movie tickets AMC', 28.00, 'USD', 28.00, 'entertainment', CURRENT_DATE - 5, 'AMC', 'text'),
  ('Sushi in Tokyo', 3200.00, 'JPY', 21.40, 'food', CURRENT_DATE - 5, 'Sushi Bar', 'voice'),
  ('Online course Udemy', 19.99, 'USD', 19.99, 'education', CURRENT_DATE - 6, 'Udemy', 'text'),
  ('Internet bill', 79.99, 'USD', 79.99, 'bills', CURRENT_DATE - 7, 'Comcast', 'manual')
) AS t(v_desc, v_amt, v_cur, v_conv, v_cat, v_dt, v_merch, v_src)
WHERE u.email = 'demo@spentra.app'
ON CONFLICT DO NOTHING;

-- Insert sample goal
INSERT INTO goals (user_id, title, target_amount, current_amount, target_date)
SELECT id, 'Emergency Fund', 5000.00, 1200.00, '2026-12-31'
FROM users
WHERE email = 'demo@spentra.app'
ON CONFLICT DO NOTHING;
