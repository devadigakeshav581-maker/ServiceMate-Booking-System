// ============================================================
//  ServiceMate – API Connector
//  Place this file in: src/main/resources/static/api.js
//  Include in every HTML page: <script src="api.js"></script>
// ============================================================

const BASE_URL = 'http://localhost:8080';

// ─────────────────────────────────────────
//  TOKEN HELPERS
// ─────────────────────────────────────────

function getToken()       { return localStorage.getItem('token'); }
function getRole()        { return localStorage.getItem('role'); }
function getUserId()      { return localStorage.getItem('userId'); }
function isLoggedIn()     { return !!getToken(); }

function saveSession(token, role, userId, name) {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  localStorage.setItem('userId', userId ?? '');
  localStorage.setItem('userName', name ?? 'User');
}

function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// ─────────────────────────────────────────
//  BASE FETCH WRAPPER
// ─────────────────────────────────────────

async function apiFetch(endpoint, method = 'GET', body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (!token) { logout(); return; }
    headers['Authorization'] = 'Bearer ' + token;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(BASE_URL + endpoint, options);

    // Session expired
    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Request failed');
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return await res.text();

  } catch (err) {
    console.error('[ServiceMate API Error]', err.message);
    throw err;
  }
}

// ─────────────────────────────────────────
//  AUTH APIs
// ─────────────────────────────────────────

const AuthAPI = {

  // Register new user
  // Usage: await AuthAPI.register({ name, email, password, role })
  async register(data) {
    return apiFetch('/api/auth/register', 'POST', data, false);
  },

  // Login and save token
  // Usage: const token = await AuthAPI.login({ email, password })
  async login(data) {
    const response = await apiFetch('/api/auth/login', 'POST', data, false);
    const tokenStr = typeof response === 'object' ? response.token : response;
    const roleStr = typeof response === 'object' && response.role ? response.role : (data.role || 'CUSTOMER');
    const nameStr = typeof response === 'object' ? response.name : null;
    
    if (tokenStr) {
      saveSession(tokenStr, roleStr, response.userId || null, nameStr);
    }
    return tokenStr;
  }
};

// ─────────────────────────────────────────
//  BOOKING APIs
// ─────────────────────────────────────────

const BookingAPI = {

  // Create a new booking
  // Usage: await BookingAPI.create({ customerId, serviceId, address, notes })
  async create(data) {
    return apiFetch('/api/bookings/create', 'POST', data);
  },

  // Get all bookings for a customer
  // Usage: await BookingAPI.getByCustomer(1)
  async getByCustomer(customerId) {
    return apiFetch(`/api/bookings/customer/${customerId}`);
  },

  // Get all bookings for a service (provider view)
  // Usage: await BookingAPI.getByService(1)
  async getByService(serviceId) {
    return apiFetch(`/api/bookings/service/${serviceId}`);
  },

  // Get single booking
  // Usage: await BookingAPI.getById(5)
  async getById(bookingId) {
    return apiFetch(`/api/bookings/${bookingId}`);
  },

  // Confirm a booking (Provider)
  // Usage: await BookingAPI.confirm(5)
  async confirm(bookingId) {
    return apiFetch(`/api/bookings/confirm/${bookingId}`, 'PUT');
  },

  // Complete a booking (Provider)
  // Usage: await BookingAPI.complete(5)
  async complete(bookingId) {
    return apiFetch(`/api/bookings/complete/${bookingId}`, 'PUT');
  },

  // Cancel a booking (Customer)
  // Usage: await BookingAPI.cancel(5)
  async cancel(bookingId) {
    return apiFetch(`/api/bookings/cancel/${bookingId}`, 'PUT');
  }
};

// ─────────────────────────────────────────
//  PAYMENT APIs
// ─────────────────────────────────────────

const PaymentAPI = {

  // Process a payment
  // Usage: await PaymentAPI.pay({ bookingId, amount, paymentMethod })
  async pay(data) {
    return apiFetch('/api/payments/pay', 'POST', data);
  },

  // Get payment status for a booking
  // Usage: await PaymentAPI.getStatus(1)
  async getStatus(bookingId) {
    return apiFetch(`/api/payments/status/${bookingId}`);
  }
};

// ─────────────────────────────────────────
//  SERVICE APIs
// ─────────────────────────────────────────

const ServiceAPI = {

  // Get all services
  async getAll() {
    return apiFetch('/api/services', 'GET', null, false);
  },

  // Get services by provider
  async getByProvider(providerId) {
    return apiFetch(`/api/services/provider/${providerId}`);
  },

  // Get single service
  async getById(serviceId) {
    return apiFetch(`/api/services/${serviceId}`, 'GET', null, false);
  }
};

// ─────────────────────────────────────────
//  UI HELPER UTILITIES
// ─────────────────────────────────────────

