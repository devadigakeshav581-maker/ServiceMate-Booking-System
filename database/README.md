# Database - ServiceMate MySQL Schema

Complete MySQL database schema and initialization scripts for the ServiceMate service booking platform.

## 📋 Overview

The database uses **MySQL 8.0** with **InnoDB** storage engine for ACID compliance and foreign key support.

### Key Characteristics
- **Tables**: 4 main tables
- **Relationships**: Foreign key constraints
- **Data Types**: Optimized for performance
- **Indexes**: Composite indexes for fast queries
- **Enums**: Type-safe status fields
- **Timestamps**: Audit trail with created_at/updated_at

---

## 🗄️ Database Schema

### 1. Users Table

**Purpose**: Store all user accounts and authentication data

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,          -- BCrypt hashed
    phone VARCHAR(20),
    role ENUM('CUSTOMER', 'PROVIDER', 'ADMIN') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Key Features:**
- `id`: Auto-increment primary key
- `email`: Unique constraint for authentication
- `role`: Enum restricts to 3 role types
- `is_active`: Boolean flag for soft delete/deactivation
- `created_at/updated_at`: Audit timestamps

**Indexes:**
- Primary: `id`
- Unique: `email`

**Sample Records:**
```
| id | name           | email                        | role     | is_active |
|----|----------------|------------------------------|----------|-----------|
| 1  | Admin User     | admin@servicemate.com        | ADMIN    | 1         |
| 2  | John Customer  | customer@servicemate.com     | CUSTOMER | 1         |
| 3  | Jane Provider  | provider@servicemate.com     | PROVIDER | 1         |
```

---

### 2. Services Table

**Purpose**: Store service offerings from providers

```sql
CREATE TABLE services (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DOUBLE NOT NULL,
    category VARCHAR(100),
    provider_id BIGINT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Key Features:**
- `provider_id`: Foreign key to users table
- `price`: Double for decimal support
- `category`: For service grouping/filtering
- `is_available`: Boolean for availability toggle

**Foreign Keys:**
- `provider_id` → `users.id` (ON DELETE CASCADE)

**Sample Records:**
```
| id | name                | price | category   | provider_id | is_available |
|----|---------------------|-------|------------|-------------|--------------|
| 1  | Home Cleaning       | 50.00 | Cleaning   | 3           | 1            |
| 2  | Plumbing Repair     | 75.00 | Repairs    | 3           | 1            |
| 3  | Electrical Work     | 100.00| Maintenance| 3           | 1            |
| 4  | Furniture Repair    | 60.00 | Repairs    | 3           | 1            |
```

---

### 3. Bookings Table

**Purpose**: Track customer service bookings

```sql
CREATE TABLE bookings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    address VARCHAR(255),
    notes TEXT,
    booking_date DATETIME NOT NULL,
    confirmed_at DATETIME,
    completed_at DATETIME,
    cancelled_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);
```

**Key Features:**
- `customer_id`: Foreign key to users (customer)
- `service_id`: Foreign key to services
- `status`: Enum with booking lifecycle states
- `booking_date`: Customer requested date/time
- `confirmed_at/completed_at/cancelled_at`: Status change timestamps
- Audit trail via `created_at/updated_at`

**Foreign Keys:**
- `customer_id` → `users.id` (ON DELETE CASCADE)
- `service_id` → `services.id` (ON DELETE CASCADE)

**Booking Status Flow:**
```
PENDING → CONFIRMED → COMPLETED
       ↓
     CANCELLED
```

**Sample Records:**
```
| id | customer_id | service_id | status    | booking_date        |
|----|-------------|------------|-----------|---------------------|
| 1  | 2           | 1          | PENDING   | 2026-03-02 10:30:00 |
| 2  | 2           | 2          | CONFIRMED | 2026-03-02 12:00:00 |
| 3  | 2           | 3          | COMPLETED | 2026-02-25 14:30:00 |
```

---

### 4. Payments Table

**Purpose**: Track payment transactions for bookings

```sql
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT UNIQUE NOT NULL,
    amount DOUBLE NOT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
    payment_method VARCHAR(100),              -- 'Credit Card', 'Debit Card', 'UPI', etc.
    transaction_ref VARCHAR(100),             -- Transaction ID from payment gateway
    payment_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
```

**Key Features:**
- `booking_id`: Unique foreign key (one payment per booking)
- `amount`: Total payment amount
- `status`: Enum for payment states
- `payment_method`: String for payment type
- `transaction_ref`: Gateway transaction reference
- `payment_date`: Timestamp of payment processing

**Foreign Keys:**
- `booking_id` → `bookings.id` (UNIQUE, ON DELETE CASCADE)

**Payment Status Flow:**
```
PENDING → SUCCESS
       ↓
      FAILED → (retry available)
