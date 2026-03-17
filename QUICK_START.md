# 🚀 ServiceMate - Quick Start Scripts

Two batch scripts to make setup and running easy:

## 📋 Step 1: Run Setup Script

**First time only!**

1. Right-click on `setup.bat`
2. Select "Run as Administrator"
3. Follow the on-screen instructions
4. Install any missing software (Java, Maven, MySQL)
5. Close and reopen Command Prompt
6. Run setup.bat again to verify all installed

```
setup.bat
├─ Checks for Java 17
├─ Checks for Maven 4.0
├─ Checks for MySQL 8.0
└─ Provides download links if missing
```

---

## 🎯 Step 2: Run Project Script

**Every time you want to run the project:**

1. Run `run-project.bat`
2. Enter your MySQL root password when prompted
3. Wait for "Tomcat started on port(s): 8080"
4. Open browser to: **http://localhost:8080/login.html**

```
run-project.bat
├─ Start MySQL Service
├─ Initialize Database
├─ Configure Backend
├─ Build with Maven
└─ Run Spring Boot Application
```

---

## 🔑 Login Credentials

| Email | Password | Role |
|-------|----------|------|
| customer@servicemate.com | 123456 | Customer |
| provider@servicemate.com | 123456 | Provider |
| admin@servicemate.com | 123456 | Admin |

---

## ⏱️ Timing

- **First Run**: 10-15 minutes
  - 5 min: Maven downloading dependencies
  - 5-10 min: Compiling code
  
- **Subsequent Runs**: 30 seconds
  - Just starting the already-built application

---

## 🐛 Troubleshooting

### "Java command not found"
- Java not installed or PATH not set
- Solution: Download from https://www.oracle.com/java/technologies/downloads/
- After install, restart Command Prompt

### "Maven command not found"
- Maven not installed
- Solution: Download from https://maven.apache.org/download.cgi
- Extract to C:\maven and add to PATH

### "MySQL command not found"
- MySQL not installed
- Solution: Download from https://dev.mysql.com/downloads/mysql/
- Run installer and accept defaults

### "Access denied for MySQL"
- Wrong password entered
- Default password is usually: `root`
- If forgotten, reinstall MySQL

### "Port 8080 already in use"
- Another application using port 8080
- Edit: backend/src/main/resources/application.properties
- Change: `server.port=8081`

---

## 📚 More Information

- [README.md](README.md) - Project overview
- [INDEX.md](INDEX.md) - Complete folder structure
- [backend/README.md](backend/README.md) - API documentation
- [frontend/README.md](frontend/README.md) - UI documentation
- [database/README.md](database/README.md) - Database schema

---

**That's it! Just run setup.bat then run-project.bat** 🎉
