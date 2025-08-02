'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { microserviceAPI } from '@/lib/api';
import Navigation from '@/components/Navigation';

interface UploadProgress {
  percentage: number;
  stage: 'uploading' | 'processing' | 'complete';
}

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ percentage: 0, stage: 'uploading' });
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    setError('');
    
    const validation = microserviceAPI.validateFile(file);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');
    setUploadProgress({ percentage: 0, stage: 'uploading' });

    try {
      const result = await microserviceAPI.uploadFile(
        selectedFile,
        (progress) => {
          setUploadProgress({ percentage: progress, stage: 'uploading' });
        }
      );

      setUploadProgress({ percentage: 100, stage: 'processing' });
      setUploadResult(result);

      // Redirect to upload details page after a brief delay
      setTimeout(() => {
        router.push(`/upload/${result.upload_id}`);
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setUploadProgress({ percentage: 0, stage: 'uploading' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Navigation>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            Upload Medical Image
          </h1>
          <p className="text-muted mt-2">
            Upload a medical image for AI-powered analysis and diagnosis
          </p>
        </div>

        {/* Guidelines */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Upload Guidelines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2" style={{ color: 'var(--text)' }}>Supported Formats</h3>
              <ul className="text-muted space-y-1">
                <li>• JPEG (.jpg, .jpeg)</li>
                <li>• PNG (.png)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2" style={{ color: 'var(--text)' }}>Requirements</h3>
              <ul className="text-muted space-y-1">
                <li>• Maximum file size: 10MB</li>
                <li>• High resolution preferred</li>
                <li>• Clear, well-lit images</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="card">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors`}
              style={{
                borderColor: dragActive ? 'var(--primary)' : 'var(--border)',
                backgroundColor: dragActive ? 'var(--primary)' : 'transparent',
                opacity: dragActive ? 0.1 : 1,
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onMouseEnter={(e) => {
                if (!dragActive) {
                  e.currentTarget.style.borderColor = 'var(--muted)';
                }
              }}
              onMouseLeave={(e) => {
                if (!dragActive) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                }
              }}
            >
              <div className="space-y-4">

                <div>
                  <p className="text-lg font-medium" style={{ color: 'var(--text)' }}>
                    Drop your image here
                  </p>
                  <p className="text-muted">or click to browse</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary"
                >
                  Select Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Preview */}
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--hover-background)' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary)', opacity: 0.2 }}>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text)' }}>
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-muted">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </p>
                  </div>
                </div>
                {!isUploading && (
                  <button
                    onClick={handleRemoveFile}
                    className="p-1 transition-colors"
                    style={{ color: 'var(--error)' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {uploadProgress.stage === 'uploading' && 'Uploading...'}
                      {uploadProgress.stage === 'processing' && 'Processing...'}
                      {uploadProgress.stage === 'complete' && 'Complete!'}
                    </span>
                    <span className="text-sm text-muted">
                      {uploadProgress.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--hover-background)' }}>
                    <div
                      className="h-full transition-all duration-300 ease-out"
                      style={{
                        backgroundColor: 'var(--primary)',
                        width: `${uploadProgress.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Result */}
              {uploadResult && (
                <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--success)', opacity: 0.1, borderColor: 'var(--success)' }}>
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--success)' }}>
                        Upload Successful!
                      </p>
                      <p className="text-sm" style={{ color: 'var(--success)', opacity: 0.8 }}>
                        Your image is being analyzed. You'll be redirected to the results page shortly.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {!isUploading && !uploadResult && (
                <button
                  onClick={handleUpload}
                  className="btn btn-primary w-full"
                >
                  Start Analysis
                </button>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 rounded-lg border" style={{ backgroundColor: 'var(--error)', opacity: 0.1, borderColor: 'var(--error)' }}>
              <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="card border" style={{ backgroundColor: 'var(--info)', opacity: 0.1, borderColor: 'var(--info)' }}>
          <div className="flex items-start space-x-3">
            <div>
              <h3 className="font-medium" style={{ color: 'var(--info)' }}>
                Security & Privacy
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--info)', opacity: 0.8 }}>
                Your uploaded images are processed securely and in compliance with HIPAA regulations. 
                All data is encrypted and access is strictly controlled and audited.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
