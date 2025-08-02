'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { microserviceAPI, UploadDetails } from '@/lib/api';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function UploadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const uploadId = params.id as string;
  
  const [upload, setUpload] = useState<UploadDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!uploadId) return;

    const fetchUploadDetails = async () => {
      try {
        setIsLoading(true);
        const details = await microserviceAPI.getUploadDetails(uploadId);
        setUpload(details);
      } catch (err: any) {
        console.error('Failed to fetch upload details:', err);
        setError('Failed to load upload details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUploadDetails();

    // Poll for updates if still processing
    const interval = setInterval(() => {
      if (upload?.status === 'processing') {
        fetchUploadDetails();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [uploadId, upload?.status]);

  const handleRetryAnalysis = async () => {
    try {
      setIsRetrying(true);
      const updatedUpload = await microserviceAPI.retryAnalysis(uploadId);
      setUpload(updatedUpload);
    } catch (err: any) {
      setError('Failed to retry analysis. Please try again.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this upload? This action cannot be undone.')) {
      return;
    }

    try {
      await microserviceAPI.deleteUpload(uploadId);
      router.push('/history');
    } catch (err: any) {
      setError('Failed to delete upload. Please try again.');
    }
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '✅';
      case 'processing':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '📋';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'var(--success)';
    if (confidence >= 70) return 'var(--warning)';
    return 'var(--error)';
  };

  if (isLoading) {
    return (
      <Navigation>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
            <p style={{ color: 'var(--muted)' }}>Loading upload details...</p>
          </div>
        </div>
      </Navigation>
    );
  }

  if (error && !upload) {
    return (
      <Navigation>
        <div className="max-w-2xl mx-auto">
          <div className="card text-center">
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Failed to Load Upload
            </h1>
            <p className="text-muted mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Try Again
              </button>
              <Link href="/history" className="btn btn-outline">
                Back to History
              </Link>
            </div>
          </div>
        </div>
      </Navigation>
    );
  }

  if (!upload) {
    return (
      <Navigation>
        <div className="max-w-2xl mx-auto">
          <div className="card text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Upload Not Found
            </h1>
            <p className="text-muted mb-4">
              The upload you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/history" className="btn btn-primary">
              Back to History
            </Link>
          </div>
        </div>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/history" className="text-sm hover:underline mb-2 block" style={{ color: 'var(--primary)' }}>
              ← Back to History
            </Link>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
              Upload Details
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            {upload.status === 'failed' && (
              <button
                onClick={handleRetryAnalysis}
                disabled={isRetrying}
                className="btn btn-accent"
              >
                {isRetrying ? 'Retrying...' : 'Retry Analysis'}
              </button>
            )}
            <button
              onClick={handleDelete}
              className="btn bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted">Filename</label>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{upload.filename}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">Upload ID</label>
                  <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>{upload.upload_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">Upload Time</label>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>
                    {new Date(upload.upload_timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">Status</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(upload.status)}</span>
                    <span
                      className="text-sm font-medium px-2 py-1 rounded-full"
                      style={{
                        color: getStatusColor(upload.status),
                        backgroundColor: `${getStatusColor(upload.status)}20`,
                      }}
                    >
                      {upload.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* File Metadata */}
            {upload.metadata && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                  File Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted">File Size</label>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>
                      {(upload.metadata.file_size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">Dimensions</label>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>
                      {upload.metadata.image_dimensions.width} × {upload.metadata.image_dimensions.height}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">File Type</label>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>{upload.metadata.file_type}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {upload.analysis_result && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                  Analysis Results
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted">Diagnosis</label>
                      <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                        {upload.analysis_result.diagnosis}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted">Confidence</label>
                      <div className="flex items-center space-x-2">
                        <p
                          className="text-lg font-semibold"
                          style={{ color: getConfidenceColor(upload.analysis_result.confidence) }}
                        >
                          {upload.analysis_result.confidence}%
                        </p>
                        <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: getConfidenceColor(upload.analysis_result.confidence),
                              width: `${upload.analysis_result.confidence}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {upload.analysis_result.findings?.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted">Key Findings</label>
                      <ul className="mt-2 space-y-1">
                        {upload.analysis_result.findings.map((finding, index) => (
                          <li key={index} className="text-sm flex items-start space-x-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span style={{ color: 'var(--text)' }}>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {upload.analysis_result.recommendations?.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted">Recommendations</label>
                      <ul className="mt-2 space-y-1">
                        {upload.analysis_result.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-sm flex items-start space-x-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span style={{ color: 'var(--text)' }}>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Processing Status */}
            {upload.status === 'processing' && (
              <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-t-transparent border-yellow-500 rounded-full animate-spin"></div>
                  <div>
                    <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                      Analysis in Progress
                    </h3>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                      Your image is currently being analyzed by our AI system. This usually takes 1-3 minutes.
                      This page will automatically update when the analysis is complete.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Failed Status */}
            {upload.status === 'failed' && (
              <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-3">
                  <span className="text-red-500 text-xl">❌</span>
                  <div>
                    <h3 className="font-medium text-red-800 dark:text-red-200">
                      Analysis Failed
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                      The analysis of your image could not be completed. This might be due to image quality
                      or technical issues. You can try uploading the image again or contact support.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/upload" className="btn btn-primary w-full">
                  Upload New Image
                </Link>
                <Link href="/history" className="btn btn-outline w-full">
                  View All Uploads
                </Link>
                {upload.analysis_result && (
                  <button
                    onClick={() => window.print()}
                    className="btn btn-outline w-full"
                  >
                    Print Report
                  </button>
                )}
              </div>
            </div>

            {/* Confidence Interpretation */}
            {upload.analysis_result && (
              <div className="card">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Confidence Guide</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span style={{ color: 'var(--text)' }}>90-100%: High confidence</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span style={{ color: 'var(--text)' }}>70-89%: Moderate confidence</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span style={{ color: 'var(--text)' }}>Below 70%: Low confidence</span>
                  </div>
                </div>
                <p className="text-xs text-muted mt-3">
                  AI analysis should always be validated by qualified medical professionals.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Navigation>
  );
}
