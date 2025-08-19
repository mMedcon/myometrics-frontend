'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { microserviceAPI, UploadResponse } from '@/lib/api';

interface UploadProgress {
  percentage: number;
  stage: 'uploading' | 'preprocessing' | 'reviewing' | 'analyzing' | 'complete';
}

interface UploadWorkflowProps {
  onUploadComplete?: (result: UploadResponse) => void;
}

export default function UploadWorkflow({ onUploadComplete }: UploadWorkflowProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ percentage: 0, stage: 'uploading' });
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [preprocessedImageUrl, setPreprocessedImageUrl] = useState<string | null>(null);
  const [showPreprocessedImage, setShowPreprocessedImage] = useState(false);
  const [approvedForAnalysis, setApprovedForAnalysis] = useState(false);
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
    const validation = microserviceAPI.validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    setError('');
    setUploadResult(null);
    setPreprocessedImageUrl(null);
    setShowPreprocessedImage(false);
    setApprovedForAnalysis(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');

    try {
      // Stage 1: Upload file
      setUploadProgress({ percentage: 0, stage: 'uploading' });
      
      const result = await microserviceAPI.uploadFile(selectedFile, (progress) => {
        setUploadProgress({ percentage: progress, stage: 'uploading' });
      });

      setUploadResult(result);

      // Stage 2: Get preprocessed image for review
      setUploadProgress({ percentage: 100, stage: 'preprocessing' });
      
      const preprocessedBlob = await microserviceAPI.getPreprocessedDicom(result.upload_id);
      const imageUrl = URL.createObjectURL(preprocessedBlob);
      setPreprocessedImageUrl(imageUrl);
      
      setUploadProgress({ percentage: 100, stage: 'reviewing' });
      setShowPreprocessedImage(true);

    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setUploadProgress({ percentage: 0, stage: 'uploading' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleApproveForAnalysis = async () => {
    if (!uploadResult) return;

    try {
      setUploadProgress({ percentage: 0, stage: 'analyzing' });
      
      // Get current user for save operation
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        await microserviceAPI.saveUpload(userData.id.toString(), uploadResult.upload_id);
      }

      setUploadProgress({ percentage: 100, stage: 'complete' });
      setApprovedForAnalysis(true);

      if (onUploadComplete) {
        onUploadComplete(uploadResult);
      }

      // Redirect to upload details page after a brief delay
      setTimeout(() => {
        router.push(`/upload/${uploadResult.upload_id}`);
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to approve for analysis');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    setUploadResult(null);
    setPreprocessedImageUrl(null);
    setShowPreprocessedImage(false);
    setApprovedForAnalysis(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (preprocessedImageUrl) {
      URL.revokeObjectURL(preprocessedImageUrl);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStageDescription = () => {
    switch (uploadProgress.stage) {
      case 'uploading':
        return 'Uploading file to server...';
      case 'preprocessing':
        return 'Processing and anonymizing DICOM data...';
      case 'reviewing':
        return 'Ready for clinical review';
      case 'analyzing':
        return 'Running AI analysis...';
      case 'complete':
        return 'Analysis complete!';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            borderColor: dragActive ? 'var(--primary)' : 'var(--border)',
            backgroundColor: dragActive ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent'
          }}
        >
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full" 
                 style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium" style={{ color: 'var(--text)' }}>
                Drop your medical image here, or click to browse
              </p>
              <p className="text-sm text-muted mt-1">
                Supports JPEG, PNG • Max 10MB
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileInputChange}
          />
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Selected File</h3>
            <button
              onClick={handleRemoveFile}
              className="text-red-500 hover:text-red-700 p-1"
              title="Remove file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" 
                 style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium" style={{ color: 'var(--text)' }}>{selectedFile.name}</p>
              <p className="text-sm text-muted">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>

          {!isUploading && !showPreprocessedImage && (
            <button
              onClick={handleUpload}
              className="btn-primary w-full"
            >
              Upload and Process
            </button>
          )}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Processing Upload
              </h3>
              <span className="text-sm text-muted">
                {uploadProgress.percentage}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${uploadProgress.percentage}%`,
                  background: 'linear-gradient(135deg, var(--sci-blue) 0%, var(--sci-dark-blue) 100%)'
                }}
              />
            </div>
            
            <p className="text-sm text-muted">{getStageDescription()}</p>
          </div>
        </div>
      )}

      {/* Preprocessed Image Review */}
      {showPreprocessedImage && preprocessedImageUrl && !approvedForAnalysis && (
        <div className="card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Clinical Review Required
              </h3>
              <span className="px-3 py-1 text-xs font-medium rounded-full"
                    style={{ 
                      backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)',
                      color: 'var(--warning)'
                    }}>
                Pending Review
              </span>
            </div>
            
            <p className="text-sm text-muted">
              Please review the anonymized image below before proceeding with AI analysis. 
              Ensure all sensitive information has been properly removed.
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <img
                src={preprocessedImageUrl}
                alt="Preprocessed DICOM"
                className="max-w-full h-auto mx-auto rounded border"
                style={{ maxHeight: '400px' }}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleApproveForAnalysis}
                className="btn-primary flex-1"
              >
                Approve for AI Analysis
              </button>
              <button
                onClick={handleRemoveFile}
                className="btn-outline px-6"
              >
                Reject & Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Progress */}
      {uploadProgress.stage === 'analyzing' && (
        <div className="card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                AI Analysis in Progress
              </h3>
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent" 
                     style={{ borderColor: 'var(--primary)' }}></div>
                <span className="text-sm text-muted">Processing...</span>
              </div>
            </div>
            
            <p className="text-sm text-muted">
              Our AI is analyzing the medical image. This may take a few minutes.
            </p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadResult && approvedForAnalysis && (
        <div className="card border-green-200 dark:border-green-800">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                  Analysis Complete!
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Upload ID: {uploadResult.upload_id}
                </p>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Diagnosis:</p>
                  <p className="text-green-700 dark:text-green-300">{uploadResult.diagnosis}</p>
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Confidence:</p>
                  <p className="text-green-700 dark:text-green-300">{uploadResult.confidence}%</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted">
              Redirecting to detailed results...
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="card border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Upload Error</h3>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
