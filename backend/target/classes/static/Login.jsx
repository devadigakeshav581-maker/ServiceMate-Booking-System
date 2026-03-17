import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthAPI } from './api';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
  };

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await AuthAPI.login({ email, password, role });
      
      // Redirect based on role
      const redirectMap = {
        CUSTOMER: '/customer-dashboard',
        PROVIDER: '/provider-dashboard',
        ADMIN: '/admin-dashboard'
      };
      navigate(redirectMap[role] || '/customer-dashboard');

    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (e, p, r) => {
    setEmail(e);
    setPassword(p);
    setRole(r);
  };

  return (
    <div c/}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full blur-[80px] opacity-[0.18] animate-drift w-[500px] h-[500px] bg-accent -top-[150px] -left-[100px]"></div>
        <div className="absolute rounded-full blur-[80px] opacity-[0.18] animate-drift w-[400px] h-[400px] bg-accent2 -bottom-[100px] -right-[80px] delay-neg-4"></div>
        <div className="absolute rounded-full blur-[80px] opacity-[0.18] animate-drift w-[300px] h-[300px] bg-purple-500 top-[40%] left-[40%] delay-neg-8"></div>
      </div>
      
      {/* Grid Pattern */}
      <div className="fixed inset-0 z-0 opacity-[0.04] bg-[radial-gradient(circle,#fff_1px,transparent_1px)] bg-[length:28px_28px] pointer-events-none"></div>

      {/* Brand Panel */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-16 py-12 border-r border-border bg-bg animate-slideLeft">
        <div className="font-syne text-4xl font-extrabold tracking-tight mb-12">Service<span className="text-accent">Mate</span></div>
        <div className"<vnssa alocal professionals for plumbing, electrical work, cleaning, and more — booked in minutes.
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
             m text-muted"><strong className="text-text block text-[0.9rem] mb-[1px]">Secure Booking</strong>JWT-based authentication & role access</div>
          </div>
          <div className="flex items-center gap-3">m text-muted"><strong className="text-text block text-[0.9rem] mb-[1px]">Instant Confirmation</strong>Real-time booking status updates</div>
   

      {/* Form Panel */}
      <div className="relative z-10 w-[480px] flex flex-col justify-center px-14 py-12 bg-panel shadow-2xl animate-slideRight">
        <div className="mb-9">cx

        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg text-sm mb-5 bg-red-500/10 border border-red-500/30 text-error animate-fade-in">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {/* Role Selector */}
        <div className="grid grid-cols-3 gap-2 mb-7">
          {['CUSTOMER''DEv  =dndleRoleSelect(r)}
            >
              <span className="block text-xl mb-1">{r === 'CUSTOMER' ? '👤' : r === 'PROVIDER' ? '🔧' : '🛡️'}</span>
              <span className="text-[0.65rem] font-bold uppercase tracking-wide">{r}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-4.5 relative">
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Email Address</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-muted pointer-events-none">📧</span>
              <input put-bg border-2 border-border rounded-xl py-3 px-3.5 pl-10 text-text font-epilogue text-sm outline-none transition-all focus:border-accent focus:bg-panel focus:ring-4 focus:ring-accent-glow placeholder:text-muted"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                p
            </div>
          </div>

          <div className="mb-4.ative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-muted pointer-events-none">🔑</span>
              <input 
                className="w-full bg-input-bg border-2 border-border rounded-xl py-3 px-3.5 pl-10 text-text font-epilogue text-sm outline-none transition-all focus:border-accent focus:bg-panel focus:ring-4 focus:ring-accent-glow placeholder:text-muted"
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
               s
            </div>
          </div>

          <buttnsitin-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}>Sign In</span>
            {loading && <span className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div></span>}
          </button>
        </div>
      </div>
    </div>
  );
