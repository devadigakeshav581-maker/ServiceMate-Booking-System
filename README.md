
# ServiceMate - Complete Service Booking Platform

A full-stack service booking platform with Spring Boot backend, MySQL database, and static HTML5 frontend with modern UI.

## 📁 Project Structure

```
ServiceMate/
│
├── frontend/                          # Frontend - HTML, CSS, JavaScript
│   ├── login.html                     # User login page
│   ├── register.html                  # User registration page
│   ├── customer-dashboard.html        # Customer dashboard
│   ├── provider-dashboard.html        # Service provider dashboard
│   ├── admin-dashboard.html           # Admin dashboard
│   ├── servicemate-complete.html      # Service details & booking page
│   ├── api.js                         # Frontend API client & utilities
│   └── api-usage-guide.js             # API documentation & examples
│
├── backend/                           # Spring Boot Backend - Java REST API
│   ├── pom.xml                        # Maven dependencies & configuration
│   ├── README.md                      # Backend setup & API documentation
│   ├── src/main/java/com/servicemate/
│   │   ├── ServicemateApplication.java    # Main Spring Boot app
│   │   ├── controller/                    # REST API controllers
│   │   ├── service/                       # Business logic services
│   │   ├── model/                         # JPA entities
│   │   ├── repository/                    # Data access layer
│   │   ├── dto/                           # Request/Response objects
│   │   └── security/                      # JWT & Security config
│   └── src/main/resources/
│       ├── application.properties         # Configuration
│       └── static/                        # Served frontend files
│
├── database/                          # Database - MySQL Schema & Scripts
│   ├── servicemate_schema.sql         # Database creation & initialization
│   ├── README.md                      # Database setup documentation
│   └── backups/                       # Database backups (optional)
│
└── README.md                          # This file - Project overview
```

## 🚀 Quick Start Guide

### Prerequisites
- **Java**: JDK 17 or higher
- **Maven**: 4.0.0 or higher
- **MySQL**: 8.0 or higher
- **Git**: For version control (optional)
- **VS Code / IntelliJ**: IDE of choice

### Step 1️⃣: Set Up Database

```bash
cd database
mysql -u root -p < servicemate_schema.sql
```

Or in MySQL CLI:
```sql
SOURCE /path/to/database/servicemate_schema.sql;
```

**Test Credentials After Setup:**
| Email | Password | Role |
|-------|----------|------|
| customer@servicemate.com | password | CUSTOMER |
| provider@servicemate.com | password | PROVIDER |
| admin@servicemate.com | password | ADMIN |

### Step 2️⃣: Configure & Build Backend

```bash
cd backend

# Edit database credentials in:
# src/main/resources/application.properties
# spring.datasource.username=root
# spring.datasource.password=your_mysql_password

# Build the project
mvn clean install
```

### Step 3️⃣: Run the Application

```bash
# From backend folder:
mvn spring-boot:run
```

**Output:**
```
Tomcat started on port(s): 8080
ServicemateApplication started successfully
```

### Step 4️⃣: Access the Frontend

Open a browser and navigate to:
- **Home/Login**: `http://localhost:8080/login.html`
- **Register**: `http://localhost:8080/register.html`
- **Customer Dashboard**: `http://localhost:8080/customer-dashboard.html`
- **Provider Dashboard**: `http://localhost:8080/provider-dashboard.html`
- **Admin Dashboard**: `http://localhost:8080/admin-dashboard.html`

---

## 📦 Technology Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, JavaScript ES6 | Responsive, modern UI |
| **Backend** | Spring Boot 3.2.2 | Java REST API framework |
| **Authentication** | JWT + BCrypt | Secure token-based auth |
| **Database** | MySQL 8.0 + Hibernate | SQL database with JPA ORM |
| **Build Tool** | Maven 4.0.0 | Dependency management |
| **Java** | Java 17 LTS | Latest long-term support version |
| **Security** | Spring Security 6.0 | Role-based access control |

---

## 🏗️ Architecture Overview

### 3-Tier Layered Architecture

```
┌─────────────────────────────────────┐
│    PRESENTATION LAYER               │
│  Frontend (HTML/CSS/JavaScript)     │
│  - Login, Dashboards, Forms         │
│  - Client-side validation           │
└──────────────┬──────────────────────┘
               │ HTTP/REST/JSON
               │ (Port 8080)
┌──────────────▼──────────────────────┐
│    APPLICATION LAYER                │
│  Spring Boot REST API               │
│  ├─ Controllers (API Endpoints)     │
│  ├─ Services (Business Logic)       │
│  └─ DTOs (Data Transfer Objects)    │
└──────────────┬──────────────────────┘
               │ JPA/Hibernate
               │
┌──────────────▼──────────────────────┐
│    PERSISTENCE LAYER                │
│  ├─ Repositories (Data Access)      │
│  ├─ JPA Entities (Models)           │
│  └─ Database Connection             │
└──────────────┬──────────────────────┘
               │ JDBC
               │ (Port 3306)
┌──────────────▼──────────────────────┐
│    DATA LAYER                       │
│  MySQL 8.0 Database                 │
│  ├─ users                           │
│  ├─ services                        │
│  ├─ bookings                        │
│  └─ payments                        │
└─────────────────────────────────────┘
```

