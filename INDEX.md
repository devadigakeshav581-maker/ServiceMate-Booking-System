# 📁 ServiceMate Complete Project Structure

**Last Updated**: March 2, 2026 | **Version**: 1.0.0 | **Status**: ✅ Production Ready

---

## 🎯 Directory Organization

```
ServiceMate/
│
├── 📄 README.md                        ← START HERE: Project overview & quick start
├── 📄 INDEX.md                         ← This file: Complete structure guide
│
├── 📁 frontend/                        ← USER INTERFACE LAYER
│   ├── 📄 README.md                    ← Frontend documentation
│   ├── 📄 login.html                   ← User login page
│   ├── 📄 register.html                ← New user registration
│   ├── 📄 customer-dashboard.html      ← Customer UI
│   ├── 📄 provider-dashboard.html      ← Service provider UI
│   ├── 📄 admin-dashboard.html         ← Admin management UI
│   ├── 📄 servicemate-complete.html    ← Service listing & booking UI
│   ├── 📄 api.js                       ← Frontend API client library
│   └── 📄 api-usage-guide.js           ← API documentation & examples
│
├── 📁 backend/                         ← APPLICATION LOGIC LAYER
│   ├── 📄 README.md                    ← Backend API documentation
│   ├── 📄 pom.xml                      ← Maven configuration & dependencies
│   ├── 📁 src/
│   │   └── main/
│   │       ├── java/com/servicemate/
│   │       │   ├── ServicemateApplication.java         ← Main Spring Boot app
│   │       │   ├── controller/                         ← REST API endpoints
│   │       │   │   ├── AuthController.java
│   │       │   │   ├── BookingController.java
│   │       │   │   ├── PaymentController.java
│   │       │   │   └── ServiceController.java
│   │       │   ├── service/                            ← Business logic
│   │       │   │   ├── AuthService.java
│   │       │   │   ├── BookingService.java
│   │       │   │   ├── PaymentService.java
│   │       │   │   └── ServiceItemService.java
│   │       │   ├── model/                              ← JPA entities
│   │       │   │   ├── User.java
│   │       │   │   ├── Role.java
│   │       │   │   ├── Booking.java
│   │       │   │   ├── BookingStatus.java
│   │       │   │   ├── Payment.java
│   │       │   │   ├── PaymentStatus.java
│   │       │   │   └── ServiceItem.java
│   │       │   ├── repository/                         ← Data access layer
│   │       │   │   ├── UserRepository.java
│   │       │   │   ├── BookingRepository.java
│   │       │   │   ├── PaymentRepository.java
│   │       │   │   └── ServiceRepository.java
│   │       │   ├── dto/                                ← Request/Response objects
│   │       │   │   ├── RegisterRequest.java
│   │       │   │   ├── LoginRequest.java
│   │       │   │   ├── BookingRequest.java
│   │       │   │   ├── PaymentRequest.java
│   │       │   │   └── PaymentResponse.java
│   │       │   └── security/                           ← JWT & Spring Security
│   │       │       ├── JwtUtil.java
│   │       │       └── SecurityConfig.java
│   │       └── resources/
│   │           ├── application.properties             ← Configuration
│   │           └── static/                            ← Served frontend files
│   │               ├── login.html
│   │               ├── register.html
│   │               ├── customer-dashboard.html
│   │               ├── provider-dashboard.html
│   │               ├── admin-dashboard.html
│   │               ├── servicemate-complete.html
│   │               ├── api.js
│   │               └── api-usage-guide.js
│   └── target/                        ← Maven build output (created after build)
│
└── 📁 database/                       ← DATA PERSISTENCE LAYER
    ├── 📄 README.md                   ← Database documentation & schema details
    ├── 📄 servicemate_schema.sql      ← MySQL initialization script
    └── 📁 backups/                    ← Database backup directory (optional)
```

---

## 📊 File Count Summary

