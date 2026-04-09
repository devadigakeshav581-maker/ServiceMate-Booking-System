import { useState, useEffect } from 'react';
import api from './api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'CUSTOMER'
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (token) {
            if (role === 'PROVIDER') navigate('/provider', { replace: true });
            else if (role === 'ADMIN') navigate('/admin', { replace: true });
            else navigate('/customer', { replace: true });
        }
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const { confirmPassword, ...requestData } = formData;
            await api.post('/api/auth/register', requestData);
            navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
        } catch (err) {
            console.error('Registration failed:', err);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center py-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-full max-w-lg premium-card p-10">
                <div className="text-center mb-8">
                    <div className="text-[#6c63ff] font-extrabold text-3xl tracking-tighter font-serif mb-2">
                        Service<span className="text-[#ff6584]">Mate</span>
                    </div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest text-[0.7rem]">Create Your Account</h2>
                </div>

                {error && <div className="bg-[#ff6584]/10 text-[#ff6584] p-4 rounded-xl mb-6 text-sm border border-[#ff6584]/20 text-center animate-shake">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[0.7rem] font-bold text-[#7070a0] uppercase tracking-widest ml-1">Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="premium-input w-full" placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[0.7rem] font-bold text-[#7070a0] uppercase tracking-widest ml-1">Account Role</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="premium-input w-full">
                                <option value="CUSTOMER">Customer</option>
                                <option value="PROVIDER">Service Provider</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[0.7rem] font-bold text-[#7070a0] uppercase tracking-widest ml-1">Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="premium-input w-full" placeholder="name@example.com" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[0.7rem] font-bold text-[#7070a0] uppercase tracking-widest ml-1">Password</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="premium-input w-full" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[0.7rem] font-bold text-[#7070a0] uppercase tracking-widest ml-1">Confirm Password</label>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="premium-input w-full" placeholder="••••••••" />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={isLoading} className="premium-button w-full py-3.5 flex items-center justify-center gap-2">
                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Register Account'}
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-8 border-t border-[#2a2a3a] text-center">
                    <p className="text-[#7070a0] text-sm">
                        Already have an account? {' '}
                        <Link to="/login" className="text-[#6c63ff] font-bold hover:underline">Sign In Instead</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;