import { Navigate } from 'react-router-dom';

/**
 * A component that protects routes from unauthenticated access.
 * It checks for a token and optionally for a specific user role.
 * @param {object} props
 * @param {React.ReactNode} props.children - The component to render if authenticated.
 * @param {string} [props.requiredRole] - The role required to access this route.
 */
const ProtectedRoute = ({ children, requiredRole }) => {
    const token = localStorage.getItem('token');
    const userRole = (localStorage.getItem('role') || '').trim().toUpperCase();
    const normalizedRequiredRole = requiredRole ? requiredRole.trim().toUpperCase() : null;

    if (!token) {
        // User not logged in, redirect to login page.
        return <Navigate to="/login" replace />;
    }

    if (normalizedRequiredRole && userRole !== normalizedRequiredRole) {
        // User does not have the required role, redirect to their dashboard if possible.
        if (userRole === 'ADMIN') return <Navigate to="/admin" replace />;
        if (userRole === 'PROVIDER') return <Navigate to="/provider" replace />;
        if (userRole === 'CUSTOMER') return <Navigate to="/customer" replace />;
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
