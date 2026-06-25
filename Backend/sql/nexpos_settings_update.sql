-- Update NexPos branding and default settings (MariaDB compatible).
USE nexpos;

INSERT INTO settings_kv (`key`, `value`) VALUES
  ('business', '{"name":"NexPos","address":"","phone":"","email":"","taxId":"","storeId":"#0001","register":"POS-01"}'),
  ('systemPrefs', '{"systemName":"NexPos","soundEffects":true,"lowStockAlerts":true,"loyaltyProgram":true}'),
  ('tax', '{"defaultTaxRate":0,"appliedTaxRate":0}'),
  ('receipts', '{"printReceipts":true,"emailReceipts":false,"receiptHeaderText":"THANK YOU FOR SHOPPING!","receiptFooterText":"Returns accepted in 14 days\\nFollow us on IG: @nexpos"}')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
