-- NexPos schema-only database setup script
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
  password_hash VARCHAR(255),
  sales_count INT NOT NULL DEFAULT 0,
  total_sales DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_employees_role
    CHECK (role IN ('Admin', 'Manager', 'Cashier'))
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
-- Schema-only setup: no seed data is inserted here.
-- Application flows (especially /auth/register) should create rows.

