import { useState, useEffect } from 'react';
import api from './api';

const Profile = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // Assuming endpoint GET /api/users/profile returns current user details
            // You might need to adjust the endpoint based on your backend implementation
            // If using userId in URL: `/api/users/${localStorage.getItem('userId')}`
            const userId = localStorage.getItem('userId') || 'me'; 
            // Using 'me' is a common convention if the backend supports it, otherwise use ID
            // For this example, let's assume the backend has a /api/users/me endpoint
            // or we use the ID stored in localStorage if available.
            
            // If your backend requires an ID and you don't store it, you might need to decode the token.
            // For now, let's try a generic endpoint or assume one exists.
            // Adjust '/api/users/profile' to match your actual backend endpoint.
            const response = await api.get('/api/users/profile'); 
            setFormData({
                name: response.data.name || '',
                email: response.data.email || '',
                phone: response.data.phone || ''
            });
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile data.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        try {
            await api.put('/api/users/profile', formData);
            setSuccess('Profile updated successfully!');
            // Update local storage name if changed
            localStorage.setItem('name', formData.name);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile.');
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        
        if (passwordData.newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters long.');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }

        try {
            await api.post('/api/users/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordSuccess('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error('Error changing password:', err);
            setPasswordError(err.response?.data?.message || 'Failed to change password. Verify your current password.');
        }
    };

    if (loading) return <div className="text-center p-10">Loading...</div>;

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">My Profile</h2>
            
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 font-bold mb-2">Phone</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">Update Profile</button>
            </form>

            <hr className="my-8 border-gray-200" />

            <h2 className="text-xl font-bold mb-6 text-gray-800">Change Password</h2>
            
            {passwordError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{passwordError}</div>}
            {passwordSuccess && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{passwordSuccess}</div>}

            <form onSubmit={handlePasswordSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">Current Password</label>
                    <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">New Password</label>
                    <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 font-bold mb-2">Confirm New Password</label>
                    <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <button type="submit" className="w-full bg-gray-700 text-white font-bold py-2 px-4 rounded hover:bg-gray-800">Change Password</button>
            </form>
        </div>
    );
};

export default Profile;