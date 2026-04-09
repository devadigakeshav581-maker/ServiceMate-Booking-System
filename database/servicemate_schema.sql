-- ============================================================
--  ServiceMate – Complete Database Schema
--  Database: MySQL
--  File: servicemate_schema.sql
--  Run this in MySQL Workbench or terminal:
--  mysql -u root -p servicemate < servicemate_schema.sql
-- ============================================================


-- ─────────────────────────────────────────
--  CREATE & SELECT DATABASE
-- ─────────────────────────────────────────

DROP DATABASE IF EXISTS servicemate;
CREATE DATABASE IF NOT EXISTS servicemate
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE servicemate;


-- ─────────────────────────────────────────
--  TABLE 1: users
--  Stores all users (Customer, Provider, Admin)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id           BIGINT          NOT NULL AUTO_INCREMENT,
    name         VARCHAR(100)    NOT NULL,
    email        VARCHAR(150)    NOT NULL UNIQUE,
    password     VARCHAR(255)    NOT NULL,          -- BCrypt hashed
    phone        VARCHAR(15),
    role         ENUM('CUSTOMER','PROVIDER','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    is_active    BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_users_email (email),
    INDEX idx_users_role  (role)
);


-- ─────────────────────────────────────────
--  TABLE 2: services
--  Services offered by Providers
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS services (
    id           BIGINT          NOT NULL AUTO_INCREMENT,
    name         VARCHAR(100)    NOT NULL,
    description  TEXT,
    price        DECIMAL(10,2)   NOT NULL,
    category     VARCHAR(50),                       -- e.g. 'Plumbing', 'Electrical'
    provider_id  BIGINT          NOT NULL,
    is_available BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_services_provider (provider_id),
    INDEX idx_services_category (category),
    FULLTEXT idx_services_search (name, description),

    CONSTRAINT fk_service_provider
        FOREIGN KEY (provider_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ─────────────────────────────────────────
--  TABLE 3: bookings
--  Full booking lifecycle
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookings (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    customer_id    BIGINT       NOT NULL,
    service_id     BIGINT       NOT NULL,
    status         ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED')
                                NOT NULL DEFAULT 'PENDING',
    address        VARCHAR(255) NOT NULL,
    notes          TEXT,
    booking_date   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at   DATETIME,
    completed_at   DATETIME,
    cancelled_at   DATETIME,

    PRIMARY KEY (id),
    INDEX idx_bookings_customer (customer_id),
    INDEX idx_bookings_service  (service_id),
    INDEX idx_bookings_status   (status),

    CONSTRAINT fk_booking_customer
        FOREIGN KEY (customer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_booking_service
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON DELETE CASCADE
);


-- ─────────────────────────────────────────
--  TABLE 4: payments
--  Mock payment records per booking
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    booking_id      BIGINT          NOT NULL UNIQUE,   -- One payment per booking
    amount          DECIMAL(10,2)   NOT NULL,
    payment_method  ENUM('UPI','CARD','CASH')   NOT NULL DEFAULT 'UPI',
    status          ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
    transaction_ref VARCHAR(100),                      -- Mock transaction ID
    payment_date    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_payments_booking (booking_id),
    INDEX idx_payments_status  (status),

    CONSTRAINT fk_payment_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE CASCADE
);


-- ─────────────────────────────────────────
--  TABLE 5: reviews  (Bonus)
--  Customer reviews for completed bookings
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    booking_id   BIGINT       NOT NULL UNIQUE,
    customer_id  BIGINT       NOT NULL,
    provider_id  BIGINT       NOT NULL,
    rating       TINYINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_reviews_provider (provider_id),
    INDEX idx_reviews_customer (customer_id),

    CONSTRAINT fk_review_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_customer
        FOREIGN KEY (customer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_provider
        FOREIGN KEY (provider_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
--  SAMPLE DATA — for testing
-- ============================================================

-- Admin user (password: 123456)
INSERT INTO users (name, email, password, phone, role) VALUES
('Admin User', 'admin@servicemate.com',
 '$2a$10$slYQmyNdgTY74z4Qnr1ffuJA1OzDK0P5I6LY.E4sQ1xDc5A.3eS9W', -- '123456'
 '9000000000', 'ADMIN');

-- Provider user (password: 123456)
INSERT INTO users (name, email, password, phone, role) VALUES
('Default Provider', 'provider@servicemate.com',
 '$2a$10$slYQmyNdgTY74z4Qnr1ffuJA1OzDK0P5I6LY.E4sQ1xDc5A.3eS9W', -- '123456'
 '9111111111', 'PROVIDER');

-- Second Provider (password: 123456)
INSERT INTO users (name, email, password, phone, role) VALUES
('Elite Cleaners', 'elite@servicemate.com',
 '$2a$10$slYQmyNdgTY74z4Qnr1ffuJA1OzDK0P5I6LY.E4sQ1xDc5A.3eS9W', -- '123456'
 '9333333333', 'PROVIDER');

-- Customer user (password: 123456)
INSERT INTO users (name, email, password, phone, role) VALUES
('Default Customer', 'customer@servicemate.com',
 '$2a$10$slYQmyNdgTY74z4Qnr1ffuJA1OzDK0P5I6LY.E4sQ1xDc5A.3eS9W', -- '123456'
 '9222222222', 'CUSTOMER');

-- Services (offered by Ravi - provider id=2)
INSERT INTO services (name, description, price, category, provider_id) VALUES
('Pipe Leak Repair',    'Fix leaking pipes and taps',           299.00, 'Plumbing',   2),
('Bathroom Fitting',    'Full bathroom fittings installation',  799.00, 'Plumbing',   2),
('Fan Installation',    'Ceiling and wall fan installation',    349.00, 'Electrical', 2),
('Wiring & Switchboard','Rewiring and switchboard repair',      599.00, 'Electrical', 2),
('Home Deep Cleaning',  'Complete home deep cleaning service',  999.00, 'Cleaning',   2),
('AC Servicing',        'AC filter clean and gas refill',       599.00, 'AC Repair',  2),
-- Services from Provider 4
('Office Cleaning',     'Professional office space sanitization', 1500.00, 'Cleaning',  4),
('Kitchen Deep Clean',  'Degreasing and deep cleaning of kitchens', 850.00, 'Cleaning',  4),
('Carpet Shampooing',   'Industrial grade carpet cleaning',     450.00, 'Cleaning',    4),
('Pest Control',        'General pest and termite control',      1200.00, 'Pest Control', 4),
('Garden Maintenance',  'Lawn mowing and plant care',           300.00, 'Gardening',   4);

-- Sample bookings (customer id=3, various services)
INSERT INTO bookings (customer_id, service_id, status, address, notes) VALUES
(3, 1, 'CONFIRMED',  '123 MG Road, Bangalore', 'Please come in the morning'),
(3, 3, 'COMPLETED',  '456 Koramangala, Bangalore', 'Bring your own tools'),
(3, 5, 'PENDING',    '789 HSR Layout, Bangalore', 'Weekend preferred'),
(3, 6, 'CANCELLED',  '321 Whitefield, Bangalore', NULL);

-- Sample payments
INSERT INTO payments (booking_id, amount, payment_method, status, transaction_ref) VALUES
(1, 299.00, 'UPI',  'SUCCESS', 'TXN_SM_20250302_001'),
(2, 349.00, 'CARD', 'SUCCESS', 'TXN_SM_20250301_002'),
(4, 599.00, 'UPI',  'FAILED',  'TXN_SM_20250228_003');

-- Sample review
INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment) VALUES
(2, 3, 2, 5, 'Excellent work! Very professional and on time.');


-- ============================================================
--  USEFUL QUERIES FOR TESTING
-- ============================================================

-- View all users
-- SELECT id, name, email, role, is_active FROM users;

-- View all bookings with customer and service name
-- SELECT b.id, u.name AS customer, s.name AS service,
--        b.status, b.address, b.booking_date
-- FROM bookings b
-- JOIN users    u ON b.customer_id = u.id
-- JOIN services s ON b.service_id  = s.id
-- ORDER BY b.booking_date DESC;

-- View all payments with booking info
-- SELECT p.id, p.booking_id, p.amount, p.payment_method,
--        p.status, p.transaction_ref, p.payment_date
-- FROM payments p
-- JOIN bookings b ON p.booking_id = b.id;

-- Provider earnings summary
-- SELECT u.name AS provider,
--        COUNT(b.id) AS total_bookings,
--        SUM(p.amount) AS total_earned
-- FROM users u
-- JOIN services s  ON s.provider_id = u.id
-- JOIN bookings b  ON b.service_id  = s.id
-- JOIN payments p  ON p.booking_id  = b.id
-- WHERE u.role = 'PROVIDER' AND p.status = 'SUCCESS'
-- GROUP BY u.id;

-- Average rating per provider
-- SELECT u.name AS provider, ROUND(AVG(r.rating), 1) AS avg_rating,
--        COUNT(r.id) AS total_reviews
-- FROM reviews r
-- JOIN users u ON r.provider_id = u.id
-- GROUP BY u.id;
