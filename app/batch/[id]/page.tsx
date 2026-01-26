// Static export compatible page for batch results
import { redirect } from 'next/navigation';

export async function generateStaticParams() {
  // Generate a few sample IDs for static export
  return [
    { id: 'sample' },
    { id: 'demo' },
    { id: 'test' },
  ];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BatchResultsPage({ params }: PageProps) {
  // For static export, redirect to upload page
  // Dynamic functionality will be handled client-side
  redirect('/upload');
}