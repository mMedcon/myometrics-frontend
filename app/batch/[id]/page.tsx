'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { microserviceAPI, BatchStatusResponse, BatchFile } from '../../../lib/api/microservice';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Navigation from '../../../components/Navigation';

export default function BatchResultsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  const [batchStatus, setBatchStatus] = useState<BatchStatusResponse | null>(null);
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) return;

    const fetchBatchData = async () => {
      try {
        setLoading(true);
        
        // Fetch batch status and files in parallel
        const [statusResponse, filesResponse] = await Promise.all([
          microserviceAPI.getBatchStatus(batchId),
          microserviceAPI.getBatchFiles(batchId)
        ]);

        setBatchStatus(statusResponse);
        setBatchFiles(filesResponse.files);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load batch data');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchData();
  }, [batchId]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'queued':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-muted';
    if (confidence >= 90) return 'text-green-600 font-semibold dark:text-green-400';
    if (confidence >= 70) return 'text-yellow-600 font-semibold dark:text-yellow-400';
    return 'text-red-600 font-semibold dark:text-red-400';
  };

  const handleViewDetails = (uploadId: string) => {
    router.push(`/upload/${uploadId}`);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Navigation>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
              <p style={{ color: 'var(--muted)' }}>Loading batch results...</p>
            </div>
          </div>
        </Navigation>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Navigation>
          <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Error Loading Batch</h2>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => router.push('/history')}
              className="btn btn-primary"
            >
              Back to History
            </button>
          </div>
        </Navigation>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Navigation>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
                Batch Results
              </h1>
              <p className="text-muted mt-1">Batch ID: {batchId}</p>
            </div>
            <button
              onClick={() => router.push('/history')}
              className="btn btn-secondary"
            >
              Back to History
            </button>
          </div>

          {/* Batch Status Card */}
          {batchStatus && (
            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(batchStatus.status)}`}>
                    {batchStatus.status.charAt(0).toUpperCase() + batchStatus.status.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>Progress</label>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${batchStatus.progress_percentage}%`,
                          backgroundColor: 'var(--primary)'
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {batchStatus.progress_percentage}%
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>Files Processed</label>
                  <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                    {batchStatus.processed_files} / {batchStatus.total_files}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>Total Files</label>
                  <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                    {batchStatus.total_files}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Files List */}
          <div className="card">
            <div className="border-b pb-4 mb-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Batch Files</h2>
            </div>
            
            {batchFiles.length === 0 ? (
              <div className="text-center py-8">
                <p style={{ color: 'var(--muted)' }}>No files found in this batch.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {batchFiles.map((file, index) => (
                  <div 
                    key={file.upload_id} 
                    className="p-4 rounded-lg border transition-colors hover:opacity-80"
                    style={{ 
                      backgroundColor: 'var(--hover-background)',
                      borderColor: 'var(--border)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span 
                            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                            style={{ backgroundColor: 'var(--primary)' }}
                          >
                            {index + 1}
                          </span>
                          <img
                            src={microserviceAPI.getUploadPreviewUrl(file.upload_id)}
                            alt={file.filename}
                            className="w-16 h-16 object-cover rounded border"
                            style={{ background: '#f3f3f3' }}
                            onError={e => { e.currentTarget.src = '/default-preview.png'; }}
                          />
                          <div>
                            <h3 className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                              {file.filename}
                            </h3>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadgeColor(file.status)}`}>
                                {file.status}
                              </span>
                              {file.upload_timestamp && (
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                  {new Date(file.upload_timestamp).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {file.diagnosis && (
                          <div className="text-right">
                            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                              {file.diagnosis}
                            </p>
                            {file.confidence && (
                              <p className={`text-xs ${getConfidenceColor(file.confidence)}`}>
                                {file.confidence}% confidence
                              </p>
                            )}
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleViewDetails(file.upload_id)}
                          className="btn btn-primary btn-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push('/upload')}
              className="btn btn-primary"
            >
              Upload More Files
            </button>
            <button
              onClick={() => router.push('/history')}
              className="btn btn-secondary"
            >
              View All Uploads
            </button>
          </div>
        </div>
      </Navigation>
    </ProtectedRoute>
  );
}
