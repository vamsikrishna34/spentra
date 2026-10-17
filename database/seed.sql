-- Spentra Seed Data (Optional mock data for local testing)
-- Run after schema.sql

-- Insert demo user
INSERT INTO users (id, email, name, default_currency)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'demo@spentra.app',
  'Demo User',
  'USD'
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample budgets
INSERT INTO budgets_planned (user_id, category, planned_amount, period)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'food', 600.00, 'monthly'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'transport', 200.00, 'monthly'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'shopping', 400.00, 'monthly'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'bills', 800.00, 'monthly'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'entertainment', 200.00, 'monthly'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'health', 200.00, 'monthly')
ON CONFLICT DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions_actual (user_id, description, amount, currency, category, date, merchant, source)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Groceries at Whole Foods', 85.50, 'USD', 'food', CURRENT_DATE - 1, 'Whole Foods', 'voice'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Uber ride downtown', 18.75, 'USD', 'transport', CURRENT_DATE - 1, 'Uber', 'text'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Netflix subscription', 15.99, 'USD', 'entertainment', CURRENT_DATE - 2, 'Netflix', 'manual'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Coffee at Starbucks', 6.25, 'USD', 'food', CURRENT_DATE - 2, 'Starbucks', 'voice'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Electric bill', 120.00, 'USD', 'bills', CURRENT_DATE - 3, 'Electric Co', 'ocr'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'New running shoes', 95.00, 'USD', 'shopping', CURRENT_DATE - 3, 'Nike', 'manual'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pharmacy - vitamins', 32.40, 'USD', 'health', CURRENT_DATE - 4, 'CVS', 'text'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lunch with team', 24.80, 'USD', 'food', CURRENT_DATE - 4, 'Chipotle', 'voice'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Gas fill-up', 52.30, 'USD', 'transport', CURRENT_DATE - 5, 'Shell', 'manual'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Movie tickets', 28.00, 'USD', 'entertainment', CURRENT_DATE - 5, 'AMC', 'text')
ON CONFLICT DO NOTHING;

-- Insert sample goal
INSERT INTO goals (user_id, title, target_amount, current_amount, target_date)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Emergency Fund', 5000.00, 1200.00, '2026-12-31')
ON CONFLICT DO NOTHING;
