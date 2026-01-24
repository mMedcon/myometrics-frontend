// Simple server component for testing
export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UploadDetailsPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <div>
      <h1>Upload Details: {id}</h1>
      <p>This is a test page for static export.</p>
    </div>
  );
}