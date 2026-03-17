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
        <div className="modal-overlay">
            <style>
                {`@keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }`}
            </style>
            <div className="modal-content">
                <h2>Create New Booking</h2>
                <form onSubmit={handleSubmit} noValidate>
                    {error && <p className="form-error">{error}</p>}
                    <div className="form-group">
                        <label htmlFor="serviceId">Service</label>
                        <select
                            id="serviceId"
                            name="serviceId"
                            value={bookingData.serviceId}
                            onChange={handleChange}
                            required
                        >
                            <option value="" disabled>Select a service</option>
                            {services.length > 0 ? (
                                services.map(service => (
                                    <option key={service.id} value={service.id}>
                                        {service.name} - ${service.price}
                                    </option>
                                ))
                            ) : (
                                <option disabled>Loading services...</option>
                            )}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="bookingDate">Date</label>
                        <input
                            type="date"
                            id="bookingDate"
                            name="bookingDate"
                            value={bookingData.bookingDate}
                            onChange={handleChange}
                            required
                            min={new Date().toISOString().split("T")[0]} // Prevent booking past dates
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="address">Address</label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={bookingData.address}
                            onChange={handleChange}
                            placeholder="Enter service address"
                            required
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={handleClose} className="btn btn-light" disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="btn btn-success" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isSubmitting && (
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid #fff',
                                    borderTop: '2px solid transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                            )}
                            {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingModal;