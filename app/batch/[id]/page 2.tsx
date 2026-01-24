// Simple server component for testing
export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BatchResultsPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <div>
      <h1>Batch Results: {id}</h1>
      <p>This is a test page for static export.</p>
    </div>
  );
}