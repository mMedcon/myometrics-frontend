'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import UploadWorkflow from '@/components/UploadWorkflow';

export default function UploadPage() {
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

        {/* Upload Workflow Component */}
        <UploadWorkflow />
      </div>
    </Navigation>
  );
}
