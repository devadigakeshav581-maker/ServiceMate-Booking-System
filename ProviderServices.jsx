import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { ServiceAPI, CategoryAPI } from './api';

const ProviderServices = () => {
    const fallbackCategories = [
        { id: 'fb-plumbing', name: 'Plumbing', icon: '🔧' },
        { id: 'fb-electrical', name: 'Electrical', icon: '⚡' },
        { id: 'fb-cleaning', name: 'Cleaning', icon: '🧹' },
        { id: 'fb-ac-repair', name: 'AC Repair', icon: '❄️' },
        { id: 'fb-carpentry', name: 'Carpentry', icon: '🪚' },
        { id: 'fb-painting', name: 'Painting', icon: '🎨' },
        { id: 'fb-pest-control', name: 'Pest Control', icon: '🐜' },
        { id: 'fb-appliance-repair', name: 'Appliance Repair', icon: '🔌' }
    ];
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Plumbing',
        isAvailable: true
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const fetchServices = useCallback(async () => {
        try {
            const [servicesRes, categoriesRes] = await Promise.all([
                ServiceAPI.getByProvider(),
                CategoryAPI.getAll()
            ]);
            setServices(servicesRes || []);
            setCategories(categoriesRes || []);
            
            // Set default category if categories exist and formData.category is empty
            if (categoriesRes && categoriesRes.length > 0 && !formData.category) {
                setFormData(prev => ({ ...prev, category: categoriesRes[0].name }));
            }
        } catch (err) {
            console.error('Error fetching services:', err);
            setError('Failed to load your services.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Service name is required.';
        if (!formData.description.trim()) errors.description = 'Description is required.';
        if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
            errors.price = 'Valid price is required.';
        }
        return errors;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingService) {
                await api.put(`/api/services/${editingService.id}`, formData);
            } else {
                await ServiceAPI.create(formData);
            }
            closeModal();
            fetchServices();
        } catch (err) {
            console.error('Error saving service:', err);
            alert('Failed to save service.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Confirm deletion? Active bookings may block this.')) return;
        try {
            await api.delete(`/api/services/${id}`);
            fetchServices();
        } catch (err) {
            alert('Could not delete service.');
        }
    };

    const openModal = (service = null) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                description: service.description,
                price: service.price,
                category: service.category || 'Plumbing',
                isAvailable: service.isAvailable !== false
            });
        } else {
            setEditingService(null);
            setFormData({ name: '', description: '', price: '', category: 'Plumbing', isAvailable: true });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
        setFormErrors({});
    };

    if (loading) return <div className="text-center p-20 text-[#7070a0]">Loading service catalog...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight">Service Catalog</h1>
                    <p className="text-[#7070a0] mt-1">Manage the professional services you offer to customers.</p>
                </div>
                <button onClick={() => openModal()} className="premium-button flex items-center gap-2 group shadow-lg shadow-[#6c63ff]/20 scale-105 hover:scale-110 active:scale-95 transition-all">
                    <span className="text-2xl font-light">+</span> 
                    <span className="font-bold">Launch New Service</span>
                </button>
            </header>

            {error && <div className="bg-[#ff6584]/10 text-[#ff6584] p-4 rounded-xl text-sm border border-[#ff6584]/20 text-center font-bold">⚠️ {error}</div>}

            {services.length === 0 ? (
                <div className="premium-card py-24 text-center border-2 border-dashed border-[#2a2a3a] bg-[#13131a]/50">
                    <div className="text-6xl mb-6 opacity-20">🛠️</div>
                    <h3 className="text-xl font-bold text-white mb-2">No active services found</h3>
                    <p className="text-[#7070a0] italic max-w-sm mx-auto mb-8">You haven't listed any services yet. Start by adding your first professional offering to reach customers.</p>
                    <button onClick={() => openModal()} className="premium-button">Get Started</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map(service => (
                        <div key={service.id} className="premium-card group hover:border-[#6c63ff]/50 transition-all duration-500 hover:shadow-2xl hover:shadow-[#6c63ff]/10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-[#1c1c27] rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 group-hover:bg-[#6c63ff]/10 transition-all duration-300">
                                    {service.category === 'Electrical' ? '⚡' : service.category === 'Cleaning' ? '🧹' : '🔧'}
                                </div>
                                <span className={`px-3 py-1.5 rounded-full text-[0.6rem] font-black uppercase tracking-widest ${service.isAvailable ? 'bg-[#43e97b]/10 text-[#43e97b] border border-[#43e97b]/20' : 'bg-[#ff6584]/10 text-[#ff6584] border border-[#ff6584]/20'}`}>
                                    {service.isAvailable ? 'Online' : 'Paused'}
                                </span>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#6c63ff] transition-colors">{service.name}</h3>
                            <p className="text-[#7070a0] text-sm line-clamp-2 mb-6 h-10 leading-relaxed">{service.description}</p>
                            
                            <div className="flex justify-between items-center pt-6 border-t border-[#2a2a3a]">
                                <div className="text-2xl font-black text-white">₹{service.price}</div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openModal(service)} className="p-3 text-[#7070a0] hover:text-[#6c63ff] hover:bg-[#6c63ff]/10 rounded-xl transition-all" title="Edit Service">
                                        <span className="text-xl">✏️</span>
                                    </button>
                                    <button onClick={() => handleDelete(service.id)} className="p-3 text-[#7070a0] hover:text-[#ff6584] hover:bg-[#ff6584]/10 rounded-xl transition-all" title="Delete Service">
                                        <span className="text-xl">🗑️</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="premium-card w-full max-w-xl p-0 overflow-hidden shadow-2xl border-[#6c63ff]/20 animate-in zoom-in-95 duration-500">
                        <header className="p-8 border-b border-[#2a2a3a] bg-gradient-to-r from-[#6c63ff]/5 to-transparent">
                            <h2 className="text-3xl font-extrabold text-white font-serif tracking-tight">{editingService ? 'Refine Service' : 'List New Service'}</h2>
                            <p className="text-[#7070a0] text-sm mt-1">Configure the technical and pricing details for your offering.</p>
                        </header>
                        
                        <form onSubmit={handleSubmit} className="p-8 space-y-7">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                                <div className="space-y-2">
                                    <label className="text-[0.65rem] font-black uppercase tracking-[3px] text-[#7070a0] ml-1">Service Title</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="premium-input w-full" placeholder="e.g. Master Electrical Install" />
                                    {formErrors.name && <p className="text-[#ff6584] text-[0.65rem] font-bold ml-1">⚠️ {formErrors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[0.65rem] font-black uppercase tracking-[3px] text-[#7070a0] ml-1">Standard Category</label>
                                    <select name="category" value={formData.category} onChange={handleInputChange} className="premium-input w-full appearance-none">
                                        {(categories.length === 0 ? fallbackCategories : categories).map(cat => (
                                            <option key={cat.id || cat.name} value={cat.name}>
                                                {cat.icon || '🔧'} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-black uppercase tracking-[3px] text-[#7070a0] ml-1">Work Scope Description</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" className="premium-input w-full resize-none leading-relaxed" placeholder="Describe the professional standard and scope of this service..." />
                                {formErrors.description && <p className="text-[#ff6584] text-[0.65rem] font-bold ml-1">⚠️ {formErrors.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                                <div className="space-y-2">
                                    <label className="text-[0.65rem] font-black uppercase tracking-[3px] text-[#7070a0] ml-1">Base Price (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7070a0] font-bold pointer-events-none">₹</span>
                                        <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="premium-input w-full pl-10" placeholder="0.00" />
                                    </div>
                                    {formErrors.price && <p className="text-[#ff6584] text-[0.65rem] font-bold ml-1">⚠️ {formErrors.price}</p>}
                                </div>
                                <div className="flex items-center gap-4 bg-[#1c1c27] p-3 rounded-2xl border border-[#2a2a3a]">
                                    <div className="flex-1">
                                        <div className="text-[0.65rem] font-black uppercase tracking-wider text-white">Visible in Search</div>
                                        <div className="text-[0.6rem] text-[#7070a0]">Show this listing to potential clients</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleInputChange} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-[#2a2a3a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#43e97b]"></div>
                                    </label>
                                </div>
                            </div>

                            <footer className="pt-6 flex gap-4">
                                <button type="button" onClick={closeModal} className="flex-1 bg-[#1c1c27] border border-[#2a2a3a] text-white py-4 rounded-2xl font-bold hover:bg-[#252535] transition-all">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="flex-[2] premium-button py-4 text-lg">
                                    {isSubmitting ? 'Platform Syncing...' : editingService ? 'Update Service' : 'Verify & Launch'}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderServices;