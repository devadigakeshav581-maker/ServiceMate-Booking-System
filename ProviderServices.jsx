import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

const ProviderServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        active: true
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await api.get('/api/provider/services');
            setServices(response.data);
        } catch (err) {
            console.error('Error fetching services:', err);
            setError('Failed to load your services.');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) {
            errors.name = 'Service name is required.';
        } else if (formData.name.length > 50) {
            errors.name = 'Service name cannot exceed 50 characters.';
        }

        if (!formData.description.trim()) {
            errors.description = 'Description is required.';
        }

        if (!formData.price) {
            errors.price = 'Price is required.';
        } else if (isNaN(formData.price) || Number(formData.price) <= 0) {
            errors.price = 'Price must be a positive number.';
        }

        return errors;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear the error for the field being edited
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
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
                await api.post('/api/services', formData);
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
        if (!window.confirm('Are you sure you want to delete this service?')) return;
        try {
            await api.delete(`/api/services/${id}`);
            fetchServices();
        } catch (err) {
            console.error('Error deleting service:', err);
            alert('Failed to delete service. It may have active bookings.');
        }
    };

    const openModal = (service = null) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                description: service.description,
                price: service.price,
                active: service.active
            });
        } else {
            setEditingService(null);
            setFormData({ name: '', description: '', price: '', active: true });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
        setFormErrors({}); // Clear errors on close
    };

    if (loading) return <div className="text-center p-10 text-gray-500">Loading services...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">My Services</h1>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/provider')} className="bg-gray-500 text-white font-bold py-2 px-4 rounded hover:bg-gray-600">Back to Dashboard</button>
                    <button onClick={() => openModal()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">Add New Service</button>
                </div>
            </div>

            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            {services.length === 0 ? (
                <p className="text-gray-500">You haven't listed any services yet.</p>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200">Name</th>
                            <th className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200">Price</th>
                            <th className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200">Status</th>
                            <th className="py-3 px-4 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-200">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map(service => (
                            <tr key={service.id}>
                                <td className="py-3 px-4 border-b border-gray-200">{service.name}</td>
                                <td className="py-3 px-4 border-b border-gray-200">${service.price}</td>
                                <td className="py-3 px-4 border-b border-gray-200">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${service.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {service.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 flex gap-2">
                                    <button onClick={() => openModal(service)} className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded">Edit</button>
                                    <button onClick={() => handleDelete(service.id)} className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">{editingService ? 'Edit Service' : 'Add New Service'}</h2>
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Service Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                            </div>
                            <div className="mb-4">
                                <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                            </div>
                            <div className="mb-4">
                                <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Price ($)</label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                    step="0.01"
                                />
                                {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                            </div>
                            <div className="mb-6 flex items-center">
                                <input
                                    type="checkbox"
                                    id="active"
                                    name="active"
                                    checked={formData.active}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="active" className="ml-2 block text-sm text-gray-900">Available for booking</label>
                            </div>
                            <div className="mt-6 flex justify-end gap-4">
                                <button type="button" onClick={closeModal} className="py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50" disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2" disabled={isSubmitting}>
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    {isSubmitting ? 'Saving...' : 'Save Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderServices;