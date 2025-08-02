'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await authService.requestPasswordReset(email);
      setMessage('Password reset instructions have been sent to your email address.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            Reset Password
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        <div className="card">
          {message && (
            <div className="mb-4 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
                placeholder="Enter your email address"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/auth"
              className="text-sm hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
