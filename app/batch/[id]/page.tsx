// Server Component wrapper
import BatchResultsClient from './BatchResultsClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BatchResultsPage({ params }: PageProps) {
  const { id } = await params;
  return <BatchResultsClient batchId={id} />;
}