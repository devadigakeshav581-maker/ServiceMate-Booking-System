# 🚀 ServiceMate Project - Installation & Setup Guide

## ⚠️ Prerequisites Required

Your system is missing the following required software:

- ❌ **Java 17 or higher** - NOT FOUND
- ❌ **Maven 4.0 or higher** - NOT FOUND  
- ❌ **MySQL 8.0 or higher** - NOT FOUND

## 📥 Installation Instructions

### Step 1: Install Java 17

**Option A: Oracle Java (Official)**
1. Go to: https://www.oracle.com/java/technologies/downloads/
2. Download "Java SE 17.x.x" → Windows x64 Installer
3. Run the installer, accept defaults, click "Next" until done
4. Restart your computer

**Option B: OpenJDK (Free Alternative)**
1. Go to: https://jdk.java.net/17/
2. Download "Windows / x64" → .zip file
3. Extract to: `C:\Program Files\Java\jdk-17`
4. Add to PATH (see instructions below)

**Verify Installation:**
```powershell
java -version
javac -version
```

---

### Step 2: Install Maven 4.0

1. Go to: https://maven.apache.org/download.cgi
2. Under "Files" section, download: `apache-maven-4.0.0-bin.zip`
3. Extract to: `C:\Program Files\maven\apache-maven-4.0.0`
4. Add to PATH (see instructions below)

**Verify Installation:**
```powershell
mvn -version
```

---

### Step 3: Install MySQL 8.0

1. Go to: https://dev.mysql.com/downloads/mysql/
2. Select version `8.0.x` → Download "Windows (x86, 64-bit), MSI Installer"
3. Run installer
4. Choose "Server Machine" configuration
5. Keep port as `3306` (default)
6. Set root password (e.g., `root` for development)
7. Complete installation

**Verify Installation:**
```powershell
mysql --version
```

---

### Step 4: Add to System PATH

**For Java:**
1. Right-click "This PC" → "Properties"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find or create `JAVA_HOME`:
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Java\jdk-17` (adjust path if different)
5. In "Path" variable, add: `%JAVA_HOME%\bin`
6. Click OK and restart PowerShell

**For Maven:**
1. Same process as above
2. Create variable:
   - Variable name: `MAVEN_HOME`
   - Variable value: `C:\Program Files\maven\apache-maven-4.0.0`
3. In "Path" variable, add: `%MAVEN_HOME%\bin`
4. Restart PowerShell

**For MySQL:**
1. **Find the Path**: Locate your MySQL bin folder (usually `C:\Program Files\MySQL\MySQL Server 8.0\bin`). Copy this path.
2. **Open Settings**: Press Windows Key, type "env", and select "Edit the system environment variables".
3. **Edit Path**: Click "Environment Variables", find "Path" in "System variables" (bottom box), and click "Edit".
4. **Add New**: Click "New", paste the path you copied, and click OK on all windows.
5. **Restart**: Close and reopen your terminal for changes to take effect.

---

## ✅ Verify All Installations

Open **new PowerShell window** and run:

```powershell
java -version
javac -version
mvn -version
mysql --version
```

**All should show version numbers without errors.**

---

## 🎯 After Installation: Run the Project

Once all three tools are installed, run these commands:

### Step 1: Start MySQL Service
```powershell
# IMPORTANT: Run this command in a PowerShell window as Administrator
net start MySQL80
# NOTE: Your service name might be different (e.g., mysql96, MySQL).
# You can find the correct name in the Windows 'Services' app.
# The command should return: "The <YourServiceName> service is starting.
#                          The <YourServiceName> service was started successfully."
```

### Step 2: Initialize Database
```powershell
cd database
mysql -u root -p < servicemate_schema.sql
# When prompted, enter your MySQL root password
```

### Step 3: Configure Backend
Edit `c:\Users\kesha\Downloads\files\backend\src\main\resources\application.properties`

Update line:
```properties
spring.datasource.password=root
# Change 'root' to your MySQL root password if different
```

### Step 4: Build Backend
```powershell
cd c:\Users\kesha\Downloads\files\backend
mvn clean install
# Wait for "BUILD SUCCESS" (may take 3-5 minutes first time)
```

### Step 5: Run Backend
```powershell
# Stay in backend folder
mvn spring-boot:run
# Wait for "Tomcat started on port(s): 8080"
```

### Step 6: Open in Browser
Open new PowerShell:
```powershell
start http://localhost:8080/login.html
```

Or manually go to: **http://localhost:8080/login.html**

---

## 🔑 Test Login Credentials

| Email | Password | Role |
|-------|----------|------|
| customer@servicemate.com | 123456 | Customer |
| provider@servicemate.com | 123456 | Provider |
| admin@servicemate.com | 123456 | Admin |

---

## 💡 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "java is not recognized" | Java not installed or PATH not set. Restart PowerShell after setting PATH. |
| "mvn is not recognized" | Maven not installed or PATH not set. Verify MAVEN_HOME is in PATH. |
| "mysql is not recognized" | MySQL not installed. Run MySQL installer again. |
| "Connection refused" | MySQL service not running. Run `net start MySQL80` |
| "Access denied for user 'root'" | Wrong MySQL password. Update application.properties |
| "Port 8080 in use" | Change port in application.properties: `server.port=8081` |

---

## 📚 Documentation

After installation, see:
- [README.md](../README.md) - Project overview
- [INDEX.md](../INDEX.md) - Folder structure
- [backend/README.md](../backend/README.md) - API documentation
- [frontend/README.md](../frontend/README.md) - UI documentation
- [database/README.md](../database/README.md) - Database schema

---

## ⏱️ Estimated Time

- Java installation: 5-10 minutes
- Maven installation: 5 minutes
- MySQL installation: 10-15 minutes
- Project first run: 5-10 minutes (downloading dependencies)
- Subsequent runs: 30 seconds

**Total: ~30-40 minutes**

---

Once installation is complete, reply and I'll help you run the project! 👍
