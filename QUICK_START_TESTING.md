# ServiceMate - Quick Start Guide

## 🚀 Start the Application

### Option 1: Maven (Recommended for Development)

```bash
# Navigate to backend directory
cd backend

# Start Spring Boot application
mvn spring-boot:run
```

Backend will start on: **http://localhost:8080**

### Option 2: Docker Compose

```bash
# From project root
docker-compose up --build
```

This starts:
- MySQL Database (port 3307)
- Spring Boot Backend (port 8080)
- React Frontend (port 80)

## 🌐 Access Dashboards

After starting the application, access the dashboards via:

### Admin Dashboard
```
http://localhost:8080/admin-dashboard.html
Login: admin@servicemate.com / password: admin123
```

### Customer Dashboard
```
http://localhost:8080/customer-dashboard.html
Demo Login: keshav@gmail.com / password: 123456
```

### Provider Dashboard
```
http://localhost:8080/provider-dashboard.html
Demo Login: ravi@gmail.com / password: 123456
```

## 📋 Test Scenarios

### 1. Admin Dashboard Testing

**User Management:**
1. Login as admin
2. View all users in the table
3. Click role tabs to filter (All/Customers/Providers/Admins)
4. Use search bar to find specific users
5. Click "Suspend" to deactivate a user
6. Click "Activate" to reactivate a suspended user
7. Click "Change Role" → Enter new role (CUSTOMER/PROVIDER/ADMIN)

**Dashboard Stats:**
- Total Users count updates automatically
- Total Bookings shows real count from database
- Total Revenue calculated from completed bookings
- Pending Issues shows pending bookings count

**Real-time Activity:**
- Watch activity feed for live booking updates
- New bookings appear instantly when customers book services

### 2. Customer Dashboard Testing

**Browse Services:**
1. Login as customer
2. View available services grid
3. Type in search box to filter services
4. Click any service card to open booking modal

**Create Booking:**
1. Click "+ Book Service" or service card
2. Fill in address
3. Add optional notes
4. Select payment method
5. Click "Confirm & Pay"
6. See success toast notification
7. Check "Recent Bookings" section for new booking

**Real-time Updates:**
- When provider confirms/completes booking, status updates automatically
- Live toast notifications for booking status changes

### 3. Provider Dashboard Testing

**View Bookings:**
1. Login as provider
2. See all bookings for your services
3. Filter by status using dropdown

**Update Booking Status:**
1. Click "Confirm" on pending booking
   - Status pill changes to "Confirmed" (blue)
   - Button changes to "Complete"
   - Success toast appears
2. Click "Complete" on confirmed booking
   - Status pill changes to "Completed" (green)
   - Button changes to "Done"
   - Success toast appears

**Earnings Display:**
- Today's earnings from completed bookings
- This week/month totals
- All-time earnings

## 🔧 Troubleshooting

### Issue: "Cannot connect to backend"
**Solution:** Ensure Spring Boot is running on port 8080
```bash
# Check if port 8080 is in use
netstat -ano | findstr :8080
```

### Issue: "Login fails with 401"
**Solution:** 
1. Verify email and password are correct
2. Check if user account is active (not suspended)
3. Ensure user email is verified

### Issue: "No services showing"
**Solution:** Create sample services in database:
```sql
INSERT INTO service_item (name, description, price, provider_id) VALUES
('Plumbing', 'Basic plumbing services', 299, 2),
('Electrical', 'Electrical repair and installation', 349, 2),
('Cleaning', 'Home cleaning service', 499, 2);
```

### Issue: "WebSocket not connecting"
**Solution:** 
1. Check browser console for errors
2. Ensure socket.io server is running on backend
3. Verify WebSocketConfig.java is properly configured

## 🎯 Feature Checklist

### ✅ Working Features

**Authentication:**
- [x] User login with JWT tokens
- [x] Role-based dashboard redirect
- [x] Token auto-included in API requests
- [x] Auto-logout on token expiry

**Admin Dashboard:**
- [x] View all users
- [x] Filter users by role
- [x] Search users by name/email
- [x] Suspend/Activate users
- [x] Change user roles
- [x] Real-time statistics
- [x] Live activity feed

**Customer Dashboard:**
- [x] Browse available services
- [x] Search/filter services
- [x] Create new bookings
- [x] View booking history
- [x] Real-time booking status updates
- [x] Toast notifications

**Provider Dashboard:**
- [x] View incoming bookings
- [x] Confirm pending bookings
- [x] Complete confirmed bookings
- [x] Earnings tracking
- [x] Real-time updates
- [x] Service management ready

## 📊 Sample Data

The database schema includes these demo users:

| Email | Password | Role | Status |
|-------|----------|------|--------|
| admin@servicemate.com | admin123 | ADMIN | Active |
| keshav@gmail.com | 123456 | CUSTOMER | Active |
| priya@gmail.com | 123456 | CUSTOMER | Active |
| ravi@gmail.com | 123456 | PROVIDER | Active |
| suresh@gmail.com | 123456 | PROVIDER | Active |

## 🎨 UI Components Tested

- Sidebar navigation ✅
- Stats cards with animations ✅
- User tables with filtering ✅
- Action buttons (Suspend/Activate/Confirm/Complete) ✅
- Search bars ✅
- Tab filters ✅
- Modal dialogs ✅
- Toast notifications ✅
- Real-time activity feeds ✅
- Status pills/badges ✅
- Form inputs with validation ✅

## 🔄 Real-time Events

These events trigger automatic UI updates:

1. **BOOKING_CREATED** - Customer creates new booking
2. **BOOKING_CONFIRMED** - Provider confirms booking
3. **BOOKING_COMPLETED** - Provider completes booking
4. **BOOKING_CANCELLED** - Customer cancels booking
5. **PAYMENT_RECEIVED** - Payment processed successfully

All dashboards listen to these events and update accordingly.

## 💡 Pro Tips

1. **Use quick-login buttons** on login page for faster testing
2. **Open multiple browsers** to see real-time updates in action
3. **Check browser console** for detailed error messages
4. **Use browser DevTools Network tab** to monitor API calls
5. **Test on different screen sizes** - dashboards are responsive

## 📞 Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check backend logs for API errors
3. Verify database connection
4. Ensure all environment variables are set
5. Check CORS settings if accessing from different domain

---

**Happy Testing! 🎉**
