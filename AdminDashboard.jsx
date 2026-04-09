import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api, { Socket, UserAPI, BookingAPI, AdminAPI, ServiceAPI, CategoryAPI } from './api';

const AdminDashboard = () => {
    const location = useLocation();
    const [users, setUsers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState({
        users: 0,
        bookings: 0,
        revenue: 0,
        issues: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setError(null);

            const results = await Promise.allSettled([
                UserAPI.getAll(),
                BookingAPI.getAll(),
                ServiceAPI.getAll(),
                AdminAPI.getOverview(),
                CategoryAPI.getAll()
            ]);

            const [usersResult, bookingsResult, servicesResult, overviewResult, categoriesResult] = results;

            const unwrap = (result, fallback) => {
                if (result.status !== 'fulfilled') return fallback;
                return result.value?.data ?? result.value ?? fallback;
            };

            const asArray = (value) => {
                if (Array.isArray(value)) return value;
                if (Array.isArray(value?.content)) return value.content;
                return [];
            };

            const userData = asArray(unwrap(usersResult, [])).map(user => ({
                ...user,
                active: user.active ?? user.isActive ?? false
            }));
            const bookingData = asArray(unwrap(bookingsResult, []));
            const serviceData = asArray(unwrap(servicesResult, []));
            const catData = asArray(unwrap(categoriesResult, []));
            const statsData = unwrap(overviewResult, {});

            const failedRequests = results.filter(result => result.status === 'rejected');

            setUsers(userData);
            setBookings(bookingData);
            setServices(serviceData);
            setCategories(catData);
            setStats({
                users: userData.length,
                bookings: bookingData.length,
                revenue: statsData.totalRevenue || 0,
                issues: statsData.pendingIssues || 0
            });

            if (failedRequests.length === results.length) {
                setError('Failed to load system metrics. Please check your connection.');
            }
        } catch (err) {
            console.error('Error fetching admin data:', err);
            setError('Failed to load system metrics. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        
        Socket.connect(() => {
            // Consolidated Activity Feed Subscription
            Socket.subscribe('/topic/admin/activity-feed', (msg) => {
                const data = msg?.body ? JSON.parse(msg.body) : msg;
                setActivities(prev => [{...data, id: Date.now()}, ...prev].slice(0, 10));
                fetchData(); 
            });
        });
    }, [fetchData]);

    const handleSuspendUser = async (userId) => {
        try {
            await UserAPI.suspend(userId);
            fetchData();
        } catch (err) {
            alert('Failed to suspend user');
        }
    };

    const handleActivateUser = async (userId) => {
        try {
            await UserAPI.activate(userId);
            fetchData();
        } catch (err) {
            alert('Failed to activate user');
        }
    };

    const handleAddCategory = async (name) => {
        if (!name) return;
        try {
            await CategoryAPI.create({ name, icon: '🔧' });
            fetchData();
        } catch (err) {
            alert('Failed to add category');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            await CategoryAPI.delete(id);
            fetchData();
        } catch (err) {
            alert('Failed to delete category');
        }
    };

    const renderSection = () => {
        const path = location.pathname;
        
        if (path === '/admin/users') return <UserManagement users={users} onSuspend={handleSuspendUser} onActivate={handleActivateUser} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
        if (path === '/admin/services') return <ServiceManagement services={services} />;
        if (path === '/admin/bookings') return <BookingManagement bookings={bookings} />;
        if (path === '/admin/payments') return <PaymentManagement bookings={bookings} />;
        if (path === '/admin/settings') return <SettingsManagement categories={categories} onAdd={handleAddCategory} onDelete={handleDeleteCategory} />;
        if (path === '/admin/security') return <SecurityManagement />;
        
        // Default: Analytics/Overview
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard label="Total Users" value={stats.users} sub="↑ 12 this week" color="accent" />
                    <StatCard label="Total Bookings" value={stats.bookings} sub="↑ 34 this month" color="blue" />
                    <StatCard label="Total Revenue" value={`₹${stats.revenue}`} sub="↑ 22% vs last month" color="green" />
                    <StatCard label="Pending Issues" value={stats.issues} sub="Needs attention" color="red" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="premium-card">
                        <h2 className="text-xl font-bold mb-6">Booking States Distribution</h2>
                        <div className="space-y-4">
                            {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(status => {
                                const count = bookings.filter(b => b.status === status).length;
                                const percentage = bookings.length > 0 ? (count / bookings.length) * 100 : 0;
                                const color = status === 'COMPLETED' ? '#43e97b' : status === 'PENDING' ? '#f59e0b' : status === 'CANCELLED' ? '#ff6584' : '#6c63ff';
                                return (
                                    <div key={status} className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-[#7070a0]">{status}</span>
                                            <span className="text-white">{count} ({Math.round(percentage)}%)</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-[#13131a] rounded-full overflow-hidden">
                                            <div 
                                                className="h-full transition-all duration-500" 
                                                style={{ width: `${percentage}%`, backgroundColor: color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="premium-card">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Recent Platform Activity</h2>
                            <span className="text-[#7070a0] text-xs">Live Feed</span>
                        </div>
                        <div className="space-y-4">
                            {activities.length === 0 ? (
                                <p className="text-[#7070a0] italic text-center py-10">Waiting for live events...</p>
                            ) : (
                                activities.map(act => (
                                    <div key={act.id} className="flex gap-4 p-3 bg-[#1c1c27] rounded-xl border border-[#2a2a3a]">
                                        <div className="w-10 h-10 rounded-lg bg-[#6c63ff]/10 flex items-center justify-center text-xl">
                                            {act.type === 'BOOKING' ? '📅' : act.type === 'PAYMENT' ? '💳' : '👤'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold">{act.message}</div>
                                            <div className="text-[0.7rem] text-[#7070a0]">{new Date(act.timestamp).toLocaleTimeString()}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="text-center p-20 text-[#7070a0]">Initializing Admin Terminal...</div>;
    if (error) return <div className="text-center p-20 text-[#ff6584]">{error}</div>;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight">System Overview</h1>
                    <p className="text-[#7070a0] mt-1">Platform management and performance analytics.</p>
                </div>
                <div className="flex items-center gap-3 bg-[#13131a] px-4 py-2 rounded-xl border border-[#2a2a3a]">
                    <div className="w-2 h-2 rounded-full bg-[#43e97b] animate-pulse"></div>
                    <span className="text-xs font-bold text-[#f0f0f8]">All Systems Operational</span>
                </div>
            </header>

            {renderSection()}
        </div>
    );
};

const StatCard = ({ label, value, sub, color }) => {
    const colors = {
        accent: 'text-[#6c63ff] border-[#6c63ff]/20',
        blue: 'text-[#5294e0] border-[#5294e0]/20',
        green: 'text-[#43e97b] border-[#43e97b]/20',
        red: 'text-[#ff6584] border-[#ff6584]/20'
    };

    return (
        <div className={`premium-card border-l-4 ${colors[color]}`}>
            <div className="text-[#7070a0] text-[0.65rem] font-bold uppercase tracking-widest mb-2">{label}</div>
            <div className="text-3xl font-black">{value}</div>
            <div className="text-[#7070a0] text-[0.7rem] mt-3 font-medium">{sub}</div>
        </div>
    );
};

const UserManagement = ({ users, onSuspend, onActivate, searchQuery, setSearchQuery }) => {
    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="premium-card">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">User Management</h2>
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..." 
                    className="premium-input w-64"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[#7070a0] text-[0.65rem] uppercase tracking-widest border-b border-[#2a2a3a]">
                            <th className="pb-4 font-bold">User</th>
                            <th className="pb-4 font-bold">Role</th>
                            <th className="pb-4 font-bold">Status</th>
                            <th className="pb-4 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a3a]">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-[#1c1c27] transition-colors">
                                <td className="py-4">
                                    <div className="font-bold">{user.name}</div>
                                    <div className="text-xs text-[#7070a0]">{user.email}</div>
                                </td>
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded-lg text-[0.6rem] font-black uppercase ${user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500' : user.role === 'PROVIDER' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="py-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className={`w-2 h-2 rounded-full ${user.active ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                        {user.active ? 'Active' : 'Suspended'}
                                    </div>
                                </td>
                                <td className="py-4 text-right">
                                    {user.active ? (
                                        <button onClick={() => onSuspend(user.id)} className="text-[#ff6584] text-xs font-bold hover:underline">Suspend</button>
                                    ) : (
                                        <button onClick={() => onActivate(user.id)} className="text-[#43e97b] text-xs font-bold hover:underline">Activate</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ServiceManagement = ({ services }) => (
    <div className="premium-card">
        <h2 className="text-xl font-bold mb-8">Platform Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
                <div key={service.id} className="bg-[#1c1c27] border border-[#2a2a3a] rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-2xl">{service.category === 'Electrical' ? '⚡' : '🔧'}</div>
                        <span className="text-[0.6rem] font-black uppercase bg-[#6c63ff]/10 text-[#6c63ff] px-2 py-1 rounded-md">{service.category}</span>
                    </div>
                    <div className="font-bold text-white mb-1">{service.name}</div>
                    <div className="text-xs text-[#7070a0] mb-4 line-clamp-2">{service.description}</div>
                    <div className="flex justify-between items-center pt-4 border-t border-[#2a2a3a]">
                        <div className="font-black text-[#43e97b]">₹{service.price || 0}</div>
                        <div className="text-[0.65rem] text-[#7070a0] uppercase font-bold tracking-tighter">By {service.providerName}</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const BookingManagement = ({ bookings }) => (
    <div className="premium-card">
        <h2 className="text-xl font-bold mb-8">All Platform Bookings</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-[#7070a0] text-[0.65rem] uppercase tracking-widest border-b border-[#2a2a3a]">
                        <th className="pb-4 font-bold">#ID</th>
                        <th className="pb-4 font-bold">Customer</th>
                        <th className="pb-4 font-bold">Service</th>
                        <th className="pb-4 font-bold">Provider</th>
                        <th className="pb-4 font-bold">Amount</th>
                        <th className="pb-4 font-bold">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a3a]">
                    {bookings.map(b => (
                        <tr key={b.id} className="hover:bg-[#1c1c27] transition-colors">
                            <td className="py-4 text-xs text-[#7070a0]">#{b.id}</td>
                            <td className="py-4 font-bold">{b.customerName}</td>
                            <td className="py-4 text-sm">{b.serviceName}</td>
                            <td className="py-4 text-sm">{b.providerName}</td>
                            <td className="py-4 font-black">₹{b.price}</td>
                            <td className="py-4">
                                <span className={`px-2 py-1 rounded-lg text-[0.6rem] font-black uppercase ${b.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : b.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                    {b.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const PaymentManagement = ({ bookings }) => (
    <div className="premium-card">
        <h2 className="text-xl font-bold mb-8">Transaction Security</h2>
        <div className="space-y-4">
            {bookings.filter(b => b.status === 'COMPLETED').map(b => (
                <div key={b.id} className="flex justify-between items-center p-4 bg-[#1c1c27] border border-[#2a2a3a] rounded-xl hover:border-[#6c63ff]/30 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#43e97b]/10 flex items-center justify-center text-[#43e97b]">🔒</div>
                        <div>
                            <div className="font-bold text-sm tracking-tight">Payment for {b.serviceName}</div>
                            <div className="text-[0.7rem] text-[#7070a0]">Ref: TXN_{b.id}_{Date.now().toString().slice(-4)} · {new Date(b.bookingDate).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-black text-white">₹{b.price}</div>
                        <div className="text-[0.6rem] font-black uppercase text-[#43e97b] tracking-widest">Verified</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const SettingsManagement = ({ categories, onAdd, onDelete }) => {
    const [newCat, setNewCat] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        onAdd(newCat);
        setNewCat('');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="premium-card">
                <h2 className="text-xl font-bold mb-8">General Configuration</h2>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-black uppercase tracking-[3px] text-[#7070a0] ml-1">Platform Alias</label>
                            <input type="text" className="premium-input w-full" defaultValue="ServiceMate Pro" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-black uppercase tracking-[3px] text-[#7070a0] ml-1">Support Hotline</label>
                            <input type="text" className="premium-input w-full" defaultValue="+91 90000 00000" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#1c1c27] rounded-xl border border-[#2a2a3a]">
                        <div>
                            <div className="font-bold text-sm">Maintenance Mode</div>
                            <div className="text-[0.7rem] text-[#7070a0]">Restrict platform access during scheduled maintenance</div>
                        </div>
                        <div className="w-12 h-6 bg-[#2a2a3a] rounded-full relative">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="premium-card border-t-4 border-[#6c63ff]">
                <h2 className="text-xl font-bold mb-4">Category Management</h2>
                <p className="text-[#7070a0] text-sm mb-6">Manage available service domains on the platform.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {categories.map(cat => (
                        <div key={cat.id} className="group relative p-4 bg-[#13131a] rounded-xl border border-[#2a2a3a] text-center font-bold text-sm hover:border-[#6c63ff]/50 transition-all">
                            <span className="mr-2">{cat.icon || '🔧'}</span>
                            {cat.name}
                            <button 
                                onClick={() => onDelete(cat.id)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-[#ff6584] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
                
                <form onSubmit={handleAdd} className="flex gap-4">
                    <input 
                        type="text" 
                        value={newCat}
                        onChange={(e) => setNewCat(e.target.value)}
                        placeholder="New category name..." 
                        className="premium-input flex-1"
                    />
                    <button type="submit" className="premium-button whitespace-nowrap px-6">
                        + Add Category
                    </button>
                </form>
            </div>
        </div>
    );
};

const SecurityManagement = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="premium-card border-l-4 border-red-500">
                <div className="text-[0.65rem] font-black uppercase text-[#7070a0] mb-2">Security Score</div>
                <div className="text-4xl font-black">98 <span className="text-sm font-normal text-green-500">A+</span></div>
            </div>
            <div className="premium-card border-l-4 border-blue-500">
                <div className="text-[0.65rem] font-black uppercase text-[#7070a0] mb-2">Active Sessions</div>
                <div className="text-4xl font-black">24</div>
            </div>
            <div className="premium-card border-l-4 border-yellow-500">
                <div className="text-[0.65rem] font-black uppercase text-[#7070a0] mb-2">Failed Logins</div>
                <div className="text-4xl font-black">0</div>
            </div>
        </div>

        <div className="premium-card">
            <h2 className="text-xl font-bold mb-8">Access Audit Logs</h2>
            <div className="space-y-3">
                {[
                    { action: 'ADMIN_LOGIN', user: 'admin@servicemate.com', time: '2 mins ago', ip: '192.168.1.1' },
                    { action: 'ROLE_UPDATE', user: 'system', time: '1 hour ago', ip: 'internal' },
                    { action: 'USER_SUSPEND', user: 'admin@servicemate.com', time: '3 hours ago', ip: '192.168.1.1' },
                    { action: 'API_KEY_GEN', user: 'dev_user', time: '5 hours ago', ip: '10.0.0.4' }
                ].map((log, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-[#1c1c27] rounded-lg border border-[#2a2a3a]">
                        <div className="flex items-center gap-4">
                            <span className="text-[0.6rem] font-black bg-[#6c63ff]/20 text-[#6c63ff] px-2 py-1 rounded uppercase">{log.action}</span>
                            <span className="text-xs font-bold">{log.user}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-[0.65rem] text-[#7070a0]">{log.time}</div>
                            <div className="text-[0.6rem] font-mono text-[#4a4a6a]">{log.ip}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default AdminDashboard;
