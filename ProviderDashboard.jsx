import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { Socket, BookingAPI } from './api';
import Pagination from './Pagination';
import ConfirmationModal from './ConfirmationModal';
import ProviderServices from './ProviderServices';
import ChatWindow from './ChatWindow';

const ProviderDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [activeChatBooking, setActiveChatBooking] = useState(null);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const providerName = localStorage.getItem('name') || 'Provider';

    const fetchProviderBookings = useCallback(async () => {
        try {
            const response = await BookingAPI.getProvider();
            setBookings(response.data || response || []);
        } catch (err) {
            console.error('Error fetching provider bookings:', err);
            setError('Failed to load dashboard data.');
            if (err.response && err.response.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchProviderBookings();
        
        Socket.connect(() => {
            Socket.subscribe('/user/queue/notifications', (msg) => {
                const data = msg?.body ? JSON.parse(msg.body) : msg;
                setNotifications(prev => [
                    { id: Date.now(), message: data?.message || 'New booking alert', time: new Date() },
                    ...prev
                ].slice(0, 5));
                fetchProviderBookings();
            });
        });
    }, [fetchProviderBookings]);

    const handleConfirmBooking = async (bookingId) => {
        try {
            await BookingAPI.confirm(bookingId);
            fetchProviderBookings();
        } catch (err) {
            alert('Failed to confirm booking.');
        }
    };

    const confirmComplete = async () => {
        if (!confirmDialog) return;
        try {
            await BookingAPI.complete(confirmDialog);
            fetchProviderBookings();
        } catch (err) {
            alert('Failed to complete booking.');
        }
        setConfirmDialog(null);
    };

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'PENDING').length,
        confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
        earnings: bookings.filter(b => b.status === 'COMPLETED').reduce((acc, b) => acc + (b.price || 0), 0),
        reviews: 4.8
    };

    const renderContent = () => {
        const path = location.pathname;

        if (path === '/provider/services') {
            return <ProviderServices />;
        }

        if (path === '/provider/bookings') {
            const list = bookings.filter(b => statusFilter === 'ALL' ? true : b.status === statusFilter);
            return (
                <div className="premium-card">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold">Booking History</h2>
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="premium-input text-xs"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {list.map(b => (
                            <ProviderBookingCard 
                                key={b.id} 
                                booking={b} 
                                onConfirm={() => handleConfirmBooking(b.id)} 
                                onComplete={() => setConfirmDialog(b.id)} 
                            />
                        ))}
                    </div>
                </div>
            );
        }

        if (path === '/provider/earnings') {
            const completed = bookings.filter(b => b.status === 'COMPLETED');
            return (
                <div className="premium-card">
                    <h2 className="text-2xl font-bold mb-8">Earnings Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="bg-[#1c1c27] p-6 rounded-2xl border border-[#2a2a3a]">
                            <div className="text-[#7070a0] text-xs font-bold uppercase mb-2">Withdrawable Balance</div>
                            <div className="text-4xl font-black text-[#43e97b]">₹{stats.earnings}</div>
                        </div>
                        <div className="bg-[#1c1c27] p-6 rounded-2xl border border-[#2a2a3a]">
                            <div className="text-[#7070a0] text-xs font-bold uppercase mb-2">Total Jobs</div>
                            <div className="text-4xl font-black text-[#6c63ff]">{stats.total}</div>
                        </div>
                        <div className="bg-[#1c1c27] p-6 rounded-2xl border border-[#2a2a3a]">
                            <div className="text-[#7070a0] text-xs font-bold uppercase mb-2">Rating</div>
                            <div className="text-4xl font-black text-yellow-400">{stats.reviews} ⭐</div>
                        </div>
                    </div>
                    <div className="mb-10">
                        <h3 className="font-bold mb-4">Weekly Earning Trend</h3>
                        <div className="flex items-end gap-3 h-32 pb-2">
                            {[15, 45, 25, 60, 35, 80, 55].map((h, i) => (
                                <div key={i} className="flex-1 bg-[#6c63ff]/20 rounded-t-lg relative group">
                                    <div className="absolute bottom-0 w-full bg-[#6c63ff] rounded-t-lg transition-all duration-700" style={{ height: `${h}%` }}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-bold mb-4">Payout History</h3>
                        {completed.map(b => (
                            <div key={b.id} className="flex justify-between items-center p-4 bg-[#13131a] border border-[#2a2a3a] rounded-xl">
                                <div>
                                    <div className="font-bold">{b.serviceName}</div>
                                    <div className="text-xs text-[#7070a0] mt-1">{new Date(b.bookingDate).toLocaleDateString()}</div>
                                </div>
                                <div className="text-[#43e97b] font-black">+ ₹{b.price}</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Default: Stats + Active Tasks
        const activeTasks = bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED');
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <ProviderStatCard label="Incoming" value={stats.pending} sub="Action required" color="accent2" />
                    <ProviderStatCard label="Active" value={stats.confirmed} sub="In progress" color="accent" />
                    <ProviderStatCard label="Total Jobs" value={stats.total} sub="All time" color="accent3" />
                    <ProviderStatCard label="Net Earnings" value={`₹${stats.earnings}`} sub="Total balance" color="yellow" />
                </div>

                <div className="premium-card">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold">Active Tasks</h2>
                        <button onClick={() => navigate('/provider/bookings')} className="text-[#6c63ff] text-sm font-semibold hover:underline">Manage All</button>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {activeTasks.length === 0 ? (
                            <div className="text-center py-10 text-[#7070a0] italic col-span-2">No active tasks.</div>
                        ) : (
                            activeTasks.map(b => (
                                <ProviderBookingCard 
                                    key={b.id} 
                                    booking={b} 
                                    onConfirm={() => handleConfirmBooking(b.id)} 
                                    onComplete={() => setConfirmDialog(b.id)}
                                    onChat={() => setActiveChatBooking(b)}
                                    onChat={() => setActiveChatBooking(b)}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="text-center p-20 text-[#7070a0]">Loading environment...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center">
                <div className="flex-1">
                    <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight">Provider Dashboard</h1>
                    <p className="text-[#7070a0] mt-1">Hello, {providerName}. Update your services and status.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/provider/services')} className="premium-button-ghost py-2">My Services</button>
                    {/* Notification Center */}
                    <div className="relative group">
                        <button className="premium-button-ghost p-2 relative">
                            🔔 {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                        </button>
                        <div className="absolute right-0 mt-2 w-64 bg-[#1c1c27] border border-[#2a2a3a] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-4">
                            <h4 className="text-xs font-bold text-white uppercase mb-3">Notifications</h4>
                            <div className="space-y-3">
                                {notifications.length === 0 ? <p className="text-[0.65rem] text-[#7070a0] italic">No new messages</p> : notifications.map(n => (
                                    <div key={n.id} className="text-[0.65rem] border-b border-[#2a2a3a] pb-2 text-[#f0f0f8]">{n.message}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {renderContent()}

            <ConfirmationModal
                isOpen={confirmDialog !== null}
                onClose={() => setConfirmDialog(null)}
                onConfirm={confirmComplete}
                title="Finish Service Job"
                message="Are you sure the task is complete? This will finalize the payment."
            />

            {activeChatBooking && (
                <ChatWindow booking={activeChatBooking} onClose={() => setActiveChatBooking(null)} />
            )}
        </div>
    );
};

const ProviderStatCard = ({ label, value, sub, color }) => {
    const colorClasses = {
        accent: 'from-[#6c63ff] to-[#6c63ff]/50',
        accent2: 'from-[#ff6584] to-[#ff6584]/50',
        accent3: 'from-[#43e97b] to-[#43e97b]/50',
        yellow: 'from-yellow-400 to-yellow-600'
    };

    return (
        <div className="premium-card group relative overflow-hidden p-6 hover:translate-y-[-4px] transition-all">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClasses[color]} opacity-[0.03] rounded-bl-full`}></div>
            <div className="relative z-10">
                <div className="text-[#7070a0] text-[0.65rem] font-bold uppercase tracking-[2px] mb-2">{label}</div>
                <div className="text-3xl font-black text-white">{value}</div>
                <div className="text-[#7070a0] text-[0.7rem] mt-3">{sub}</div>
            </div>
        </div>
    );
};

const ProviderBookingCard = ({ booking, onConfirm, onComplete, onChat }) => {
    const statusConfig = {
        PENDING: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'NEEDS ACTION' },
        CONFIRMED: { color: 'text-[#6c63ff]', bg: 'bg-[#6c63ff]/10', label: 'IN PROGRESS' },
        COMPLETED: { color: 'text-[#43e97b]', bg: 'bg-[#43e97b]/10', label: 'COMPLETED' },
        CANCELLED: { color: 'text-[#ff6584]', bg: 'bg-[#ff6584]/10', label: 'CANCELLED' }
    };

    const config = statusConfig[booking.status] || statusConfig.PENDING;

    return (
        <div className="bg-[#1c1c27] border border-[#2a2a3a] rounded-2xl p-5 hover:border-[#6c63ff]/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#13131a] flex items-center justify-center font-black text-[#6c63ff] border border-[#2a2a3a]">
                        {booking.customerName?.charAt(0) || 'C'}
                    </div>
                    <div>
                        <div className="text-white font-bold text-sm">{booking.customerName || 'Customer'}</div>
                        <div className="text-[0.7rem] text-[#7070a0]">Order #{booking.id}</div>
                    </div>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-widest ${config.bg} ${config.color}`}>
                    {config.label}
                </div>
            </div>

            <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-[#7070a0] text-xs"><span className="text-lg">📍</span> {booking.address || 'Location provided'}</div>
                <div className="flex items-center gap-2 text-[#7070a0] text-xs"><span className="text-lg">🔧</span> <span className="font-bold text-gray-200">{booking.serviceName}</span></div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-[#2a2a3a]">
                {booking.status === 'PENDING' && (
                    <button onClick={onConfirm} className="flex-1 bg-[#6c63ff] text-white text-[0.75rem] font-bold py-2.5 rounded-xl hover:bg-[#5a52e0] transition-all">Accept Job</button>
                )}
                {booking.status === 'CONFIRMED' && (
                    <button onClick={onComplete} className="flex-1 bg-[#43e97b] text-[#0a0a0f] text-[0.75rem] font-bold py-2.5 rounded-xl hover:bg-[#34c767] transition-all">Mark Done</button>
                )}
                <button className="p-2.5 bg-[#13131a] text-[#7070a0] border border-[#2a2a3a] rounded-xl hover:text-white transition-all">💬</button>
            </div>
        </div>
    );
};

export default ProviderDashboard;
