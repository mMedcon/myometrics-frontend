
import React, { useEffect, useRef, useState } from 'react';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as dcmjs from 'dcmjs';
import * as dicomParser from 'dicom-parser';

// Configure cornerstone and WADO image loader
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

// Configure WADO image loader
cornerstoneWADOImageLoader.configure({
  beforeSend: function(xhr: XMLHttpRequest) {
    // No auth headers needed for blob URLs
  },
  useWebWorkers: true,
});

const DicomViewer: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);

  useEffect(() => {
    if (imageId && elementRef.current) {
      cornerstone.enable(elementRef.current);
      cornerstone.loadImage(imageId)
        .then((image: any) => {
          cornerstone.displayImage(elementRef.current!, image);
        })
        .catch((err: any) => {
          console.error('Display error:', err);
          setError('Failed to display DICOM image.');
        });
    }
    return () => {
      if (elementRef.current) {
        try { 
          cornerstone.disable(elementRef.current); 
        } catch (e) {
          // Element might already be disabled
        }
      }
    };
  }, [imageId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setLoading(true);
    const file = e.target.files?.[0];
    if (!file) {
      setLoading(false);
      return;
    }
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Try different approaches to load the DICOM file
      let imageId: string | null = null;
      
      // Method 1: Try with blob URL
      try {
        const blob = new Blob([arrayBuffer], { type: 'application/dicom' });
        const blobUrl = URL.createObjectURL(blob);
        const testImageId = `wadouri:${blobUrl}`;
        
        await cornerstone.loadImage(testImageId);
        imageId = testImageId;
        console.log('Successfully loaded DICOM with blob URL');
      } catch (blobError) {
        console.warn('Blob URL method failed:', blobError);
      }
      
      // Method 2: Try with base64 data URI if blob failed
      if (!imageId) {
        try {
          const uint8Array = new Uint8Array(arrayBuffer);
          const base64String = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
          const dataUri = `data:application/dicom;base64,${base64String}`;
          const testImageId = `wadouri:${dataUri}`;
          
          await cornerstone.loadImage(testImageId);
          imageId = testImageId;
          console.log('Successfully loaded DICOM with data URI');
        } catch (dataUriError) {
          console.warn('Data URI method failed:', dataUriError);
        }
      }
      
      // Method 3: Try direct parsing with dicom-parser
      if (!imageId) {
        try {
          const byteArray = new Uint8Array(arrayBuffer);
          const dataset = dicomParser.parseDicom(byteArray);
          
          if (dataset) {
            const blob = new Blob([arrayBuffer], { type: 'application/dicom' });
            const blobUrl = URL.createObjectURL(blob);
            imageId = `wadouri:${blobUrl}`;
            console.log('DICOM parsed with dicom-parser, trying to load...');
            await cornerstone.loadImage(imageId);
          }
        } catch (parserError) {
          console.warn('dicom-parser method failed:', parserError);
        }
      }
      
      if (imageId) {
        setImageId(imageId);
      } else {
        throw new Error('load DICOM file with any method. Please check if the file is a valid DICOM image.');
      }
      
    } catch (err: any) {
      setError(err.message || 'Could not load DICOM file.');
      console.error('DICOM loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2>DICOM Viewer</h2>
      <input
        type="file"
        accept=".dcm,application/dicom,image/dicom"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ marginBottom: 16 }}
      />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {loading && <div>Loading...</div>}
      <div
        ref={elementRef}
        style={{ width: 512, height: 512, background: '#222', marginTop: 16 }}
      />
    </div>
  );
};

export default DicomViewer;
