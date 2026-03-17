import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Dashboard from './pages/Dashboard'; // Placeholder for dashboard components
import { ToastProvider } from './ToastContext';
import { ThemeProvider } from './ThemeContext';
// import './index.css';
import ErrorBoundary from './ErrorBoundary';

const Login = React.lazy(() => import('./Login'));
const CustomerDashboard = React.lazy(() => import('./CustomerDashboard'));
const ProviderDashboard = React.lazy(() => import('./ProviderDashboard'));
const AdminDashboard = React.lazy(() => import('./AdminDashboard'));
const NotFound = React.lazy(() => import('./NotFound'));
const Unauthorized = React.lazy(() => import('./Unauthorized'));

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/unauthorized" />;

  return children;
};

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-bg">
    <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/login" />} />
                
                <Route path="/customer-dashboard" element={<PrivateRoute allowedRoles={['CUSTOMER']}><CustomerDashboard /></PrivateRoute>} />
                <Route path="/provider-dashboard" element={<PrivateRoute allowedRoles={['PROVIDER']}><ProviderDashboard /></PrivateRoute>} />
                <Route path="/admin-dashboard" element={<PrivateRoute allowedRoles={['ADMIN']}><AdminDashboard /></PrivateRoute>} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;