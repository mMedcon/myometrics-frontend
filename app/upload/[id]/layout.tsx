import React from 'react';

// This function is required for static site generation with dynamic routes
// It provides a list of known/sample upload IDs that will be pre-rendered at build time
export function generateStaticParams() {
  // Return placeholder IDs for static generation
  // In a real application, you might fetch these from an API or database
  return [
    { id: 'sample-upload-1' },
    { id: 'sample-upload-2' },
    { id: 'sample-upload-3' }
  ];
}

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  // This layout wraps the upload page and provides the generateStaticParams function
  // for static site generation
  return <>{children}</>;
}