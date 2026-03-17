# ⚙️ Setup Checklist - ServiceMate Project

## ❌ Current Status: Prerequisites Missing

**Required Software NOT FOUND:**
- [ ] Java 17+
- [ ] Maven 4.0+  
- [ ] MySQL 8.0+

---

## 📋 Installation Checklist

### Java 17 Installation
- [ ] Downloaded Java 17 installer from oracle.com
- [ ] Ran installer (accept all defaults)
- [ ] Restarted computer
- [ ] Added `JAVA_HOME` environment variable (set to Java installation path)
- [ ] Added `%JAVA_HOME%\bin` to PATH
- [ ] Verified with command: `java -version` (shows version 17.x.x)
- [ ] Verified with command: `javac -version` (shows version 17.x.x)

### Maven 4.0 Installation
- [ ] Downloaded apache-maven-4.0.0-bin.zip
- [ ] Extracted to `C:\Program Files\maven\apache-maven-4.0.0`
- [ ] Added `MAVEN_HOME` environment variable
- [ ] Added `%MAVEN_HOME%\bin` to PATH
- [ ] Verified with command: `mvn -version` (shows Maven 4.0.0+)

### MySQL 8.0 Installation
- [ ] Downloaded MySQL installer from dev.mysql.com
- [ ] Ran MySQL MSI installer
- [ ] Set root password (write it down!)
- [ ] Completed installation
- [ ] Verified MySQL service started: `net start MySQL80`
- [ ] Verified with command: `mysql --version` (shows MySQL 8.0.x)

### After Installation: Restart
- [ ] Closed all PowerShell windows
- [ ] Opened NEW PowerShell window
- [ ] Verified all three tools with version commands

---

## 🚀 Project Setup Checklist

### Database Setup
- [ ] Navigated to: `c:\Users\kesha\Downloads\files\database`
- [ ] Ran command: `mysql -u root -p < servicemate_schema.sql`
- [ ] Entered MySQL root password when prompted
- [ ] Database initialized successfully (no errors)

### Backend Configuration
- [ ] Opened file: `backend/src/main/resources/application.properties`
- [ ] Found line: `spring.datasource.password=root`
- [ ] Updated password to match MySQL root password
- [ ] Saved file

### Build Backend
- [ ] Navigated to: `c:\Users\kesha\Downloads\files\backend`
- [ ] Ran command: `mvn clean install`
- [ ] Waited for download of dependencies (3-5 minutes)
- [ ] Build completed with "BUILD SUCCESS"

### Run Backend
- [ ] From backend folder, ran: `mvn spring-boot:run`
- [ ] Waited for message: "Tomcat started on port(s): 8080"
- [ ] Backend running successfully

### Test in Browser
- [ ] Opened browser to: `http://localhost:8080/login.html`
- [ ] Login page loaded successfully
- [ ] Logged in with credentials (customer@servicemate.com / password)
- [ ] Dashboard loaded without errors

---

## ✅ Final Status

Once you complete all checkboxes, your ServiceMate project will be:
- ✅ Installed
- ✅ Configured
- ✅ Built
- ✅ Running
- ✅ Ready to use!

---

## 📞 Need Help?

1. See [INSTALLATION_REQUIRED.md](INSTALLATION_REQUIRED.md) for detailed steps
2. See [README.md](README.md) for project overview
3. Check specific folder READMEs for component details

---

**Download & Install Required Software** → Complete checklist above → Ready to go! 🎉
