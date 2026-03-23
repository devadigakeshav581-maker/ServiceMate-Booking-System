import { useState } from 'react';

const BookingModal = ({ isOpen, onClose, services, onSubmit }) => {
    const [bookingData, setBookingData] = useState({
        serviceId: '',
        bookingDate: '',
        address: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBookingData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!bookingData.serviceId || !bookingData.bookingDate || !bookingData.address) {
            setError('Please fill out all fields.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(bookingData);
            // Reset form and close on success
            setBookingData({ serviceId: '', bookingDate: '', address: '' });
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create booking.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Create New Booking</h2>
                <form onSubmit={handleSubmit} noValidate>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <div className="mb-4">
                        <label htmlFor="serviceId" className="block text-gray-700 text-sm font-bold mb-2">Service</label>
                        <select
                            id="serviceId"
                            name="serviceId"
                            value={bookingData.serviceId}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="" disabled>Select a service</option>
                            {services.length > 0 ? (
                                services.map(service => (
                                    <option key={service.id} value={service.id}>
                                        {service.name} - ${service.price}
                                    </option>
                                ))
                            ) : (
                                <option disabled>No services available</option>
                            )}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="bookingDate" className="block text-gray-700 text-sm font-bold mb-2">Date</label>
                        <input
                            type="date"
                            id="bookingDate"
                            name="bookingDate"
                            value={bookingData.bookingDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            min={new Date().toISOString().split("T")[0]} // Prevent booking past dates
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">Address</label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={bookingData.address}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter service address"
                            required
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-4">
                        <button type="button" onClick={handleClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50" disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2" disabled={isSubmitting}>
                            {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingModal;