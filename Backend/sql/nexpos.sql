-- NexPos full database setup script
-- Run this entire file in MySQL Workbench.

CREATE DATABASE IF NOT EXISTS nexpos
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE nexpos;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS settings_kv;
DROP TABLE IF EXISTS discounts;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS products;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  barcode VARCHAR(64) NOT NULL UNIQUE,
  category VARCHAR(64) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE inventory_items (
  product_id VARCHAR(64) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id),
  CONSTRAINT fk_inventory_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE customers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(40),
  loyalty_points INT NOT NULL DEFAULT 0,
  total_spent DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE employees (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL,
  password_hash TEXT,
  sales_count INT NOT NULL DEFAULT 0,
  total_sales DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE discounts (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  type VARCHAR(20) NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  code VARCHAR(64) UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE settings_kv (
  `key` VARCHAR(191) PRIMARY KEY,
  `value` JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  customer_id VARCHAR(64),
  employee_id VARCHAR(64),
  discount_code VARCHAR(64),
  discount_id VARCHAR(64),
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_orders_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(120) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_discounts_code_active ON discounts(code, active);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_employee_id ON orders(employee_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Seed products
INSERT INTO products (id, name, description, barcode, category, price) VALUES
  ('espresso', 'Espresso', 'Rich Italian espresso', 'espresso', 'Beverages', 3.50),
  ('capuccino', 'Capuccino', 'Classic cappuccino', 'capuccino', 'Beverages', 4.50),
  ('latte', 'Latte', 'Smooth latte', 'latte', 'Beverages', 4.00),
  ('croissant', 'Croissant', 'Fresh butter croissant', 'croissant', 'Food', 3.00),
  ('muffin', 'Muffin', 'Blueberry muffin', 'muffin', 'Food', 2.50),
  ('sandwich', 'Sandwich', 'Turkey club sandwich', 'sandwich', 'Food', 6.50),
  ('americano', 'Americano', 'Classic americano', 'americano', 'Beverages', 3.00),
  ('mocha', 'Mocha', 'Chocolate mocha', 'mocha', 'Beverages', 5.00),
  ('bagel', 'Bagel', 'Fresh bagel', 'bagel', 'Snacks', 2.00),
  ('green-tea', 'Green Tea', 'Green tea', 'green-tea', 'Beverages', 3.00),
  ('ice-chocolate', 'Iced Chocolate', 'Iced chocolate', 'ice-chocolate', 'Snacks', 4.00),
  ('cookie', 'Cookie', 'Cookie', 'cookie', 'Desserts', 1.50);

-- Seed inventory
INSERT INTO inventory_items (product_id, stock) VALUES
  ('espresso', 100),
  ('capuccino', 100),
  ('latte', 100),
  ('croissant', 50),
  ('muffin', 40),
  ('sandwich', 30),
  ('americano', 100),
  ('mocha', 100),
  ('bagel', 60),
  ('green-tea', 90),
  ('ice-chocolate', 50),
  ('cookie', 200);

-- Seed customers
INSERT INTO customers (id, name, email, phone, loyalty_points, total_spent) VALUES
  ('alice', 'Alice Johnson', 'alice@email.com', '555-0101', 250, 450.00),
  ('bob', 'Bob Smith', 'bob@email.com', '555-0102', 500, 890.00),
  ('carol', 'Carol White', 'carol@email.com', '555-0103', 150, 280.00);

-- Seed employees
INSERT INTO employees (id, name, email, role, password_hash, sales_count, total_sales) VALUES
  ('john', 'John Admin', 'john@pos.com', 'Admin', '$2b$10$7VqJ3uNuNRzygrz81YCAzuINsL3qwkdciRF.bs5hZ5zPBNH4OQO.G', 150, 12500.00),
  ('sarah', 'Sarah Manager', 'sarah@pos.com', 'Manager', '$2b$10$7VqJ3uNuNRzygrz81YCAzuINsL3qwkdciRF.bs5hZ5zPBNH4OQO.G', 200, 18000.00),
  ('mike', 'Mike Cashier', 'mike@pos.com', 'Cashier', '$2b$10$7VqJ3uNuNRzygrz81YCAzuINsL3qwkdciRF.bs5hZ5zPBNH4OQO.G', 300, 9500.00);

-- Seed discounts
INSERT INTO discounts (id, name, type, value, code, active) VALUES
  ('happy-hour', 'Happy Hour', 'percentage', 10, NULL, TRUE),
  ('loyalty-15', 'Loyalty Discount', 'percentage', 15, 'LOYAL15', TRUE),
  ('five-off', '$5 Off', 'fixed', 5, 'SAVES', TRUE),
  ('save10', 'Save 10%', 'percentage', 10, 'SAVE10', TRUE),
  ('save20', 'Save 20%', 'percentage', 20, 'SAVE20', TRUE);

-- Seed settings
INSERT INTO settings_kv (`key`, `value`) VALUES
  ('business', JSON_OBJECT(
    'name', 'QuickPOS',
    'address', '123 Main St City, State 12345',
    'phone', '(555) 123-4567',
    'email', 'contact@business.com'
  )),
  ('systemPrefs', JSON_OBJECT(
    'soundEffects', TRUE,
    'lowStockAlerts', TRUE,
    'loyaltyProgram', TRUE
  )),
  ('tax', JSON_OBJECT(
    'defaultTaxRate', 8.5,
    'appliedTaxRate', 8.5
  )),
  ('receipts', JSON_OBJECT(
    'printReceipts', TRUE,
    'emailReceipts', FALSE,
    'receiptHeaderText', 'Thank you for shopping with us!',
    'receiptFooterText', 'Please come again!'
  )),
  ('hardware', JSON_OBJECT(
    'receiptPrinter', FALSE,
    'barcodeScanner', TRUE,
    'cardReader', FALSE
  )),
  ('security', JSON_OBJECT(
    'requirePin', TRUE,
    'autoLogout', FALSE
  ));

-- Optional quick checks:
-- SELECT COUNT(*) AS products_count FROM products;
-- SELECT COUNT(*) AS inventory_count FROM inventory_items;
-- SELECT COUNT(*) AS customers_count FROM customers;

