import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { ServiceAPI, BookingAPI, getUserId, logout, BASE_URL } from './api';
import { useToast } from './ToastContext';
import ThemeToggle from './ThemeToggle';
import { Card, CardHeader } from './Card';
import { Skeleton } from './Skeleton';
// import WorkingHours from './WorkingHours'; // Assuming missing or not provided
import ProviderProfile from './ProviderProfile';

const ProviderDashboard = () => {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [sortConfig, setSortConfig] = useState({ key: 'bookingDate', direction: 'desc' });
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  // Modal States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({ name: '', price: '', emoji: '🔧' });

  const userId = getUserId();

  // ─────────────────────────────────────────────
  // Data Loading
  // ─────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 1. Fetch Provider's Services
      const myServices = await ServiceAPI.getByProvider(userId);
      setServices(myServices);

      // 2. Fetch Bookings for those services
      // Note: If backend supported BookingAPI.getByProvider(userId), we'd use that.
      // Since it relies on service IDs, we fetch per service.
      if (myServices.length > 0) {
        const bookingPromises = myServices.map(s => BookingAPI.getByService(s.id));
        const results = await Promise.all(bookingPromises);
        // Flatten and sort
        const allBookings = results.flat().sort((a, b) => b.id - a.id);
        setBookings(allBookings);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─────────────────────────────────────────────
  // Real-time Update
  // ─────────────────────────────────────────────
  useEffect(() => {
    const socket = io(BASE_URL);
    socket.on('connect', () => console.log('Provider connected to WS'));
    
    socket.on('message', (msg) => {
      if (msg.type && msg.type.startsWith('BOOKING_')) {
        addToast(`New Update: ${msg.type}`, 'info');
        loadData(); // Refresh data
      }
    });

    return () => socket.disconnect();
  }, [loadData, addToast]);

  // ─────────────────────────────────────────────
  // Service Management
  // ─────────────────────────────────────────────
  const openServiceModal = (service = null) => {
    if (service) {
      setEditingService(service);
      const emoji = service.description ? service.description.split(' ')[0] : '🔧';
      setServiceForm({ 
        name: service.name, 
        price: service.price, 
        emoji: emoji 
      });
    } else {
      setEditingService(null);
      setServiceForm({ name: '', price: '', emoji: '🔧' });
    }
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async () => {
    const { name, price, emoji } = serviceForm;
    if (!name || !price) {
      addToast('Please fill in all fields', 'warning');
      return;
    }

    const payload = {
      name,
      price: parseFloat(price),
      providerId: userId,
      description: `${emoji} ${name}`
    };

    try {
      if (editingService) {
        await ServiceAPI.update(editingService.id, payload);
        addToast('Service updated successfully', 'success');
      } else {
        await ServiceAPI.create(payload);
        addToast('Service created successfully', 'success');
      }
      setIsServiceModalOpen(false);
      loadData();
    } catch (err) {
      addToast('Failed to save service', 'error');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await ServiceAPI.delete(id);
      addToast('Service deleted', 'success');
      loadData();
    } catch (err) {
      addToast('Failed to delete service', 'error');
    }
  };

  const exportToCSV = () => {
    if (!bookings.length) {
      addToast('No bookings to export', 'info');
      return;
    }

    const headers = ['ID', 'Service', 'Address', 'Date', 'Status', 'Amount'];
    const rows = bookings.map(b => {
      const service = services.find(s => s.id === b.serviceId);
      const amount = service ? service.price : 499;
      return [
        b.id,
        `"${(b.serviceName || service?.name || `Service #${b.serviceId}`).replace(/"/g, '""')}"`,
        `"${(b.address || '').replace(/"/g, '""')}"`,
        new Date(b.bookingDate).toLocaleDateString(),
        b.status,
        amount
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `provider_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─────────────────────────────────────────────
  // Booking Actions
  // ─────────────────────────────────────────────
  const handleStatusUpdate = async (id, status) => {
    try {
      if (status === 'CONFIRMED') {
        await BookingAPI.confirm(id);
        addToast('Booking confirmed!', 'success');
      } else if (status === 'COMPLETED') {
        await BookingAPI.complete(id);
        addToast('Booking marked as completed!', 'success');
      }
      loadData();
    } catch (err) {
      addToast(`Failed to update booking`, 'error');
    }
  };

  // Stats Calculation
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    revenue: bookings
      .filter(b => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
      .reduce((acc, curr) => acc + (450), 0) // Mock price if not in booking object
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-500/15 text-yellow-500';
      case 'CONFIRMED': return 'bg-accent/15 text-accent';
      case 'COMPLETED': return 'bg-green-500/15 text-green-500';
      case 'CANCELLED': return 'bg-red-500/15 text-red-500';
      default: return 'bg-gray-500/15 text-gray-500';
    }
  };

  const sortedBookings = useMemo(() => {
    let sortableItems = [...bookings];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [bookings, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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
          <div 
            className={`flex items-center gap-3 px-6 py-2.5 cursor-pointer text-sm transition-colors border-l-[3px] ${activeView === 'dashboard' ? 'text-accent border-accent bg-accent/10' : 'text-muted border-transparent hover:text-text hover:bg-white/5'}`}
            onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }}
          >
            <span className="text-lg w-5 text-center">🏠</span> Dashboard
          </div>
          <div 
            className="flex items-center gap-3 px-6 py-2.5 text-muted border-l-[3px] border-transparent hover:text-text hover:bg-white/5 cursor-pointer transition-colors duration-200 text-sm"
            onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }}
          >
            <span className="text-lg w-5 text-center">📅</span> Bookings
          </div>
          <div 
            className="flex items-center gap-3 px-6 py-2.5 text-muted border-l-[3px] border-transparent hover:text-text hover:bg-white/5 cursor-pointer transition-colors duration-200 text-sm"
            onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }}
          >
            <span className="text-lg w-5 text-center">🔧</span> My Services
          </div>
          <div 
            className="flex items-center gap-3 px-6 py-2.5 text-muted border-l-[3px] border-transparent hover:text-text hover:bg-white/5 cursor-pointer transition-colors duration-200 text-sm"
          >
            <span className="text-lg w-5 text-center">💰</span> Earnings
          </div>
          <div className={`flex items-center gap-3 px-6 py-2.5 cursor-pointer text-sm transition-colors border-l-[3px] ${activeView === 'profile' ? 'text-accent border-accent bg-accent/10' : 'text-muted border-transparent hover:text-text hover:bg-white/5'}`} onClick={() => { setActiveView('profile'); setSidebarOpen(false); }}>
            <span className="text-lg w-5 text-center">👤</span> Profile
          </div>
        </nav>
        <div className="mt-auto p-6">
          <div className="flex items-center gap-2.5">

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent2 to-purple-500 flex items-center justify-center font-syne font-bold text-sm text-white">R</div>
            <div className="text-xs">
              <strong className="block font-medium text-text">Provider</strong>
              <span className="text-muted text-[0.72rem]">Service Provider</span>
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
          <div className="font-syne text-[1.7rem] font-extrabold text-text">{activeView === 'dashboard' ? 'Provider Dashboard' : 'Profile Settings'}</div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />

            {activeView === 'dashboard' && <button className="px-5 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-blue-600 transition-colors shadow-lg shadow-accent/20" onClick={() => openServiceModal()}>+ Add Service</button>}
          </div>
        </div>


        ) : (
        <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="p-5">
                <div className="flex justify-between items-start mb-3"><Skeleton className="w-10 h-10 rounded-xl" /><Skeleton className="h-5 w-16 rounded-full" /></div>
                <Skeleton className="h-8 w-12 mb-1" /><Skeleton className="h-3 w-20" />
              </Card>
            ))
          ) : (
            <>
              <Card className="p-5" hover><div className="flex justify-between items-start mb-3"><div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-lg">📅</div><span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Live</span></div><div className="font-syne text-3xl font-extrabold text-text mb-1">{stats.total}</div><div className="text-xs text-muted uppercase tracking-widest">Total Bookings</div></Card>
              <Card className="p-5" hover><div className="flex justify-between items-start mb-3"><div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-lg">⏳</div><span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">{stats.pending} urgent</span></div><div className="font-syne text-3xl font-extrabold text-text mb-1">{stats.pending}</div><div className="text-xs text-muted uppercase tracking-widest">Pending</div></Card>
              <Card className="p-5" hover><div className="flex justify-between items-start mb-3"><div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-lg">✅</div><span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Success</span></div><div className="font-syne text-3xl font-extrabold text-text mb-1">{stats.completed}</div><div className="text-xs text-muted uppercase tracking-widest">Completed</div></Card>
              <Card className="p-5" hover><div className="flex justify-between items-start mb-3"><div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-lg">💰</div><span className="text-xs font-bold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full">Est.</span></div><div className="font-syne text-3xl font-extrabold text-text mb-1">₹{stats.revenue}</div><div className="text-xs text-muted uppercase tracking-widest">Revenue</div></Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          {/* Left Column: Bookings */}
          <div>
            <Card className="p-6 mb-5">
              <CardHeader 
                title="Incoming Bookings" 
                action={<button onClick={exportToCSV} className="text-xs text-accent hover:underline font-medium">Export CSV</button>}
              />
              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th 
                      className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border cursor-pointer hover:text-text select-none"
                      onClick={() => requestSort('id')}
                    >
                      ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border cursor-pointer hover:text-text select-none"
                      onClick={() => requestSort('address')}
                    >
                      Address {sortConfig.key === 'address' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border cursor-pointer hover:text-text select-none"
                      onClick={() => requestSort('bookingDate')}
                    >
                      Date {sortConfig.key === 'bookingDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border cursor-pointer hover:text-text select-none"
                      onClick={() => requestSort('status')}
                    >
                      Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-xs text-muted uppercase tracking-wider py-2 border-b border-border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td className="py-3 border-b border-border"><Skeleton className="h-4 w-8" /></td>
                        <td className="py-3 border-b border-border"><Skeleton className="h-4 w-32" /></td>
                        <td className="py-3 border-b border-border"><Skeleton className="h-4 w-24" /></td>
                        <td className="py-3 border-b border-border"><Skeleton className="h-5 w-16 rounded-full" /></td>
                        <td className="py-3 border-b border-border"><Skeleton className="h-6 w-16 rounded-lg" /></td>
                      </tr>
                    ))
                  ) : (
                    sortedBookings.length > 0 ? sortedBookings.map(b => (
                      <tr key={b.id} className="group hover:bg-input-bg transition-colors">
                        <td className="py-3 border-b border-border text-sm font-medium text-muted">#{b.id}</td>
                        <td className="py-3 border-b border-border text-sm text-text font-bold">{b.address}</td>
                        <td className="py-3 border-b border-border text-sm text-muted">{new Date(b.bookingDate).toLocaleDateString()}</td>
                        <td className="py-3 border-b border-border"><span className={`px-2.5 py-0.5 rounded-full text-[0.7rem] font-semibold ${getStatusStyle(b.status)}`}>{b.status}</span></td>
                        <td className="py-3 border-b border-border">
                          <div className="flex gap-2">
                            {b.status === 'PENDING' && <button className="px-3 py-1 rounded-lg text-xs font-semibold bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors" onClick={() => handleStatusUpdate(b.id, 'CONFIRMED')}>Confirm</button>}
                            {b.status === 'CONFIRMED' && <button className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors" onClick={() => handleStatusUpdate(b.id, 'COMPLETED')}>Complete</button>}
                            {b.status === 'COMPLETED' && <span className="text-xs text-muted py-1">Done</span>}
                            {b.status === 'CANCELLED' && <span className="text-xs text-red-500 py-1">Cancelled</span>}
                          </div>
                        </td>
                    </tr>
                    )) : <tr><td colSpan="5" className="text-center py-5 text-muted text-sm">No bookings found.</td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </Card>
          </div>

          {/* Right Column: Services & Earnings */}
          <div className="flex flex-col gap-6">
            <Card className="p-6">
              <CardHeader title="My Services" />
              <div className="flex flex-col gap-3 mb-5">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-input-bg border border-border rounded-xl">
                      <Skeleton className="w-9 h-9 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <div className="flex gap-1.5">
                        <Skeleton className="h-6 w-10 rounded-lg" />
                        <Skeleton className="h-6 w-10 rounded-lg" />
                      </div>
                    </div>
                  ))
                ) : (
                  services.length > 0 ? services.map(s => {
                     const emoji = s.description ? s.description.split(' ')[0] : '🔧';
                     return (
                      <div key={s.id} className="flex items-center gap-3 p-3 bg-input-bg border border-border rounded-xl">
                        <div className="text-2xl w-9 text-center">{emoji}</div>
                        <div className="flex-1">
                          <strong className="block text-sm font-medium text-text">{s.name}</strong>
                          <span className="text-xs text-accent font-bold">₹{s.price}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <button className="px-3 py-1 rounded-lg text-xs font-semibold bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors" onClick={() => openServiceModal(s)}>Edit</button>
                          <button className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors" onClick={() => handleDeleteService(s.id)}>Del</button>
                        </div>
                      </div>
                     );
                  }) : <p className="text-muted text-sm">No services added yet.</p>
                )}
              </div>
              <button className="w-full py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-blue-600 transition-colors" onClick={() => openServiceModal()}>+ Add New Service</button>
            </Card>

            <Card className="p-6">
              <CardHeader title="Earnings Summary" />
              {loading ? (
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-border pb-3"><Skeleton className="h-4 w-12" /><Skeleton className="h-4 w-16" /></div>
                  <div className="flex justify-between pt-1"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-20" /></div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between py-3 border-b border-border text-sm"><span className="text-muted">Today</span><span className="font-syne font-bold text-text">₹--</span></div>
                  <div className="flex justify-between py-3 border-0 text-sm"><span className="text-muted">This Week</span><span className="font-syne font-bold text-text">₹{stats.revenue}</span></div>
                </>
              )}
            </Card>
          </div>
        </div>
        </>
        )}
      </main>

      {/* Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && setIsServiceModalOpen(false)}>
          <div className="bg-panel border border-border rounded-2xl p-8 w-[400px] max-w-full animate-in fade-in zoom-in duration-200">
            <h3 className="font-syne font-bold text-xl mb-6 text-text">{editingService ? 'Edit Service' : 'Add New Service'}</h3>
            <div className="mb-4">
              <label className="text-xs text-muted mb-1.5 block uppercase tracking-wide font-bold">Service Name</label>
              <input className="w-full bg-input-bg border border-border rounded-xl py-2.5 px-3.5 text-text font-epilogue text-sm outline-none transition-colors duration-200 focus:border-accent" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} placeholder="e.g. Home Cleaning" />
            </div>
            <div className="mb-4">
              <label className="text-xs text-muted mb-1.5 block uppercase tracking-wide font-bold">Price (₹)</label>
              <input className="w-full bg-input-bg border border-border rounded-xl py-2.5 px-3.5 text-text font-epilogue text-sm outline-none transition-colors duration-200 focus:border-accent" type="number" value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: e.target.value})} placeholder="499" />
            </div>
            <div className="mb-6">
              <label className="text-xs text-muted mb-1.5 block uppercase tracking-wide font-bold">Icon / Emoji</label>
              <input className="w-full bg-input-bg border border-border rounded-xl py-2.5 px-3.5 text-text font-epilogue text-sm outline-none transition-colors duration-200 focus:border-accent" value={serviceForm.emoji} onChange={e => setServiceForm({...serviceForm, emoji: e.target.value})} placeholder="🔧" />
            </div>
            <div className="flex gap-2.5">
              <button className="px-5 py-2.5 rounded-xl bg-white/5 text-text border border-border font-medium text-sm hover:border-accent hover:text-accent transition-colors" onClick={() => setIsServiceModalOpen(false)}>Cancel</button>
              <button className="flex-1 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-blue-600 transition-colors" onClick={handleSaveService}>{editingService ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>

      )}

    </div>
  );
};

export default ProviderDashboard;