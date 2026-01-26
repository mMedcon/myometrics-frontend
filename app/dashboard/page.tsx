'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { microserviceAPI, djangoAPI, Stats, UserActivity } from '@/lib/api';
import Navigation from '@/components/Navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  color?: string;
}

function DashboardCard({ title, value, description, color = 'var(--primary)' }: DashboardCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted mt-1">{description}</p>
          )}
        </div>

      </div>
    </div>
  );
}

interface RecentUploadProps {
  upload: {
    id: string;
    filename: string;
    timestamp: string;
    status: string;
  };
}

function RecentUpload({ upload }: RecentUploadProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'var(--success)';
      case 'processing':
        return 'var(--warning)';
      case 'failed':
        return 'var(--error)';
      default:
        return 'var(--info)';
    }
  };



  return (
    <Link 
      href={`/upload/${upload.id}`} 
      className="block p-3 rounded-lg transition-colors"
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-background)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">

          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {upload.filename}
            </p>
            <p className="text-xs text-muted">
              {new Date(upload.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <span
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{
            color: getStatusColor(upload.status),
            backgroundColor: `${getStatusColor(upload.status)}20`,
          }}
        >
          {upload.status}
        </span>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [statsData, activityData] = await Promise.all([
          microserviceAPI.getStats(),
          djangoAPI.getUserActivity(),
        ]);
        setStats(statsData);
        setUserActivity(activityData);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <Navigation>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
            <p style={{ color: 'var(--muted)' }}>Loading dashboard...</p>
          </div>
        </div>
      </Navigation>
    );
  }

  return (
    <ProtectedRoute>
      <Navigation>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted mt-1">
            Here's an overview of your medical image analysis activity.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--error)', opacity: 0.1, borderColor: 'var(--error)' }}>
            <p style={{ color: 'var(--error)' }}>{error}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/upload" className="btn btn-primary text-center">

              Upload New Image
            </Link>
            <Link href="/history" className="btn btn-outline text-center">

              View History
            </Link>
            <Link href="/account" className="btn btn-outline text-center">

              Account Settings
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard
              title="Total Uploads"
              value={stats.total_uploads}
              description="All time"
              color="var(--primary)"
            />
            <DashboardCard
              title="Unique Users"
              value={stats.unique_users}
              description="Active users"
              color="var(--secondary)"
            />
            <DashboardCard
              title="Latest Upload"
              value={new Date(stats.latest_upload).toLocaleDateString()}
              description="Most recent activity"
              color="var(--accent)"
            />
            <DashboardCard
              title="First Upload"
              value={new Date(stats.earliest_upload).toLocaleDateString()}
              description="Platform started"
              color="var(--success)"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Uploads */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Recent Uploads
              </h2>
              <Link href="/history" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {userActivity?.recent_uploads?.length ? (
                userActivity.recent_uploads.slice(0, 5).map((upload) => (
                  <RecentUpload key={upload.id} upload={upload} />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted">No uploads yet</p>
                  <Link href="/upload" className="btn btn-primary mt-4">
                    Upload your first image
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Platform Activity Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Platform Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg" 
                   style={{ backgroundColor: 'var(--hover-background)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Total Uploads</p>
                  <p className="text-xs text-muted">All-time activity</p>
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
                  {stats?.total_uploads || 0}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg" 
                   style={{ backgroundColor: 'var(--hover-background)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Active Users</p>
                  <p className="text-xs text-muted">Unique contributors</p>
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--secondary)' }}>
                  {stats?.unique_users || 0}
                </div>
              </div>

              <div className="text-center pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs text-muted">
                  Platform active since {stats ? new Date(stats.earliest_upload).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Navigation>
    </ProtectedRoute>
  );
}