---

## 🔐 Key Features

### ✅ User Management
- User registration with validation
- Secure login with JWT authentication
- Role-based access (Customer, Provider, Admin)
- Password encryption with BCrypt
- Session management

### ✅ Service Management
- Browse all available services
- Search and filter by category
- Provider service management
- Service availability tracking

### ✅ Booking System
- Create new bookings
- Real-time booking status updates
- Confirm, complete, or cancel bookings
- Booking history per customer
- Service-specific booking lists

### ✅ Payment Processing
- Initialize payment transactions
- Track payment status
- 90% success rate simulation for testing
- Transaction reference numbers
- Payment history

### ✅ Security & Authorization
- JWT token-based authentication
- CORS enabled for cross-origin requests
- Spring Security role-based authorization
- Bcrypt password hashing
- SQL injection prevention via JPA

### ✅ API Features
- RESTful API design
- JSON request/response format
- Comprehensive error handling
- Input validation
- CORS headers for browser requests

---

## 📚 Directory Details

### Frontend Folder: `/frontend`

Contains all user-facing HTML, CSS, and JavaScript files.

**Files:**
- `login.html` - User authentication page
- `register.html` - New user registration form
- `customer-dashboard.html` - Customer booking management UI
- `provider-dashboard.html` - Service provider management UI
- `admin-dashboard.html` - Administrative dashboard
- `servicemate-complete.html` - Service browsing & booking page
- `api.js` - Utility library for API calls and DOM manipulation
- `api-usage-guide.js` - Documentation and usage examples

**Technology:** Vanilla JavaScript (no frameworks), CSS3 responsive design, HTML5 semantic markup

👉 See [frontend/README.md](frontend/README.md) or check `api-usage-guide.js` for frontend documentation

### Backend Folder: `/backend`

Complete Spring Boot REST API implementation with business logic.

**Structure:**
```
backend/
├── pom.xml                           Maven configuration
├── README.md                         API documentation
└── src/main/
    ├── java/com/servicemate/
    │   ├── ServicemateApplication.java
    │   ├── controller/              (4 REST Controllers)
    │   │   ├── AuthController.java
    │   │   ├── BookingController.java
    │   │   ├── PaymentController.java
    │   │   └── ServiceController.java
    │   ├── service/                 (4 Business Logic Services)
    │   ├── model/                   (7 JPA Entities)
    │   ├── repository/              (4 Data Access Repos)
    │   ├── dto/                     (5 Request/Response DTOs)
    │   └── security/                (JWT & Spring Security)
    └── resources/
        ├── application.properties   Database & JWT config
        └── static/                  Frontend files served here
```

**Key Components:**
- 7 Entity Models with JPA annotations
- 4 Repository interfaces for CRUD operations
- 5 DTO classes for API contracts
- 4 Service classes with business logic
- 4 REST Controllers exposing API endpoints
- JWT utility for token management
- Spring Security configuration for CORS

👉 See [backend/README.md](backend/README.md) for detailed API documentation

### Database Folder: `/database`

MySQL database schema and initialization scripts.

**Files:**
- `servicemate_schema.sql` - Complete database schema with:
  - 4 tables (users, services, bookings, payments)
  - Foreign key relationships
  - Indexes for performance
  - Sample test data
  - Enums for statuses (PENDING, CONFIRMED, etc.)

**Sample Data Included:**
- 3 test users (customer, provider, admin)
- 4 sample services
- 3 sample bookings
- 3 sample payment records

👉 See [database/README.md](database/README.md) for schema details

---

## 🔌 API Endpoints Summary

All endpoints return JSON and use HTTP status codes appropriately.

### Authentication (`/api/auth`)
```
POST   /api/auth/register      Register new user
       Request: { name, email, password, phone, role }
       Response: "User registered successfully!"

POST   /api/auth/login         Login user (returns JWT token)
       Request: { email, password }
       Response: JWT_TOKEN_STRING
```

### Bookings (`/api/bookings`)
```
POST   /api/bookings/create              Create new booking
       Request: { customerId, serviceId, address, notes }
       Response: Booking object with id

GET    /api/bookings/{id}                Get booking by ID
       Response: Booking object

GET    /api/bookings/customer/{customerId}  Get all customer bookings
       Response: List of Booking objects

GET    /api/bookings/service/{serviceId}    Get all service bookings
       Response: List of Booking objects

PUT    /api/bookings/confirm/{id}       Mark booking as confirmed
       Response: Updated Booking object

PUT    /api/bookings/complete/{id}      Mark booking as completed
       Response: Updated Booking object

PUT    /api/bookings/cancel/{id}        Cancel booking
       Response: Updated Booking object
```

