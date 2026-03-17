/* =============================================================
   ServiceMate – Frontend API Integration & Project Overview
   ---------------------------------------------------------
   This repository contains the static frontend for ServiceMate,
   a service‑booking platform where customers request services,
   providers manage bookings, and administrators oversee the entire
   system.

   The pages depend on a REST API running at http://localhost:8080
   (implementation not included here).  Typical endpoints include
   /api/auth, /api/bookings, /api/services, /api/payments, etc.

   The overall system is modular; supported backend modules include:
     • Actors & Roles foundation (CUSTOMER/PROVIDER/ADMIN roles)
     • Authentication & user management with JWT
     • Core business entities: Services, Bookings, Payments
     • Booking & Purchase workflow per role (create, confirm, pay,
       cancel, complete)
     • Search/Filter/Discovery for services and bookings
     • Payment processing (mocked on frontend; backend can integrate
       real gateways)
     • Notifications & real‑time status updates via WebSocket
     • Reporting & analytics exposed through dashboard endpoints

   To make ServiceMate a **major, real‑time application** you can
   extend the backend with WebSocket or Server‑Sent Events support
   and use the `Socket` helper in api.js to push live updates
   (new bookings, status changes, payment notifications, chat,
   etc.) to connected clients.

   Below you'll find usage examples, recommended enhancements, and
   guidance on turning the prototype into a production‑ready project.
   ============================================================= */


// ─────────────────────────────────────────────────────────────
//  STEP 1: Add this to EVERY HTML page (inside <head>)
// ─────────────────────────────────────────────────────────────

/*
<script src="api.js"></script>
*/


// ─────────────────────────────────────────────────────────────
//  REAL-TIME EXAMPLE (optional)
// ─────────────────────────────────────────────────────────────
// The Socket helper in api.js uses socket.io.  Include the client
// library on every page before api.js, for example:
//
//   <script src="http://localhost:8080/socket.io/socket.io.js"></script>
//   <script src="api.js"></script>
//
// Example initialization:
//
//   document.addEventListener('DOMContentLoaded', () => {
//     Socket.connect();            // connects to backend (default `/`)
//     Socket.onMessage(msg => {
//       if (msg.type === 'BOOKING_UPDATED') {
//         UI.toast(`Booking #${msg.id} ${msg.status}`, 'info');
//         loadCustomerBookings(getUserId());
//       }
//     });
//   });
//
// On the server side, emit events via socket.io.  Common types:
//   - BOOKING_CREATED
//   - BOOKING_CONFIRMED
//   - PAYMENT_RECEIVED
//   - CHAT_MESSAGE
//
// Using sockets transforms the dashboard into a *real‑time* UI
// with no manual refreshes.

// ─────────────────────────────────────────────────────────────
//  LOGIN PAGE  (login.html)
// ─────────────────────────────────────────────────────────────

async function handleLogin() {
  const btn = document.getElementById('loginBtn');
  UI.setLoading(btn, true);

  try {
    const token = await AuthAPI.login({
      email:    document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      role:     selectedRole   // 'CUSTOMER' | 'PROVIDER' | 'ADMIN'
    });

    UI.toast('Login successful! Redirecting...', 'success');
    setTimeout(() => UI.redirectByRole(selectedRole), 800);

  } catch (err) {
    UI.toast('Invalid email or password.', 'error');
    UI.setLoading(btn, false);
  }
}


// ─────────────────────────────────────────────────────────────
//  REGISTER PAGE  (register.html)
// ─────────────────────────────────────────────────────────────

async function handleRegister() {
  const btn = document.getElementById('submitBtn');
  UI.setLoading(btn, true);

  try {
    await AuthAPI.register({
      name:     document.getElementById('firstName').value + ' ' +
                document.getElementById('lastName').value,
      email:    document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      role:     selectedRole
    });

    // Show success screen
    document.getElementById('step3').style.display = 'none';
    document.getElementById('successScreen').classList.add('show');

  } catch (err) {
    UI.toast('Registration failed. Email may already exist.', 'error');
    UI.setLoading(btn, false);
  }
}


