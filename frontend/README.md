# Frontend - ServiceMate User Interface

Static HTML5, CSS3, and vanilla JavaScript files providing the complete user interface for the ServiceMate service booking platform.

## 📁 Files Overview

### Authentication Pages

#### `login.html`
- User login interface
- Email and password input fields
- JWT token storage in localStorage
- Session management
- Redirect to appropriate dashboard based on role

#### `register.html`
- New user registration form
- Fields: Name, Email, Password, Phone, Role selection
- Input validation
- Password strength indicators (optional)
- Links to login page

### Dashboard Pages

#### `customer-dashboard.html`
**For Users with CUSTOMER role**
- Browse available services
- Create new bookings
- View booking history
- Track booking status (Pending, Confirmed, Completed, Cancelled)
- Cancel bookings
- Payment tracking

#### `provider-dashboard.html`
**For Users with PROVIDER role**
- Manage service listings
- View all bookings for your services
- Confirm or complete bookings
- Service availability toggle
- Earnings/revenue dashboard
- Provider profile management

#### `admin-dashboard.html`
**For Users with ADMIN role**
- View all users
- View all services
- Manage all bookings
- View payment records
- System statistics
- User management (approve/reject providers)

### Service Pages

#### `servicemate-complete.html`
- Service details and listing page
- Service search and filtering
- Service categories
- Provider information
- Booking interface
- Reviews and ratings (if available)

### Utilities & Documentation

#### `api.js`
**Frontend API Client Library**
- REST API helper functions for all endpoints
- Authentication token management
- Request/response handling
- Error management
- DOM manipulation utilities
- Local storage management

**Key Functions:**
```javascript
// Authentication
AuthAPI.register(userData) → Promise
AuthAPI.login(email, password) → Promise<token>

// Services
ServiceAPI.getAll() → Promise<services>
ServiceAPI.getById(id) → Promise<service>
ServiceAPI.getByProvider(providerId) → Promise<services>

// Bookings
BookingAPI.create(bookingData) → Promise<booking>
BookingAPI.getById(id) → Promise<booking>
BookingAPI.getByCustomer(customerId) → Promise<bookings>
BookingAPI.confirm(id) → Promise<booking>
BookingAPI.complete(id) → Promise<booking>
BookingAPI.cancel(id) → Promise<booking>

// Payments
PaymentAPI.pay(paymentData) → Promise<response>
PaymentAPI.getStatus(bookingId) → Promise<status>

// Utilities
TokenManager.save(token) → void
TokenManager.get() → string
TokenManager.remove() → void
TokenManager.isValid() → boolean
TokenManager.decode() → object
```

**Usage Example:**
```javascript
// Login user
const token = await AuthAPI.login('user@example.com', 'password123');
TokenManager.save(token);
window.location.href = '/customer-dashboard.html';

// Get all services
const services = await ServiceAPI.getAll();
console.log(services);

// Create booking
const booking = await BookingAPI.create({
  customerId: 1,
  serviceId: 5,
  address: '123 Main St',
  notes: 'Please come on Saturday'
});
```

#### `api-usage-guide.js`
- Complete API documentation with examples
- Code samples for all scenarios
- Error handling patterns
- Best practices
- Integration guidelines
- Feature roadmap

---

## 🎨 Design & Features

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly buttons and forms
- Flexible grid layouts

### User Experience
- Intuitive navigation
- Clear call-to-action buttons
- Real-time status updates
- Form validation feedback
- Error messages
- Loading indicators
- Success notifications

### Security Features
- JWT token storage
- Secure localStorage management
- CSRF token handling (if needed)
- Input sanitization
- Password field masking

---

## 🚀 How to Use

### 1. Open in Browser
- Direct file access: `file:///path/to/frontend/login.html`
- Or via Spring Boot server: `http://localhost:8080/login.html`

**Recommended**: Use via Spring Boot server since frontend files are copied to `backend/src/main/resources/static/`

### 2. Backend Required
The frontend requires a running backend server at `http://localhost:8080`

Starting the backend:
```bash
cd backend
mvn spring-boot:run
```

### 3. Login/Register
1. Navigate to `http://localhost:8080/login.html`
2. Click "Register" to create new account
3. Fill registration form with:
   - Name: Your full name
   - Email: Unique email address
   - Password: Minimum 8 characters
   - Phone: Contact number
   - Role: Select CUSTOMER or PROVIDER
4. Click "Register"
5. Login with credentials
6. Access your role-specific dashboard

### 4. Use Dashboard
- **Customer**: Browse services → Create booking → Track payment
- **Provider**: Manage services → Confirm bookings → View earnings
- **Admin**: Monitor system → Manage users → View analytics

---

## 🔗 API Integration

All frontend pages connect to backend via `api.js`:

### API Base URL
```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

### Authentication
```javascript
// Get JWT token from login
POST /api/auth/login
Response: "eyJhbGciOiJIUzUxMiJ9..."

// Store in localStorage
localStorage.setItem('token', tokenString);

