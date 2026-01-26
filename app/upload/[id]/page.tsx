// Server Component wrapper
import UploadDetailsClient from './UploadDetailsClient';

export async function generateStaticParams() {
  // Return empty array - dynamic routes will be handled at runtime
  return [];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UploadDetailsPage({ params }: PageProps) {
  const { id } = await params;
  return <UploadDetailsClient uploadId={id} />;
}