import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────
const users = [
  { id: 1, name: "Mock Customer", email: "customer@servicemate.com", role: "CUSTOMER" },
  { id: 2, name: "Mock Provider", email: "provider@servicemate.com", role: "PROVIDER" },
  { id: 3, name: "Mock Admin", email: "admin@servicemate.com", role: "ADMIN" }
];

const services = [
  { id: 1, name: "Home Cleaning", price: 499, description: "🧹 Full home cleaning", providerId: 2 },
  { id: 2, name: "Plumbing Repair", price: 399, description: "🔧 Fix leaks and pipes", providerId: 2 },
  { id: 3, name: "AC Service", price: 599, description: "❄️ AC maintenance", providerId: 2 }
];

let bookings = [
  { id: 101, customerId: 1, serviceId: 1, serviceName: "Home Cleaning", status: "PENDING", bookingDate: new Date().toISOString(), address: "123 Mock St" },
  { id: 102, customerId: 1, serviceId: 2, serviceName: "Plumbing Repair", status: "COMPLETED", bookingDate: new Date(Date.now() - 86400000).toISOString(), address: "123 Mock St" }
];

const chats = {}; // bookingId -> array of message objects

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // Accept any password '123456' or for test emails
  if (password === '123456' || users.some(u => u.email === email)) {
    res.send("mock-jwt-token-xyz");
  } else {
    res.status(401).send("Invalid credentials");
  }
});

// Services
app.get('/api/services', (req, res) => res.json(services));
app.get('/api/services/provider/:id', (req, res) => res.json(services.filter(s => s.providerId == req.params.id)));
app.post('/api/services', (req, res) => {
  const newService = { id: services.length + 1, ...req.body };
  services.push(newService);
  res.json(newService);
});

// Bookings
app.get('/api/bookings/customer/:id', (req, res) => {
  let customerBookings = bookings.filter(b => b.customerId == req.params.id);
  const status = req.query.status;
  const address = req.query.address;

  if (status && status !== 'ALL') {
    customerBookings = customerBookings.filter(b => b.status === status);
  }

  if (address) {
    customerBookings = customerBookings.filter(b => b.address.toLowerCase().includes(address.toLowerCase()));
  }
  
  customerBookings.sort((a, b) => b.id - a.id);

  const page = parseInt(req.query.page) || 0;
  const size = parseInt(req.query.size) || 5;
  const start = page * size;
  
  res.json({
    content: customerBookings.slice(start, start + size),
    totalPages: Math.ceil(customerBookings.length / size) || 1
  });
});

app.get('/api/bookings/customer/:id/stats', (req, res) => {
  const customerBookings = bookings.filter(b => b.customerId == req.params.id);
  const total = customerBookings.length;
  const pending = customerBookings.filter(b => b.status === 'PENDING').length;
  const completed = customerBookings.filter(b => b.status === 'COMPLETED').length;
  const spent = customerBookings.filter(b => b.status === 'COMPLETED').reduce((acc, curr) => acc + 450, 0);
  res.json({ total, pending, completed, spent });
});

// Chat
app.get('/api/chat/:bookingId', (req, res) => {
  const { bookingId } = req.params;
  res.json(chats[bookingId] || []);
});

app.post('/api/chat/:bookingId', (req, res) => {
  const { bookingId } = req.params;
  const { text, senderRole } = req.body;
  
  if (!chats[bookingId]) chats[bookingId] = [];
  
  const msg = { id: Date.now(), bookingId: parseInt(bookingId), text, senderRole, timestamp: new Date().toISOString() };
  chats[bookingId].push(msg);
  
  io.emit('message', { type: 'CHAT_MESSAGE', message: msg });
  res.json(msg);
});

app.get('/api/bookings/service/:id', (req, res) => res.json(bookings.filter(b => b.serviceId == req.params.id)));

app.post('/api/bookings/create', (req, res) => {
  const svc = services.find(s => s.id == req.body.serviceId);
  const newBooking = { 
    id: Math.floor(Math.random() * 10000), 
    status: 'PENDING', 
    bookingDate: new Date().toISOString(),
    serviceName: svc ? svc.name : 'Unknown Service',
    ...req.body 
  };
  bookings.unshift(newBooking);
  
  // Simulate Real-time update
  io.emit('message', { type: 'BOOKING_CREATED', booking: newBooking });
  res.json(newBooking);
});

app.put('/api/bookings/confirm/:id', (req, res) => {
  const booking = bookings.find(b => b.id == req.params.id);
  if(booking) {
    booking.status = 'CONFIRMED';
    io.emit('message', { type: 'BOOKING_CONFIRMED', id: booking.id });
    res.json(booking);
  } else res.status(404).send();
});

app.put('/api/bookings/complete/:id', (req, res) => {
  const booking = bookings.find(b => b.id == req.params.id);
  if(booking) {
    booking.status = 'COMPLETED';
    io.emit('message', { type: 'BOOKING_COMPLETED', id: booking.id });
    res.json(booking);
  } else res.status(404).send();
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = 8080;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Mock Backend running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO enabled\n`);
});