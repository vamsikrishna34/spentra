/*
# Widen salary precision

Plain-English summary: the salary is stored in USD, and converting between USD and
other currencies can produce more than two decimal places. Keeping four decimals
means a salary typed in any display currency reads back as the same amount.

1. Modified Tables
- `salary_settings.monthly_amount_usd` changed from two to four decimal places
  (numeric(14,4)). The table was created in this same change and holds no rows,
  so no existing values are affected.

2. Security
- No changes to row level security, policies, or grants.
*/

ALTER TABLE salary_settings ALTER COLUMN monthly_amount_usd TYPE NUMERIC(14, 4);
