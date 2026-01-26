'use client';

import React, { useState, useEffect } from 'react';
import { microserviceAPI } from '@/lib/api/microservice';

interface ServiceStatus {
  microservice: boolean;
  dicom: boolean;
  urls: {
    microservice: string;
    dicom: string;
  };
}

export default function ServiceStatusChecker() {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkServices();
  }, []);

  const checkServices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const healthStatus = await microserviceAPI.healthCheck();
      setStatus(healthStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check services');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card-background)', borderColor: 'var(--border)' }}>
        <p style={{ color: 'var(--text)' }}>Checking backend services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card-background)', borderColor: 'var(--error)' }}>
        <p style={{ color: 'var(--error)' }}>Error checking services: {error}</p>
        <button 
          onClick={checkServices}
          className="btn btn-outline mt-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="p-4 rounded-lg border mb-4" style={{ backgroundColor: 'var(--card-background)', borderColor: 'var(--border)' }}>
      <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
        Backend Services Status
      </h3>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: status.microservice ? 'var(--success)' : 'var(--error)' }}
          ></div>
          <span style={{ color: 'var(--text)' }}>
            Main API: {status.microservice ? 'Connected' : 'Disconnected'}
          </span>
          <code className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--hover-background)', color: 'var(--muted)' }}>
            {status.urls.microservice}
          </code>
        </div>
        
        <div className="flex items-center space-x-3">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: status.dicom ? 'var(--success)' : 'var(--error)' }}
          ></div>
          <span style={{ color: 'var(--text)' }}>
            DICOM Service: {status.dicom ? 'Connected' : 'Disconnected'}
          </span>
          <code className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--hover-background)', color: 'var(--muted)' }}>
            {status.urls.dicom}
          </code>
        </div>
      </div>

      <button 
        onClick={checkServices}
        className="btn btn-outline mt-3 text-sm"
      >
        Refresh Status
      </button>

      {(!status.microservice || !status.dicom) && (
        <div className="mt-3 p-3 rounded" style={{ backgroundColor: 'var(--warning)', opacity: 0.1 }}>
          <p className="text-sm" style={{ color: 'var(--warning)' }}>
            Some services are not connected. Make sure your Render backend services are deployed and running.
            {process.env.NEXT_PUBLIC_DEV_MODE === 'true' && ' (Currently in development mode)'}
          </p>
        </div>
      )}
    </div>
  );
}