const UI = {

  // Show a toast notification
  // Usage: UI.toast('Booking confirmed!', 'success')
  toast(message, type = 'success') {
    let toast = document.getElementById('_toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = '_toast';
      toast.style.cssText = `
        position:fixed; bottom:24px; right:24px; z-index:9999;
        padding:12px 20px; border-radius:12px; font-weight:600;
        font-size:.85rem; display:none; animation:fadeIn .3s ease;
        font-family:'DM Sans',sans-serif; max-width:320px;
      `;
      document.body.appendChild(toast);
    }
    const colors = {
      success: { bg:'#34d399', color:'#000' },
      error:   { bg:'#f87171', color:'#fff' },
      info:    { bg:'#3b82f6', color:'#fff' },
      warning: { bg:'#f59e0b', color:'#000' }
    };
    const c = colors[type] || colors.success;
    toast.style.background = c.bg;
    toast.style.color = c.color;
    toast.textContent = message;
    toast.style.display = 'block';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.style.display = 'none', 3500);
  },

  // Show loading state on a button
  // Usage: UI.setLoading(btn, true) / UI.setLoading(btn, false)
  setLoading(btn, isLoading) {
    if (!btn) return;
    if (isLoading) {
      btn._originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Loading...';
      btn.style.opacity = '0.7';
    } else {
      btn.disabled = false;
      btn.textContent = btn._originalText || 'Submit';
      btn.style.opacity = '1';
    }
  },

  // Toggle sidebar for mobile
  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.display = sidebar.style.display === 'flex' ? 'none' : 'flex';
  },

  // Render status badge HTML
  // Usage: UI.statusBadge('CONFIRMED')
  statusBadge(status) {
    const map = {
      PENDING:   { label:'Pending',   color:'#f59e0b', bg:'rgba(245,158,11,.12)' },
      CONFIRMED: { label:'Confirmed', color:'#3b82f6', bg:'rgba(59,130,246,.12)' },
      COMPLETED: { label:'Completed', color:'#34d399', bg:'rgba(52,211,153,.12)' },
      CANCELLED: { label:'Cancelled', color:'#f87171', bg:'rgba(248,113,113,.12)' },
      SUCCESS:   { label:'Success',   color:'#34d399', bg:'rgba(52,211,153,.12)' },
      FAILED:    { label:'Failed',    color:'#f87171', bg:'rgba(248,113,113,.12)' },
    };
    const s = map[status] || { label: status, color:'#aaa', bg:'rgba(170,170,170,.1)' };
    return `<span style="padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:700;
      color:${s.color};background:${s.bg}">${s.label}</span>`;
  },

  // Format date nicely
  // Usage: UI.formatDate('2025-03-02T10:30:00')
  formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day:'numeric', month:'short', year:'numeric',
      hour:'2-digit', minute:'2-digit'
    });
  },

  // Redirect if not logged in
  requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
    }
  },

  // Redirect based on role after login
  redirectByRole(role) {
    const map = {
      CUSTOMER: 'customer-dashboard.html',
      PROVIDER: 'provider-dashboard.html',
      ADMIN:    'admin-dashboard.html'
    };
    window.location.href = map[role] || 'login.html';
  }
};


// ─────────────────────────────────────────
//  REAL-TIME SOCKET HELPERS (STOMP over SockJS)
// ─────────────────────────────────────────

const Socket = {
  stompClient: null,
  connected: false,
  subscriptions: new Map(),

  /**
   * Connect to the WebSocket endpoint
   * @param {Function} callback - Success callback
   */
  connect(callback) {
    if (this.connected && this.stompClient) {
      if (callback) callback();
      return;
    }

    if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
      console.warn('[STOMP] SockJS or Stomp client not loaded yet');
      setTimeout(() => this.connect(callback), 500);
      return;
    }

    const socket = new SockJS(BASE_URL + '/ws');
    this.stompClient = Stomp.over(socket);
    this.stompClient.debug = null; // Disable debug logging

    const headers = {
      'Authorization': 'Bearer ' + getToken()
    };

    this.stompClient.connect(headers, (frame) => {
      console.log('[STOMP] Connected');
      this.connected = true;
      if (callback) callback();
    }, (error) => {
      console.error('[STOMP] Connection error: ', error);
      this.connected = false;
      // Reconnect after 3 seconds
      setTimeout(() => this.connect(callback), 3000);
    });
  },

  /**
   * Subscribe to a specific topic
   * @param {String} topic - The topic to subscribe to (e.g., /topic/bookings/5)
   * @param {Function} callback - Callback for incoming messages
   */
  subscribe(topic, callback) {
    if (!this.connected) {
      // Defer subscription until connected
      setTimeout(() => this.subscribe(topic, callback), 1000);
      return;
    }

    // Unsubscribe if already subscribed to this topic
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
    }

    const sub = this.stompClient.subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body);
        callback(payload);
      } catch (e) {
        callback(message.body);
      }
    });

    this.subscriptions.set(topic, sub);
    console.log('[STOMP] Subscribed to ' + topic);
  },

  /**
   * Send a message to a destination
   * @param {String} destination - The target prefix (e.g., /app/chat)
   * @param {Object} payload - Data to send
   */
  send(destination, payload) {
    if (this.connected && this.stompClient) {
      this.stompClient.send(destination, {}, JSON.stringify(payload));
    }
  }
};
