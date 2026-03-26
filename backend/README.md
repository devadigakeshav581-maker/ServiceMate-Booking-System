# ServiceMate - Spring Boot Backend

Complete Spring Boot REST API for the ServiceMate service booking platform with JWT authentication, role-based access control, and payment processing.

## Tech Stack

- **Framework**: Spring Boot 3.2.2
- **Language**: Java 17
- **Database**: MySQL 8.0
- **Build Tool**: Maven 4.0.0
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Spring Security with BCrypt password encoding
- **ORM**: Spring Data JPA with Hibernate

## Project Structure

```
server/
├── pom.xml                                     # Maven configuration with dependencies
├── servicemate_schema.sql                      # Database initialization script
├── src/main/java/com/servicemate/
│   ├── ServicemateApplication.java            # Main Spring Boot application
│   ├── controller/                            # REST API endpoints
│   │   ├── AuthController.java                # Authentication endpoints
│   │   ├── BookingController.java             # Booking management endpoints
│   │   ├── PaymentController.java             # Payment processing endpoints
│   │   └── ServiceController.java             # Service listing endpoints
│   ├── service/                               # Business logic layer
│   │   ├── AuthService.java                   # Authentication & registration logic
│   │   ├── BookingService.java                # Booking business logic
│   │   ├── PaymentService.java                # Payment processing logic
│   │   └── ServiceItemService.java            # Service listing logic
│   ├── model/                                 # JPA Entity classes
│   │   ├── User.java                          # User entity
│   │   ├── Role.java                          # Role enum (CUSTOMER, PROVIDER, ADMIN)
│   │   ├── Booking.java                       # Booking entity
│   │   ├── BookingStatus.java                 # Booking status enum
│   │   ├── Payment.java                       # Payment entity
│   │   ├── PaymentStatus.java                 # Payment status enum
│   │   └── ServiceItem.java                   # Service entity
│   ├── repository/                            # Data access layer
│   │   ├── UserRepository.java                # User CRUD & queries
│   │   ├── BookingRepository.java             # Booking CRUD & queries
│   │   ├── PaymentRepository.java             # Payment CRUD & queries
│   │   └── ServiceRepository.java             # Service CRUD & queries
│   ├── dto/                                   # Data Transfer Objects
│   │   ├── RegisterRequest.java               # User registration request
│   │   ├── LoginRequest.java                  # User login request
│   │   ├── BookingRequest.java                # Booking creation request
│   │   ├── PaymentRequest.java                # Payment request
│   │   └── PaymentResponse.java               # Payment response
│   └── security/                              # Security configuration
│       ├── JwtUtil.java                       # JWT token generation & validation
│       └── SecurityConfig.java                # Spring Security & CORS configuration
├── src/main/resources/
│   ├── application.properties                 # Spring Boot configuration
│   └── static/                                # Frontend files served by Spring Boot
│       ├── login.html, register.html
│       ├── customer-dashboard.html
│       ├── provider-dashboard.html
│       ├── admin-dashboard.html
│       ├── api.js                             # Frontend API client
│       └── api-usage-guide.js
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login with JWT token

### Bookings
- `POST /api/bookings/create` - Create new booking
- `PUT /api/bookings/confirm/{id}` - Confirm booking
- `PUT /api/bookings/complete/{id}` - Mark booking as completed
- `PUT /api/bookings/cancel/{id}` - Cancel booking
- `GET /api/bookings/{id}` - Get booking by ID
- `GET /api/bookings/customer/{customerId}` - Get bookings for customer
- `GET /api/bookings/service/{serviceId}` - Get bookings for service

### Payments
- `POST /api/payments/pay` - Process payment (90% success rate)
- `GET /api/payments/status/{bookingId}` - Get payment status

### Services
- `GET /api/services` - Get all services
- `GET /api/services/{id}` - Get service by ID
- `GET /api/services/provider/{providerId}` - Get services by provider
- `POST /api/services` - Create new service

## Setup Instructions

### Prerequisites
- Java 17 or higher
- Maven 4.0.0 or higher
- MySQL 8.0 or higher
- Git (optional)

### Step 1: Set Up Database

1. Start your MySQL server
2. Run the database script to create the schema and sample data:

```bash
mysql -u root -p < servicemate_schema.sql
```

Or execute in MySQL Workbench/CLI:
```sql
-- Run the contents of servicemate_schema.sql
```

### Step 2: Configure Database Connection

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/servicemate
spring.datasource.username=root
spring.datasource.password=your_password
```

