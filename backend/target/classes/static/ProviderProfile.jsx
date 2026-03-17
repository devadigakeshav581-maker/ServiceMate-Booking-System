import React, { useEffect, useState } from 'react';
import { UserAPI, getUserId } from './api';
import { useToast } from './ToastContext';
import { useForm } from './useForm';
import { Card, CardHeader } from './Card';

const ProviderProfile = () => {
  const { addToast } = useToast();
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = getUserId();

  const { values, setValues, handleChange } = useForm({
    name: '',
    email: '',
    phone: '',
    bio: '' // Assuming backend supports bio/description for providers
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await UserAPI.getProfile(userId);
        setValues({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          bio: user.description || '',
          profileImage: user.profileImage || null
        });
      } catch (err) {
        addToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (userId) loadProfile();
  }, [userId, addToast, setValues]);

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('email', values.email);
    formData.append('phone', values.phone);
    formData.append('bio', values.bio);
    if (profileImage) {
        formData.append('profileImage', profileImage);
    }

    try {
      await UserAPI.updateProfile(userId, formData);
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast('Failed to update profile', 'error');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);

      // Show a local preview of the image:
      const reader = new FileReader();
      reader.onloadend = () => {
        setValues(prev => ({
          ...prev,
          profileImage: reader.result // base64 string
        }));
      }

      reader.readAsDataURL(file); // Reads the file as a data URL
    }
  };

  if (loading) return <div className="p-4 text-muted">Loading profile...</div>;

  return (
    <Card className="p-6 max-w-2xl">
      <CardHeader title="Profile Settings" />
      <div className="space-y-4">
        {/* Profile Image Display and Upload */}
        <div className="flex items-center space-x-6 responsive">
          <div className="shrink-0">
            <img className="object-cover rounded-full w-20 h-20" src={values.profileImage || "https://via.placeholder.com/150"} alt="Profile" />
          </div>
          <label className="block">
            <span className="sr-only">Choose profile photo</span>
            <input type="file" accept="image/*" className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-accent file:text-text
              hover:file:bg-accent2
              transition-colors
            " onChange={handleImageChange} />
          </label>
        </div>
        <div>
          <label className="text-xs text-muted font-bold uppercase block mb-1">Full Name</label>
          <input name="name" value={values.name} onChange={handleChange} className="w-full bg-input-bg border border-border rounded-xl p-3 text-sm focus:border-accent outline-none" type="text" />
        </div>
        <div>
          <label className="text-xs text-muted font-bold uppercase block mb-1">Email</label>
          <input name="email" value={values.email} disabled className="w-full bg-input-bg border border-border rounded-xl p-3 text-sm text-muted cursor-not-allowed" type="email" />
        </div>
        <div>
          <label className="text-xs text-muted font-bold uppercase block mb-1">Phone</label>
          <input name="phone" value={values.phone} onChange={handleChange} className="w-full bg-input-bg border border-border rounded-xl p-3 text-sm focus:border-accent outline-none" type="tel" />
        </div>
        <div className="pt-2">
          <button onClick={handleSubmit} className="px-6 py-2 bg-accent text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition-colors">Save Changes</button>
        </div>
      </div>
    </Card>
  );
};

export default ProviderProfile;