-- Registration-flow migration script (existing database)
-- Use this if your DB previously had demo/seed users.
USE nexpos;

-- 1) Ensure employee auth column type matches app usage.
ALTER TABLE employees
  MODIFY COLUMN password_hash VARCHAR(255) NULL;

-- 2) Remove known demo users from earlier seeded setups.
DELETE FROM employees
WHERE email IN ('john@pos.com', 'sarah@pos.com', 'mike@pos.com');

-- 3) Verify remaining employees (should be registration-created users).
SELECT id, name, email, role
FROM employees
ORDER BY created_at DESC;

