import React, { useEffect, useState } from 'react';

interface SimpleImageViewerProps {
  imageBlob: Blob;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

const SimpleImageViewer: React.FC<SimpleImageViewerProps> = ({
  imageBlob,
  alt = "Image",
  className = "",
  style = {}
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (imageBlob) {
      try {
        const url = URL.createObjectURL(imageBlob);
        setImageUrl(url);
        setError(null);
      } catch (err) {
        setError('Failed to load image');
        console.error('Error creating object URL:', err);
      } finally {
        setLoading(false);
      }

      // Cleanup function to revoke the object URL
      return () => {
        if (imageUrl) {
          URL.revokeObjectURL(imageUrl);
        }
      };
    } else {
      setLoading(false);
      setError('No image provided');
    }
  }, [imageBlob]);

  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ 
          minHeight: '200px', 
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          ...style 
        }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading image...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ 
          minHeight: '200px', 
          backgroundColor: '#fee', 
          borderRadius: '8px',
          border: '2px dashed #fca5a5',
          ...style 
        }}
      >
        <div className="text-center text-red-600">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ 
          minHeight: '200px', 
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          ...style 
        }}
      >
        <p className="text-gray-500">No image to display</p>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <img
        src={imageUrl}
        alt={alt}
        style={{
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onError={() => {
          setError('Failed to display image');
          setImageUrl(null);
        }}
      />
    </div>
  );
};

export default SimpleImageViewer;
