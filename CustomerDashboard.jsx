import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from './api';
import { useNavigate } from 'react-router-dom';
import Pagination from './Pagination';
import BookingModal from './BookingModal';

const CustomerDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'bookingDate', direction: 'desc' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [services, setServices] = useState([]);
    const itemsPerPage = 5;
    const navigate = useNavigate();

    const fetchBookings = useCallback(async () => {
        try {
            // Ensure your backend has an endpoint like /api/bookings that returns
            // bookings for the currently authenticated user.
            const response = await api.get('/api/bookings');
            setBookings(response.data);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError('Failed to load your bookings. Please try again.');
            
            // If unauthorized, redirect to login
            if (err.response && err.response.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Initial data fetch
    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Fetch available services for the booking form
    useEffect(() => {
        const fetchServices = async () => {
            try {
                // Assuming an endpoint to get all available services exists
                const response = await api.get('/api/services');
                setServices(response.data);
            } catch (err) {
                console.error("Failed to fetch services", err);
            }
        };
        fetchServices();
    }, []); // Fetch once on component mount

    // Set up WebSocket for real-time updates
    useEffect(() => {
        // Connect to the socket server. The URL should point to your backend.
        // If frontend and backend are on the same domain, you can omit the URL.
        const socket = io();

        // Listen for an event that signifies a booking has been updated.
        // This event name ('booking_update') should match what your backend emits.
        socket.on('booking_update', (updatedBooking) => {
            console.log('Booking update received:', updatedBooking);
            // Re-fetch the booking list to show the latest status.
            fetchBookings();
        });

        // Clean up the socket connection when the component unmounts.
        return () => {
            socket.disconnect();
        };
    }, [fetchBookings]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            // Assumes a backend endpoint exists to handle cancellation, e.g., PUT /api/bookings/{id}/cancel
            await api.put(`/api/bookings/${bookingId}/cancel`);
            // Update the state locally for an immediate UI update
            setBookings(prevBookings => prevBookings.map(b => 
                b.id === bookingId ? { ...b, status: 'CANCELLED' } : b
            ));
        } catch (err) {
            console.error('Failed to cancel booking:', err);
            alert('Could not cancel the booking. It may have already started.');
        }
    };

    const handleCreateBooking = async (bookingData) => {
        try {
            // Assumes a POST endpoint to create a new booking
            await api.post('/api/bookings', bookingData);
            alert('Booking created successfully!');
            fetchBookings(); // Re-fetch bookings to show the new one
        } catch (err) {
            console.error('Failed to create booking:', err);
            throw new Error(err.response?.data?.message || 'Failed to create booking. Please try again.');
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Sorting logic
    const sortedBookings = [...bookings].sort((a, b) => {
        if (sortConfig.key === 'bookingDate') {
            const dateA = new Date(a.bookingDate || 0);
            const dateB = new Date(b.bookingDate || 0);
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        const valA = (a[sortConfig.key] || '').toString().toLowerCase();
        const valB = (b[sortConfig.key] || '').toString().toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedBookings.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);

    if (loading) {
        return <div className="dashboard-loading">Loading your dashboard...</div>;
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <p className="form-error">{error}</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary">Retry</button>
                <br /><br />
                <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
            </div>
        );
    }

    return (
        <div className="dashboard-container" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Customer Dashboard</h1>
                <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
            </div>

            <section className="bookings-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>My Bookings</h2>
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                        Create New Booking
                    </button>
                </div>
                {bookings.length === 0 ? (
                    <p>You have no current bookings.</p>
                ) : (
                    <>
                        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => handleSort('serviceName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        Service {sortConfig.key === 'serviceName' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => handleSort('bookingDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        Date {sortConfig.key === 'bookingDate' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => handleSort('address')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        Address {sortConfig.key === 'address' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((booking) => (
                                    <tr key={booking.id}>
                                        <td>{booking.id}</td>
                                        <td>{booking.serviceName || `Service #${booking.serviceId}`}</td>
                                        <td>{new Date(booking.bookingDate || Date.now()).toLocaleDateString()}</td>
                                        <td>{booking.status}</td>
                                        <td>{booking.address || 'N/A'}</td>
                                        <td>
                                            {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                                                <button
                                                    onClick={() => handleCancelBooking(booking.id)} className="btn btn-sm btn-danger"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            onPageChange={setCurrentPage} 
                        />
                    </>
                )}
            </section>

            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                services={services}
                onSubmit={handleCreateBooking}
            />
        </div>
    );
};

export default CustomerDashboard;