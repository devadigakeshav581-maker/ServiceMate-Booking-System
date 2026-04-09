import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import ProtectedRoute from './ProtectedRoute';
import Login from './Login';
import Register from './Register';
import CustomerDashboard from './CustomerDashboard';
import Profile from './Profile';
import ProviderDashboard from './ProviderDashboard';
import ProviderServices from './ProviderServices';
import AdminDashboard from './AdminDashboard'; // Import from separate file
import { Socket } from './api';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer Routes */}
          <Route path="/customer" element={<ProtectedRoute requiredRole="CUSTOMER"><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/customer/services" element={<ProtectedRoute requiredRole="CUSTOMER"><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/customer/bookings" element={<ProtectedRoute requiredRole="CUSTOMER"><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/customer/payments" element={<ProtectedRoute requiredRole="CUSTOMER"><CustomerDashboard /></ProtectedRoute>} />

          {/* Provider Routes */}
          <Route path="/provider" element={<ProtectedRoute requiredRole="PROVIDER"><ProviderDashboard /></ProtectedRoute>} />
          <Route path="/provider/services" element={<ProtectedRoute requiredRole="PROVIDER"><ProviderDashboard /></ProtectedRoute>} />
          <Route path="/provider/bookings" element={<ProtectedRoute requiredRole="PROVIDER"><ProviderDashboard /></ProtectedRoute>} />
          <Route path="/provider/earnings" element={<ProtectedRoute requiredRole="PROVIDER"><ProviderDashboard /></ProtectedRoute>} />
          
          {/* Profile Route - Accessible by all authenticated users */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/services" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/security" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />

          {/* Fallback Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;