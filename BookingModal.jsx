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
            setError('Please complete all fields to secure your booking.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(bookingData);
            setBookingData({ serviceId: '', bookingDate: '', address: '' });
            onClose();
        } catch (err) {
            setError(err.message || 'Platform synchronization failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="premium-card w-full max-w-lg p-0 overflow-hidden shadow-2xl border-[#6c63ff]/20 animate-in zoom-in-95 duration-500">
                <header className="p-8 border-b border-[#2a2a3a] bg-gradient-to-r from-[#6c63ff]/5 to-transparent">
                    <h2 className="text-3xl font-extrabold text-white font-serif tracking-tight">Reserve Service</h2>
                    <p className="text-[#7070a0] text-sm mt-1">Configure your professional service request below.</p>
                </header>
                
                <form onSubmit={handleSubmit} noValidate className="p-8 space-y-6">
                    {error && (
                        <div className="bg-[#ff6584]/10 border border-[#ff6584]/20 text-[#ff6584] p-4 rounded-xl text-xs font-bold animate-in slide-in-from-top-2">
                            ⚠️ {error}
                        </div>
                    )}
                    
                    <div className="space-y-2 text-white">
                        <label className="text-[0.65rem] font-black uppercase tracking-[3px] text-[#7070a0] ml-1">Select Service Offering</label>
                        <select
                            name="serviceId"
                            value={bookingData.serviceId}
                            onChange={handleChange}
                            className="premium-input w-full appearance-none pr-10"
                        >
                            <option value="" disabled>Choose from catalog...</option>
                            {services.map(service => (
                                <option key={service.id} value={service.id} className="bg-[#13131a]">
                                    {service.name} — ₹{service.price}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-black uppercase tracking-[3px] text-[#7070a0] ml-1">Service Date</label>
                            <input
                                type="date"
                                name="bookingDate"
                                value={bookingData.bookingDate}
                                onChange={handleChange}
                                min={new Date().toISOString().split("T")[0]}
                                className="premium-input w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-black uppercase tracking-[3px] text-[#7070a0] ml-1">Service Time</label>
                            <select className="premium-input w-full">
                                <option>09:00 AM - Morning</option>
                                <option>02:00 PM - Afternoon</option>
                                <option>06:00 PM - Evening</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 text-white">
                        <label className="text-[0.65rem] font-black uppercase tracking-[3px] text-[#7070a0] ml-1">Full Service Address</label>
                        <input
                            type="text"
                            name="address"
                            value={bookingData.address}
                            onChange={handleChange}
                            placeholder="Street, Building, Unit Number"
                            className="premium-input w-full"
                        />
                    </div>

                    <footer className="pt-6 flex gap-4">
                        <button 
                            type="button" 
                            onClick={handleClose} 
                            className="flex-1 py-3 bg-[#1c1c27] border border-[#2a2a3a] text-white rounded-xl font-bold hover:bg-[#252535] transition-all"
                            disabled={isSubmitting}
                        >
                            Dismiss
                        </button>
                        <button 
                            type="submit" 
                            className="flex-[2] premium-button py-3 flex items-center justify-center gap-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                'Secure Booking'
                            )}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default BookingModal;