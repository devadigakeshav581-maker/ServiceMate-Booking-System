import { useState } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            // POST credentials to the backend proxy
            // Ensure your Spring Boot backend has an endpoint like /api/auth/login or similar
            const response = await api.post('/api/auth/login', { 
                email, 
                password 
            });

            // Assuming the backend returns { token: "...", role: "CUSTOMER" }
            const { token, role } = response.data;

            // Store token for future authenticated requests
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);

            // Redirect based on user role
            if (role === 'PROVIDER') {
                navigate('/provider');
            } else if (role === 'ADMIN') {
                navigate('/admin'); // Assuming you have an admin route
            } else {
                navigate('/customer');
            }
        } catch (err) {
            console.error('Login failed:', err);
            setError('Invalid email or password. Please try again.');
        }
    };

    return (
        <div className="login-container">
            <h2>Login to ServiceMate</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email:</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;