| Folder | Type | Count | Details |
|--------|------|-------|---------|
| **frontend/** | UI Files | 8 | 6 HTML pages + 2 JS utilities |
| **backend/** | Java Source | 24 | 7 models + 4 repos + 5 DTOs + 4 services + 4 controllers + 2 security |
| **backend/** | Configuration | 2 | pom.xml + application.properties |
| **backend/** | Static Assets | 8 | Frontend files copied to static/ |
| **database/** | SQL Scripts | 1 | Complete MySQL schema |
| **Root** | Documentation | 2 | README.md + INDEX.md |
| **TOTAL** | | **45** | Complete production-ready project |

---

## 🔄 Folder Dependencies

```
┌─────────────────────────────────────────┐
│  FRONTEND (Static HTML/CSS/JS)          │
│  - Served by Spring Boot on :8080       │
│  - Calls REST APIs                      │
└────────────────┬────────────────────────┘
                 │ HTTP Requests
                 ↓
┌─────────────────────────────────────────┐
│  BACKEND (Spring Boot REST API)         │
│  - Receives HTTP requests               │
│  - Processes business logic             │
│  - Queries database                     │
└────────────────┬────────────────────────┘
                 │ JDBC/JPA
                 ↓
┌─────────────────────────────────────────┐
│  DATABASE (MySQL)                       │
│  - Stores user data                     │
│  - Stores service & booking data        │
│  - Stores payment records               │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Navigation

### 👤 I want to...

| Goal | Start With | Then Go To |
|------|-----------|-----------|
| Understand the project | [README.md](README.md) | Any subfolder README |
| Work on frontend | [frontend/README.md](frontend/README.md) | frontend/*.html files |
| Build the backend | [backend/README.md](backend/README.md) | backend/pom.xml |
| Set up database | [database/README.md](database/README.md) | database/servicemate_schema.sql |
| Test the API | [backend/README.md](backend/README.md) | Use Postman or curl |
| Deploy to production | [backend/README.md](backend/README.md) | Docker setup |
| See API examples | [frontend/api-usage-guide.js](frontend/api-usage-guide.js) | Copy code samples |

---

## 📋 Layer-by-Layer Breakdown

### Frontend Layer (`/frontend`)
**Responsibility**: User Interface & Client-side Logic
- Display information to users
- Collect user input
- Validate input before sending
- Manage user sessions
- Toast notifications & error handling

**Technology**: HTML5, CSS3, Vanilla JavaScript
**Files**: 8 (6 HTML pages + 2 utility JS files)

### Backend Layer (`/backend`)
**Responsibility**: Business Logic & API Endpoints
- User authentication & authorization
- Service management (CRUD)
- Booking workflow
- Payment processing
- Data validation
- Error handling

**Technology**: Java 17, Spring Boot 3.2.2, Spring Security
**Files**: 24 Java source files + Configuration

### Database Layer (`/database`)
**Responsibility**: Data Persistence
- Store user accounts
- Store service offerings
- Track bookings
- Record payments
- Maintain data relationships

**Technology**: MySQL 8.0, InnoDB
**Files**: 1 SQL schema file (self-contained)

---

## 🔧 Component Mapping

### Authentication Flow
```
frontend/login.html
    ↓ (POST /api/auth/login)
backend/controller/AuthController.java
    ↓ (calls)
backend/service/AuthService.java
    ↓ (queries)
backend/repository/UserRepository.java
    ↓ (access)
database/servicemate_schema.sql (users table)
```

### Booking Flow
```
frontend/customer-dashboard.html
    ↓ (POST /api/bookings/create)
backend/controller/BookingController.java
    ↓ (calls)
backend/service/BookingService.java
    ↓ (uses)
backend/model/Booking.java
backend/dto/BookingRequest.java
    ↓ (queries via)
backend/repository/BookingRepository.java
    ↓ (access)
database/servicemate_schema.sql (bookings table)
```

---

## 📦 Technology Stack Organization

| Component | Technology | Location | Purpose |
|-----------|-----------|----------|---------|
| **Web Server** | Spring Boot Tomcat | backend/ | Serve frontend & API |
| **REST API** | Spring Web MVC | backend/controller/ | HTTP endpoints |
| **Authentication** | JWT + Spring Security | backend/security/ | User authentication |
| **Business Logic** | Spring Services | backend/service/ | Business rules |
| **Data Access** | Spring Data JPA | backend/repository/ | Database queries |
| **ORM** | Hibernate | backend/model/ | Object-relational mapping |
| **Database** | MySQL 8.0 | database/ | Data storage |
| **Frontend** | Vanilla JavaScript | frontend/ | User interface |
| **Build Tool** | Maven | backend/pom.xml | Dependency management |

---

## 🎓 Learning Path

### For Beginners
1. Read [README.md](README.md) - Project overview
2. Read [frontend/README.md](frontend/README.md) - Understand UI
3. Read [frontend/api-usage-guide.js](frontend/api-usage-guide.js) - See examples
4. Click around http://localhost:8080 - Test manually
5. Read [backend/README.md](backend/README.md) - Understand API

### For Backend Developers
1. Read [backend/README.md](backend/README.md) - API documentation
2. Check backend/pom.xml - Dependencies
3. Review backend/src/main/java/com/servicemate/model/ - Entity models
4. Review backend/src/main/java/com/servicemate/controller/ - Endpoints
5. Study backend/src/main/java/com/servicemate/service/ - Business logic

### For Frontend Developers
1. Read [frontend/README.md](frontend/README.md) - Frontend docs
2. Check frontend/api.js - API utilities
3. Check frontend/api-usage-guide.js - Examples
4. Modify frontend/*.html - Add features
5. Test against http://localhost:8080

### For Database Administrators
1. Read [database/README.md](database/README.md) - Schema documentation
2. Review database/servicemate_schema.sql - SQL code
3. Run setup: `mysql -u root -p < servicemate_schema.sql`
4. Check tables: `SHOW TABLES; DESCRIBE bookings;`
5. Monitor: `SELECT * FROM users;`

---

## ✅ Setup Checklist

- [ ] Extract/clone repository
- [ ] Read [README.md](README.md) completely
- [ ] Install Java 17
- [ ] Install Maven 4.0.0
- [ ] Install MySQL 8.0
- [ ] Run SQL script: `mysql -u root -p < database/servicemate_schema.sql`
- [ ] Update `backend/src/main/resources/application.properties` with MySQL credentials
- [ ] Build backend: `cd backend && mvn clean install`
- [ ] Run backend: `mvn spring-boot:run`
- [ ] Open http://localhost:8080/login.html
- [ ] Login with test credentials
- [ ] Test all features

---

## 📚 Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| [README.md](README.md) | Project overview & quick start | Everyone |
| [INDEX.md](INDEX.md) | This file - Folder structure | Developers |
| [frontend/README.md](frontend/README.md) | Frontend documentation | Frontend devs |
| [backend/README.md](backend/README.md) | Backend & API docs | Backend devs |
| [database/README.md](database/README.md) | Database schema & setup | DBAs & Backend devs |
| [frontend/api-usage-guide.js](frontend/api-usage-guide.js) | Code examples & patterns | All developers |

---

## 🔐 Important Files

### Configuration Files
- `backend/pom.xml` - Maven dependencies (DO NOT MODIFY without testing)
- `backend/src/main/resources/application.properties` - Database connection
- `frontend/api.js` - API endpoint configuration

### Database Files
- `database/servicemate_schema.sql` - Must run before first start

### Security Files
- `backend/src/main/java/com/servicemate/security/SecurityConfig.java` - CORS settings
- `backend/src/main/java/com/servicemate/security/JwtUtil.java` - JWT secret

---

## 🚀 Deployment Path

```
Development
    ↓
1. Ensure everything works locally
2. Build: mvn clean install
3. Run tests
    ↓
Staging
    ↓
1. Deploy to staging server
2. Test against test database
3. Verify all features
    ↓
Production
    ↓
1. Update JWT secret
2. Update database credentials
3. Disable auto DDL (use validate mode)
4. Enable rate limiting
5. Configure backups
6. Deploy with CI/CD
```

---

## 📞 Folder Documentation Index

```
├── README.md                  (Main documentation)
├── INDEX.md                   (This file)
├── frontend/
│   └── README.md             (UI & JavaScript guide)
├── backend/
│   └── README.md             (REST API documentation)
└── database/
    └── README.md             (Schema & SQL guide)
```

**Each folder has its own README.md with detailed information!**

---

## 🎯 Key Takeaways

1. **Three clear layers**: Frontend (UI), Backend (Logic), Database (Data)
2. **Well-organized code**: Maven structure for backend, flat structure for frontend
3. **Complete documentation**: README in each folder
4. **Production-ready**: All components configured for real use
5. **Easy to extend**: Clear patterns for adding new features
6. **Test data included**: Sample users and services pre-loaded
7. **Security integrated**: JWT authentication from day one

---

**Version**: 2.0 (Reorganized with clear folder separation)
**Status**: ✅ Ready for use
**Last Updated**: March 2, 2026
