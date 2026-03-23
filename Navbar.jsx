import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Triggers re-render on route change
    
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    return (
        <nav className="bg-gray-800 text-white py-4 px-8 flex justify-between items-center shadow-md">
            <Link to="/" className="text-2xl font-bold">ServiceMate</Link>
            <div className="flex items-center">
                {!token ? (
                    <>
                        <Link to="/login" className="ml-5 font-medium hover:text-blue-300">Login</Link>
                        <Link to="/register" className="ml-5 font-medium hover:text-blue-300">Register</Link>
                    </>
                ) : (
                    <>
                        {role === 'CUSTOMER' && (
                            <Link to="/customer" className="ml-5 font-medium hover:text-blue-300">Dashboard</Link>
                        )}
                        {role === 'PROVIDER' && (
                            <>
                                <Link to="/provider" className="ml-5 font-medium hover:text-blue-300">Dashboard</Link>
                                <Link to="/provider/services" className="ml-5 font-medium hover:text-blue-300">My Services</Link>
                            </>
                        )}
                        <button onClick={handleLogout} className="ml-5 py-1 px-4 bg-red-600 rounded hover:bg-red-700">Logout</button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;