### Step 3: Build the Project

```bash
cd server
mvn clean install
```

This will download all dependencies and compile the project.

### Step 4: Run the Application

```bash
mvn spring-boot:run
```

Or using JAR:
```bash
mvn clean package
java -jar target/ServicemateApplication.jar
```

The application will start on `http://localhost:8080`

## Accessing the Application

### Frontend
- **Login**: `http://localhost:8080/login.html`
- **Register**: `http://localhost:8080/register.html`
- **Customer Dashboard**: `http://localhost:8080/customer-dashboard.html`
- **Provider Dashboard**: `http://localhost:8080/provider-dashboard.html`
- **Admin Dashboard**: `http://localhost:8080/admin-dashboard.html`

### Test Credentials

Use these credentials to test the application:

| Email | Password | Role |
|-------|----------|------|
| customer@servicemate.com | 123456 | CUSTOMER |
| provider@servicemate.com | 123456 | PROVIDER |
| admin@servicemate.com | 123456 | ADMIN |

## Testing with Postman

1. **Register a new user**
   ```
   POST http://localhost:8080/api/auth/register
   Content-Type: application/json
   
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "password123",
     "phone": "1234567890",
     "role": "CUSTOMER"
   }
   ```

2. **Login to get JWT token**
   ```
   POST http://localhost:8080/api/auth/login
   Content-Type: application/json
   
   {
     "email": "john@example.com",
     "password": "password123"
   }
   ```

3. **Use JWT token in headers for protected endpoints**
   ```
   Authorization: Bearer <token_from_login>
   ```

## Database Schema

### users
- id, name, email, password, phone, role, is_active

### services
- id, name, description, price, category, provider_id, is_available

### bookings
- id, customer_id, service_id, status, address, notes, booking_date, confirmed_at, completed_at, cancelled_at

### payments
- id, booking_id, amount, status, payment_method, transaction_ref, payment_date

## Features Implemented

✅ User Registration & Login with JWT authentication
✅ Role-based access control (CUSTOMER, PROVIDER, ADMIN)
✅ Service listing and management
✅ Booking creation, confirmation, completion, and cancellation
✅ Payment processing with 90% simulated success rate
✅ CORS enabled for cross-origin requests
✅ Password encryption with BCrypt
✅ MySQL database with Hibernate JPA ORM
✅ Static HTML/CSS/JS frontend served by Spring Boot
✅ Comprehensive error handling

## Key Dependencies

- **spring-boot-starter-web**: REST API creation
- **spring-boot-starter-security**: Authentication & authorization
- **spring-boot-starter-data-jpa**: ORM and database operations
- **mysql-connector-j**: MySQL database driver
- **jjwt**: JWT token handling
- **lombok**: Boilerplate code reduction
- **spring-boot-starter-test**: Unit testing framework

## Configuration Notes

- **JWT Secret**: Configure in `application.properties` (change for production)
- **JWT Expiration**: 24 hours (configurable)
- **Password Encoding**: BCrypt with strength 10
- **Database DDL**: Auto-update mode (change to validate in production)
- **CORS**: Enabled for all origins (restrict in production)

## Troubleshooting

### MySQL Connection Issues
- Verify MySQL is running: `mysql -u root -p`
- Check database exists: `SHOW DATABASES;`
- Verify user permissions: `GRANT ALL PRIVILEGES ON servicemate.* TO 'root'@'localhost';`

### Maven Build Issues
- Clean cache: `mvn clean`
- Update dependencies: `mvn dependency:resolve`
- Check Java version: `java -version` (should be 17+)

### Port Already in Use
- Change port in `application.properties`: `server.port=8081`

## Next Steps

1. Customize the JWT secret for production
2. Implement email verification for registration
3. Add file upload for service images
4. Implement review/rating system
5. Add notification system (email/SMS)
6. Deploy to cloud platform (AWS, Heroku, Google Cloud)

## License

ServiceMate - Service Booking Platform

---

For more information or issues, contact the development team.
