import React from 'react';

// This function is required for static site generation with dynamic routes
// It provides a list of known/sample batch IDs that will be pre-rendered at build time
export function generateStaticParams() {
  // Return placeholder IDs for static generation
  // In a real application, you might fetch these from an API or database
  return [
    { id: 'sample-batch-1' },
    { id: 'sample-batch-2' },
    { id: 'sample-batch-3' }
  ];
}

export default function BatchLayout({ children }: { children: React.ReactNode }) {
  // This layout wraps the batch page and provides the generateStaticParams function
  // for static site generation
  return <>{children}</>;
}