// Microservice API service for image uploads and analysis
const MICROSERVICE_URL = process.env.NEXT_PUBLIC_MICROSERVICE_URL || 'http://localhost:8001';
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// Mock data for development mode
const mockStats: Stats = {
  total_uploads: 1247,
  uploads_today: 23,
  uploads_this_week: 156,
  uploads_this_month: 687,
  average_confidence: 87.3,
  common_diagnoses: [
    { diagnosis: 'Normal', count: 523, percentage: 42 },
    { diagnosis: 'Myocardial Infarction', count: 312, percentage: 25 },
    { diagnosis: 'Arrhythmia', count: 187, percentage: 15 },
    { diagnosis: 'Cardiomyopathy', count: 124, percentage: 10 },
    { diagnosis: 'Valve Disease', count: 101, percentage: 8 },
  ],
  status_distribution: {
    uploaded: 12,
    processing: 8,
    completed: 1198,
    failed: 29,
  },
};

const mockUploads: UserUpload[] = [
  {
    upload_id: 'upload_001',
    filename: 'cardiac_scan_001.jpg',
    status: 'completed',
    upload_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    diagnosis: 'Normal',
    confidence: 94.2,
  },
  {
    upload_id: 'upload_002',
    filename: 'cardiac_scan_002.jpg',
    status: 'completed',
    upload_timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    diagnosis: 'Myocardial Infarction',
    confidence: 87.6,
  },
  {
    upload_id: 'upload_003',
    filename: 'cardiac_scan_003.jpg',
    status: 'processing',
    upload_timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    upload_id: 'upload_004',
    filename: 'cardiac_scan_004.jpg',
    status: 'completed',
    upload_timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    diagnosis: 'Arrhythmia',
    confidence: 76.4,
  },
  {
    upload_id: 'upload_005',
    filename: 'cardiac_scan_005.jpg',
    status: 'failed',
    upload_timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

const mockUploadDetails: { [key: string]: UploadDetails } = {
  upload_001: {
    upload_id: 'upload_001',
    filename: 'cardiac_scan_001.jpg',
    status: 'completed',
    upload_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    analysis_result: {
      diagnosis: 'Normal',
      confidence: 94.2,
      findings: [
        'Regular cardiac rhythm detected',
        'Normal chamber dimensions',
        'No signs of abnormal tissue',
        'Clear vascular structure'
      ],
      recommendations: [
        'Continue regular monitoring',
        'Maintain healthy lifestyle',
        'Follow up in 6 months'
      ]
    },
    metadata: {
      file_size: 2048576,
      image_dimensions: { width: 1024, height: 768 },
      file_type: 'image/jpeg'
    }
  },
  upload_002: {
    upload_id: 'upload_002',
    filename: 'cardiac_scan_002.jpg',
    status: 'completed',
    upload_timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    analysis_result: {
      diagnosis: 'Myocardial Infarction',
      confidence: 87.6,
      findings: [
        'Abnormal tissue density in left ventricle',
        'Reduced wall motion detected',
        'Elevated biomarker indicators',
        'Characteristic pattern consistent with MI'
      ],
      recommendations: [
        'Immediate cardiology consultation required',
        'Consider emergency intervention',
        'Monitor cardiac enzymes',
        'Implement cardiac rehabilitation protocol'
      ]
    },
    metadata: {
      file_size: 3145728,
      image_dimensions: { width: 1280, height: 960 },
      file_type: 'image/jpeg'
    }
  },
};

export interface UploadResponse {
  upload_id: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  filename: string;
  upload_timestamp: string;
}

export interface UploadDetails {
  upload_id: string;
  filename: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  upload_timestamp: string;
  analysis_result?: {
    diagnosis: string;
    confidence: number;
    findings: string[];
    recommendations: string[];
  };
  metadata?: {
    file_size: number;
    image_dimensions: {
      width: number;
      height: number;
    };
    file_type: string;
  };
}

export interface UserUpload {
  upload_id: string;
  filename: string;
  status: string;
  upload_timestamp: string;
  diagnosis?: string;
  confidence?: number;
}

export interface Stats {
  total_uploads: number;
  uploads_today: number;
  uploads_this_week: number;
  uploads_this_month: number;
  average_confidence: number;
  common_diagnoses: Array<{
    diagnosis: string;
    count: number;
    percentage: number;
  }>;
  status_distribution: {
    uploaded: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

class MicroserviceAPI {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (user) {
      const userData = JSON.parse(user);
      headers['X-User-ID'] = userData.id.toString();
    }

    return headers;
  }

  private getFileUploadHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (user) {
      const userData = JSON.parse(user);
      headers['X-User-ID'] = userData.id.toString();
    }

    return headers;
  }

  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    if (isDevMode) {
      // Simulate upload progress in development mode
      return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (onProgress) {
            onProgress(progress);
          }
          if (progress >= 100) {
            clearInterval(interval);
            resolve({
              upload_id: `upload_dev_${Date.now()}`,
              status: 'uploaded',
              filename: file.name,
              upload_timestamp: new Date().toISOString(),
            });
          }
        }, 100);
      });
    }

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.detail || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${MICROSERVICE_URL}/upload`);
      
      // Set headers
      const headers = this.getFileUploadHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send(formData);
    });
  }

  async getUploadDetails(uploadId: string): Promise<UploadDetails> {
    if (isDevMode) {
      // Return mock data for known upload IDs
      if (mockUploadDetails[uploadId]) {
        return Promise.resolve(mockUploadDetails[uploadId]);
      }
      // Generate mock data for unknown IDs
      return Promise.resolve({
        upload_id: uploadId,
        filename: `demo_file_${uploadId.slice(-3)}.jpg`,
        status: 'completed',
        upload_timestamp: new Date().toISOString(),
        analysis_result: {
          diagnosis: 'Demo Analysis',
          confidence: 85.5,
          findings: ['This is demo data', 'Backend not connected'],
          recommendations: ['Enable backend for real analysis']
        },
        metadata: {
          file_size: 1024000,
          image_dimensions: { width: 800, height: 600 },
          file_type: 'image/jpeg'
        }
      });
    }

    const response = await fetch(`${MICROSERVICE_URL}/upload/${uploadId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch upload details');
    }

    return response.json();
  }

  async getUserUploads(limit = 50, offset = 0): Promise<UserUpload[]> {
    if (isDevMode) {
      // Return paginated mock data
      const start = offset;
      const end = start + limit;
      return Promise.resolve(mockUploads.slice(start, end));
    }

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${MICROSERVICE_URL}/uploads?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch uploads');
    }

    return response.json();
  }

  async getStats(): Promise<Stats> {
    if (isDevMode) {
      return Promise.resolve(mockStats);
    }

    const response = await fetch(`${MICROSERVICE_URL}/stats`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch statistics');
    }

    return response.json();
  }

  async deleteUpload(uploadId: string): Promise<void> {
    const response = await fetch(`${MICROSERVICE_URL}/upload/${uploadId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete upload');
    }
  }

  async retryAnalysis(uploadId: string): Promise<UploadDetails> {
    const response = await fetch(`${MICROSERVICE_URL}/upload/${uploadId}/retry`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to retry analysis');
    }

    return response.json();
  }

  // Utility function to check file validity before upload
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported. Please upload JPEG or PNG images only.',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Please upload files smaller than 10MB.',
      };
    }

    return { valid: true };
  }
}

export const microserviceAPI = new MicroserviceAPI();
