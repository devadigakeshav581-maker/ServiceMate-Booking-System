import React, { useState, useEffect, useCallback } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { AdminAPI, BookingAPI, PaymentAPI, logout, BASE_URL } from './api';
import { useToast } from './ToastContext';
import ThemeToggle from './ThemeToggle';
import { Card, CardHeader } from './Card';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalBookings: 0, totalRevenue: 0, pendingIssues: 0 });
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  
  const [userFilter, setUserFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  // Modals State
  const [activeModal, setActiveModal] = useState(null); // 'PAYMENTS', 'BOOKINGS', or null
  const [modalData, setModalData] = useState({ 
    userId: null, 
    userName: '', 
    items: [], 
    loading: false,
    page: 0,
    totalPages: 0
  });

  const { addToast } = useToast();

  // ─────────────────────────────────────────────
  // Initial Data Load
  // ─────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      // Parallel fetch for dashboard data
      const [usersData, bookingsData, statsData] = await Promise.all([
        AdminAPI.getUsers(),
        BookingAPI.getAll(),
        AdminAPI.getStats().catch(() => ({ totalUsers: 0, totalBookings: 0, totalRevenue: 0, pendingIssues: 0 }))
      ]);

      setUsers(usersData);
      setFilteredUsers(usersData);
      setBookings(bookingsData.slice(0, 10)); // Show recent 10
      setStats(statsData);
    } catch (err) {
      console.error(err);
      addToast('Failed to load dashboard data', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─────────────────────────────────────────────
  // Real-time Feed
  // ─────────────────────────────────────────────
  useEffect(() => {
    const socket = new SockJS(`${BASE_URL}/ws`);
    const stompClient = Stomp.over(socket);
    stompClient.debug = null; // Disable console logs

    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    stompClient.connect(headers, () => {
      // Subscribe to the activity feed topic
      stompClient.subscribe('/topic/admin/activity-feed', (message) => {
        const activity = JSON.parse(message.body);

        const iconMap = {
          USER_ONLINE: '🟢',
          USER_OFFLINE: '⚪',
          NEW_REGISTRATION: '👤',
          BOOKING_CREATED: '📅',
          BOOKING_CONFIRMED: '✅',
          BOOKING_COMPLETED: '🎉',
          BOOKING_CANCELLED: '❌',
          PAYMENT_RECEIVED: '💳',
        };

        const newActivity = {
          id: activity.timestamp, // Use timestamp from backend for unique key
          type: activity.type,
          text: activity.message,
          icon: iconMap[activity.type] || 'ℹ️',
          time: new Date(activity.timestamp).toLocaleTimeString()
        };

        setActivityFeed(prev => [newActivity, ...prev].slice(0, 10));
      });
    }, (error) => {
      console.error("WebSocket Connection Error: ", error);
    });

    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.disconnect();
      }
    };
  }, []); // Empty dependency array to run once on mount

  // ─────────────────────────────────────────────
  // User Filtering
  // ─────────────────────────────────────────────
  useEffect(() => {
    let result = users;
    if (userFilter !== 'All') {
      result = result.filter(u => u.role === userFilter.toUpperCase().slice(0, -1)); // Remove 's' from Customers/Providers
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    setFilteredUsers(result);
  }, [users, userFilter, searchQuery]);

  // ─────────────────────────────────────────────
  // User Actions
  // ─────────────────────────────────────────────
  const handleSetStatus = async (userId, isActive) => {
    const action = isActive ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await AdminAPI.setUserStatus(userId, isActive);
      addToast(`User ${action}d successfully`, 'success');
      loadData();
    } catch (err) {
      addToast(`Failed to ${action} user`, 'error');
    }
  };

  const handleWarnUser = async (userId, userName) => {
    const message = prompt(`Enter warning for ${userName}:`);
    if (!message) return;
    try {
      await AdminAPI.sendWarning(userId, message);
      addToast('Warning sent successfully', 'success');
    } catch (err) {
      addToast('Failed to send warning', 'error');
    }
  };

  // ─────────────────────────────────────────────
  // Modal Handlers
  // ─────────────────────────────────────────────
  const openBookingsModal = async (userId, userName) => {
    setActiveModal('BOOKINGS');
    setModalData({ userId, userName, items: [], loading: true });
    try {
      const data = await BookingAPI.getByCustomer(userId);
      setModalData({ userId, userName, items: data, loading: false });
    } catch (err) {
      addToast('Failed to load bookings', 'error');
      setModalData(prev => ({ ...prev, loading: false }));
    }
  };

  const openPaymentsModal = async (userId, userName, page = 0) => {
    setActiveModal('PAYMENTS');
    setModalData(prev => ({ ...prev, userId, userName, loading: true, page }));
    try {
      const data = await PaymentAPI.getByCustomer(userId, page, 5);
      // Handle if backend returns Page object or List
      const items = data.content || data; 
      const totalPages = data.totalPages || 1;
      
      setModalData({ userId, userName, items, loading: false, page, totalPages });
    } catch (err) {
      addToast('Failed to load payments', 'error');
      setModalData(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRefund = async (paymentId) => {
    if (!window.confirm('Refund this payment?')) return;
    try {
      await PaymentAPI.refund(paymentId);
      addToast('Refund processed', 'success');
      openPaymentsModal(modalData.userId, modalData.userName, modalData.page); // Refresh
    } catch (err) {
      addToast('Refund failed', 'error');
    }
  };

  const handleAdminCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await BookingAPI.cancel(bookingId);
      addToast('Booking cancelled', 'success');
      openBookingsModal(modalData.userId, modalData.userName); // Refresh
    } catch (err) {
      addToast('Cancellation failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text font-epilogue flex">
      {/* Sidebar */}
      <aside className={`w-64 min-h-screen bg-panel border-r border-border flex flex-col py-7 fixed top-0 left-0 z-30 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="px-6 pb-2 font-syne text-2xl font-extrabold text-text tracking-tighter">
          Service<span className="text-yellow-500">Mate</span>
        </div>
        <span className="px-6 pb-8 text-[0.65rem] text-muted tracking-[3px] uppercase block">Admin Control Panel</span>
        
        <nav className="py-2">
          <div className="text-[0.65rem] font-semibold text-muted uppercase tracking-widest px-6 py-1.5">Overview</div>
          <div className="flex items-center gap-3 px-6 py-2.5 text-yellow-500 border-l-[3px] border-yellow-500 bg-yellow-500/10 cursor-pointer text-sm">
            <span className="text-lg w-5 text-center">🏠</span> Dashboard
          </div>
          <div className="flex items-center gap-3 px-6 py-2.5 text-muted border-l-[3px] border-transparent hover:text-text hover:bg-white/5 cursor-pointer transition-colors duration-200 text-sm">
            <span className="text-lg w-5 text-center">📊</span> Analytics
          </div>
        </nav>
        <nav className="py-2">
          <div className="text-[0.65rem] font-semibold text-muted uppercase tracking-widest px-6 py-1.5">Management</div>
          <div className="flex items-center gap-3 px-6 py-2.5 text-muted border-l-[3px] border-transparent hover:text-text hover:bg-white/5 cursor-pointer transition-colors duration-200 text-sm">
            <span className="text-lg w-5 text-center">👥</span> Users <span className="ml-auto bg-red-500 text-white rounded-lg px-2 py-0.5 text-[0.65rem] font-bold">{users.length}</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-2.5 text-muted border-l-[3px] border-transparent hover:text-text hover:bg-white/5 cursor-pointer transition-colors duration-200 text-sm">
            <span className="text-lg w-5 text-center">🔧</span> Services
          </div>
          <div className="flex items-center gap-3 px-6 py-2.5 text-muted border-l-[3px] border-transparent hover:text-text hover:bg-white/5 cursor-pointer transition-colors duration-200 text-sm">
            <span className="text-lg w-5 text-center">📅</span> Bookings <span className="ml-auto bg-red-500 text-white rounded-lg px-2 py-0.5 text-[0.65rem] font-bold">{bookings.length}</span>
          </div>
        </nav>
        <div className="mt-auto p-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-yellow-500 text-black flex items-center justify-center font-syne font-bold text-sm">A</div>
            <div className="text-xs">
              <strong className="block font-medium text-text">Admin</strong>
              <span className="text-muted text-[0.72rem]">Super Admin</span>
            </div>
          </div>
          <button onClick={logout} className="mt-4 w-full py-2 bg-white/5 text-text border border-border rounded-lg text-xs font-medium hover:border-yellow-500 hover:text-yellow-500 transition-colors">Logout</button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-9 lg:ml-64 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-4">
          <div className="flex items-center gap-3">
             <button className="lg:hidden p-2 text-text border border-border rounded-lg bg-panel" onClick={() => setSidebarOpen(true)}>☰</button>
             <div>
               <div className="font-syne text-[1.6rem] font-extrabold text-text">System Overview</div>
               <div className="text-xs text-muted mt-1">Today, {new Date().toLocaleDateString()}</div>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 bg-panel border border-border rounded-lg px-4 py-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,1)]"></div>
              All Systems Operational
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5 hover:border-yellow-500/50 transition-colors"><div className="text-[0.68rem] text-muted uppercase tracking-widest mb-2">Total Users</div><div className="font-syne text-3xl font-extrabold text-yellow-500">{stats.totalUsers || users.length}</div><div className="flex justify-between items-center mt-2"><span className="text-xs font-bold text-emerald-400">↑ Active</span></div></Card>
          <Card className="p-5 hover:border-blue-400/50 transition-colors"><div className="text-[0.68rem] text-muted uppercase tracking-widest mb-2">Total Bookings</div><div className="font-syne text-3xl font-extrabold text-blue-400">{stats.totalBookings || bookings.length}</div><div className="flex justify-between items-center mt-2"><span className="text-xs font-bold text-emerald-400">↑ All time</span></div></Card>
          <Card className="p-5 hover:border-emerald-400/50 transition-colors"><div className="text-[0.68rem] text-muted uppercase tracking-widest mb-2">Total Revenue</div><div className="font-syne text-3xl font-extrabold text-emerald-400">₹{stats.totalRevenue || '82k'}</div><div className="flex justify-between items-center mt-2"><span className="text-xs font-bold text-emerald-400">↑ 22%</span></div></Card>
          <Card className="p-5 hover:border-red-400/50 transition-colors"><div className="text-[0.68rem] text-muted uppercase tracking-widest mb-2">Pending Issues</div><div className="font-syne text-3xl font-extrabold text-red-400">{stats.pendingIssues || 3}</div><div className="flex justify-between items-center mt-2"><span className="text-xs font-bold text-red-400">Needs attention</span></div></Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
          {/* User Management */}
          <Card className="p-6">
            <CardHeader 
              title="User Management"
              action={
                <input 
                  className="bg-input-bg border border-border rounded-lg py-2 px-3.5 text-text font-epilogue text-sm outline-none w-full sm:w-56 focus:border-yellow-500 transition-colors"
                  placeholder="Search users..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              }
            />
            <div className="flex gap-1 bg-input-bg rounded-lg p-1 mb-4 overflow-x-auto">
              {['All', 'Customers', 'Providers', 'Admins'].map(tab => (
                <div 
                  key={tab} 
                  className={`px-3 py-1.5 rounded-md text-xs cursor-pointer transition-colors whitespace-nowrap ${userFilter === tab ? 'bg-panel text-text font-medium shadow-sm' : 'text-muted hover:text-text'}`}
                  onClick={() => setUserFilter(tab)}
                >
                  {tab} ({
                    tab === 'All' ? users.length : 
                    users.filter(u => u.role === tab.toUpperCase().slice(0, -1)).length
                  })
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead><tr>
                <th className="text-[0.65rem] text-muted uppercase tracking-wider py-2 border-b border-border">Name</th>
                <th className="text-[0.65rem] text-muted uppercase tracking-wider py-2 border-b border-border">Email</th>
                <th className="text-[0.65rem] text-muted uppercase tracking-wider py-2 border-b border-border">Role</th>
                <th className="text-[0.65rem] text-muted uppercase tracking-wider py-2 border-b border-border">Status</th>
                <th className="text-[0.65rem] text-muted uppercase tracking-wider py-2 border-b border-border">Actions</th>
              </tr></thead>
              <tbody>
                {filteredUsers.slice(0, 5).map(u => (
                  <tr key={u.id} className="group hover:bg-input-bg transition-colors">
                    <td className="py-2.5 border-b border-border text-sm font-bold text-text">{u.name}</td>
                    <td className="py-2.5 border-b border-border text-sm text-muted">{u.email}</td>
                    <td className="py-2.5 border-b border-border"><span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${u.role === 'CUSTOMER' ? 'bg-blue-500/15 text-blue-400' : u.role === 'PROVIDER' ? 'bg-yellow-500/15 text-yellow-500' : 'bg-red-500/15 text-red-500'}`}>{u.role}</span></td>
                    <td className="py-2.5 border-b border-border text-sm">{u.isActive ? <><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>Active</> : <><span className="inline-block w-1.5 h-1.5 rounded-full bg-muted mr-1.5"></span>Suspended</>}</td>
                    <td className="py-2.5 border-b border-border flex items-center">
                      {u.isActive 
                        ? <button title="Suspend User" className="mr-1.5 px-2 py-0.5 border border-border text-muted rounded text-[0.7rem] hover:text-red-400 hover:border-red-400 transition-colors" onClick={() => handleSetStatus(u.id, false)}>Suspend</button>
                        : <button title="Activate User" className="mr-1.5 px-2 py-0.5 border border-emerald-500/50 text-emerald-400 rounded text-[0.7rem] hover:bg-emerald-500 hover:text-black transition-colors" onClick={() => handleSetStatus(u.id, true)}>Activate</button>
                      }
                      <button title="Warn User" className="mr-1.5 px-2 py-0.5 border border-border text-muted rounded text-[0.7rem] hover:text-yellow-500 hover:border-yellow-500 transition-colors" onClick={() => handleWarnUser(u.id, u.name)}>Warn</button>
                      <button title="View Bookings" className="mr-1.5 px-2 py-0.5 border border-border text-muted rounded text-[0.7rem] hover:text-blue-400 hover:border-blue-400 transition-colors" onClick={() => openBookingsModal(u.id, u.name)}>Bookings</button>
                      <button title="View Payments" className="px-2 py-0.5 border border-border text-muted rounded text-[0.7rem] hover:text-text hover:border-text transition-colors" onClick={() => openPaymentsModal(u.id, u.name)}>Payments</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            </div>
          </Card>

          {/* Activity Feed */}
          <Card className="p-6">
            <CardHeader title="Live Activity" action={<span className="text-xs text-yellow-500 cursor-pointer">View all →</span>} />
            <div className="flex flex-col">
              {activityFeed.map(act => (
                <div key={act.id} className="flex gap-3 py-2.5 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 bg-blue-500/10">{act.icon}</div>
                  <div>
                    <div className="text-sm text-text">{act.text}</div>
                    <div className="text-[0.7rem] text-muted mt-0.5">{act.time}</div>
                  </div>
                </div>
              ))}
              {activityFeed.length === 0 && <p className="text-muted text-sm py-5">No recent activity.</p>}
            </div>
          </Card>
        </div>

        {/* Bottom Row: Recent Bookings & Revenue */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card className="p-6">
             <CardHeader title="Recent Bookings" />
             <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[400px]">
               <thead><tr>
                 <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">ID</th>
                 <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">Service</th>
                 <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">Amount</th>
                 <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">Status</th>
               </tr></thead>
               <tbody>
                 {bookings.map(b => (
                   <tr key={b.id} className="group hover:bg-input-bg transition-colors">
                     <td className="py-2.5 border-b border-border text-sm text-muted">#{b.id}</td>
                     <td className="py-2.5 border-b border-border text-sm text-text">{b.serviceName || `Service #${b.serviceId}`}</td>
                     <td className="py-2.5 border-b border-border text-sm font-bold text-text">₹499</td>
                     <td className="py-2.5 border-b border-border"><span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${b.status === 'CONFIRMED' ? 'bg-blue-500/15 text-blue-400' : b.status === 'PENDING' ? 'bg-yellow-500/15 text-yellow-500' : b.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-500'}`}>{b.status}</span></td>
                   </tr>
                 ))}
               </tbody>
             </table>
             </div>
          </Card>

          <Card className="p-6">
            <CardHeader title="Monthly Revenue" className="mb-2" />
            <div className="text-xs text-muted mb-4">in ₹ thousands</div>
            <div className="flex items-end gap-1 h-24">
               {[45, 55, 50, 70, 60, 80, 65, 90].map((h, i) => (
                 <div key={i} className={`flex-1 rounded-t-sm transition-all hover:brightness-125 ${i===7 ? 'bg-emerald-400 opacity-100' : 'bg-blue-500 opacity-60'}`} style={{height:`${h}%`}}></div>
               ))}
            </div>
            <div className="flex justify-between mt-2 text-[0.65rem] text-muted"><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span></div>
          </Card>
        </div>
      </main>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}>
          <div className="bg-panel border border-border rounded-2xl p-6 w-[700px] max-w-full animate-in fade-in zoom-in duration-200">
            <h3 className="font-syne font-bold text-lg mb-5 text-text">{activeModal === 'BOOKINGS' ? 'Booking' : 'Payment'} History for {modalData.userName}</h3>
            
            {modalData.loading ? <p>Loading...</p> : (
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    {activeModal === 'BOOKINGS' 
                      ? <tr>
                          <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">ID</th>
                          <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">Service</th>
                          <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">Address</th>
                          <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">Date</th>
                          <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">Status</th>
                          <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">Actions</th>
                        </tr>
                      : <tr>
                          <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">ID</th>
                          <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">Booking</th>
                          <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">Amount</th>
                          <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">Method</th>
                          <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">Status</th>
                          <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">Actions</th>
                        </tr>
                    }
                  </thead>
                  <tbody>
                    {modalData.items.length === 0 ? <tr><td colSpan="6" className="text-center py-4 text-muted text-sm">No records found.</td></tr> :
                     modalData.items.map(item => (
                       activeModal === 'BOOKINGS' ? (
                         <tr key={item.id} className="group hover:bg-input-bg transition-colors">
                           <td className="py-2.5 border-b border-border text-sm text-muted">#{item.id}</td>
                           <td className="py-2.5 border-b border-border text-sm text-text">{item.serviceName || item.serviceId}</td>
                           <td className="py-2.5 border-b border-border text-sm text-text">{item.address}</td>
                           <td className="py-2.5 border-b border-border text-sm text-muted">{new Date(item.bookingDate).toLocaleDateString()}</td>
                           <td className="py-2.5 border-b border-border"><span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${item.status === 'CONFIRMED' ? 'bg-blue-500/15 text-blue-400' : item.status === 'PENDING' ? 'bg-yellow-500/15 text-yellow-500' : 'bg-red-500/15 text-red-500'}`}>{item.status}</span></td>
                           <td className="py-2.5 border-b border-border">{item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && (
                             <button className="px-2 py-0.5 border border-border text-muted rounded text-[0.7rem] hover:text-red-400 hover:border-red-400 transition-colors" onClick={() => handleAdminCancel(item.id)}>Cancel</button>
                           )}</td>
                         </tr>
                       ) : (
                         <tr key={item.id || item.paymentId} className="group hover:bg-input-bg transition-colors">
                           <td className="py-2.5 border-b border-border text-sm text-muted">{item.id || item.paymentId}</td>
                           <td className="py-2.5 border-b border-border text-sm text-text">#{item.bookingId}</td>
                           <td className="py-2.5 border-b border-border text-sm font-bold text-text">₹{item.amount}</td>
                           <td className="py-2.5 border-b border-border text-sm text-muted">{item.paymentMethod}</td>
                           <td className="py-2.5 border-b border-border text-sm text-text">{item.status}</td>
                           <td className="py-2.5 border-b border-border">{item.status === 'SUCCESS' && (
                             <button className="px-2 py-0.5 border border-border text-muted rounded text-[0.7rem] hover:text-red-400 hover:border-red-400 transition-colors" onClick={() => handleRefund(item.id || item.paymentId)}>Refund</button>
                           )}</td>
                         </tr>
                       )
                     ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
              {activeModal === 'PAYMENTS' && (
                <div>
                  <button className="px-3 py-1 mr-2 border border-border rounded text-xs text-text disabled:opacity-50" disabled={modalData.page === 0} onClick={() => openPaymentsModal(modalData.userId, modalData.userName, modalData.page - 1)}>Previous</button>
                  <button className="px-3 py-1 border border-border rounded text-xs text-text disabled:opacity-50" disabled={modalData.page >= modalData.totalPages - 1} onClick={() => openPaymentsModal(modalData.userId, modalData.userName, modalData.page + 1)}>Next</button>
                </div>
              )}
              <button className="ml-auto px-4 py-1.5 bg-white/5 border border-border rounded text-xs text-text hover:bg-white/10" onClick={() => setActiveModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;