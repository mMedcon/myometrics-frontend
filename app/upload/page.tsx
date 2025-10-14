'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import UploadWorkflow from '@/components/UploadWorkflow';

export default function UploadPage() {
  const [selectedDetection, setSelectedDetection] = useState<'dmd' | 'tumor' | null>(null);
  const [error, setError] = useState('');
   const [imageType, setImageType] = useState<"MS" | "DMD" | "">("");

    // Function to validate detection type selection
  const handleUploadAttempt = () => {
    if (!selectedDetection) {
      setError('Please select a detection type before proceeding with upload and analysis.');
      return;
    }
    // Clear error if validation passes
    setError('');
  };

  // Clear error when user makes a selection
  const handleDetectionSelection = (type: 'dmd' | 'tumor') => {
    setSelectedDetection(type);
    setImageType(type === 'dmd' ? 'DMD' : 'MS');
    setError('');
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

         {/* Detection Type Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Select Detection Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedDetection === 'dmd' 
                  ? 'border-sci-blue bg-sci-blue bg-opacity-10' 
                  : 'border-gray-300 hover:border-sci-blue'
              }`}
              onChange={e => setImageType((e.target as HTMLInputElement).value as "MS" | "DMD" | "")}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="detection"
                  value="dmd"
                  checked={selectedDetection === 'dmd'}
                  onChange={() => handleDetectionSelection('dmd')}
                  className="text-sci-blue"
                />
                <div>
                  <h3 className="font-medium" style={{ color: 'var(--text)' }}>DMD Detection</h3>
                  <p className="text-sm text-muted">
                    Duchenne Muscular Dystrophy analysis using MRI scans
                  </p>
                </div>
              </div>
            </div>
            
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedDetection === 'tumor' 
                  ? 'border-sci-blue bg-sci-blue bg-opacity-10' 
                  : 'border-gray-300 hover:border-sci-blue'
              }`}
              onClick={() => handleDetectionSelection('tumor')}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="detection"
                  value="tumor"
                  checked={selectedDetection === 'tumor'}
                  onChange={() => handleDetectionSelection('tumor')}
                  className="text-sci-blue"
                />
                <div>
                  <h3 className="font-medium" style={{ color: 'var(--text)' }}>Tumor Detection</h3>
                  <p className="text-sm text-muted">
                    Brain tumor identification and classification
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Selection Required</h3>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}



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
                <li>• DICOM (.dcm)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2" style={{ color: 'var(--text)' }}>Requirements</h3>
              <ul className="text-muted space-y-1">
                <li>• Maximum file size: 10MB</li>
                <li>• High resolution preferred</li>
                <li>• Clear, well-lit images</li>
                <li>• Clinical review required</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Clinical Workflow Notice */}
        <div className="card" style={{ borderColor: 'var(--sci-blue)', backgroundColor: 'color-mix(in srgb, var(--sci-blue) 5%, transparent)' }}>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 mt-0.5 flex-shrink-0">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--sci-blue)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium mb-1" style={{ color: 'var(--sci-blue)' }}>Clinical Review Process</h3>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                All uploaded images undergo automatic anonymization and require clinical review before AI analysis. 
                This ensures patient privacy and clinical oversight of the diagnostic process.
              </p>
            </div>
          </div>
        </div>

       {/* Upload Workflow Component - Only show when detection type is selected */}
        {selectedDetection && (
          <UploadWorkflow 
            detectionType={selectedDetection as 'dmd' | 'tumor'} 
            imageType={imageType}
            onUploadAttempt={handleUploadAttempt}
          />
        )}
      </div>
    </Navigation>
  );
}
