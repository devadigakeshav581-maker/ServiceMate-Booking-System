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
            setPasswordSuccess('Password successfully changed!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error('Error changing password:', err);
            setPasswordError(err.response?.data?.message || 'Failed to change password.');
        }
    };

    if (loading) return <div className="text-center p-20 text-[#7070a0]">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight">Account Settings</h1>
                <p className="text-[#7070a0] mt-1">Manage your personal information and security preferences.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Profile Summary */}
                <div className="space-y-6">
                    <div className="premium-card text-center py-10">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#ff6584] mx-auto mb-4 flex items-center justify-center text-4xl font-black text-white shadow-lg">
                            {formData.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-xl font-bold text-white">{formData.name}</h2>
                        <p className="text-[#7070a0] text-sm">{formData.email}</p>
                        <div className="mt-6 pt-6 border-t border-[#2a2a3a]">
                            <div className="text-[0.65rem] font-bold text-[#7070a0] uppercase tracking-widest mb-1">Role</div>
                            <div className="text-[#6c63ff] font-bold text-sm tracking-widest">{localStorage.getItem('role')}</div>
                        </div>
                    </div>
                </div>

                {/* Right: Forms */}
                <div className="md:col-span-2 space-y-8">
                    {/* Personal Info */}
                    <div className="premium-card">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="text-2xl">📝</span> Personal Information
                        </h2>
                        
                        {error && <div className="bg-[#ff6584]/10 text-[#ff6584] p-4 rounded-xl mb-6 text-sm border border-[#ff6584]/20">{error}</div>}
                        {success && <div className="bg-[#43e97b]/10 text-[#43e97b] p-4 rounded-xl mb-6 text-sm border border-[#43e97b]/20">✨ {success}</div>}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[0.7rem] font-bold text-[#7070a0] uppercase tracking-widest ml-1">Full Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="premium-input w-full" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[0.7rem] font-bold text-[#7070a0] uppercase tracking-widest ml-1">Phone Number</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="premium-input w-full" placeholder="+1 (555) 000-0000" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.7rem] font-bold text-[#7070a0] uppercase tracking-widest ml-1">Email Address</label>
                                <input type="email" value={formData.email} className="premium-input w-full opacity-50 cursor-not-allowed" disabled />
                                <p className="text-[0.65rem] text-[#7070a0] italic">Email cannot be changed for security reasons.</p>
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="premium-button w-full md:w-auto px-10">Save Changes</button>
                            </div>
                        </form>
                    </div>

                    {/* Change Password */}
                    <div className="premium-card">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="text-2xl">🔒</span> Security & Password
                        </h2>
                        
                        {passwordError && <div className="bg-[#ff6584]/10 text-[#ff6584] p-4 rounded-xl mb-6 text-sm border border-[#ff6584]/20">{passwordError}</div>}
                        {passwordSuccess && <div className="bg-[#43e97b]/10 text-[#43e97b] p-4 rounded-xl mb-6 text-sm border border-[#43e97b]/20">✨ {passwordSuccess}</div>}

                        <form onSubmit={handlePasswordSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[0.7rem] font-bold text-[#7070a0] uppercase tracking-widest ml-1">Current Password</label>
                                <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className="premium-input w-full" required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[0.7rem] font-bold text-[#7070a0] uppercase tracking-widest ml-1">New Password</label>
                                    <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="premium-input w-full" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[0.7rem] font-bold text-[#7070a0] uppercase tracking-widest ml-1">Confirm New Password</label>
                                    <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="premium-input w-full" required />
                                </div>
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="bg-[#1c1c27] border border-[#2a2a3a] text-white font-bold py-2.5 px-10 rounded-xl hover:border-[#6c63ff] hover:text-[#6c63ff] transition-all">
                                    Change Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;