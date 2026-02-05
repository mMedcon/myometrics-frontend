'use client';

import React, { useState, useEffect } from 'react';
import { microserviceAPI, UserUpload } from '@/lib/api';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface FilterOptions {
  status: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function UploadHistoryPage() {
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    dateRange: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const { data: session, status: sessionStatus } = useSession();

  const itemsPerPage = 20;

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchUploads(1, true);
    }
  }, [filters, sessionStatus]);

  const fetchUploads = async (page = 1, reset = false) => {
    try {
      setIsLoading(true);
      
      // Check NextAuth session first
      if (session?.user?.email) {
        console.log('🔍 Using NextAuth session for user:', session.user.email);
        // Use email as user ID for NextAuth users
        const response = await microserviceAPI.getUserUploads(session.user.email);
        
        if (reset) {
          setUploads(response.uploads);
          setCurrentPage(1);
        } else {
          setUploads(prev => [...prev, ...response.uploads]);
        }
        
        setHasMore(response.uploads.length === itemsPerPage);
        setError(''); // Clear any previous errors
        return;
      }
      
      // Fallback to localStorage for backward compatibility
      const user = localStorage.getItem('user');
      if (!user) {
        console.log('❌ No user found in NextAuth session or localStorage');
        setError('User not authenticated. Please sign in to view upload history.');
        return;
      }
      
      console.log('🔍 Using localStorage user data');
      const userData = JSON.parse(user);
      const response = await microserviceAPI.getUserUploads(userData.id.toString());
      
      if (reset) {
        setUploads(response.uploads);
        setCurrentPage(1);
      } else {
        setUploads(prev => [...prev, ...response.uploads]);
      }
      
      setHasMore(response.uploads.length === itemsPerPage);
    } catch (err: any) {
      console.error('Failed to fetch uploads:', err);
      setError('Failed to load upload history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchUploads(nextPage, false);
  };

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


  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'var(--muted)';
    if (confidence >= 90) return 'var(--success)';
    if (confidence >= 70) return 'var(--warning)';
    return 'var(--error)';
  };

  const filteredUploads = uploads
    .filter(upload => {
      if (filters.status !== 'all' && upload.status !== filters.status) {
        return false;
      }
      
      if (filters.dateRange !== 'all') {
        const uploadDate = new Date(upload.upload_timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.dateRange) {
          case 'today':
            if (diffDays !== 0) return false;
            break;
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'date':
          aValue = new Date(a.upload_timestamp).getTime();
          bValue = new Date(b.upload_timestamp).getTime();
          break;
        case 'filename':
          aValue = a.filename.toLowerCase();
          bValue = b.filename.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'confidence':
          aValue = a.confidence || 0;
          bValue = b.confidence || 0;
          break;
        default:
          aValue = new Date(a.upload_timestamp).getTime();
          bValue = new Date(b.upload_timestamp).getTime();
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  if (isLoading && uploads.length === 0) {
    return (
      <Navigation>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
            <p style={{ color: 'var(--muted)' }}>Loading upload history...</p>
          </div>
        </div>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
              Upload History
            </h1>
            <p className="text-muted mt-1">
              Complete audit trail of all your uploaded medical images
            </p>
          </div>
          <Link href="/upload" className="btn btn-primary">
            Upload New Image
          </Link>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="uploaded">Uploaded</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <option value="date">Upload Date</option>
                <option value="filename">Filename</option>
                <option value="status">Status</option>
                <option value="confidence">Confidence</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--error)', opacity: 0.1, borderColor: 'var(--error)' }}>
            <p style={{ color: 'var(--error)' }}>{error}</p>
          </div>
        )}

        {/* Upload List */}
        {filteredUploads.length === 0 ? (
          <div className="card text-center py-12">
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
              No uploads found
            </h2>
            <p className="text-muted mb-6">
              {uploads.length === 0 
                ? "You haven't uploaded any images yet."
                : "No uploads match your current filters."
              }
            </p>
            {uploads.length === 0 ? (
              <Link href="/upload" className="btn btn-primary">
                Upload Your First Image
              </Link>
            ) : (
              <button
                onClick={() => setFilters({
                  status: 'all',
                  dateRange: 'all',
                  sortBy: 'date',
                  sortOrder: 'desc',
                })}
                className="btn btn-outline"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted">
              Showing {filteredUploads.length} of {uploads.length} uploads
            </div>
            
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: 'var(--hover-background)' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                        Image
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                        Diagnosis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                        Confidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ borderColor: 'var(--border)' }} className="divide-y">
                    {filteredUploads.map((upload) => (
                      <tr 
                        key={upload.upload_id} 
                        className="transition-colors"
                        style={{ borderColor: 'var(--border)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-background)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                                {upload.filename}
                              </p>
                              <p className="text-xs text-muted font-mono">
                                {upload.upload_id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm" style={{ color: 'var(--text)' }}>
                            {upload.diagnosis || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {upload.confidence ? (
                            <div className="flex items-center space-x-2">
                              <span
                                className="text-sm font-medium"
                                style={{ color: getConfidenceColor(upload.confidence) }}
                              >
                                {upload.confidence}%
                              </span>
                              <div className="w-16 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--hover-background)' }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    backgroundColor: getConfidenceColor(upload.confidence),
                                    width: `${upload.confidence}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm" style={{ color: 'var(--text)' }}>
                            {new Date(upload.upload_timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted">
                            {new Date(upload.upload_timestamp).toLocaleTimeString()}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/upload/${upload.upload_id}`}
                            className="text-sm hover:underline"
                            style={{ color: 'var(--primary)' }}
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Load More */}
            {hasMore && !isLoading && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  className="btn btn-outline"
                >
                  Load More
                </button>
              </div>
            )}

            {isLoading && uploads.length > 0 && (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--primary)' }}></div>
              </div>
            )}
          </div>
        )}
      </div>
    </Navigation>
  );
}
