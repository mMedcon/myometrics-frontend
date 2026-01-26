'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/auth');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading screen while determining authentication status
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <div className="text-center">
        <div className="mb-8">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--primary)' }}>
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            MyoMetrics
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
            Professional Medical Image Analysis Platform
          </p>
        </div>
        
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
        
        <p style={{ color: 'var(--muted)' }}>
          {isLoading ? 'Loading...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}