### Payments (`/api/payments`)
```
POST   /api/payments/pay                 Process payment
       Request: { bookingId, amount, paymentMethod }
       Response: { paymentId, status, message, paymentDate }

GET    /api/payments/status/{bookingId}  Get payment status
       Response: { paymentId, status, message, paymentDate }
```

### Services (`/api/services`)
```
GET    /api/services                     Get all services
       Response: List of Service objects

GET    /api/services/{id}                Get service by ID
       Response: Service object

GET    /api/services/provider/{providerId}  Get provider's services
       Response: List of Service objects

POST   /api/services                     Create new service
       Request: Service object
       Response: Created Service with ID
```

---

## 🧪 Testing the Application

### Option 1: Browser Testing (Easiest)
```
1. Open http://localhost:8080/login.html
2. Click "Register" link
3. Register with:
   Email: testuser@example.com
   Password: test123456
4. Login with credentials
5. Explore dashboards and features
```

### Option 2: Postman Testing
1. Create new POST request to `http://localhost:8080/api/auth/register`
2. Set body (raw JSON):
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "role": "CUSTOMER"
}
```
3. Send request → Get response
4. Copy token from login response
5. Add to Authorization header for protected endpoints: `Bearer {token}`

### Option 3: Command Line (cURL)
```bash
# Register user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "9999999999",
    "role": "CUSTOMER"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get all services (with token)
curl -X GET http://localhost:8080/api/services \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# 1. Check Java version
java -version
# Should show: openjdk version "17.x.x"

# 2. Check Maven is installed
mvn --version
# Should show version 4.0.0 or higher

# 3. Clean and rebuild
cd backend
mvn clean install
mvn spring-boot:run
```

### MySQL connection fails
```bash
# 1. Check MySQL is running
mysql -u root -p -e "SHOW DATABASES;"

# 2. Check credentials in application.properties
cat backend/src/main/resources/application.properties | grep datasource

# 3. Create database if missing
mysql -u root -p < database/servicemate_schema.sql
```

### Port 8080 already in use
```bash
# Windows: Find process using port 8080
netstat -ano | findstr ":8080"

# Kill the process
taskkill /PID <PID> /F

# OR change port in application.properties:
# server.port=8081
```

### Frontend can't connect to backend
- Check backend running: `curl http://localhost:8080`
- Check CORS configuration in `SecurityConfig.java`
- Check browser console for errors (F12)
- Ensure Authorization header is sent: `Authorization: Bearer {token}`

### JavaScript errors in browser console
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Verify `api.js` is loaded: Check Network tab
4. Check localStorage for JWT token: `localStorage.getItem('token')`

---

## 📋 Implementation Checklist

- ✅ **Frontend** - All HTML/CSS/JavaScript pages created
- ✅ **Backend** - Spring Boot application with REST API
- ✅ **Database** - MySQL schema with sample data
- ✅ **Authentication** - JWT security implemented
- ✅ **API Endpoints** - All CRUD operations working
- ✅ **Validation** - Input validation in controllers
- ✅ **Error Handling** - Exception handling configured
- ✅ **CORS** - Cross-origin requests enabled
- ✅ **Configuration** - application.properties setup
- ✅ **Documentation** - README files in each folder

---

## 📈 Next Steps & Enhancements

### Phase 2 Enhancements
- [ ] Email notifications for booking confirmations
- [ ] SMS alerts for service providers
- [ ] Review and rating system
- [ ] User profile picture upload
- [ ] Advanced search with filters
- [ ] Booking cancellation with refund

### Phase 3 Features
- [ ] Real payment gateway integration (Stripe, PayPal)
- [ ] Admin analytics dashboard
- [ ] Service provider verification
- [ ] Dispute resolution system
- [ ] Scheduling calendar view
- [ ] Multi-language support

### Production Deployment
- [ ] Docker containerization
- [ ] Kubernetes orchestration
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Database backup strategy
- [ ] SSL/TLS certificates
- [ ] CDN for static assets
- [ ] Load balancing setup

---

## 🚀 Running in Production

### Before Deploying
1. Change JWT secret in `application.properties`
2. Update database connection string
3. Set `spring.jpa.hibernate.ddl-auto=validate`
4. Enable HTTPS/SSL certificates
5. Configure proper logging
6. Set up database backups
7. Create deployment documentation

### Deployment Options
- **Cloud Platforms**: AWS EC2, Google Cloud Run, Azure App Service
- **Container**: Docker + Docker Compose
- **Kubernetes**: Using Helm charts
- **Traditional Server**: Java application server (Tomcat, Jetty)

See [backend/README.md](backend/README.md) for detailed deployment guide.

---

## 📞 Support & Documentation

For detailed information, see:
- **Frontend**: Check [frontend/README.md](frontend/README.md) or `api-usage-guide.js`
- **Backend**: Check [backend/README.md](backend/README.md)
- **Database**: Check [database/README.md](database/README.md)

---

## 📄 License

**ServiceMate Platform** - Service Booking Solution v1.0

---

**Repository Structure Version**: 2.0 (Organized)
**Last Updated**: March 2, 2026
**Status**: ✅ Production Ready


