import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api, { Socket, UserAPI, BookingAPI, AdminAPI, ServiceAPI, CategoryAPI, CouponAPI } from './api';

const LS_ALIAS = 'servicemate_admin_platform_alias';
const LS_HOTLINE = 'servicemate_admin_support_hotline';
const LS_MAINT = 'servicemate_admin_maintenance';

const SECTION_META = {
    '/admin': { title: 'System Overview', subtitle: 'Platform management and performance analytics.' },
    '/admin/users': { title: 'User Management', subtitle: 'Roles, access control, and account status.' },
    '/admin/services': { title: 'Services Catalog', subtitle: 'All provider listings across the marketplace.' },
    '/admin/bookings': { title: 'Bookings Operations', subtitle: 'Lifecycle control for every reservation.' },
    '/admin/payments': { title: 'Payments & Settlement', subtitle: 'Completed transactions and references.' },
    '/admin/reviews': { title: 'Review Moderation', subtitle: 'Reported reviews and visibility controls.' },
    '/admin/coupons': { title: 'Promo Codes', subtitle: 'Create and audit discount coupons.' },
    '/admin/settings': { title: 'Platform Settings', subtitle: 'Branding, categories, and operational toggles.' },
    '/admin/security': { title: 'Security Posture', subtitle: 'Sessions, signals, and audit context.' }
};

const enrichBookings = (rawBookings, users, services) => {
    const userMap = new Map(users.map(u => [u.id, u]));
    const serviceMap = new Map(services.map(s => [s.id, s]));
    return rawBookings.map(b => {
        const svc = serviceMap.get(b.serviceId);
        const customer = userMap.get(b.customerId);
        const provider = svc ? userMap.get(svc.providerId) : null;
        return {
            ...b,
            customerName: customer?.name ?? `User #${b.customerId}`,
            serviceName: svc?.name ?? `Service #${b.serviceId}`,
            providerName: provider?.name ?? '—',
            price: svc?.price ?? 0
        };
    });
};

const categoryEmoji = (category) => {
    const c = (category || '').toLowerCase();
    if (c.includes('electric')) return '⚡';
    if (c.includes('plumb')) return '🔧';
    if (c.includes('clean')) return '🧹';
    if (c.includes('paint')) return '🎨';
    if (c.includes('carpent')) return '🪚';
    return '🔧';
};

const activityIcon = (type) => {
    if (!type) return '📌';
    const t = String(type).toUpperCase();
    if (t.includes('BOOKING')) return '📅';
    if (t.includes('PAYMENT')) return '💳';
    if (t.includes('USER')) return '👤';
    return '⚡';
};

