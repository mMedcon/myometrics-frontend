'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  clinicName: string;
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    clinicName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const router = useRouter();
  
  // Check if development mode is enabled
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(loginData.email, loginData.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        clinicName: registerData.clinicName || undefined,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-md w-full space-y-8 p-8">
        {isDevMode && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Development Mode Active</h3>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  You can use any email/password to log in. Backend services are mocked.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            MyoMetrics
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            Professional Medical Image Analysis Platform
          </p>
        </div>

        <div className="card">
          <div className="flex justify-center space-x-1 mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isLogin
                  ? 'btn-primary'
                  : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              style={!isLogin ? { color: 'var(--text)' } : {}}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                !isLogin
                  ? 'btn-primary'
                  : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              style={isLogin ? { color: 'var(--text)' } : {}}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm hover:underline"
                  style={{ color: 'var(--primary)' }}
                >
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={registerData.firstName}
                    onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      backgroundColor: 'var(--background)',
                      borderColor: 'var(--border)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={registerData.lastName}
                    onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
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
                <label htmlFor="registerEmail" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Email Address
                </label>
                <input
                  id="registerEmail"
                  type="email"
                  required
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div>
                <label htmlFor="clinicName" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Clinic Name (Optional)
                </label>
                <input
                  id="clinicName"
                  type="text"
                  value={registerData.clinicName}
                  onChange={(e) => setRegisterData({ ...registerData, clinicName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div>
                <label htmlFor="registerPassword" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Password
                </label>
                <input
                  id="registerPassword"
                  type="password"
                  required
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            By using this platform, you agree to our Terms of Service and Privacy Policy.
            <br />
            This platform is HIPAA compliant for medical data handling.
          </p>
        </div>
      </div>
    </div>
  );
}
