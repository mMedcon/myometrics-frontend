'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation>
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            <p>Dashboard functionality will be restored after deployment fix.</p>
          </div>
        </Navigation>
      </div>
    </ProtectedRoute>
  );
}