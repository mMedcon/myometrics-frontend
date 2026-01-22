// Server Component wrapper
import UploadDetailsClient from './UploadDetailsClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UploadDetailsPage({ params }: PageProps) {
  const { id } = await params;
  return <UploadDetailsClient uploadId={id} />;
}