```

**Sample Records:**
```
| id | booking_id | amount | status  | payment_method | transaction_ref  |
|----|------------|--------|---------|----------------|------------------|
| 1  | 1          | 50.00  | SUCCESS | Credit Card    | TXN_SM_ABC12345  |
| 2  | 2          | 75.00  | SUCCESS | Debit Card     | TXN_SM_XYZ67890  |
| 3  | 3          | 100.00 | SUCCESS | UPI            | TXN_SM_DEF11111  |
```

---

## 🔗 Entity Relationships

### Relationship Diagram

```
┌──────────┐
│  Users   │
│ (id, ..) │
└─────┬────┘
      │
      ├─── (provider_id) ──→ Services
      │                       (id, name, price, ...)
      │
      └─── (customer_id) ──→ Bookings
                             (id, customer_id, service_id, ...)
                                      │
                                      ├─→ service_id → Services
                                      │
                                      └─→ (booking_id) ──→ Payments
                                                          (id, amount, status)
```

### Cascade Rules

- **Users → Services**: ON DELETE CASCADE (delete provider's services)
- **Users → Bookings**: ON DELETE CASCADE (delete customer's bookings)
- **Services → Bookings**: ON DELETE CASCADE (delete bookings when service deleted)
- **Bookings → Payments**: ON DELETE CASCADE (delete payment when booking deleted)

---

## 🔑 Indexes

Performance-optimized indexes:

```sql
-- Unique Indexes
INDEX idx_email ON users(email);          -- Fast login lookups

-- Foreign Key Indexes (auto-created)
INDEX idx_provider_id ON services(provider_id);
INDEX idx_customer_id ON bookings(customer_id);
INDEX idx_service_id ON bookings(service_id);
INDEX idx_booking_id ON payments(booking_id);

-- Search Indexes
INDEX idx_service_category ON services(category);
INDEX idx_booking_status ON bookings(status);
INDEX idx_payment_status ON payments(status);

-- Composite Indexes
INDEX idx_customer_status ON bookings(customer_id, status);
INDEX idx_provider_service ON services(provider_id, is_available);
```

---

## 📊 Database Statistics

### Table Sizes
- **users**: ~1 KB (3 test records)
- **services**: ~1 KB (4 test records)
- **bookings**: ~1 KB (3 test records)
- **payments**: ~1 KB (3 test records)
- **Total**: ~4 KB (initial)

### Estimated Growth
```
Assuming 10,000 users, 1,000 services, 50,000 bookings:
→ Database size: ~50 MB
→ With indexes: ~100 MB
```

---

## 🚀 Setup Instructions

### Step 1: Create Database

```bash
mysql -u root -p < servicemate_schema.sql
```

### Step 2: Verify Installation

```bash
mysql -u root -p

> USE servicemate;
> SHOW TABLES;
> SELECT COUNT(*) FROM users;
> SELECT * FROM users;
```

### Step 3: Update Backend Configuration

In `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/servicemate
spring.datasource.username=root
spring.datasource.password=your_mysql_password
spring.jpa.hibernate.ddl-auto=update
```

---

## 👥 Test Data

### Users (Pre-loaded)

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| admin@servicemate.com | password | ADMIN | System admin testing |
| customer@servicemate.com | password | CUSTOMER | Customer feature testing |
| provider@servicemate.com | password | PROVIDER | Provider feature testing |

**Note**: Passwords are BCrypt hashed in database

### Services (Pre-loaded)

| Name | Price | Category | Provider |
|------|-------|----------|----------|
| Home Cleaning | $50 | Cleaning | provider@servicemate.com |
| Plumbing Repair | $75 | Repairs | provider@servicemate.com |
| Electrical Work | $100 | Maintenance | provider@servicemate.com |
| Furniture Repair | $60 | Repairs | provider@servicemate.com |

### Bookings & Payments (Pre-loaded)

- 3 sample bookings with corresponding payments
- Status examples: PENDING, CONFIRMED, COMPLETED
- Payment status: SUCCESS

---

## 🔄 Common Queries

### Find Services by Provider
```sql
SELECT * FROM services 
WHERE provider_id = 3 AND is_available = TRUE;
```

### Get Customer's Booking History
```sql
SELECT b.*, s.name as service_name, s.price
FROM bookings b
JOIN services s ON b.service_id = s.id
WHERE b.customer_id = 2
ORDER BY b.booking_date DESC;
```

### Get Payment Status for Booking
```sql
SELECT * FROM payments 
WHERE booking_id = 1;
```

### Get Confirmed Bookings for Provider
```sql
SELECT b.*, u.name as customer_name, s.name as service_name
FROM bookings b
JOIN services s ON b.service_id = s.id
JOIN users u ON b.customer_id = u.id
WHERE s.provider_id = 3 AND b.status = 'CONFIRMED';
```

### Calculate Total Revenue by Provider
```sql
SELECT 
    u.name as provider_name,
    SUM(p.amount) as total_revenue,
    COUNT(p.id) as total_payments
