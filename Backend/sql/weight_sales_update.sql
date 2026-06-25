-- Add weight / fractional sales support to existing NexPos databases.
USE nexpos;

ALTER TABLE products
  ADD COLUMN sell_mode VARCHAR(20) NOT NULL DEFAULT 'unit' AFTER price,
  ADD COLUMN package_size DECIMAL(12, 3) NOT NULL DEFAULT 1 AFTER sell_mode,
  ADD COLUMN package_unit VARCHAR(20) NOT NULL DEFAULT 'piece' AFTER package_size;

ALTER TABLE inventory_items
  MODIFY COLUMN stock DECIMAL(12, 3) NOT NULL DEFAULT 0;

ALTER TABLE order_items
  MODIFY COLUMN quantity DECIMAL(12, 3) NOT NULL;