// ─────────────────────────────────────────────────────────────
//  CUSTOMER DASHBOARD  (customer-dashboard.html)
// ─────────────────────────────────────────────────────────────

// On page load — protect route & load bookings
document.addEventListener('DOMContentLoaded', async () => {
  UI.requireAuth();   // Redirects to login.html if not logged in

  const customerId = getUserId();   // Get from localStorage
  await loadCustomerBookings(customerId);
});

// Load and render bookings
async function loadCustomerBookings(customerId) {
  try {
    const bookings = await BookingAPI.getByCustomer(customerId);
    const container = document.getElementById('bookingList');
    container.innerHTML = '';

    bookings.forEach(b => {
      container.innerHTML += `
        <div class="booking-item">
          <div class="booking-details">
            <div class="booking-name">Booking #${b.id}</div>
            <div class="booking-date">${UI.formatDate(b.bookingDate)} · ${b.address}</div>
          </div>
          ${UI.statusBadge(b.status)}
          ${b.status === 'CONFIRMED'
            ? `<button onclick="payNow(${b.id})">Pay Now</button>`
            : ''}
          ${b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
            ? `<button onclick="cancelBooking(${b.id})">Cancel</button>`
            : ''}
        </div>`;
    });

  } catch (err) {
    UI.toast('Failed to load bookings.', 'error');
  }
}

// Create a new booking
async function createBooking() {
  const btn = document.getElementById('bookBtn');
  UI.setLoading(btn, true);

  try {
    const booking = await BookingAPI.create({
      customerId: getUserId(),
      serviceId:  document.getElementById('serviceSelect').value,
      address:    document.getElementById('address').value,
      notes:      document.getElementById('notes').value
    });

    UI.toast('Booking created! Awaiting confirmation.', 'success');
    closeModal();
    await loadCustomerBookings(getUserId());   // Refresh list

  } catch (err) {
    UI.toast('Booking failed. Try again.', 'error');
  } finally {
    UI.setLoading(btn, false);
  }
}

// Pay for a confirmed booking
async function payNow(bookingId) {
  try {
    const result = await PaymentAPI.pay({
      bookingId:     bookingId,
      amount:        499,           // Get from booking/service
      paymentMethod: 'UPI'
    });

    if (result.status === 'SUCCESS') {
      UI.toast('Payment successful! 🎉', 'success');
    } else {
      UI.toast('Payment failed. Please retry.', 'error');
    }

  } catch (err) {
    UI.toast('Payment error.', 'error');
  }
}

// Cancel a booking
async function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel?')) return;

  try {
    await BookingAPI.cancel(bookingId);
    UI.toast('Booking cancelled.', 'warning');
    await loadCustomerBookings(getUserId());  // Refresh

  } catch (err) {
    UI.toast(err.message || 'Cannot cancel this booking.', 'error');
  }
}


// ─────────────────────────────────────────────────────────────
//  PROVIDER DASHBOARD  (provider-dashboard.html)
// ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  UI.requireAuth();

  const serviceId = 1;   // Provider's service ID (get from token/session)
  await loadProviderBookings(serviceId);
});

async function loadProviderBookings(serviceId) {
  try {
    const bookings = await BookingAPI.getByService(serviceId);
    const tbody = document.getElementById('bookingTableBody');
    tbody.innerHTML = '';

    bookings.forEach(b => {
      tbody.innerHTML += `
        <tr>
          <td>#${b.id}</td>
          <td>${b.address}</td>
          <td>${UI.formatDate(b.bookingDate)}</td>
          <td>${UI.statusBadge(b.status)}</td>
          <td>
            ${b.status === 'PENDING'
              ? `<button onclick="confirmBooking(${b.id})">Confirm</button>`
              : ''}
            ${b.status === 'CONFIRMED'
              ? `<button onclick="completeBooking(${b.id})">Complete</button>`
              : ''}
          </td>
        </tr>`;
    });

  } catch (err) {
    UI.toast('Failed to load bookings.', 'error');
  }
}

