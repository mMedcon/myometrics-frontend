// Server Component wrapper
import BatchResultsClient from './BatchResultsClient';

export async function generateStaticParams() {
  // Return empty array - dynamic routes will be handled at runtime
  return [];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BatchResultsPage({ params }: PageProps) {
  const { id } = await params;
  return <BatchResultsClient batchId={id} />;
}