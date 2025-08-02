'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { authService, djangoAPI, NotificationSettings } from '@/lib/api';
import Navigation from '@/components/Navigation';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  clinicName: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AccountPage() {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Profile form state
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    clinicName: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    upload_completed: true,
    analysis_ready: true,
    system_alerts: true,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        clinicName: user.clinicName || '',
      });
    }

    // Load notification settings
    const loadNotificationSettings = async () => {
      try {
        const settings = await djangoAPI.getNotificationSettings();
        setNotificationSettings(settings);
      } catch (err) {
        console.error('Failed to load notification settings:', err);
      }
    };

    loadNotificationSettings();
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        clinicName: profileData.clinicName || undefined,
      });
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationUpdate = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      const updatedSettings = { ...notificationSettings, [key]: value };
      setNotificationSettings(updatedSettings);
      await djangoAPI.updateNotificationSettings({ [key]: value });
      setMessage('Notification settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError('Failed to update notification settings');
      // Revert the change
      setNotificationSettings(notificationSettings);
    }
  };

  const handleExportData = async (format: 'csv' | 'json') => {
    try {
      setIsLoading(true);
      const blob = await djangoAPI.exportData(format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `myometrics-data.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage(`Data exported successfully as ${format.toUpperCase()}!`);
    } catch (err: any) {
      setError('Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'This action cannot be undone. Type "DELETE" to confirm account deletion:'
    );
    
    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      setIsLoading(true);
      await djangoAPI.deleteAccount();
      await authService.logout();
      window.location.href = '/auth';
    } catch (err: any) {
      setError('Failed to delete account');
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'password', label: 'Password', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'data', label: 'Data & Privacy', icon: '📊' },
  ];

  return (
    <Navigation>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            Account Settings
          </h1>
          <p className="text-muted mt-1">
            Manage your profile, security, and privacy settings
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--success)', opacity: 0.1, borderColor: 'var(--success)' }}>
            <p style={{ color: 'var(--success)' }}>{message}</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--error)', opacity: 0.1, borderColor: 'var(--error)' }}>
            <p style={{ color: 'var(--error)' }}>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={{
                  backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--text)',
                }}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text)' }}>
                  Profile Information
                </h2>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: 'var(--background)',
                          borderColor: 'var(--border)',
                          color: 'var(--text)',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: 'var(--background)',
                          borderColor: 'var(--border)',
                          color: 'var(--text)',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        backgroundColor: 'var(--background)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                      Clinic Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={profileData.clinicName}
                      onChange={(e) => setProfileData({ ...profileData, clinicName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        backgroundColor: 'var(--background)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text)' }}>
                  Change Password
                </h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        backgroundColor: 'var(--background)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        backgroundColor: 'var(--background)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        backgroundColor: 'var(--background)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text)' }}>
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--text)' }}>Email Notifications</h3>
                      <p className="text-sm text-muted">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.email_notifications}
                        onChange={(e) => handleNotificationUpdate('email_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--text)' }}>Upload Completed</h3>
                      <p className="text-sm text-muted">Get notified when file upload is complete</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.upload_completed}
                        onChange={(e) => handleNotificationUpdate('upload_completed', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--text)' }}>Analysis Ready</h3>
                      <p className="text-sm text-muted">Get notified when AI analysis is complete</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.analysis_ready}
                        onChange={(e) => handleNotificationUpdate('analysis_ready', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--text)' }}>System Alerts</h3>
                      <p className="text-sm text-muted">Receive important system notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.system_alerts}
                        onChange={(e) => handleNotificationUpdate('system_alerts', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div className="card">
                  <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text)' }}>
                    Data Export
                  </h2>
                  <p className="text-muted mb-4">
                    Download all your data including uploads, analysis results, and account information.
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleExportData('csv')}
                      disabled={isLoading}
                      className="btn btn-outline"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExportData('json')}
                      disabled={isLoading}
                      className="btn btn-outline"
                    >
                      Export as JSON
                    </button>
                  </div>
                </div>

                <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <h2 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-200">
                    Danger Zone
                  </h2>
                  <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                    All your data, including uploads and analysis results, will be permanently deleted.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className="btn bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Navigation>
  );
}