FROM payments p
JOIN bookings b ON p.booking_id = b.id
JOIN services s ON b.service_id = s.id
JOIN users u ON s.provider_id = u.id
WHERE p.status = 'SUCCESS'
GROUP BY s.provider_id;
```

---

## 🔐 Security Considerations

### Password Security
- Passwords stored as BCrypt hashes (NOT plain text)
- Minimum 60 characters for hash storage
- Salt generated automatically by BCrypt

### Data Access
- Use parameterized queries (JPA prevents SQL injection)
- Foreign keys enforce referential integrity
- Unique constraints prevent duplicate emails
- Enums restrict status values

### Audit Trail
- `created_at`/`updated_at` timestamps on all tables
- Enables tracking of data changes
- Useful for compliance and debugging

### Backups
```bash
# Backup entire database
mysqldump -u root -p servicemate > backup_2026_03_02.sql

# Restore from backup
mysql -u root -p servicemate < backup_2026_03_02.sql
```

---

## 📝 Schema Modification Guide

### Add New Table
```sql
CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL UNIQUE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
```

### Add New Column
```sql
ALTER TABLE users ADD COLUMN last_login DATETIME;

-- Update Spring Boot entity
@Column(name = "last_login")
private LocalDateTime lastLogin;
```

### Add Index
```sql
CREATE INDEX idx_users_role ON users(role);
```

### Drop Table (Careful!)
```sql
DROP TABLE IF EXISTS reviews;
```

---

## ⚠️ Maintenance

### Check Table Status
```sql
CHECK TABLE users;
CHECK TABLE services;
CHECK TABLE bookings;
CHECK TABLE payments;
```

### Optimize Tables
```sql
OPTIMIZE TABLE users;
OPTIMIZE TABLE services;
OPTIMIZE TABLE bookings;
OPTIMIZE TABLE payments;
```

### Repair Corrupted Table
```sql
REPAIR TABLE bookings;
```

### View Table Details
```sql
DESCRIBE users;
SHOW CREATE TABLE services;
SHOW INDEX FROM bookings;
```

---

## 🔄 Data Migration

### Export Data
```bash
# Export as CSV
SELECT * FROM users INTO OUTFILE '/tmp/users.csv' 
FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n';

# Export as JSON
SELECT JSON_OBJECT('id', id, 'email', email, 'role', role) FROM users;
```

### Import Data
```bash
LOAD DATA INFILE '/tmp/users.csv' INTO TABLE users
FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n';
```

---

## 🐛 Troubleshooting

### Connection Failed
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Verify credentials
mysql -u root -ppassword servicemate

# Check port (default 3306)
netstat -an | grep 3306
```

### Table Doesn't Exist
```bash
# Check database selection
USE servicemate;
SHOW TABLES;

# Re-run schema script
mysql -u root -p servicemate < servicemate_schema.sql
```

### Foreign Key Error
```sql
-- Disable foreign key checks (temporary)
SET FOREIGN_KEY_CHECKS=0;
-- ... perform deletions ...
SET FOREIGN_KEY_CHECKS=1;

-- Or check foreign key constraints
SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'bookings';
```

### Lock Wait Timeout
```sql
-- Long-running transaction blocking
SHOW PROCESSLIST;

-- Kill blocking process
KILL 123;  -- Process ID

-- View current locks
SHOW OPEN TABLES WHERE In_use > 0;
```

---

## 📚 Related Documentation

- See [../backend/README.md](../backend/README.md) for JPA entity mapping
- See [../frontend/README.md](../frontend/README.md) for API contracts
- See [../README.md](../README.md) for full project overview

---

## 📄 Files in This Directory

```
database/
├── servicemate_schema.sql    ← Main schema file
├── README.md                 ← This file
└── backups/                  ← Backup directory (optional)
    └── 2026-03-02.sql
```

---

**Database Version**: 1.0
**MySQL Version**: 8.0+
**Last Updated**: March 2, 2026
**Status**: ✅ Production Ready
