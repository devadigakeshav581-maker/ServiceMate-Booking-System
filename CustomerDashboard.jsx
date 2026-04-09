import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { Socket, ServiceAPI, BookingAPI, CategoryAPI, PaymentAPI } from './api';
import Pagination from './Pagination';
import BookingModal from './BookingModal';
import ChatWindow from './ChatWindow';

const CustomerDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [monthlyBookingsCount, setMonthlyBookingsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [serviceSearch, setServiceSearch] = useState('');
    const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
    const [serviceSortBy, setServiceSortBy] = useState('POPULAR');
    const [notifications, setNotifications] = useState([]);
    const [activeChatBooking, setActiveChatBooking] = useState(null);
    const [liveNow, setLiveNow] = useState(new Date());
    const [favoriteServices, setFavoriteServices] = useState(() => {
        try {
            const raw = localStorage.getItem('customerFavoriteServices');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });
    const [reviewsByBooking, setReviewsByBooking] = useState(() => {
        try {
            const raw = localStorage.getItem('customerBookingReviews');
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });
    const [reviewModal, setReviewModal] = useState({ open: false, booking: null, rating: 5, comment: '' });
    const [paymentModal, setPaymentModal] = useState({ open: false, booking: null, method: 'UPI', processing: false });
    const [paymentHistory, setPaymentHistory] = useState(() => {
        try {
            const raw = localStorage.getItem('customerPaymentHistory');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });
    const name = localStorage.getItem('name') || 'User';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 5) return "Burning the midnight oil";
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const fetchData = useCallback(async () => {
        try {
            const role = localStorage.getItem('role');
            if (role !== 'CUSTOMER') {
                console.error('Access denied: User is not a customer');
                navigate('/login');
                return;
            }
            setError(null);
            const customerId = localStorage.getItem('userId');
            const [bookingsRes, servicesRes, categoriesRes, paymentsRes] = await Promise.allSettled([
                BookingAPI.getMy(),
                ServiceAPI.getAll(),
                CategoryAPI.getAll(),
                customerId ? PaymentAPI.getByCustomer(customerId) : Promise.resolve([])
            ]);

            if (bookingsRes.status === 'fulfilled') {
                const rawData = bookingsRes.value?.data || bookingsRes.value || [];
                const bookingData = Array.isArray(rawData) ? rawData : [];
                setBookings(bookingData);
                
                // Re-calculate monthly bookings whenever bookings are updated
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                const count = bookingData.filter((b) => {
                    const d = new Date(b.bookingDate);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                }).length;
                setMonthlyBookingsCount(count);
            } else {
                console.error('Failed to load bookings:', bookingsRes.reason);
                if (bookingsRes.reason?.response?.status === 401) {
                    navigate('/login');
                    return;
                }
            }

            if (servicesRes.status === 'fulfilled') {
                setServices(Array.isArray(servicesRes.value) ? servicesRes.value : []);
            } else {
                console.error('Failed to load services:', servicesRes.reason);
            }

            if (categoriesRes.status === 'fulfilled') {
                setCategories(Array.isArray(categoriesRes.value) ? categoriesRes.value : []);
            } else {
                console.error('Failed to load categories:', categoriesRes.reason);
            }

            if (paymentsRes.status === 'fulfilled') {
                const rawPayments = paymentsRes.value?.content || paymentsRes.value?.data || paymentsRes.value || [];
                setPaymentHistory(
                    Array.isArray(rawPayments)
                        ? rawPayments.map((payment) => ({
                              id: payment.id || payment.paymentId || Date.now(),
                              bookingId: payment.bookingId,
                              serviceName: payment.serviceName || payment.service || 'Service Payment',
                              amount: payment.amount || 0,
                              method: payment.paymentMethod || payment.method || 'UPI',
                              status: payment.status || 'SUCCESS',
                              at: payment.paymentDate || payment.createdAt || new Date().toISOString()
                          }))
                        : []
                );
            }
        } catch (err) {
            console.error('Error fetching customer data:', err);
            setError('Some dashboard sections could not be refreshed.');
            if (err.response && err.response.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        const clockId = setInterval(() => setLiveNow(new Date()), 1000);
        return () => clearInterval(clockId);
    }, []);

    useEffect(() => {
        localStorage.setItem('customerFavoriteServices', JSON.stringify(favoriteServices));
    }, [favoriteServices]);

    useEffect(() => {
        localStorage.setItem('customerBookingReviews', JSON.stringify(reviewsByBooking));
    }, [reviewsByBooking]);

    useEffect(() => {
        localStorage.setItem('customerPaymentHistory', JSON.stringify(paymentHistory));
    }, [paymentHistory]);

    useEffect(() => {
        fetchData();
        
        Socket.connect(() => {
            Socket.subscribe('/user/queue/notifications', (msg) => {
                const data = msg?.body ? JSON.parse(msg.body) : msg;
                setNotifications((prev) => [
                    { id: Date.now(), message: data?.message || 'Booking update received', time: new Date().toISOString() },
                    ...prev
                ].slice(0, 8));
                fetchData();
            });
        });

        const intervalId = setInterval(() => {
            fetchData();
        }, 20000);

        const handleFocus = () => fetchData();
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchData]);

    const handleCreateBooking = async (bookingData) => {
        try {
            const customerId = localStorage.getItem('userId');
            if (!customerId) {
                api.toast('Please log in again to book a service.', 'error');
                return;
            }
            await BookingAPI.create({ ...bookingData, customerId: parseInt(customerId) });
            setIsModalOpen(false);
            fetchData();
            api.toast('Booking request sent successfully!');
        } catch (err) {
            api.toast(err.response?.data?.message || 'Booking failed.', 'error');
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Cancel this booking?')) return;
        try {
            await BookingAPI.cancel(bookingId);
            fetchData();
        } catch (err) {
            alert('Failed to cancel.');
        }
    };

    const handleRebook = async (booking) => {
        try {
            const customerId = localStorage.getItem('userId');
            if (!customerId) {
                api.toast('Please log in again to rebook.', 'error');
                return;
            }
            await BookingAPI.create({
                customerId: parseInt(customerId),
                serviceId: booking.serviceId,
                address: booking.address || 'Address not provided',
                bookingDate: new Date().toISOString().split('T')[0]
            });
            api.toast('Service rebooked successfully!');
            fetchData();
        } catch (err) {
            api.toast('Rebooking failed. Please try again.', 'error');
        }
    };

    const toggleFavoriteService = (serviceName) => {
        setFavoriteServices((prev) =>
            prev.includes(serviceName)
                ? prev.filter((name) => name !== serviceName)
                : [...prev, serviceName]
        );
    };

    const openReviewModal = (booking) => {
        const existing = reviewsByBooking[String(booking.id)];
        setReviewModal({
            open: true,
            booking,
            rating: existing?.rating || 5,
            comment: existing?.comment || ''
        });
    };

    const submitReview = () => {
        if (!reviewModal.booking) return;
        setReviewsByBooking((prev) => ({
            ...prev,
            [String(reviewModal.booking.id)]: {
                rating: reviewModal.rating,
                comment: reviewModal.comment,
                updatedAt: new Date().toISOString()
            }
        }));
        setReviewModal({ open: false, booking: null, rating: 5, comment: '' });
        api.toast('Review saved successfully.');
    };

    const openPaymentModal = (booking) => {
        setPaymentModal({ open: true, booking, method: 'UPI', processing: false });
    };

    const handlePayNow = async () => {
        if (!paymentModal.booking) return;
        try {
            setPaymentModal((prev) => ({ ...prev, processing: true }));
            const amount = paymentModal.booking.price || 499;
            const paymentResult = await PaymentAPI.pay({
                bookingId: paymentModal.booking.id,
                amount,
                paymentMethod: paymentModal.method
            });
            setPaymentHistory((prev) => [
                {
                    id: paymentResult.paymentId || Date.now(),
                    bookingId: paymentModal.booking.id,
                    serviceName: paymentModal.booking.serviceName,
                    amount,
                    method: paymentModal.method,
                    status: paymentResult.status || 'SUCCESS',
                    at: paymentResult.paymentDate || new Date().toISOString()
                },
                ...prev
            ]);
            api.toast('Payment successful!');
            setPaymentModal({ open: false, booking: null, method: 'UPI', processing: false });
        } catch (err) {
            api.toast(err.response?.data?.message || 'Payment failed. Please try again.', 'error');
            setPaymentModal((prev) => ({ ...prev, processing: false }));
        }
    };

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'PENDING').length,
        completed: bookings.filter(b => b.status === 'COMPLETED').length,
        spent: bookings.reduce((acc, b) => acc + (b.price || 0), 0)
    };
    const nextBooking = [...bookings]
        .filter((b) => ['PENDING', 'CONFIRMED'].includes(b.status) && new Date(b.bookingDate) >= new Date())
        .sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate))[0];
    const unpaidConfirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const completionRate = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

    const renderContent = () => {
        const path = location.pathname;

        if (path === '/customer/services') {
            let filteredServices = services.filter(s => 
                (s.name || '').toLowerCase().includes(serviceSearch.toLowerCase()) ||
                (s.category || '').toLowerCase().includes(serviceSearch.toLowerCase())
            );
            if (serviceSortBy === 'PRICE_LOW_HIGH') {
                filteredServices = [...filteredServices].sort((a, b) => (a.price || 0) - (b.price || 0));
            } else if (serviceSortBy === 'PRICE_HIGH_LOW') {
                filteredServices = [...filteredServices].sort((a, b) => (b.price || 0) - (a.price || 0));
            } else if (serviceSortBy === 'NAME_A_Z') {
                filteredServices = [...filteredServices].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            }
            return (
                <div className="premium-card">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold">Browse Professional Services</h2>
                        <div className="flex gap-3">
                            <input 
                                type="text" 
                                value={serviceSearch}
                                onChange={(e) => setServiceSearch(e.target.value)}
                                placeholder="Type to search services..." 
                                className="premium-input w-72" 
                            />
                            <select
                                value={serviceSortBy}
                                onChange={(e) => setServiceSortBy(e.target.value)}
                                className="premium-input text-xs"
                            >
                                <option value="POPULAR">Popular</option>
                                <option value="PRICE_LOW_HIGH">Price: Low to High</option>
                                <option value="PRICE_HIGH_LOW">Price: High to Low</option>
                                <option value="NAME_A_Z">Name: A-Z</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredServices.map(service => (
                            <div key={service.id} className="bg-[#1c1c27] border border-[#2a2a3a] rounded-2xl p-6 hover:border-[#6c63ff]/50 hover:translate-y-[-4px] transition-all group shadow-lg">
                                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                                    {service.category === 'Electrical' ? '⚡' : service.category === 'Cleaning' ? '🧹' : service.category === 'AC Repair' ? '❄️' : '🔧'}
                                </div>
                                <div className="font-black text-xl mb-1">{service.name}</div>
                                <div className="text-xs text-[#7070a0] mb-6 line-clamp-2">{service.description}</div>
                                <div className="flex justify-between items-center pt-4 border-t border-[#2a2a3a]">
                                    <div className="text-lg font-black text-[#43e97b]">₹{service.price}</div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleFavoriteService(service.name)}
                                            className="text-[#ff6584] font-bold text-xs hover:underline uppercase tracking-widest"
                                        >
                                            {favoriteServices.includes(service.name) ? 'Unfavorite' : 'Favorite'}
                                        </button>
                                        <button onClick={() => setIsModalOpen(true)} className="text-[#6c63ff] font-bold text-xs hover:underline uppercase tracking-widest">Book Now</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredServices.length === 0 && (
                        <div className="text-center py-12 text-[#7070a0] italic">No services found for your search.</div>
                    )}
                </div>
            );
        }

        if (path === '/customer/bookings') {
            const filteredBookings = bookings.filter((b) => bookingStatusFilter === 'ALL' ? true : b.status === bookingStatusFilter);
            return (
                <div className="premium-card">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold">My Booking History</h2>
                        <select
                            value={bookingStatusFilter}
                            onChange={(e) => setBookingStatusFilter(e.target.value)}
                            className="premium-input text-xs"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <div className="space-y-4">
                        {filteredBookings.length === 0 ? (
                            <div className="text-center py-20 text-[#7070a0] italic">No bookings found.</div>
                        ) : (
                            filteredBookings.map(booking => (
                                <BookingItem
                                    key={booking.id}
                                    booking={booking}
                                    onCancel={handleCancelBooking}
                                    onRebook={handleRebook}
                                    onReview={openReviewModal}
                                    onPay={openPaymentModal}
                                    onChat={setActiveChatBooking}
                                    review={reviewsByBooking[String(booking.id)]}
                                />
                            ))
                        )}
                    </div>
                </div>
            );
        }

        if (path === '/customer/payments') {
            const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
            const payableBookings = bookings.filter((b) => b.status === 'CONFIRMED');
            const records = paymentHistory.length > 0
                ? paymentHistory
                : completedBookings.map((b) => ({
                    id: b.id,
                    bookingId: b.id,
                    serviceName: b.serviceName,
                    amount: b.price || 499,
                    method: 'LEGACY',
                    at: b.bookingDate
                }));
            return (
                <div className="premium-card">
                    <h2 className="text-2xl font-bold mb-8">Secure Payment History</h2>
                    <div className="mb-6">
                        <h3 className="font-bold mb-3">Pending Invoices</h3>
                        {payableBookings.length === 0 ? (
                            <div className="text-xs text-[#7070a0] italic">No pending invoices right now.</div>
                        ) : (
                            <div className="space-y-2">
                                {payableBookings.map((b) => (
                                    <div key={`due-${b.id}`} className="flex justify-between items-center p-3 bg-[#1c1c27] border border-[#2a2a3a] rounded-xl">
                                        <div>
                                            <div className="text-sm font-bold">{b.serviceName}</div>
                                            <div className="text-[0.7rem] text-[#7070a0]">Booking #{b.id}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-[#43e97b]">₹{b.price || 499}</span>
                                            <button onClick={() => openPaymentModal(b)} className="premium-button-ghost py-1 px-3 text-xs">Pay Now</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="space-y-4">
                        {records.length === 0 ? (
                            <div className="text-center py-20 text-[#7070a0] italic">No completed payments found.</div>
                        ) : (
                            records.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-5 bg-[#1c1c27] border border-[#2a2a3a] rounded-2xl hover:border-[#43e97b]/30">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#43e97b]/10 flex items-center justify-center text-[#43e97b] text-xl">✅</div>
                                        <div>
                                            <div className="font-bold text-white uppercase tracking-tight">{p.serviceName}</div>
                                            <div className="text-[0.7rem] text-[#7070a0] mt-0.5">Paid on {new Date(p.at).toLocaleDateString()} · Booking #{p.bookingId}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-[#43e97b]">₹{p.amount || 499}</div>
                                        <div className="text-[0.6rem] font-black text-white/50 uppercase tracking-widest">{p.method}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            );
        }

        // Default: Dashboard Overview
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard label="Total Bookings" value={stats.total} sub="All time" color="accent" />
                    <StatCard label="Pending" value={stats.pending} sub="Awaiting confirmation" color="accent2" />
                    <StatCard label="Completed" value={stats.completed} sub="Successfully finished" color="accent3" />
                    <StatCard label="Total Spent" value={`₹${stats.spent}`} sub="Service investments" color="yellow" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="premium-card">
                        <h3 className="font-bold mb-2">Live Session</h3>
                        <div className="text-2xl font-black text-[#6c63ff]">{liveNow.toLocaleTimeString()}</div>
                        <div className="text-xs text-[#7070a0] mt-1">Real-time clock for your booking activity</div>
                    </div>
                    <div className="premium-card">
                        <h3 className="font-bold mb-2">This Month</h3>
                        <div className="text-2xl font-black text-[#43e97b]">{monthlyBookingsCount} bookings</div>
                        <div className="text-xs text-[#7070a0] mt-1">Current month usage trend</div>
                    </div>
                    <div className="premium-card">
                        <h3 className="font-bold mb-2">Next Service</h3>
                        {nextBooking ? (
                            <>
                                <div className="text-sm font-bold text-white">{nextBooking.serviceName}</div>
                                <div className="text-xs text-[#7070a0] mt-1">{new Date(nextBooking.bookingDate).toLocaleString()}</div>
                            </>
                        ) : (
                            <div className="text-xs text-[#7070a0] italic">No upcoming bookings yet.</div>
                        )}
                    </div>
                    <div className="premium-card">
                        <h3 className="font-bold mb-2">Pending Payments</h3>
                        <div className="text-2xl font-black text-yellow-400">{unpaidConfirmed}</div>
                        <div className="text-xs text-[#7070a0] mt-1">Confirmed bookings waiting for payment</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 premium-card">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Recent Bookings</h2>
                            <button onClick={() => navigate('/customer/bookings')} className="text-[#6c63ff] text-sm font-semibold hover:underline">View All</button>
                        </div>
                        <div className="space-y-4">
                            {bookings.slice(0, 4).map(booking => (
                                <BookingItem
                                    key={booking.id}
                                    booking={booking}
                                    onCancel={handleCancelBooking}
                                    onRebook={handleRebook}
                                    onReview={openReviewModal}
                                    onPay={openPaymentModal}
                                    onChat={setActiveChatBooking}
                                    review={reviewsByBooking[String(booking.id)]}
                                />
                            ))}
                            {bookings.length === 0 && (
                                <div className="text-center py-10 text-[#7070a0] italic">No recent bookings yet. Book your first service now.</div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="premium-card">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Notifications</h2>
                                <span className="text-xs text-[#7070a0]">Live</span>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-auto">
                                {notifications.length === 0 ? (
                                    <div className="text-xs text-[#7070a0] italic">No new updates yet.</div>
                                ) : notifications.map((n) => (
                                    <div key={n.id} className="text-xs bg-[#1c1c27] border border-[#2a2a3a] rounded-lg p-2">
                                        <div className="text-white">{n.message}</div>
                                        <div className="text-[#7070a0] mt-1">{new Date(n.time).toLocaleTimeString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="premium-card">
                            <h2 className="text-xl font-bold mb-4 uppercase tracking-tighter">Quick Categories</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {(categories.length > 0 ? categories : [
                                    {name: 'Plumbing', icon: '🔧'}, 
                                    {name: 'Electrical', icon: '⚡'}, 
                                    {name: 'Cleaning', icon: '🧹'}, 
                                    {name: 'AC Repair', icon: '❄️'},
                                    {name: 'Painting', icon: '🎨'},
                                    {name: 'Carpentry', icon: '🪚'},
                                    {name: 'Gardening', icon: '🌱'},
                                    {name: 'Pest Control', icon: '🐜'},
                                    {name: 'Appliance Repair', icon: '🔌'},
                                    {name: 'Home Deep Clean', icon: '🧽'},
                                    {name: 'Laundry', icon: '🧺'},
                                    {name: 'Moving Help', icon: '📦'}
                                ]).slice(0, 12).map(cat => (
                                    <div key={cat.name} onClick={() => { setServiceSearch(cat.name); navigate('/customer/services'); }} className="bg-[#1c1c27] border border-[#2a2a3a] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#6c63ff] hover:translate-y-[-2px] transition-all group">
                                        <span className="text-2xl mb-1">{cat.icon || '🔧'}</span>
                                        <span className="text-[0.6rem] font-bold text-[#7070a0] group-hover:text-white uppercase tracking-tight text-center">{cat.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="premium-card">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Popular Services</h2>
                                <button onClick={() => navigate('/customer/services')} className="text-[#6c63ff] text-sm font-semibold hover:underline">See More</button>
                            </div>
                            <div className="space-y-3">
                                {services.slice(0, 8).map(service => (
                                    <div key={service.id} className="flex justify-between items-center p-3 bg-[#1c1c27] border border-[#2a2a3a] rounded-xl">
                                        <div>
                                            <div className="font-semibold text-white">{service.name}</div>
                                            <div className="text-xs text-[#7070a0]">{service.category || 'General'}</div>
                                        </div>
                                        <div className="text-sm font-bold text-[#43e97b]">₹{service.price}</div>
                                    </div>
                                ))}
                                {services.length === 0 && (
                                    <div className="text-center py-6 text-[#7070a0] italic">No services available right now.</div>
                                )}
                            </div>
                        </div>
                        <div className="premium-card">
                            <h2 className="text-xl font-bold mb-3">Favorites</h2>
                            <div className="space-y-2">
                                {favoriteServices.length === 0 ? (
                                    <div className="text-xs text-[#7070a0] italic">No favorites yet. Mark services to access quickly.</div>
                                ) : favoriteServices.map((name) => (
                                    <div key={name} className="text-xs bg-[#1c1c27] border border-[#2a2a3a] rounded-lg p-2 flex justify-between items-center">
                                        <span className="text-white">{name}</span>
                                        <button onClick={() => { setServiceSearch(name); navigate('/customer/services'); }} className="text-[#6c63ff] font-bold">Open</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#7070a0]">
                <div className="w-8 h-8 border-4 border-[#6c63ff] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Syncing with platform...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-white font-serif">{getGreeting()}, <span className="text-[#6c63ff]">{name}</span> 👋</h1>
                    <p className="text-[#7070a0] mt-1">Here's a snapshot of your service status today.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="premium-button flex items-center gap-2">
                    <span className="text-xl">+</span> Book Service
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button onClick={() => navigate('/customer/services')} className="premium-button-ghost py-2">Browse Services</button>
                <button onClick={() => navigate('/customer/bookings')} className="premium-button-ghost py-2">My Bookings</button>
                <button onClick={() => navigate('/customer/payments')} className="premium-button-ghost py-2">My Payments</button>
            </div>

            <div className="premium-card">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">Booking Completion Progress</h3>
                    <span className="text-sm text-[#43e97b] font-bold">{completionRate}%</span>
                </div>
                <div className="w-full h-2 bg-[#1c1c27] rounded-full">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#6c63ff] to-[#43e97b]" style={{ width: `${completionRate}%` }}></div>
                </div>
            </div>

            {error && (
                <div className="bg-[#ff6584]/10 border border-[#ff6584]/20 text-[#ff6584] p-4 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {renderContent()}

            <BookingModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                services={services} 
                onSubmit={handleCreateBooking} 
            />

            {reviewModal.open && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[120] p-4">
                    <div className="premium-card w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4">Rate Service</h3>
                        <div className="text-sm text-[#7070a0] mb-4">
                            {reviewModal.booking?.serviceName} - Booking #{reviewModal.booking?.id}
                        </div>
                        <div className="space-y-2 mb-4">
                            <label className="text-xs text-[#7070a0] font-bold uppercase">Rating (1-5)</label>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={reviewModal.rating}
                                onChange={(e) => setReviewModal((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                                className="w-full"
                            />
                            <div className="text-sm font-bold text-yellow-400">{'⭐'.repeat(reviewModal.rating)}</div>
                        </div>
                        <div className="space-y-2 mb-6">
                            <label className="text-xs text-[#7070a0] font-bold uppercase">Comment</label>
                            <textarea
                                rows="3"
                                value={reviewModal.comment}
                                onChange={(e) => setReviewModal((prev) => ({ ...prev, comment: e.target.value }))}
                                className="premium-input w-full"
                                placeholder="Share your experience"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setReviewModal({ open: false, booking: null, rating: 5, comment: '' })}
                                className="flex-1 bg-[#1c1c27] border border-[#2a2a3a] py-3 rounded-xl font-bold"
                            >
                                Cancel
                            </button>
                            <button type="button" onClick={submitReview} className="flex-1 premium-button py-3">
                                Save Review
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {paymentModal.open && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[120] p-4">  
                    <div className="premium-card w-full max-w-md">
                        <h3 className="text-xl font-bold mb-3">Pay for Service</h3>
                        <div className="text-sm text-[#7070a0] mb-4">
                            {paymentModal.booking?.serviceName} - Booking #{paymentModal.booking?.id}
                        </div>
                        <div className="text-lg font-black text-[#43e97b] mb-4">₹{paymentModal.booking?.price || 499}</div>
                        <div className="space-y-2 mb-6">
                            <label className="text-xs font-bold text-[#7070a0] uppercase">Payment Method</label>
                            <select
                                value={paymentModal.method}
                                onChange={(e) => setPaymentModal((prev) => ({ ...prev, method: e.target.value }))}
                                className="premium-input w-full"
                            >
                                <option value="UPI">UPI</option>
                                <option value="CARD">Card</option>
                                <option value="NET_BANKING">Net Banking</option>
                                <option value="CASH">Cash</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setPaymentModal({ open: false, booking: null, method: 'UPI', processing: false })} className="flex-1 bg-[#1c1c27] border border-[#2a2a3a] py-3 rounded-xl font-bold" disabled={paymentModal.processing}>Cancel</button>
                            <button type="button" onClick={handlePayNow} className="flex-1 premium-button py-3" disabled={paymentModal.processing}>
                                {paymentModal.processing ? 'Processing...' : 'Pay Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeChatBooking && (
                <ChatWindow booking={activeChatBooking} onClose={() => setActiveChatBooking(null)} />
            )}
        </div>
    );
};

const StatCard = ({ label, value, sub, color }) => {
    const colorClasses = {
        accent: 'text-[#6c63ff] border-t-4 border-[#6c63ff]',
        accent2: 'text-[#ff6584] border-t-4 border-[#ff6584]',
        accent3: 'text-[#43e97b] border-t-4 border-[#43e97b]',
        yellow: 'text-yellow-400 border-t-4 border-yellow-400'
    };
    
    return (
        <div className={`premium-card pt-5 pb-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300 ${colorClasses[color]}`}>
            <div>
                <div className="text-[#7070a0] text-[0.7rem] font-bold uppercase tracking-wider mb-2">{label}</div>
                <div className="text-3xl font-extrabold font-serif">{value}</div>
            </div>
            <div className="text-[#7070a0] text-xs mt-3">{sub}</div>
        </div>
    );
};

const BookingItem = ({ booking, onCancel, onRebook, onReview, onPay, onChat, review }) => {
    const statusPills = {
        PENDING: 'bg-yellow-500/10 text-yellow-500',
        CONFIRMED: 'bg-[#6c63ff]/10 text-[#6c63ff]',
        COMPLETED: 'bg-[#43e97b]/10 text-[#43e97b]',
        CANCELLED: 'bg-[#ff6584]/10 text-[#ff6584]'
    };

    const serviceIcons = {
        Plumbing: '🔧',
        Electrical: '⚡',
        Cleaning: '🧹',
        'AC Repair': '❄️'
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-[#1c1c27] border border-[#2a2a3a] rounded-xl hover:border-[#6c63ff] transition-all group">
            <div className="w-12 h-12 bg-[#13131a] rounded-xl flex items-center justify-center text-xl shadow-inner">
                {serviceIcons[booking.serviceName] || '📋'}
            </div>
            <div className="flex-1">
                <div className="font-bold text-white group-hover:text-[#6c63ff] transition-colors">{booking.serviceName}</div>
                <div className="text-[0.75rem] text-[#7070a0] mt-0.5 flex items-center gap-2">
                    <span>📅 {new Date(booking.bookingDate).toLocaleDateString()}</span>
                    <span>📍 {booking.address || 'Location N/A'}</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-tight uppercase ${statusPills[booking.status]}`}>
                    {booking.status}
                </span>
                {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                    <button onClick={() => onCancel(booking.id)} className="p-2 text-[#ff6584] hover:bg-[#ff6584]/10 rounded-lg transition-colors" title="Cancel Booking">
                        ✕
                    </button>
                )}
                {booking.status !== 'CANCELLED' && (
                    <button onClick={() => onChat(booking)} className="p-2 text-[#6c63ff] hover:bg-[#6c63ff]/10 rounded-lg transition-colors" title="Open Chat">
                        💬
                    </button>
                )}
                {booking.status === 'COMPLETED' && (
                    <>
                        <button onClick={() => onRebook(booking)} className="p-2 text-[#43e97b] hover:bg-[#43e97b]/10 rounded-lg transition-colors" title="Rebook Service">↻</button>
                        <button onClick={() => onReview(booking)} className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors" title="Rate Service">
                            {review ? `⭐${review.rating}` : '☆'}
                        </button>
                    </>
                )}
                {booking.status === 'CONFIRMED' && (
                    <button onClick={() => onPay(booking)} className="p-2 text-[#6c63ff] hover:bg-[#6c63ff]/10 rounded-lg transition-colors" title="Pay for this booking">₹</button>
                )}
            </div>
        </div>
    );
};



export default CustomerDashboard;
