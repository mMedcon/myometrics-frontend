'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { djangoAPI, microserviceAPI, AnalyticsData, Stats } from '@/lib/api';
import Navigation from '@/components/Navigation';
import { useRouter } from 'next/navigation';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'stable';
  };
  color?: string;
}

function MetricCard({ title, value, change, color = 'var(--primary)' }: MetricCardProps) {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'var(--success)';
      case 'down': return 'var(--error)';
      default: return 'var(--muted)';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text)' }}>
            {value}
          </p>
          {change && (
            <div className="flex items-center space-x-1 mt-2">
              <span
                className="text-sm font-medium"
                style={{ color: getTrendColor(change.trend) }}
              >
                {change.value > 0 ? '+' : ''}{change.value}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChartData {
  labels: string[];
  data: number[];
}

function SimpleBarChart({ data, title }: { data: ChartData; title: string }) {
  const maxValue = Math.max(...data.data);
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
        {title}
      </h3>
      <div className="space-y-3">
        {data.labels.map((label, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-20 text-sm text-muted">{label}</div>
            <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--hover-background)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  backgroundColor: 'var(--primary)',
                  width: `${(data.data[index] / maxValue) * 100}%`,
                }}
              />
            </div>
            <div className="w-12 text-sm font-medium text-right" style={{ color: 'var(--text)' }}>
              {data.data[index]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    // Check if user has admin access
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        const [analyticsData, statsData] = await Promise.all([
          djangoAPI.getAnalytics(),
          microserviceAPI.getStats(),
        ]);
        setAnalytics(analyticsData);
        setStats(statsData);
      } catch (err: any) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchAnalyticsData();
    }
  }, [user, router, timeRange]);

  if (user && user.role !== 'admin') {
    return (
      <Navigation>
        <div className="max-w-2xl mx-auto">
          <div className="card text-center">
            <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Access Denied
            </h1>
            <p className="text-muted mb-4">
              You don't have permission to access the analytics dashboard.
            </p>
          </div>
        </div>
      </Navigation>
    );
  }

  if (isLoading) {
    return (
      <Navigation>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
            <p style={{ color: 'var(--muted)' }}>Loading analytics...</p>
          </div>
        </div>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
              Analytics Dashboard
            </h1>
            <p className="text-muted mt-1">
              Comprehensive insights into platform usage and performance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--error)', opacity: 0.1, borderColor: 'var(--error)' }}>
            <p style={{ color: 'var(--error)' }}>{error}</p>
          </div>
        )}

        {/* System Health */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Active Users"
              value={analytics.system_health.active_users}
              color="var(--primary)"
            />
            <MetricCard
              title="Total Uploads"
              value={analytics.system_health.total_uploads.toLocaleString()}
              color="var(--secondary)"
            />
            <MetricCard
              title="Success Rate"
              value={`${analytics.system_health.success_rate}%`}
              color="var(--success)"
            />
            <MetricCard
              title="Avg Processing Time"
              value={`${analytics.system_health.average_processing_time}s`}
              color="var(--accent)"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Trends */}
          {analytics && (
            <SimpleBarChart
              data={{
                labels: analytics.user_activity.daily_uploads.slice(-7).map(item => 
                  new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                ),
                data: analytics.user_activity.daily_uploads.slice(-7).map(item => item.count),
              }}
              title="Daily Uploads (Last 7 Days)"
            />
          )}

          {/* Diagnosis Distribution */}
          {stats && (
            <SimpleBarChart
              data={{
                labels: stats.common_diagnoses.slice(0, 5).map(item => item.diagnosis),
                data: stats.common_diagnoses.slice(0, 5).map(item => item.count),
              }}
              title="Top Diagnoses"
            />
          )}
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Diagnosis Trends */}
          {analytics && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                Diagnosis Trends
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <th className="text-left py-2 text-sm font-medium text-muted">Diagnosis</th>
                      <th className="text-left py-2 text-sm font-medium text-muted">Cases</th>
                      <th className="text-left py-2 text-sm font-medium text-muted">Trend</th>
                      <th className="text-left py-2 text-sm font-medium text-muted">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.diagnosis_trends.slice(0, 8).map((item, index) => (
                      <tr key={index} className="border-b" style={{ borderColor: 'var(--border)' }}>
                        <td className="py-3 text-sm" style={{ color: 'var(--text)' }}>
                          {item.diagnosis}
                        </td>
                        <td className="py-3 text-sm" style={{ color: 'var(--text)' }}>
                          {item.count}
                        </td>
                        <td className="py-3 text-sm">
                          <span
                            style={{ 
                              color: item.trend === 'up' ? 'var(--success)' : 
                                     item.trend === 'down' ? 'var(--error)' : 'var(--muted)'
                            }}
                          >
                            {item.trend}
                          </span>
                        </td>
                        <td className="py-3 text-sm">
                          <span
                            style={{ 
                              color: item.percentage_change > 0 ? 'var(--success)' : 
                                     item.percentage_change < 0 ? 'var(--error)' : 'var(--muted)'
                            }}
                          >
                            {item.percentage_change > 0 ? '+' : ''}{item.percentage_change}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Weekly Upload Patterns */}
          {analytics && (
            <SimpleBarChart
              data={{
                labels: analytics.user_activity.weekly_uploads.slice(-4).map(item => item.week),
                data: analytics.user_activity.weekly_uploads.slice(-4).map(item => item.count),
              }}
              title="Weekly Upload Patterns"
            />
          )}
        </div>

        {/* Status Distribution */}
        {stats && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Upload Status Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-success mb-1">
                  {stats.status_distribution.completed}
                </div>
                <div className="text-sm text-muted">Completed</div>
                <div className="text-xs text-muted">
                  {((stats.status_distribution.completed / stats.total_uploads) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-warning mb-1">
                  {stats.status_distribution.processing}
                </div>
                <div className="text-sm text-muted">Processing</div>
                <div className="text-xs text-muted">
                  {((stats.status_distribution.processing / stats.total_uploads) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-info mb-1">
                  {stats.status_distribution.uploaded}
                </div>
                <div className="text-sm text-muted">Uploaded</div>
                <div className="text-xs text-muted">
                  {((stats.status_distribution.uploaded / stats.total_uploads) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-error mb-1">
                  {stats.status_distribution.failed}
                </div>
                <div className="text-sm text-muted">Failed</div>
                <div className="text-xs text-muted">
                  {((stats.status_distribution.failed / stats.total_uploads) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Export Analytics
          </h3>
          <p className="text-muted mb-4">
            Download comprehensive analytics reports for further analysis.
          </p>
          <div className="flex space-x-4">
            <button className="btn btn-outline">
              Export CSV Report
            </button>
            <button className="btn btn-outline">
              Export PDF Report
            </button>
            <button className="btn btn-outline">
              Export JSON Data
            </button>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