const formatRupee = (n) => {
    const v = Number(n);
    if (Number.isNaN(v)) return '₹0';
    return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const AdminDashboard = () => {
    const location = useLocation();
    const refreshDebounceRef = useRef(null);
    const [users, setUsers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [reviewReports, setReviewReports] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [activities, setActivities] = useState([]);
    const [overview, setOverview] = useState({});
    const [onlineSnapshot, setOnlineSnapshot] = useState({ count: null });
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
                BookingAPI.getAll(0, 500),
                ServiceAPI.getAll(),
                AdminAPI.getOverview(),
                CategoryAPI.getAll(),
                AdminAPI.getReportedReviews(),
                CouponAPI.getAll(),
                UserAPI.getOnlineCount()
            ]);

            const [
                usersResult,
                bookingsResult,
                servicesResult,
                overviewResult,
                categoriesResult,
                reportsResult,
                couponsResult,
                onlineResult
            ] = results;

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
            const bookingRaw = asArray(unwrap(bookingsResult, []));
            const serviceData = asArray(unwrap(servicesResult, []));
            const catData = asArray(unwrap(categoriesResult, []));
            const statsData = unwrap(overviewResult, {}) || {};
            const reportsData = asArray(unwrap(reportsResult, []));
            const couponData = asArray(unwrap(couponsResult, []));
            const onlineData = unwrap(onlineResult, {});

            const bookingData = enrichBookings(bookingRaw, userData, serviceData);

            const failedRequests = results.filter(result => result.status === 'rejected');

            setUsers(userData);
            setBookings(bookingData);
            setServices(serviceData);
            setCategories(catData);
            setOverview(statsData);
            setReviewReports(reportsData);
            setCoupons(couponData);
            setOnlineSnapshot({
                count: typeof onlineData.count === 'number' ? onlineData.count : onlineData?.count ?? null
            });
            setStats({
                users: statsData.totalUsers ?? userData.length,
                bookings: statsData.totalBookings ?? bookingData.length,
                revenue: statsData.totalRevenue ?? 0,
                issues: statsData.pendingIssues ?? statsData.pendingBookings ?? 0
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

    const queueRefresh = useCallback(() => {
        if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
        refreshDebounceRef.current = setTimeout(() => {
            fetchData();
            refreshDebounceRef.current = null;
        }, 700);
    }, [fetchData]);

    useEffect(() => {
        fetchData();

        Socket.connect(() => {
            Socket.subscribe('/topic/admin/activity-feed', (payload) => {
                const data = typeof payload === 'string' ? (() => { try { return JSON.parse(payload); } catch { return { message: payload }; } })() : payload;
                setActivities(prev => [{ ...data, id: Date.now() + Math.random() }, ...prev].slice(0, 12));
                queueRefresh();
            });
        });

        return () => {
            if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
        };
    }, [fetchData, queueRefresh]);

    const currentUserId = Number(localStorage.getItem('userId')) || null;

    const handleSuspendUser = async (userId) => {
        try {
            await UserAPI.suspend(userId);
            fetchData();
            api.toast('User suspended.', 'success');
        } catch (err) {
            api.toast(err.response?.data?.message || 'Failed to suspend user.', 'error');
        }
    };

    const handleActivateUser = async (userId) => {
        try {
            await UserAPI.activate(userId);
            fetchData();
            api.toast('User activated.', 'success');
        } catch (err) {
            api.toast(err.response?.data?.message || 'Failed to activate user.', 'error');
        }
    };

    const handleRoleChange = async (userId, role) => {
        try {
            await UserAPI.updateRole(userId, role);
            fetchData();
            api.toast('Role updated.', 'success');
        } catch (err) {
            api.toast(err.response?.data?.message || err.response?.data?.error || 'Failed to update role.', 'error');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (userId === currentUserId) {
            api.toast('You cannot delete your own admin account from here.', 'error');
            return;
        }
        if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
        try {
            await UserAPI.delete(userId);
            fetchData();
            api.toast('User deleted.', 'success');
        } catch (err) {
            api.toast(err.response?.data?.message || 'Failed to delete user.', 'error');
        }
    };

    const handleBookingAction = async (bookingId, action) => {
        try {
            if (action === 'confirm') await BookingAPI.confirm(bookingId);
            else if (action === 'complete') await BookingAPI.complete(bookingId);
            else if (action === 'cancel') await BookingAPI.cancel(bookingId);
            fetchData();
            const verb = action === 'confirm' ? 'confirmed' : action === 'complete' ? 'completed' : 'cancelled';
            api.toast(`Booking ${verb}.`, 'success');
        } catch (err) {
            api.toast(err.response?.data?.message || `Failed to ${action} booking.`, 'error');
        }
    };

    const handleAddCategory = async (name) => {
        if (!name?.trim()) return;
        try {
            await CategoryAPI.create({ name: name.trim(), icon: '🔧' });
            fetchData();
            api.toast('Category added.', 'success');
        } catch (err) {
            api.toast(err.response?.data?.message || 'Failed to add category.', 'error');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            await CategoryAPI.delete(id);
            fetchData();
            api.toast('Category removed.', 'success');
        } catch (err) {
            api.toast(err.response?.data?.message || 'Failed to delete category.', 'error');
        }
    };

    const reviewIdFromReport = (report) => report?.review?.id ?? report?.reviewId ?? null;

    const handleApproveReview = async (report) => {
        const rid = reviewIdFromReport(report);
        if (!rid) {
            api.toast('Could not resolve review id.', 'error');
            return;
        }
        try {
            await AdminAPI.approveReview(rid);
            fetchData();
            api.toast('Review approved and reports cleared.', 'success');
        } catch (err) {
            api.toast(err.response?.data?.message || 'Approve failed.', 'error');
        }
    };

    const handleDismissReports = async (report) => {
        const rid = reviewIdFromReport(report);
        if (!rid) return;
        try {
            await AdminAPI.dismissReports(rid);
            fetchData();
            api.toast('Reports dismissed.', 'success');
        } catch (err) {
            api.toast(err.response?.data?.message || 'Dismiss failed.', 'error');
        }
    };

    const handleDeleteReview = async (report) => {
        const rid = reviewIdFromReport(report);
        if (!rid) return;
        if (!window.confirm('Delete this review permanently?')) return;
        try {
            await AdminAPI.deleteReview(rid);
            fetchData();
            api.toast('Review deleted.', 'success');
        } catch (err) {
            api.toast(err.response?.data?.message || 'Delete failed.', 'error');
        }
    };

    const renderSection = () => {
        const path = location.pathname;

        if (path === '/admin/users') {
            return (
                <UserManagement
                    users={users}
                    currentUserId={currentUserId}
                    onSuspend={handleSuspendUser}
                    onActivate={handleActivateUser}
                    onRoleChange={handleRoleChange}
                    onDelete={handleDeleteUser}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            );
        }
        if (path === '/admin/services') return <ServiceManagement services={services} />;
        if (path === '/admin/bookings') return <BookingManagement bookings={bookings} onAction={handleBookingAction} />;
        if (path === '/admin/payments') return <PaymentManagement bookings={bookings} />;
        if (path === '/admin/reviews') {
            return (
                <ReviewModeration
                    reports={reviewReports}
                    onApprove={handleApproveReview}
                    onDismiss={handleDismissReports}
                    onDeleteReview={handleDeleteReview}
                />
            );
        }
        if (path === '/admin/coupons') return <CouponManagement coupons={coupons} onCreated={() => fetchData()} />;
        if (path === '/admin/settings') {
            return (
                <SettingsManagement
                    categories={categories}
                    onAdd={handleAddCategory}
                    onDelete={handleDeleteCategory}
                />
            );
        }
        if (path === '/admin/security') {
            return (
                <SecurityManagement
                    onlineCount={onlineSnapshot.count}
                    reportedCount={reviewReports.length}
                    pendingBookings={overview.pendingBookings ?? 0}
                    activities={activities}
                />
            );
        }

        const userSub = `${overview.totalCustomers ?? '—'} customers · ${overview.totalProviders ?? '—'} providers`;
        const bookingSub = `${overview.pendingBookings ?? '—'} pending · ${overview.completedBookings ?? '—'} completed`;
        const revenueSub = `${overview.completedBookings ?? '—'} paid completions`;
        const issuesSub = `${overview.pendingBookings ?? stats.issues} bookings awaiting action`;

        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard label="Total Users" value={stats.users} sub={userSub} color="accent" />
                    <StatCard label="Total Bookings" value={stats.bookings} sub={bookingSub} color="blue" />
                    <StatCard label="Total Revenue" value={formatRupee(stats.revenue)} sub={revenueSub} color="green" />
                    <StatCard label="Attention Queue" value={stats.issues} sub={issuesSub} color="red" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="premium-card">
                        <h2 className="text-xl font-bold mb-6">Booking States Distribution</h2>
                        <div className="space-y-4">
                            {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(status => {
                                const count =
                                    status === 'PENDING'
                                        ? overview.pendingBookings
                                        : status === 'CONFIRMED'
                                          ? overview.confirmedBookings
                                          : status === 'COMPLETED'
                                            ? overview.completedBookings
                                            : overview.cancelledBookings;
                                const resolved =
                                    typeof count === 'number'
                                        ? count
                                        : bookings.filter(b => b.status === status).length;
                                const denom =
                                    typeof overview.totalBookings === 'number' && overview.totalBookings > 0
                                        ? overview.totalBookings
                                        : bookings.length;
                                const percentage = denom > 0 ? (resolved / denom) * 100 : 0;
                                const color =
                                    status === 'COMPLETED'
                                        ? '#43e97b'
                                        : status === 'PENDING'
                                          ? '#f59e0b'
                                          : status === 'CANCELLED'
                                            ? '#ff6584'
                                            : '#6c63ff';
                                return (
                                    <div key={status} className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-[#7070a0]">{status}</span>
                                            <span className="text-white">
                                                {resolved} ({Math.round(percentage)}%)
                                            </span>
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
                                    <div
                                        key={act.id}
                                        className="flex gap-4 p-3 bg-[#1c1c27] rounded-xl border border-[#2a2a3a]"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[#6c63ff]/10 flex items-center justify-center text-xl">
                                            {activityIcon(act.type)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold">{act.message}</div>
                                            <div className="text-[0.7rem] text-[#7070a0]">
                                                {act.timestamp
                                                    ? new Date(act.timestamp).toLocaleString()
                                                    : 'Just now'}
                                            </div>
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
    if (error) {
        return (
            <div className="text-center p-20 space-y-4">
                <p className="text-[#ff6584]">{error}</p>
                <button type="button" className="premium-button px-6" onClick={() => { setLoading(true); fetchData(); }}>
                    Retry
                </button>
            </div>
        );
    }

    const meta = SECTION_META[location.pathname] || SECTION_META['/admin'];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-wrap justify-between items-start gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight">{meta.title}</h1>
                    <p className="text-[#7070a0] mt-1">{meta.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => fetchData()}
                        className="premium-button px-4 py-2 text-xs whitespace-nowrap"
                    >
                        Refresh data
                    </button>
                    <div className="flex items-center gap-3 bg-[#13131a] px-4 py-2 rounded-xl border border-[#2a2a3a]">
                        <div className="w-2 h-2 rounded-full bg-[#43e97b] animate-pulse" />
                        <span className="text-xs font-bold text-[#f0f0f8]">Operational</span>
                    </div>
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
            <div className="text-[#7070a0] text-[0.7rem] mt-3 font-medium leading-snug">{sub}</div>
        </div>
    );
};

const UserManagement = ({
    users,
    currentUserId,
    onSuspend,
    onActivate,
    onRoleChange,
    onDelete,
    searchQuery,
    setSearchQuery
}) => {
    const filteredUsers = users.filter(u => {
        const q = searchQuery.toLowerCase();
        return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });

    return (
        <div className="premium-card">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h2 className="text-xl font-bold">Directory</h2>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="premium-input w-64 max-w-full"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[720px]">
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
                                    <div className="font-bold">{user.name || '—'}</div>
                                    <div className="text-xs text-[#7070a0]">{user.email || '—'}</div>
                                </td>
                                <td className="py-4">
                                    <select
                                        className="bg-[#13131a] border border-[#2a2a3a] rounded-lg px-2 py-1 text-xs font-bold text-white"
                                        value={user.role || 'CUSTOMER'}
                                        disabled={user.id === currentUserId}
                                        onChange={e => onRoleChange(user.id, e.target.value)}
                                        title={user.id === currentUserId ? 'Change your own role from another admin account.' : ''}
                                    >
                                        {['CUSTOMER', 'PROVIDER', 'ADMIN'].map(r => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="py-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className={`w-2 h-2 rounded-full ${user.active ? 'bg-green-500' : 'bg-gray-500'}`} />
                                        {user.active ? 'Active' : 'Suspended'}
                                    </div>
                                </td>
                                <td className="py-4 text-right space-x-3 whitespace-nowrap">
                                    {user.active ? (
                                        <button
                                            type="button"
                                            onClick={() => onSuspend(user.id)}
                                            className="text-[#ff6584] text-xs font-bold hover:underline"
                                        >
                                            Suspend
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => onActivate(user.id)}
                                            className="text-[#43e97b] text-xs font-bold hover:underline"
                                        >
                                            Activate
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onDelete(user.id)}
                                        disabled={user.id === currentUserId}
                                        className="text-[#7070a0] text-xs font-bold hover:text-white hover:underline disabled:opacity-30 disabled:hover:no-underline"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ServiceManagement = ({ services }) => {
    const [q, setQ] = useState('');
    const filtered = services.filter(s => {
        const n = q.toLowerCase();
        return (
            (s.name || '').toLowerCase().includes(n) ||
            (s.description || '').toLowerCase().includes(n) ||
            (s.category || '').toLowerCase().includes(n)
        );
    });

    return (
        <div className="premium-card">
            <div className="flex flex-wrap justify-between gap-4 mb-8">
                <h2 className="text-xl font-bold">Platform Services</h2>
                <input
                    type="search"
                    placeholder="Filter services..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    className="premium-input w-64 max-w-full"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(service => (
                    <div key={service.id} className="bg-[#1c1c27] border border-[#2a2a3a] rounded-2xl p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-2xl">{categoryEmoji(service.category)}</div>
                            <span className="text-[0.6rem] font-black uppercase bg-[#6c63ff]/10 text-[#6c63ff] px-2 py-1 rounded-md">
                                {service.category || 'General'}
                            </span>
                        </div>
                        <div className="font-bold text-white mb-1">{service.name}</div>
                        <div className="text-xs text-[#7070a0] mb-4 line-clamp-3">{service.description}</div>
                        <div className="flex justify-between items-center pt-4 border-t border-[#2a2a3a]">
                            <div className="font-black text-[#43e97b]">{formatRupee(service.price || 0)}</div>
                            <div className="text-[0.65rem] text-[#7070a0] uppercase font-bold tracking-tighter">
                                By {service.providerName || 'Provider'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {filtered.length === 0 && <p className="text-[#7070a0] text-center py-12">No services match your filter.</p>}
        </div>
    );
};

const BookingManagement = ({ bookings, onAction }) => {
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [q, setQ] = useState('');

    const rows = bookings.filter(b => {
        if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
        const n = q.toLowerCase();
        if (!n) return true;
        return (
            String(b.id).includes(n) ||
            (b.customerName || '').toLowerCase().includes(n) ||
            (b.serviceName || '').toLowerCase().includes(n)
        );
    });

    return (
        <div className="premium-card">
            <div className="flex flex-wrap justify-between gap-4 mb-8">
                <h2 className="text-xl font-bold">All Platform Bookings</h2>
                <div className="flex flex-wrap gap-2 items-center">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="premium-input text-xs py-2"
                    >
                        {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(s => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <input
                        type="search"
                        placeholder="Search ID, customer, service..."
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        className="premium-input w-56 max-w-full text-sm"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                    <thead>
                        <tr className="text-[#7070a0] text-[0.65rem] uppercase tracking-widest border-b border-[#2a2a3a]">
                            <th className="pb-4 font-bold">#ID</th>
                            <th className="pb-4 font-bold">Schedule</th>
                            <th className="pb-4 font-bold">Customer</th>
                            <th className="pb-4 font-bold">Service</th>
                            <th className="pb-4 font-bold">Provider</th>
                            <th className="pb-4 font-bold">Amount</th>
                            <th className="pb-4 font-bold">Status</th>
                            <th className="pb-4 font-bold text-right">Ops</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a3a]">
                        {rows.map(b => (
                            <tr key={b.id} className="hover:bg-[#1c1c27] transition-colors">
                                <td className="py-4 text-xs text-[#7070a0]">#{b.id}</td>
                                <td className="py-4 text-xs text-[#7070a0]">
                                    {b.bookingDate ? new Date(b.bookingDate).toLocaleString() : '—'}
                                </td>
                                <td className="py-4 font-bold">{b.customerName}</td>
                                <td className="py-4 text-sm">{b.serviceName}</td>
                                <td className="py-4 text-sm">{b.providerName}</td>
                                <td className="py-4 font-black">{formatRupee(b.price)}</td>
                                <td className="py-4">
                                    <span
                                        className={`px-2 py-1 rounded-lg text-[0.6rem] font-black uppercase ${
                                            b.status === 'COMPLETED'
                                                ? 'bg-green-500/10 text-green-500'
                                                : b.status === 'PENDING'
                                                  ? 'bg-yellow-500/10 text-yellow-500'
                                                  : b.status === 'CANCELLED'
                                                    ? 'bg-red-500/10 text-red-400'
                                                    : 'bg-blue-500/10 text-blue-500'
                                        }`}
                                    >
                                        {b.status}
                                    </span>
                                </td>
                                <td className="py-4 text-right space-x-2 whitespace-nowrap">
                                    {b.status === 'PENDING' && (
                                        <>
                                            <button
                                                type="button"
                                                className="text-[#43e97b] text-xs font-bold hover:underline"
                                                onClick={() => onAction(b.id, 'confirm')}
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                type="button"
                                                className="text-[#ff6584] text-xs font-bold hover:underline"
                                                onClick={() => onAction(b.id, 'cancel')}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    {b.status === 'CONFIRMED' && (
                                        <>
                                            <button
                                                type="button"
                                                className="text-[#43e97b] text-xs font-bold hover:underline"
                                                onClick={() => onAction(b.id, 'complete')}
                                            >
                                                Complete
                                            </button>
                                            <button
                                                type="button"
                                                className="text-[#7070a0] text-xs font-bold hover:underline"
                                                onClick={() => onAction(b.id, 'cancel')}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {rows.length === 0 && <p className="text-[#7070a0] text-center py-10">No bookings in this view.</p>}
        </div>
    );
};

const PaymentManagement = ({ bookings }) => {
    const completed = bookings.filter(b => b.status === 'COMPLETED');
    const total = completed.reduce((s, b) => s + (Number(b.price) || 0), 0);

    return (
        <div className="premium-card space-y-8">
            <div className="flex flex-wrap justify-between gap-4 items-end">
                <div>
                    <h2 className="text-xl font-bold mb-1">Verified completions</h2>
                    <p className="text-[#7070a0] text-sm">{completed.length} transactions · {formatRupee(total)} recorded</p>
                </div>
            </div>
            <div className="space-y-4">
                {completed.length === 0 && (
                    <p className="text-[#7070a0] text-center py-12">No completed bookings with settlement yet.</p>
                )}
                {completed.map(b => (
                    <div
                        key={b.id}
                        className="flex justify-between items-center p-4 bg-[#1c1c27] border border-[#2a2a3a] rounded-xl hover:border-[#6c63ff]/30 transition-all gap-4 flex-wrap"
                    >
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#43e97b]/10 flex items-center justify-center text-[#43e97b] shrink-0">
                                🔒
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-sm tracking-tight truncate">Payment for {b.serviceName}</div>
                                <div className="text-[0.7rem] text-[#7070a0]">
                                    Ref: TXN-{String(b.id).padStart(6, '0')} ·{' '}
                                    {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : '—'}
                                </div>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-lg font-black text-white">{formatRupee(b.price)}</div>
                            <div className="text-[0.6rem] font-black uppercase text-[#43e97b] tracking-widest">Verified</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SettingsManagement = ({ categories, onAdd, onDelete }) => {
    const [newCat, setNewCat] = useState('');
    const [alias, setAlias] = useState(() => localStorage.getItem(LS_ALIAS) || 'ServiceMate Pro');
    const [hotline, setHotline] = useState(() => localStorage.getItem(LS_HOTLINE) || '+91 90000 00000');
    const [maintenance, setMaintenance] = useState(() => localStorage.getItem(LS_MAINT) === 'true');

    useEffect(() => {
        localStorage.setItem(LS_ALIAS, alias);
    }, [alias]);

    useEffect(() => {
        localStorage.setItem(LS_HOTLINE, hotline);
    }, [hotline]);

    useEffect(() => {
        localStorage.setItem(LS_MAINT, maintenance ? 'true' : 'false');
    }, [maintenance]);

    const handleAdd = e => {
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
                            <label className="text-[0.65rem] font-black uppercase tracking-[3px] text-[#7070a0] ml-1">
                                Platform Alias
                            </label>
                            <input
                                type="text"
                                className="premium-input w-full"
                                value={alias}
                                onChange={e => setAlias(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-black uppercase tracking-[3px] text-[#7070a0] ml-1">
                                Support Hotline
                            </label>
                            <input
                                type="text"
                                className="premium-input w-full"
                                value={hotline}
                                onChange={e => setHotline(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => api.toast('Settings saved locally for this browser.', 'success')}
                        className="premium-button text-xs px-5 py-2"
                    >
                        Save branding (local)
                    </button>
                    <div className="flex items-center justify-between p-4 bg-[#1c1c27] rounded-xl border border-[#2a2a3a] gap-4">
                        <div>
                            <div className="font-bold text-sm">Maintenance Mode</div>
                            <div className="text-[0.7rem] text-[#7070a0]">
                                Flag stored locally — wire to backend when available.
                            </div>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={maintenance}
                            onClick={() => setMaintenance(m => !m)}
                            className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${maintenance ? 'bg-[#6c63ff]' : 'bg-[#2a2a3a]'}`}
                        >
                            <span
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${maintenance ? 'left-7' : 'left-1'}`}
                            />
                        </button>
                    </div>
                </div>
            </div>
            <div className="premium-card border-t-4 border-[#6c63ff]">
                <h2 className="text-xl font-bold mb-4">Category Management</h2>
                <p className="text-[#7070a0] text-sm mb-6">Manage available service domains on the platform.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {categories.map(cat => (
                        <div
                            key={cat.id}
                            className="group relative p-4 bg-[#13131a] rounded-xl border border-[#2a2a3a] text-center font-bold text-sm hover:border-[#6c63ff]/50 transition-all"
                        >
                            <span className="mr-2">{cat.icon || '🔧'}</span>
                            {cat.name}
                            <button
                                type="button"
                                onClick={() => onDelete(cat.id)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-[#ff6584] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleAdd} className="flex gap-4 flex-wrap">
                    <input
                        type="text"
                        value={newCat}
                        onChange={e => setNewCat(e.target.value)}
                        placeholder="New category name..."
                        className="premium-input flex-1 min-w-[200px]"
                    />
                    <button type="submit" className="premium-button whitespace-nowrap px-6">
                        + Add Category
                    </button>
                </form>
            </div>
        </div>
    );
};

const ReviewModeration = ({ reports, onApprove, onDismiss, onDeleteReview }) => {
    const groupedHint =
        reports.length === 0 ? (
            <p className="text-[#7070a0] text-center py-16">No open reports — community signals look calm.</p>
        ) : null;

    return (
        <div className="premium-card">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-bold">Reported reviews</h2>
                    <p className="text-[#7070a0] text-sm mt-1">{reports.length} report row(s) loaded</p>
                </div>
            </div>
            {groupedHint}
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[640px]">
                    <thead>
                        <tr className="text-[#7070a0] text-[0.65rem] uppercase tracking-widest border-b border-[#2a2a3a]">
                            <th className="pb-4 font-bold">Review</th>
                            <th className="pb-4 font-bold">Reason</th>
                            <th className="pb-4 font-bold">Reported</th>
                            <th className="pb-4 font-bold text-right">Moderation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a3a]">
                        {reports.map(report => {
                            const rid = report?.review?.id ?? report?.reviewId;
                            return (
                                <tr key={report.id} className="hover:bg-[#1c1c27] transition-colors">
                                    <td className="py-4 font-mono text-sm">#{rid ?? '—'}</td>
                                    <td className="py-4 text-sm max-w-xs">{report.reason}</td>
                                    <td className="py-4 text-xs text-[#7070a0]">
                                        {report.reportedAt ? new Date(report.reportedAt).toLocaleString() : '—'}
                                    </td>
                                    <td className="py-4 text-right space-x-2 whitespace-nowrap">
                                        <button
                                            type="button"
                                            className="text-[#43e97b] text-xs font-bold hover:underline"
                                            onClick={() => onApprove(report)}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            type="button"
                                            className="text-[#5294e0] text-xs font-bold hover:underline"
                                            onClick={() => onDismiss(report)}
                                        >
                                            Dismiss
                                        </button>
                                        <button
                                            type="button"
                                            className="text-[#ff6584] text-xs font-bold hover:underline"
                                            onClick={() => onDeleteReview(report)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CouponManagement = ({ coupons, onCreated }) => {
    const [code, setCode] = useState('');
    const [pct, setPct] = useState('10');
    const [maxUses, setMaxUses] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async e => {
        e.preventDefault();
        if (!code.trim()) {
            api.toast('Enter a coupon code.', 'error');
            return;
        }
        setBusy(true);
        try {
            await CouponAPI.create({
                code: code.trim().toUpperCase(),
                discountPercentage: Number(pct) || 0,
                maxUses: maxUses ? Number(maxUses) : null,
                validUntil: validUntil ? new Date(validUntil).toISOString() : null,
                isActive: true
            });
            setCode('');
            setPct('10');
            setMaxUses('');
            setValidUntil('');
            onCreated();
            api.toast('Coupon created.', 'success');
        } catch (err) {
            api.toast(err.response?.data?.message || 'Could not create coupon.', 'error');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="premium-card">
                <h2 className="text-xl font-bold mb-6">Issue coupon</h2>
                <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-[0.65rem] font-black uppercase text-[#7070a0]">Code</label>
                        <input
                            className="premium-input w-full"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            placeholder="SAVE20"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[0.65rem] font-black uppercase text-[#7070a0]">Discount %</label>
                        <input
                            type="number"
                            min={1}
                            max={90}
                            className="premium-input w-full"
                            value={pct}
                            onChange={e => setPct(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[0.65rem] font-black uppercase text-[#7070a0]">Max uses (optional)</label>
                        <input
                            type="number"
                            min={1}
                            className="premium-input w-full"
                            value={maxUses}
                            onChange={e => setMaxUses(e.target.value)}
                            placeholder="Unlimited"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[0.65rem] font-black uppercase text-[#7070a0]">Valid until</label>
                        <input
                            type="datetime-local"
                            className="premium-input w-full"
                            value={validUntil}
                            onChange={e => setValidUntil(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <button type="submit" disabled={busy} className="premium-button px-8">
                            {busy ? 'Saving…' : 'Create coupon'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="premium-card">
                <h3 className="text-lg font-bold mb-4">Active catalog</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[520px]">
                        <thead>
                            <tr className="text-[#7070a0] text-[0.65rem] uppercase border-b border-[#2a2a3a]">
                                <th className="pb-3 font-bold">Code</th>
                                <th className="pb-3 font-bold">%</th>
                                <th className="pb-3 font-bold">Uses</th>
                                <th className="pb-3 font-bold">Until</th>
                                <th className="pb-3 font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2a3a]">
                            {coupons.map(c => (
                                <tr key={c.id}>
                                    <td className="py-3 font-mono font-bold">{c.code}</td>
                                    <td className="py-3">{c.discountPercentage}%</td>
                                    <td className="py-3 text-sm text-[#7070a0]">
                                        {c.timesUsed ?? 0}
                                        {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                                    </td>
                                    <td className="py-3 text-xs text-[#7070a0]">
                                        {c.validUntil ? new Date(c.validUntil).toLocaleString() : '—'}
                                    </td>
                                    <td className="py-3">
                                        <span
                                            className={`text-[0.65rem] font-black uppercase px-2 py-1 rounded-md ${c.isActive ? 'bg-green-500/10 text-green-500' : 'bg-[#2a2a3a] text-[#7070a0]'}`}
                                        >
                                            {c.isActive ? 'Live' : 'Off'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {coupons.length === 0 && <p className="text-[#7070a0] py-8 text-center">No coupons yet.</p>}
            </div>
        </div>
    );
};

const SecurityManagement = ({ onlineCount, reportedCount, pendingBookings, activities }) => {
    const derivedScore = Math.max(
        72,
        Math.min(100, 100 - (reportedCount > 0 ? 8 : 0) - (pendingBookings > 12 ? 6 : 0))
    );
    const grade = derivedScore >= 95 ? 'A+' : derivedScore >= 85 ? 'A' : 'B';

    const auditFromLive = activities.slice(0, 6).map(a => ({
        action: a.type || 'EVENT',
        user: 'platform',
        time: a.timestamp ? new Date(a.timestamp).toLocaleString() : 'recent',
        ip: 'live feed'
    }));

    const seedLogs = [
        { action: 'ADMIN_LOGIN', user: 'admin@servicemate.com', time: 'baseline', ip: 'policy' },
        { action: 'ROLE_UPDATE', user: 'system', time: 'policy', ip: 'internal' }
    ];

    const auditLogs = [...auditFromLive, ...seedLogs];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="premium-card border-l-4 border-red-500">
                    <div className="text-[0.65rem] font-black uppercase text-[#7070a0] mb-2">Security Score</div>
                    <div className="text-4xl font-black">
                        {derivedScore}{' '}
                        <span className="text-sm font-normal text-green-500">{grade}</span>
                    </div>
                    <p className="text-[0.7rem] text-[#7070a0] mt-2">Weighted from moderation backlog & queue depth.</p>
                </div>
                <div className="premium-card border-l-4 border-blue-500">
                    <div className="text-[0.65rem] font-black uppercase text-[#7070a0] mb-2">Online users</div>
                    <div className="text-4xl font-black">{onlineCount ?? '—'}</div>
                    <p className="text-[0.7rem] text-[#7070a0] mt-2">From /api/users/online/count</p>
                </div>
                <div className="premium-card border-l-4 border-yellow-500">
                    <div className="text-[0.65rem] font-black uppercase text-[#7070a0] mb-2">Open review reports</div>
                    <div className="text-4xl font-black">{reportedCount}</div>
                    <p className="text-[0.7rem] text-[#7070a0] mt-2">{pendingBookings} bookings still pending</p>
                </div>
            </div>

            <div className="premium-card">
                <h2 className="text-xl font-bold mb-8">Access & activity context</h2>
                <div className="space-y-3">
                    {auditLogs.map((log, i) => (
                        <div
                            key={`${log.action}-${i}`}
                            className="flex justify-between items-center p-3 bg-[#1c1c27] rounded-lg border border-[#2a2a3a] gap-4 flex-wrap"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <span className="text-[0.6rem] font-black bg-[#6c63ff]/20 text-[#6c63ff] px-2 py-1 rounded uppercase shrink-0">
                                    {log.action}
                                </span>
                                <span className="text-xs font-bold truncate">{log.user}</span>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-[0.65rem] text-[#7070a0]">{log.time}</div>
                                <div className="text-[0.6rem] font-mono text-[#4a4a6a]">{log.ip}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
