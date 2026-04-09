import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name') || 'User';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        localStorage.removeItem('userId');
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <aside className="fixed left-0 top-0 w-[240px] h-screen bg-[#13131a] border-r border-[#2a2a3a] flex flex-col py-7 z-50">
            <div className="px-6 mb-8 text-[#6c63ff] font-extrabold text-2xl tracking-tighter font-serif">
                Service<span className="text-[#ff6584]">Mate</span>
            </div>

            <nav className="flex-1 px-0">
                <div className="px-6 mb-2 text-[#7070a0] text-[0.65rem] font-bold uppercase tracking-widest">Menu</div>
                
                {role === 'CUSTOMER' && (
                    <>
                        <Link to="/customer" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/customer')}`}>
                            <span className="w-5 text-center text-lg">🏠</span> Dashboard
                        </Link>
                        <Link to="/customer/services" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/customer/services')}`}>
                            <span className="w-5 text-center text-lg">🔧</span> Browse Services
                        </Link>
                        <Link to="/customer/bookings" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/customer/bookings')}`}>
                            <span className="w-5 text-center text-lg">📅</span> My Bookings
                        </Link>
                        <Link to="/customer/payments" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/customer/payments')}`}>
                            <span className="w-5 text-center text-lg">💳</span> Payments
                        </Link>
                    </>
                )}

                {role === 'PROVIDER' && (
                    <>
                        <Link to="/provider" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/provider')}`}>
                            <span className="w-5 text-center text-lg">📊</span> Dashboard
                        </Link>
                        <Link to="/provider/services" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/provider/services')}`}>
                            <span className="w-5 text-center text-lg">🛠️</span> My Services
                        </Link>
                        <Link to="/provider/bookings" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/provider/bookings')}`}>
                            <span className="w-5 text-center text-lg">🕒</span> Bookings
                        </Link>
                        <Link to="/provider/earnings" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/provider/earnings')}`}>
                            <span className="w-5 text-center text-lg">💰</span> Earnings
                        </Link>
                    </>
                )}

                {role === 'ADMIN' && (
                    <>
                        <Link to="/admin" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/admin')}`}>
                            <span className="w-5 text-center text-lg">⚡</span> Analytics
                        </Link>
                        <Link to="/admin/users" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/admin/users')}`}>
                            <span className="w-5 text-center text-lg">👥</span> Users
                        </Link>
                        <Link to="/admin/services" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/admin/services')}`}>
                            <span className="w-5 text-center text-lg">🔧</span> Services
                        </Link>
                        <Link to="/admin/bookings" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/admin/bookings')}`}>
                            <span className="w-5 text-center text-lg">📅</span> Bookings
                        </Link>
                        <Link to="/admin/payments" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/admin/payments')}`}>
                            <span className="w-5 text-center text-lg">💳</span> Payments
                        </Link>
                        <Link to="/admin/settings" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/admin/settings')}`}>
                            <span className="w-5 text-center text-lg">⚙️</span> Settings
                        </Link>
                        <Link to="/admin/security" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/admin/security')}`}>
                            <span className="w-5 text-center text-lg">🛡️</span> Security
                        </Link>
                    </>
                )}

                <div className="mt-6 px-6 mb-2 text-[#7070a0] text-[0.65rem] font-bold uppercase tracking-widest">Account</div>
                <Link to="/profile" className={`flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27] sidebar-item ${isActive('/profile')}`}>
                    <span className="w-5 text-center text-lg">👤</span> My Profile
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3 text-[#7070a0] text-sm transition-all hover:text-white hover:bg-[#1c1c27]">
                    <span className="w-5 text-center text-lg">🚪</span> Log Out
                </button>
            </nav>

            <div className="mt-auto px-6 pt-6 border-t border-[#2a2a3a]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#ff6584] flex items-center justify-center font-bold text-white text-sm">
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-white text-sm font-medium leading-tight">{name}</div>
                        <div className="text-[#7070a0] text-[0.72rem] uppercase tracking-wider font-semibold">{role || 'User'}</div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .sidebar-item.active {
                    color: #6c63ff;
                    border-left: 3px solid #6c63ff;
                    background: rgba(108, 99, 255, 0.08);
                }
            ` }} />
        </aside>
    );
};

export default Sidebar;