// Send with requests
Authorization: Bearer {token}
```

### Error Handling
```javascript
try {
  const result = await ServiceAPI.getAll();
  console.log('Services:', result);
} catch (error) {
  console.error('Error:', error.message);
  // Show error in UI
}
```

---

## 📋 Page Workflow

### Registration flow
```
login.html
    ↓
click "Register" → register.html
    ↓
fill form → submit to /api/auth/register
    ↓
success → navigate to login.html
    ↓
login with credentials
```

### Customer flow
```
login.html
    ↓
login with customer credentials
    ↓
redirect to customer-dashboard.html
    ↓
browse services from /api/services
    ↓
create booking via /api/bookings/create
    ↓
pay via /api/payments/pay
    ↓
track booking status from /api/bookings/{id}
```

### Provider flow
```
login.html
    ↓
login with provider credentials
    ↓
redirect to provider-dashboard.html
    ↓
view my services from /api/services/provider/{id}
    ↓
view my bookings from /api/bookings/service/{id}
    ↓
confirm/complete bookings
    ↓
download earnings report
```

---

## 🧪 Testing Frontend

### Manual Testing Steps

1. **Test Registration**
   - Navigate to register page
   - Fill all fields
   - Submit with new email
   - Verify success message

2. **Test Login**
   - Use registered email and password
   - Verify JWT token is stored
   - Verify redirect to dashboard

3. **Test Customer Dashboard**
   - View all services (GET /api/services)
   - Filter by category
   - Create new booking
   - Track booking status
   - Cancel booking

4. **Test Payment**
   - Proceed to payment
   - Verify 90% success rate
   - Check payment status
   - View transaction reference

### Browser DevTools Testing

**Console (F12)**
```javascript
// Check stored token
localStorage.getItem('token')

// Test API call
fetch('http://localhost:8080/api/services')
  .then(r => r.json())
  .then(d => console.log(d))

// Check user role
TokenManager.decode()
```

**Network Tab**
- Monitor all HTTP requests
- Check request/response headers
- Verify Authorization header is sent
- Monitor CORS headers

**Application Tab**
- Check localStorage for token
- Verify sessionStorage if used
- Check cookies (if any)

---

## 🛠️ Customization

### Modify Styling
Edit CSS directly in HTML `<style>` tags or create separate CSS file:
```html
<link rel="stylesheet" href="styles.css">
```

### Add New Features
1. Add HTML elements
2. Create handler functions in `<script>` tags
3. Call API methods from `api.js`
4. Update error handling

### Integrate Payment Gateway
In `api.js`, modify `PaymentAPI.pay()`:
```javascript
// Replace mock payment with Stripe/PayPal
const stripe = await loadStripe('pk_test_...');
const session = await fetch('/api/payment-session', { ... });
```

---

## 📱 Features Checklist

### Authentication
- ✅ User registration form
- ✅ User login form
- ✅ JWT token storage
- ✅ Session management
- ✅ Role-based routing

### Customer Features
- ✅ Service browsing
- ✅ Service filtering
- ✅ Booking creation
- ✅ Booking history
- ✅ Booking cancellation
- ✅ Payment processing
- ✅ Status tracking

### Provider Features
- ✅ Service management
- ✅ Service listing
- ✅ Booking confirmation
- ✅ Booking completion
- ✅ Earnings dashboard
- ✅ Profile management

### Admin Features
- ✅ User management
- ✅ System dashboard
- ✅ Analytics view
- ✅ Payment tracking
- ✅ Service management

---

## 🐛 Troubleshooting

### "Cannot GET /login.html"
- Ensure backend is running: `mvn spring-boot:run`
- Check frontend files are in `backend/src/main/resources/static/`
- Verify browser URL: `http://localhost:8080/login.html`

### "404 when calling API"
- Backend not running
- Check API endpoint URL in `api.js`
- Verify backend logs for errors
- Check CORS configuration

### "Login fails - Invalid credentials"
- Verify account is registered
- Check email spelling
- Ensure password is correct
- Try registering new account

### "Token invalid or expired"
- Clear localStorage: `localStorage.clear()`
- Re-login to get new token
- Check JWT expiration in backend config (24 hours default)

### "CORS error in console"
- Backend must have CORS enabled
- Check `SecurityConfig.java` in backend
- Verify `@CrossOrigin` annotations on controllers

---

## 📚 File Structure

```
frontend/
├── login.html                   (← Start here for testing)
├── register.html
├── customer-dashboard.html
├── provider-dashboard.html
├── admin-dashboard.html
├── servicemate-complete.html
├── api.js                       (← Core utilities)
└── api-usage-guide.js          (← Documentation with examples)
```

---

## 🚀 Production Deployment

For production:
1. Minify HTML, CSS, JavaScript
2. Enable gzip compression
3. Set Cache-Control headers
4. Use CDN for static assets
5. Implement service worker for offline mode
6. Update API_BASE_URL to production server
7. Use HTTPS for all requests
8. Implement analytics/monitoring

---

## 🔗 Related Documentation

- See [../backend/README.md](../backend/README.md) for API documentation
- See [../database/README.md](../database/README.md) for database schema
- See [../README.md](../README.md) for full project overview

---

**Last Updated**: March 2, 2026
**Status**: ✅ Ready to Use
