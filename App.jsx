import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import ProtectedRoute from './ProtectedRoute'; // Import the new component
import Login from './Login';
import Register from './Register';
import CustomerDashboard from './CustomerDashboard';
import Profile from './Profile';
import ProviderDashboard from './ProviderDashboard';
import ProviderServices from './ProviderServices';

// Placeholder for the Admin Dashboard
const AdminDashboard = () => <div className="bg-white p-6 rounded-lg shadow-md"><h1 className="text-3xl font-bold">Admin Dashboard</h1></div>;

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer Routes */}
            <Route path="/customer" element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <CustomerDashboard />
              </ProtectedRoute>
            } />

            {/* Provider Routes */}
            <Route path="/provider" element={<ProtectedRoute requiredRole="PROVIDER"><ProviderDashboard /></ProtectedRoute>} />
            <Route path="/provider/services" element={<ProtectedRoute requiredRole="PROVIDER"><ProviderServices /></ProtectedRoute>} />
            
            {/* Profile Route - Accessible by all authenticated users */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin Route */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />

            {/* Fallback Route - Redirects to login if no other route matches */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;