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
        const socket = io('http://localhost:8080');

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
        return <div className="text-center p-10 text-gray-500">Loading your dashboard...</div>;
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
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Customer Dashboard</h1>

            <section className="bookings-section">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-gray-700">My Bookings</h2>
                    <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-200">
                        Create New Booking
                    </button>
                </div>
                {bookings.length === 0 ? (
                    <p className="text-gray-500">You have no current bookings.</p>
                ) : (
                    <>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('id')} className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200 cursor-pointer">
                                        ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => handleSort('serviceName')} className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200 cursor-pointer">
                                        Service {sortConfig.key === 'serviceName' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => handleSort('bookingDate')} className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200 cursor-pointer">
                                        Date {sortConfig.key === 'bookingDate' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => handleSort('status')} className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200 cursor-pointer">
                                        Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => handleSort('address')} className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200 cursor-pointer">
                                        Address {sortConfig.key === 'address' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((booking) => (
                                    <tr key={booking.id}>
                                        <td className="py-3 px-4 border-b border-gray-200">{booking.id}</td>
                                        <td className="py-3 px-4 border-b border-gray-200">{booking.serviceName || `Service #${booking.serviceId}`}</td>
                                        <td className="py-3 px-4 border-b border-gray-200">{new Date(booking.bookingDate || Date.now()).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 border-b border-gray-200">{booking.status}</td>
                                        <td className="py-3 px-4 border-b border-gray-200">{booking.address || 'N/A'}</td>
                                        <td className="py-3 px-4 border-b border-gray-200">
                                            {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                                                <button
                                                    onClick={() => handleCancelBooking(booking.id)} className="bg-red-500 text-white text-xs font-bold py-1 px-2 rounded hover:bg-red-600 transition duration-200"
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