async function confirmBooking(bookingId) {
  try {
    await BookingAPI.confirm(bookingId);
    UI.toast('Booking confirmed! ✅', 'success');
    await loadProviderBookings(1);  // Refresh

  } catch (err) {
    UI.toast('Failed to confirm booking.', 'error');
  }
}

async function completeBooking(bookingId) {
  try {
    await BookingAPI.complete(bookingId);
    UI.toast('Booking marked as completed! 🎉', 'success');
    await loadProviderBookings(1);  // Refresh

  } catch (err) {
    UI.toast('Failed to complete booking.', 'error');
  }
}


// ─────────────────────────────────────────────────────────────
//  PAYMENT STATUS CHECK  (any page)
// ─────────────────────────────────────────────────────────────

async function checkPaymentStatus(bookingId) {
  try {
    const result = await PaymentAPI.getStatus(bookingId);
    UI.toast(`Payment: ${result.status} on ${UI.formatDate(result.paymentDate)}`, 'info');
    return result;

  } catch (err) {
    UI.toast('Payment info not found.', 'error');
  }
}


// ─────────────────────────────────────────────────────────────
//  LOGOUT BUTTON  (all dashboards)
// ─────────────────────────────────────────────────────────────

// Add this to your logout button:
// <button onclick="logout()">Logout</button>
//
// logout() is already defined in api.js — clears localStorage
// and redirects to login.html automatically.


// ─────────────────────────────────────────────────────────────
//  COMPLETE HTML SNIPPET — HOW TO ADD TO DASHBOARD
// ─────────────────────────────────────────────────────────────

/*

<!-- 1. Include api.js before closing </body> -->
<script src="api.js"></script>

<!-- 2. Protect the page on load -->
<script>
  document.addEventListener('DOMContentLoaded', () => {
    UI.requireAuth();
    loadCustomerBookings(getUserId());
  });
</script>

<!-- 3. Booking list container in HTML -->
<div id="bookingList">
  <!-- Bookings are injected here by loadCustomerBookings() -->
</div>

<!-- 4. Book Now button -->
<button onclick="createBooking()">Book Service</button>

<!-- 5. Logout button -->
<button onclick="logout()">Logout</button>

*/


/* =============================================================
   TAKING SERVICE MATE TO PRODUCTION
   -------------------------------------------------------------
   Below are ideas and tasks for expanding this prototype into a
   major, real‑time project.  Each of the modules listed at the top
   of this file should be fully implemented in the backend and
   integrated with the frontend:

   • **Actors & Roles (Foundation)** – enforce role-based access on
     every route; store role claims in JWT and introspect on the
     client for routing.
   • **Authentication & User Management** – add profile pages, email
     verification, forgot‑password flows, and admin user controls.
   • **Core Business** – fully implement CRUD APIs for services,
     bookings, payments, search, filters, and any ancillary entities.
   • **Booking & Purchase Workflow** – implement background jobs to
     send reminders, auto‑expire bookings, and reconcile payments.
   • **Search/Discovery** – add elasticsearch or DB full‑text search,
     support filters (by category, price, location) and sorting.
   • **Payment** – integrate with Stripe/PayPal; support refunds and
     receipts; simulate for testing.
   • **Notifications & Status Updates** – expand WebSocket events,
     consider push notifications or email/SMS gateways.
   • **Reporting & Analytics** – backend endpoints returning
     aggregated metrics; feed to dashboard charts and reports.
   • **Other concerns** – logging, monitoring, security audits,
     scalability, internationalization, accessibility.

   Frontend notes:
   - `Socket` helper can be extended for topic subscriptions
   - UI files already show placeholders for stats, charts, and
     service management
   - Add search UI and filter controls as needed
   - Use build tools (Webpack/Vite) and framework migration if
     project grows larger

   With all modules implemented, ServiceMate supports the complete
   lifecycle from user authentication through booking, payment, and
   analytic reporting.
   ============================================================= */
