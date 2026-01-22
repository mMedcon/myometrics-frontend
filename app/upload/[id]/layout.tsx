import React from 'react';

// Generate static params for upload/[id] routes
export async function generateStaticParams() {
  // Return empty array - dynamic routes will be handled at runtime
  return [];
}

export default function UploadIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}