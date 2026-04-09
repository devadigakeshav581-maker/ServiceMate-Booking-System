import axios from 'axios';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const api = axios.create({
    baseURL: window.location.origin, // Use the Nginx proxy origin
    headers: {
        'Content-Type': 'application/json'
    }
});

const callWithFallback = async (requests) => {
    let lastError;

    for (const request of requests) {
        try {
            return await request();
        } catch (error) {
            lastError = error;
            if (!error.response || ![404, 405].includes(error.response.status)) {
                throw error;
            }
        }
    }

    throw lastError;
};

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('Unauthorized access - clearing session and redirecting.');
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('name');
            localStorage.removeItem('userId');
            
            // Check if we are in a React environment or static HTML
            const path = window.location.pathname.toLowerCase();
            const isStatic = path.endsWith('.html') || path.includes('/public/');
            
            window.location.href = isStatic ? 'login.html' : '/login';
        }
        return Promise.reject(error);
    }
);

// Authentication utilities
const UI = {
    requireAuth: () => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        if (!token || !role) {
            window.location.href = '/login';
            return false;
        }
        
        return true;
    },
    
    toast: (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 12px 20px;
            border-radius: 12px;
            font-weight: 600;
            font-size: .85rem;
            z-index: 999;
            animation: fadeIn .3s ease;
            background: ${type === 'success' ? '#43e97b' : type === 'error' ? '#ff6584' : '#6c63ff'};
            color: ${type === 'success' ? '#0a0a0f' : '#fff'};
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

// Get current user ID from localStorage
const getUserId = () => localStorage.getItem('userId');

// Get current user role
const getUserRole = () => localStorage.getItem('role');

// Get current user name
const getUserName = () => localStorage.getItem('name') || 'User';

// Service API
const ServiceAPI = {
    getAll: async () => {
        const response = await api.get('/api/services');
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/api/services/${id}`);
        return response.data;
    },
    getByProvider: async (providerId) => {
        const response = await callWithFallback([
            () => api.get(providerId ? `/api/services/provider/${providerId}` : '/api/services/provider'),
            () => api.get(`/api/services/provider/${providerId || getUserId()}`)
        ]);
        return response.data;
    },
    create: async (serviceData) => {
        const response = await api.post('/api/services/create', serviceData);
        return response.data;
    }
};

// Booking API
const BookingAPI = {
    getAll: async () => {
        const response = await api.get('/api/bookings');
        return response.data;
    },
    getMy: async () => {
        const response = await callWithFallback([
            () => api.get('/api/bookings/my'),
            () => api.get(`/api/bookings/customer/${getUserId()}`)
        ]);
        return response.data;
    },
    getProvider: async () => {
        const response = await api.get('/api/bookings/provider');
        return response.data;
    },
    getByCustomer: async (customerId, page, size, status, address) => {
        const params = new URLSearchParams();
        if (page !== undefined && page !== null) params.set('page', page);
        if (size !== undefined && size !== null) params.set('size', size);
        if (status && status !== 'ALL') params.set('status', status);
        if (address) params.set('address', address);

        const query = params.toString();
        const response = await api.get(`/api/bookings/customer/${customerId}${query ? `?${query}` : ''}`);
        return response.data;
    },
    getStatsByCustomer: async (customerId) => {
        const response = await callWithFallback([
            () => api.get(`/api/bookings/customer/${customerId}/stats`),
            () => api.get(`/api/bookings/stats/customer/${customerId}`)
        ]);
        return response.data;
    },
    create: async (bookingData) => {
        const response = await api.post('/api/bookings/create', bookingData);
        return response.data;
    },
    confirm: async (bookingId) => {
        const response = await callWithFallback([
            () => api.put(`/api/bookings/${bookingId}/confirm`),
            () => api.put(`/api/bookings/confirm/${bookingId}`)
        ]);
        return response.data;
    },
    complete: async (bookingId) => {
        const response = await callWithFallback([
            () => api.put(`/api/bookings/${bookingId}/complete`),
            () => api.put(`/api/bookings/complete/${bookingId}`)
        ]);
        return response.data;
    },
    cancel: async (bookingId) => {
        const response = await callWithFallback([
            () => api.put(`/api/bookings/${bookingId}/cancel`),
            () => api.put(`/api/bookings/cancel/${bookingId}`)
        ]);
        return response.data;
    }
};

// Payment API
const PaymentAPI = {
    pay: async (paymentData) => {
        const response = await api.post('/api/payments/pay', paymentData);
        return response.data;
    },
    getStatus: async (bookingId) => {
        const response = await api.get(`/api/payments/status/${bookingId}`);
        return response.data;
    },
    getByCustomer: async (userId, page = 0, size = 10) => {
        const response = await callWithFallback([
            () => api.get(`/api/payments/customer/${userId}?page=${page}&size=${size}`),
            () => api.get(`/api/payments/user/${userId}?page=${page}&size=${size}`)
        ]);
        return response.data;
    }
};

const ChatAPI = {
    getMessages: async (bookingId) => {
        const response = await callWithFallback([
            () => api.get(`/api/chats/${bookingId}`),
            () => api.get(`/api/chat/${bookingId}`)
        ]);
        return response.data;
    },
    sendMessage: async (bookingId, payload) => {
        const response = await callWithFallback([
            () => api.post(`/api/chats/${bookingId}`, payload),
            () => api.post(`/api/chat/${bookingId}`, payload)
        ]);
        return response.data;
    }
};

// User API
const UserAPI = {
    getAll: async () => {
        const response = await api.get('/api/admin/users');
        return response.data;
    },
    updateRole: async (userId, role) => {
        const response = await api.put(`/api/admin/users/${userId}/role`, { role });
        return response.data;
    },
    suspend: async (userId) => {
        const response = await callWithFallback([
            () => api.put(`/api/admin/users/${userId}/suspend`),
            () => api.put(`/api/admin/users/${userId}/status?active=false`)
        ]);
        return response.data;
    },
    activate: async (userId) => {
        const response = await callWithFallback([
            () => api.put(`/api/admin/users/${userId}/activate`),
            () => api.put(`/api/admin/users/${userId}/status?active=true`)
        ]);
        return response.data;
    },
    getOnlineCount: async () => {
        const response = await api.get('/api/users/online/count');
        return response.data;
    }
};

// Category API
const CategoryAPI = {
    getAll: async () => {
        const response = await api.get('/api/categories');
        return response.data;
    },
    create: async (categoryData) => {
        const response = await api.post('/api/categories', categoryData);
        return response.data;
    },
    delete: async (id) => {
        await api.delete(`/api/categories/${id}`);
    }
};

// Admin/Reports API
const AdminAPI = {
    getOverview: async () => {
        const response = await api.get('/api/reports/overview');
        return response.data;
    }
};

// STOMP over SockJS connection manager
const Socket = {
    stompClient: null,
    connected: false,
    subscriptions: new Map(),
    
    connect: (callback) => {
        if (Socket.connected && Socket.stompClient) {
            if (callback) callback();
            return;
        }
        
        const socket = new SockJS(`${window.location.origin}/ws`);
        Socket.stompClient = Stomp.over(socket);
        Socket.stompClient.debug = null; // Disable debug logging
        
        const headers = {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        };
        
        Socket.stompClient.connect(headers, (frame) => {
            console.log('STOMP Connected');
            Socket.connected = true;
            if (callback) callback();
        }, (error) => {
            console.error('STOMP Error:', error);
            Socket.connected = false;
            // Attempt to reconnect after 5 seconds
            setTimeout(() => Socket.connect(callback), 5000);
        });
    },
    
    subscribe: (topic, callback) => {
        if (!Socket.connected) {
            // Defer subscription until connected
            setTimeout(() => Socket.subscribe(topic, callback), 1000);
            return;
        }
        
        // Unsubscribe if already subscribed to this topic
        if (Socket.subscriptions.has(topic)) {
            Socket.subscriptions.get(topic).unsubscribe();
        }
        
        const sub = Socket.stompClient.subscribe(topic, (message) => {
            try {
                const payload = JSON.parse(message.body);
                callback(payload);
            } catch (e) {
                callback(message.body);
            }
        });
        
        Socket.subscriptions.set(topic, sub);
        console.log('STOMP Subscribed to ' + topic);
    },
    
    disconnect: () => {
        if (Socket.stompClient) {
            Socket.stompClient.disconnect();
            Socket.connected = false;
            Socket.subscriptions.clear();
        }
    }
};

// Add toast to the main api instance for easier access from components
api.toast = UI.toast;

// Export everything
export default api;
export {
    UI,
    getUserId,
    getUserRole,
    getUserName,
    ServiceAPI, 
    BookingAPI, 
    PaymentAPI,
    ChatAPI,
    UserAPI,
    AdminAPI,
    CategoryAPI,
    Socket 
};
