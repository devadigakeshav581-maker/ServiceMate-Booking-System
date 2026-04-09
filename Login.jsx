import { useState, useEffect } from 'react';
import api from './api';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [isCapsLockOn, setIsCapsLockOn] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const applyDemoCreds = (demoRole) => {
        const demos = {
            CUSTOMER: { email: 'customer@servicemate.com', password: '123456' },
            PROVIDER: { email: 'provider@servicemate.com', password: '123456' },
            ADMIN: { email: 'admin@servicemate.com', password: '123456' }
        };
        const selected = demos[demoRole];
        if (!selected) return;
        setEmail(selected.email);
        setPassword(selected.password);
    };

    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }

        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (token) {
            if (role === 'PROVIDER') navigate('/provider', { replace: true });
            else if (role === 'ADMIN') navigate('/admin', { replace: true });
            else navigate('/customer', { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            const response = await api.post('/api/auth/login', { email, password });
            const { token, role, name, id, userId } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            if (name) localStorage.setItem('name', name);
            const resolvedUserId = userId || id;
            if (resolvedUserId) localStorage.setItem('userId', resolvedUserId);
            if (rememberMe && email) localStorage.setItem('rememberedEmail', email);
            if (!rememberMe) localStorage.removeItem('rememberedEmail');
            localStorage.setItem('lastLoginAt', new Date().toISOString());

            if (role === 'PROVIDER') navigate('/provider');
            else if (role === 'ADMIN') navigate('/admin');
            else navigate('/customer');
        } catch (err) {
            console.error('Login failed:', err);
            setError('Invalid email or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-full max-w-md premium-card p-10">
                <div className="text-center mb-10">
                    <div className="text-[#6c63ff] font-extrabold text-3xl tracking-tighter font-serif mb-2">
                        Service<span className="text-[#ff6584]">Mate</span>
                    </div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest text-[0.7rem]">Sign In to Your Account</h2>
                </div>

                {error && <div className="bg-[#ff6584]/10 text-[#ff6584] p-4 rounded-xl mb-6 text-sm border border-[#ff6584]/20 text-center animate-shake">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[0.7rem] font-bold text-[#7070a0] uppercase tracking-widest ml-1">Email Address</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            className="premium-input w-full"
                            placeholder="name@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[0.7rem] font-bold text-[#7070a0] uppercase tracking-widest ml-1">Password</label>
                            <Link to="/forgot-password" size="sm" className="text-[0.65rem] text-[#6c63ff] hover:underline font-bold uppercase tracking-tight">Forgot Password?</Link>
                        </div>
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            onKeyUp={(e) => setIsCapsLockOn(e.getModifierState('CapsLock'))}
                            required 
                            className="premium-input w-full"
                            placeholder="••••••••"
                        />
                    </div>
                    {isCapsLockOn && (
                        <div className="text-[0.7rem] text-yellow-400">Caps Lock is ON</div>
                    )}

                    <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center gap-2 text-[#7070a0] cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            Remember email
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="text-[#6c63ff] font-bold hover:underline"
                        >
                            {showPassword ? 'Hide Password' : 'Show Password'}
                        </button>
                    </div>

                    <div className="text-[0.7rem] text-[#7070a0] bg-[#1c1c27] border border-[#2a2a3a] rounded-lg p-2">
                        Tip: Use role-specific demo credentials if configured by admin.
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => applyDemoCreds('CUSTOMER')} className="premium-button-ghost py-2 text-[0.65rem]">Demo Customer</button>
                        <button type="button" onClick={() => applyDemoCreds('PROVIDER')} className="premium-button-ghost py-2 text-[0.65rem]">Demo Provider</button>
                        <button type="button" onClick={() => applyDemoCreds('ADMIN')} className="premium-button-ghost py-2 text-[0.65rem]">Demo Admin</button>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="premium-button w-full py-3.5 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : 'Sign In Now'}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-[#2a2a3a] text-center">
                    <p className="text-[#7070a0] text-sm">
                        Don't have an account? {' '}
                        <Link to="/register" className="text-[#6c63ff] font-bold hover:underline">Create Account</Link>
                    </p>
                    {localStorage.getItem('lastLoginAt') && (
                        <p className="text-[#7070a0] text-xs mt-3">
                            Last sign in: {new Date(localStorage.getItem('lastLoginAt')).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;