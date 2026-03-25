import React, { useState, useEffect, useCallback, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { ServiceAPI, BookingAPI, PaymentAPI, getUserId, logout, BASE_URL } from './api';
import { useToast } from './ToastContext';
import ThemeToggle from './ThemeToggle';
import { NotificationDot } from './NotificationDot';
import { Card, CardHeader } from './Card';
import { useForm } from './useForm';
import { Skeleton } from './Skeleton';
import ChatWindow from './ChatWindow';

const validateBooking = (values) => {
  const errors = {};
  if (!values.address.trim()) {
    errors.address = 'Address is required';
  }
  if (!values.bookingDate) {
    errors.bookingDate = 'Date & time is required';
  }
  return errors;
};

const CustomerDashboard = () => {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, spent: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  
  const { addToast } = useToast();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeChatBooking, setActiveChatBooking] = useState(null);
  const activeChatBookingRef = useRef(null); // Ref to track active chat without triggering re-renders in socket effect
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showModal, setShowModal] = useState(false);
  const { values: bookingForm, errors: bookingErrors, handleChange, setValues: setBookingForm, validateForm, resetForm } = useForm({
    serviceId: '',
    address: '',
    notes: '',
    paymentMethod: 'UPI',
    bookingDate: ''
  }, validateBooking, 'booking_draft');

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [bookingSearch, setBookingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [totalPages, setTotalPages] = useState(0);

  // Define data loading functions first so they can be used in useEffect
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [servicesData, bookingsData, statsData] = await Promise.all([
        ServiceAPI.getAll(),
        BookingAPI.getByCustomer(getUserId(), page, 5, statusFilter, bookingSearch),
        BookingAPI.getStatsByCustomer(getUserId())
      ]);
      setServices(servicesData);
      setStats(statsData);
      
      if (bookingsData.content) {
        setBookings(bookingsData.content);
        setTotalPages(bookingsData.totalPages);
      } else {
        setBookings(bookingsData.sort((a, b) => b.id - a.id)); // Fallback
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, bookingSearch]);

  const refreshBookings = useCallback(async () => {
    try {
      const data = await BookingAPI.getByCustomer(getUserId(), page, 5, statusFilter, bookingSearch);
      if (data.content) {
        setBookings(data.content);
      } else {
        setBookings(data.sort((a, b) => b.id - a.id));
      }
    } catch (err) {
      console.error(err);
    }
  }, [page, statusFilter, bookingSearch]);

  // Keep ref in sync with state
  useEffect(() => {
    activeChatBookingRef.current = activeChatBooking;
  }, [activeChatBooking]);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const socket = new SockJS(`${BASE_URL}/ws`);
    const stompClient = Stomp.over(socket);
    stompClient.debug = null;

    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    stompClient.connect(headers, () => {
      console.log('Connected to WebSocket via STOMP');

      // Listen for private notifications (for unread messages and status updates)
      stompClient.subscribe('/user/queue/notifications', (message) => {
        const notification = JSON.parse(message.body);

        if (notification.type === 'NEW_CHAT_MESSAGE') {
          const { bookingId } = notification;
          // Only increment count if the chat window is not currently open for this booking
          if (activeChatBookingRef.current?.id !== bookingId) {
            setUnreadCounts(prev => ({ ...prev, [bookingId]: (prev[bookingId] || 0) + 1 }));
          }
        } else if (notification.type && notification.type.startsWith('BOOKING_')) {
          // A booking status was updated by the provider
          refreshBookings();
          addToast(notification.message || 'A booking was updated.', 'info');
        }
      });
    }, (error) => console.error("WebSocket connection error:", error));

    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.disconnect();
      }
    };
  }, [refreshBookings, addToast]);

  // Initial Data Load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Modal Logic
  const openBookModal = (preSelectedService = null) => {
    // Only update serviceId, keeping other drafted fields (address, notes) intact
    setBookingForm(prev => {
      const targetServiceId = preSelectedService ? preSelectedService.id : (prev.serviceId || services[0]?.id || '');
      return {
        ...prev,
        serviceId: targetServiceId
      };
    });
    setShowModal(true);
  };

  const handleBookService = async () => {
    if (!validateForm()) {
      addToast("Please fix the errors in the form", "error");
      return;
    }
    try {
      await BookingAPI.create({
        customerId: getUserId(),
        serviceId: bookingForm.serviceId,
        address: bookingForm.address,
        notes: bookingForm.notes,
        bookingDate: new Date(bookingForm.bookingDate).toISOString()
      });
      addToast("Booking request sent successfully!", "success");
      setShowModal(false);
      refreshBookings();
      resetForm(); // Clear the saved draft on success
    } catch (err) {
      addToast("Failed to create booking.", "error");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        await BookingAPI.cancel(bookingId);
        addToast("Booking cancelled successfully", "success");
        refreshBookings();
      } catch (err) {
        addToast("Failed to cancel booking", "error");
      }
    }
  };

  // Filter services
  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFilterChange = (status) => {
    setPage(0); // Reset to first page on filter change
    setStatusFilter(status);
  };
  
  // Helper for status colors
  const getStatusStyle = (status) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-500/15 text-yellow-500';
      case 'CONFIRMED': return 'bg-accent/15 text-accent';
      case 'COMPLETED': return 'bg-green-500/15 text-green-500';
      case 'CANCELLED': return 'bg-red-500/15 text-red-500';
      default: return 'bg-gray-500/15 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text font-epilogue flex">
      {/* Sidebar */}
      <aside className={`w-64 min-h-screen bg-panel border-r border-border flex flex-col py-7 fixed top-0 left-0 z-30 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="px-6 pb-8 font-syne text-2xl font-extrabold text-accent tracking-tighter">
          Service<span className="text-accent2">Mate</span>
        </div>
        <nav className="py-2">
          <div className="text-[0.65rem] font-semibold text-muted uppercase tracking-widest px-6 py-1.5">Menu</div>
          <div className="flex items-center gap-3 px-6 py-2.5 text-accent border-l-[3px] border-accent bg-accent/10 cursor-pointer text-sm">
            <span className="text-lg w-5 text-center">🏠</span> Dashboard
          </div>
          <div className="flex items-center gap-3 px-6 py-2.5 text-muted border-l-[3px] border-transparent hover:text-text hover:bg-white/5 cursor-pointer transition-colors duration-200 text-sm">
            <span className="text-lg w-5 text-center">🔧</span> Browse Services
          </div>
          <div className="flex items-center gap-3 px-6 py-2.5 text-muted border-l-[3px] border-transparent hover:text-text hover:bg-white/5 cursor-pointer transition-colors duration-200 text-sm">
            <span className="text-lg w-5 text-center">📅</span> My Bookings
          </div>
          <div className="flex items-center gap-3 px-6 py-2.5 text-muted border-l-[3px] border-transparent hover:text-text hover:bg-white/5 cursor-pointer transition-colors duration-200 text-sm">
            <span className="text-lg w-5 text-center">💳</span> Payments
          </div>
        </nav>
        <div className="mt-auto p-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center font-syne font-bold text-sm text-white">K</div>
            <div className="text-xs">
              <strong className="block font-medium text-text">User</strong>
              <span className="text-muted text-[0.72rem]">Customer</span>
            </div>
          </div>
          <button onClick={logout} className="mt-4 w-full py-2 bg-white/5 text-text border border-border rounded-lg text-xs font-medium hover:border-accent hover:text-accent transition-colors">Logout</button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-9 lg:ml-64 w-full">
        <div className="flex justify-between items-center mb-6 lg:mb-9">
          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2 mr-3 text-text border border-border rounded-lg bg-panel" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <div className="font-syne text-[1.7rem] font-extrabold text-text">Good morning, <span className="text-accent">Customer</span> 👋</div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <button className="px-5 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-blue-600 transition-colors shadow-lg shadow-accent/20" onClick={() => openBookModal()}>+ Book Service</button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="p-5 relative overflow-hidden h-[120px]">
                <Skeleton className="w-[60px] h-[60px] rounded-bl-[60px] absolute top-0 right-0 opacity-20" />
                <Skeleton className="h-3 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </Card>
            ))
          ) : (
            <>
              <Card className="p-5 relative overflow-hidden" hover>
                <div className="absolute top-0 right-0 w-[60px] h-[60px] rounded-bl-[60px] opacity-15 bg-accent"></div>
                <div className="text-xs text-muted uppercase tracking-widest mb-2">Total Bookings</div>
                <div className="font-syne text-3xl font-extrabold text-accent">{stats.total}</div>
                <div className="text-xs text-muted mt-1">Lifetime</div>
              </Card>
              <Card className="p-5 relative overflow-hidden" hover>
                <div className="absolute top-0 right-0 w-[60px] h-[60px] rounded-bl-[60px] opacity-15 bg-accent2"></div>
                <div className="text-xs text-muted uppercase tracking-widest mb-2">Pending</div>
                <div className="font-syne text-3xl font-extrabold text-accent2">{stats.pending}</div>
                <div className="text-xs text-muted mt-1">Awaiting confirmation</div>
              </Card>
              <Card className="p-5 relative overflow-hidden" hover>
                <div className="absolute top-0 right-0 w-[60px] h-[60px] rounded-bl-[60px] opacity-15 bg-green-500"></div>
                <div className="text-xs text-muted uppercase tracking-widest mb-2">Completed</div>
                <div className="font-syne text-3xl font-extrabold text-green-500">{stats.completed}</div>
                <div className="text-xs text-muted mt-1">Successful jobs</div>
              </Card>
              <Card className="p-5 relative overflow-hidden" hover>
                <div className="absolute top-0 right-0 w-[60px] h-[60px] rounded-bl-[60px] opacity-15 bg-yellow-400"></div>
                <div className="text-xs text-muted uppercase tracking-widest mb-2">Est. Spent</div>
                <div className="font-syne text-3xl font-extrabold text-yellow-400">₹{stats.spent}</div>
                <div className="text-xs text-muted mt-1">Total Value</div>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          {/* Left Column */}
          <div>
            {/* Services Section */}
            <Card className="p-6 mb-6">
              <CardHeader 
                title="Available Services" 
                action={
                  <input 
                    className="bg-input-bg border border-border rounded-xl py-2 px-3.5 text-text font-epilogue text-sm outline-none w-full sm:w-64 focus:border-accent transition-colors"
                    placeholder="Search services..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                }
              />
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="bg-input-bg border border-border rounded-xl p-4 text-center h-[110px]">
                      <Skeleton className="w-8 h-8 rounded-full mx-auto mb-3" />
                      <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
                      <Skeleton className="h-3 w-1/2 mx-auto" />
                    </div>
                  ))
                ) : (
                  filteredServices.length > 0 ? filteredServices.map(s => (
                    <div key={s.id} className="bg-input-bg border border-border rounded-xl p-4 cursor-pointer transition-all duration-200 text-center hover:border-accent hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/20" onClick={() => openBookModal(s)}>
                      <div className="text-3xl mb-2">🔧</div>
                      <div className="text-sm font-medium mb-1 text-text">{s.name}</div>
                      <div className="text-xs text-accent font-semibold">From ₹{s.price}</div>
                    </div>
                  )) : <p className="text-muted p-2">No services found.</p>
                )}
              </div>
            </Card>

            {/* Recent Bookings */}
            <Card className="p-6">
              <CardHeader 
                title="Recent Bookings"
                action={
                  <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                    <input 
                      className="bg-input-bg border border-border rounded-lg py-1.5 px-3 text-text font-epilogue text-xs outline-none focus:border-accent transition-colors w-40"
                      placeholder="Search address..." 
                      value={bookingSearch}
                      onChange={(e) => { setPage(0); setBookingSearch(e.target.value); }}
                    />
                    <div className="flex gap-1 bg-input-bg rounded-lg p-1 overflow-x-auto">
                      {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(status => (
                        <button 
                          key={status}
                          onClick={() => handleFilterChange(status)}
                          className={`px-3 py-1.5 rounded-md text-xs cursor-pointer transition-colors whitespace-nowrap ${statusFilter === status ? 'bg-panel text-text font-medium shadow-sm' : 'text-muted hover:text-text'}`}
                        >
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                }
              />
              <div className="flex flex-col gap-2.5">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3.5 bg-input-bg rounded-xl p-3.5 border border-border">
                      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-1/3 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))
                ) : (
                  bookings.length > 0 ? bookings.map(b => (
                    <div key={b.id} className="flex items-center gap-3.5 bg-input-bg rounded-xl p-3.5 border border-border transition-colors duration-200 hover:border-border/80 hover:bg-white/5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 bg-white/5">📅</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-text">{b.serviceName || `Service #${b.serviceId}`}</div>
                        <div className="text-xs text-muted">{new Date(b.bookingDate).toLocaleDateString()} · {b.address}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[0.7rem] font-semibold whitespace-nowrap ${getStatusStyle(b.status)}`}>{b.status}</span>
                        {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setActiveChatBooking(b); setUnreadCounts(prev => ({...prev, [b.id]: 0})); }} 
                              className="text-[0.65rem] text-accent hover:text-blue-400 font-medium transition-colors flex items-center"
                            >
                              Chat
                              {unreadCounts[b.id] > 0 && (
                                <span className="ml-1 w-2 h-2 rounded-full bg-red-500 block"></span>
                              )}
                            </button>
                            <button onClick={() => handleCancelBooking(b.id)} className="text-[0.65rem] text-red-500 hover:text-red-400 font-medium transition-colors">
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : <div className="p-2 text-muted">No bookings yet.</div>
                )}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                  <button 
                    className="px-3 py-1 rounded border border-border text-xs text-text disabled:opacity-50 hover:bg-white/5 transition-colors"
                    disabled={page === 0} 
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <span className="text-xs text-muted">Page {page + 1} of {totalPages}</span>
                  <button 
                    className="px-3 py-1 rounded border border-border text-xs text-text disabled:opacity-50 hover:bg-white/5 transition-colors"
                    disabled={page >= totalPages - 1} 
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Payments (Mocked UI based on HTML) */}
          <div>
            <Card className="p-6">
              <CardHeader title="Payment History" />
              <div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="text-xs">
                      <span className="block font-medium text-text">Plumbing Repair</span>
                      <span className="text-muted text-[0.7rem]">Feb 28, 2025</span>
                    </div>
                  </div>
                  <div className="font-syne font-bold text-sm text-green-500">₹499</div>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="text-xs">
                      <span className="block font-medium text-text">Electrical Work</span>
                      <span className="text-muted text-[0.7rem]">Feb 25, 2025</span>
                    </div>
                  </div>
                  <div className="font-syne font-bold text-sm text-green-500">₹749</div>
                </div>
                <div className="flex justify-between items-center py-3 border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="text-xs">
                      <span className="block font-medium text-text">AC Repair</span>
                      <span className="text-muted text-[0.7rem]">Feb 20, 2025</span>
                    </div>
                  </div>
                  <div className="font-syne font-bold text-sm text-red-500">₹599</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-panel border border-border rounded-2xl p-8 w-[420px] max-w-full animate-in fade-in zoom-in duration-200">
            <h3 className="font-syne font-bold text-xl mb-6 text-text">Book a Service</h3>
            <div className="mb-4">
              <label className="text-xs text-muted mb-1.5 block uppercase tracking-wide font-bold">Service</label>
              <select 
                name="serviceId"
                className="w-full bg-input-bg border border-border rounded-xl py-2.5 px-3.5 text-text font-epilogue text-sm outline-none transition-colors duration-200 focus:border-accent"
                value={bookingForm.serviceId}
                onChange={handleChange}
              >
                {services.map(s => <option key={s.id} value={s.id}>{s.name} – ₹{s.price}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="text-xs text-muted mb-1.5 block uppercase tracking-wide font-bold">Address</label>
              <input name="address" className={`w-full bg-input-bg border ${bookingErrors.address ? 'border-red-500' : 'border-border'} rounded-xl py-2.5 px-3.5 text-text font-epilogue text-sm outline-none transition-colors duration-200 focus:border-accent`} placeholder="Enter your address" value={bookingForm.address} onChange={handleChange} />
              {bookingErrors.address && <p className="text-xs text-red-500 mt-1">{bookingErrors.address}</p>}
            </div>
            <div className="mb-4">
              <label className="text-xs text-muted mb-1.5 block uppercase tracking-wide font-bold">Date & Time</label>
              <input 
                type="datetime-local" 
                name="bookingDate" 
                className={`w-full bg-input-bg border ${bookingErrors.bookingDate ? 'border-red-500' : 'border-border'} rounded-xl py-2.5 px-3.5 text-text font-epilogue text-sm outline-none transition-colors duration-200 focus:border-accent`}
                value={bookingForm.bookingDate} 
                onChange={handleChange} 
              />
              {bookingErrors.bookingDate && <p className="text-xs text-red-500 mt-1">{bookingErrors.bookingDate}</p>}
            </div>
            <div className="mb-6">
              <label className="text-xs text-muted mb-1.5 block uppercase tracking-wide font-bold">Notes (Optional)</label>
              <textarea name="notes" className="w-full bg-input-bg border border-border rounded-xl py-2.5 px-3.5 text-text font-epilogue text-sm outline-none transition-colors duration-200 focus:border-accent resize-none h-20" placeholder="Special instructions..." value={bookingForm.notes} onChange={handleChange}></textarea>
            </div>
            <div className="flex gap-2.5">
              <button className="flex-1 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-blue-600 transition-colors" onClick={handleBookService}>Confirm & Pay</button>
              <button className="px-5 py-2.5 rounded-xl bg-white/5 text-text border border-border font-medium text-sm hover:border-accent hover:text-accent transition-colors" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {activeChatBooking && <ChatWindow booking={activeChatBooking} onClose={() => setActiveChatBooking(null)} />}
    </div>
  );
};

export default CustomerDashboard;