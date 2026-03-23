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
        const socket = io('http://localhost:8080');

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
        return <div className="text-center p-10 text-gray-500">Loading provider dashboard...</div>;
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center">
                <p className="font-bold mb-2">{error}</p>
                <button onClick={() => window.location.reload()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">Retry</button>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Provider Dashboard</h1>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/provider/services')} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">Manage Services</button>
                </div>
            </div>

            <section className="bookings-section">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Assigned Bookings</h2>

                {/* Filter Controls */}
                <div className="mb-4">
                    <label className="mr-2 font-semibold text-gray-700">Filter by Status:</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1); // Reset to first page when filter changes
                        }}
                        className="p-2 border border-gray-300 rounded-md"
                    >
                        <option value="ALL">All Bookings</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                {filteredBookings.length === 0 ? (
                    <p className="text-gray-500">You have no assigned bookings at the moment.</p>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200">ID</th>
                                <th className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200">Customer Name</th>
                                <th className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200">Address</th>
                                <th className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200">Service</th>
                                <th className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200">Date</th>
                                <th className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200">Status</th>
                                <th className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((booking) => (
                                <tr key={booking.id}>
                                    <td className="py-3 px-4 border-b border-gray-200">{booking.id}</td>
                                    <td className="py-3 px-4 border-b border-gray-200">{booking.customerName || 'N/A'}</td>
                                    <td className="py-3 px-4 border-b border-gray-200">{booking.address || 'N/A'}</td>
                                    <td className="py-3 px-4 border-b border-gray-200">{booking.serviceName}</td>
                                    <td className="py-3 px-4 border-b border-gray-200">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                                    <td className="py-3 px-4 border-b border-gray-200">{booking.status}</td>
                                    <td className="py-3 px-4 border-b border-gray-200">
                                        {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' ? (
                                            <button 
                                                onClick={() => requestComplete(booking.id)} className="bg-green-500 text-white text-xs font-bold py-1 px-2 rounded hover:bg-green-600">
                                                Mark Complete
                                            </button>
                                        ) : (
                                            <span className="text-gray-500 text-sm">No actions</span>
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