import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from './api';
import { useNavigate } from 'react-router-dom';
import Pagination from './Pagination';
import ConfirmationModal from './ConfirmationModal';

const ProviderDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('ALL'); // State for filtering
    const [confirmDialog, setConfirmDialog] = useState(null); // Stores the ID of the booking to confirm
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const navigate = useNavigate();

    const fetchProviderBookings = useCallback(async () => {
        try {
            // Ensure your backend has an endpoint like /api/provider/bookings
            // that returns bookings assigned to the authenticated provider.
            const response = await api.get('/api/provider/bookings');
            setBookings(response.data);
        } catch (err) {
            console.error('Error fetching provider bookings:', err);
            setError('Failed to load your assigned bookings.');

            if (err.response && err.response.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Initial data fetch
    useEffect(() => {
        fetchProviderBookings();
    }, [fetchProviderBookings]);

    // Set up WebSocket for real-time updates
    useEffect(() => {
        const socket = io();

        // A new booking was created and might be assigned to this provider
        socket.on('booking_created', (newBooking) => {
            console.log('New booking created, refreshing list:', newBooking);
            fetchProviderBookings();
        });

        // An existing booking was updated (e.g., cancelled by customer)
        socket.on('booking_update', (updatedBooking) => {
            console.log('Booking update received, refreshing list:', updatedBooking);
            fetchProviderBookings();
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchProviderBookings]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const requestComplete = (bookingId) => {
        setConfirmDialog(bookingId);
    };

    const confirmComplete = async () => {
        const bookingId = confirmDialog;
        if (!bookingId) return;

        try {
            await api.put(`/api/bookings/${bookingId}/complete`);
            setBookings(prevBookings => prevBookings.map(b => 
                b.id === bookingId ? { ...b, status: 'COMPLETED' } : b
            ));
        } catch (err) {
            console.error('Error completing booking:', err);
            alert('Failed to mark booking as completed. Please try again.');
        }
        setConfirmDialog(null); // Close the dialog
    };

    // Filter logic
    const filteredBookings = bookings.filter(booking => 
        statusFilter === 'ALL' ? true : booking.status === statusFilter
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

    if (loading) {
        return <div className="dashboard-loading">Loading provider dashboard...</div>;
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
                <h1>Provider Dashboard</h1>
                <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
            </div>

            <section className="bookings-section">
                <h2>Assigned Bookings</h2>

                {/* Filter Controls */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Filter by Status:</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1); // Reset to first page when filter changes
                        }}
                        style={{ padding: '5px', borderRadius: '4px' }}
                    >
                        <option value="ALL">All Bookings</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                {filteredBookings.length === 0 ? (
                    <p>You have no assigned bookings at the moment.</p>
                ) : (
                    <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer Name</th>
                                <th>Address</th>
                                <th>Service</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((booking) => (
                                <tr key={booking.id}>
                                    <td>{booking.id}</td>
                                    <td>{booking.customerName || 'N/A'}</td>
                                    <td>{booking.address || 'N/A'}</td>
                                    <td>{booking.serviceName}</td>
                                    <td>{new Date(booking.bookingDate).toLocaleDateString()}</td>
                                    <td>{booking.status}</td>
                                    <td>
                                        {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' ? (
                                            <button 
                                                onClick={() => requestComplete(booking.id)} className="btn btn-sm btn-success">
                                                Mark Complete
                                            </button>
                                        ) : (
                                            <span style={{ color: '#666', fontSize: '0.9em' }}>No actions</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination Controls */}
                <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={setCurrentPage} 
                />

                <ConfirmationModal
                    isOpen={confirmDialog !== null}
                    onClose={() => setConfirmDialog(null)}
                    onConfirm={confirmComplete}
                    title="Confirm Completion"
                    message="Are you sure you want to mark this booking as COMPLETED?"
                />
            </section>
        </div>
    );
};

export default ProviderDashboard;