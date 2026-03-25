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
    const userRole = localStorage.getItem('role');

    if (!token) {
        // User not logged in, redirect to login page.
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && userRole !== requiredRole) {
        // User does not have the required role, redirect to login.
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;