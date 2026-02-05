// Microservice API service for image uploads and analysis
const MICROSERVICE_URL = process.env.NEXT_PUBLIC_MICROSERVICE_URL || 'http://localhost:8000';
const DICOM_SERVICE_URL = process.env.NEXT_PUBLIC_DICOM_SERVICE_URL || process.env.NEXT_PUBLIC_MICROSERVICE_URL || 'http://localhost:8000';
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// API Configuration for Render services
const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Add timeout for production services
  timeout: 30000,
};

// Mock data for development mode
const mockStats: Stats = {
  total_uploads: 1247,
  unique_users: 89,
  latest_upload: new Date().toISOString(),
  earliest_upload: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

const mockUploads: UserUpload[] = [
  {
    upload_id: 'upload_001',
    filename: 'brain_scan_001.jpg',
    status: 'completed',
    upload_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    diagnosis: 'Tumor Detected',
    confidence: 94.2,
  },
  {
    upload_id: 'upload_002',
    filename: 'muscle_scan_002.jpg',
    status: 'completed',
    upload_timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    diagnosis: 'DMD Detected',
    confidence: 87.6,
  },
  {
    upload_id: 'upload_003',
    filename: 'filler_scan_003.jpg',
    status: 'completed',
    upload_timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    diagnosis: 'Filler Detected',
    confidence: 91.3,
  },
  {
    upload_id: 'upload_004',
    filename: 'brain_scan_004.jpg',
    status: 'completed',
    upload_timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    diagnosis: 'Tumor Not Detected',
    confidence: 88.7,
  },
  {
    upload_id: 'upload_005',
    filename: 'filler_scan_005.jpg',
    status: 'completed',
    upload_timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    diagnosis: 'No Filler Detected',
    confidence: 76.4,
  },
  {
    upload_id: 'upload_006',
    filename: 'muscle_scan_006.jpg',
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
  message: string;
  diagnosis: string;
  confidence: number;
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

export interface UserUploadsResponse {
  user_id: string;
  uploads: UserUpload[];
  count: number;
}

export interface Stats {
  total_uploads: number;
  unique_users: number;
  latest_upload: string;
  earliest_upload: string;
}

export interface BatchUploadResponse {
  batch_id: string;
  message: string;
  total_files: number;
  status: 'queued';
}

export interface BatchStatusResponse {
  batch_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  total_files: number;
  processed_files: number;
  progress_percentage: number;
}

export interface UserBatch {
  batch_id: string;
  status: string;
  total_files: number;
  processed_files: number;
  upload_timestamp: string;
  progress_percentage: number;
}

export interface UserBatchesResponse {
  user_id: string;
  batches: UserBatch[];
  count: number;
}

export interface BatchFile {
  upload_id: string;
  filename: string;
  status: string;
  upload_timestamp: string;
  diagnosis?: string;
  confidence?: number;
}

export interface BatchFilesResponse {
  batch_id: string;
  files: BatchFile[];
  count: number;
}

export interface UploadFileInfo {
  upload_id: string;
  original_filename: string;
  file_type: string;
  upload_time: string;
  storage_path: string;
  exists: boolean;
}

class MicroserviceAPI {
  [x: string]: any;
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

  private getFileUploadHeaders(filename: string): Record<string, string> {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    const headers: Record<string, string> = {
      'X-File-Name': filename,
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

  async uploadFile(file: File, onProgress?: (progress: number) => void, imageType?: string): Promise<UploadResponse> {
    if (isDevMode) {
      console.log('🧪 Development mode: simulating upload with imageType:', imageType);
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
            
            // Generate diagnosis based on imageType
            let diagnosis = 'Normal';
            let confidence = 85 + Math.random() * 15; // 85-100%
            
            if (imageType === 'MS') {
              // Random MS diagnosis with 50% probability
              const random = Math.random();
              diagnosis = random < 0.5 ? 'Tumor Detected' : 'Tumor Not Detected';
            } else if (imageType === 'DMD') {
              // Always DMD detected for DMD type
              diagnosis = 'DMD Detected';
            } else if (imageType === 'FILLER') {
              // Random Filler diagnosis with 50% probability
              const random = Math.random();
              diagnosis = random < 0.5 ? 'Filler Detected' : 'No Filler Detected';
            }
            
            const mockResult = {
              upload_id: `upload_dev_${Date.now()}`,
              message: 'Development mode upload simulation',
              diagnosis: diagnosis,
              confidence: Math.round(confidence * 10) / 10,
            };
            console.log('🧪 Dev mode upload result:', mockResult);
            resolve(mockResult);
          }
        }, 100);
      });
    }

    return new Promise((resolve, reject) => {
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

      xhr.open('POST', `${MICROSERVICE_URL}/upload${imageType ? `?image_type=${encodeURIComponent(imageType)}` : ''}`);
      
      console.log('🌐 Sending upload request to:', `${MICROSERVICE_URL}/upload${imageType ? `?image_type=${encodeURIComponent(imageType)}` : ''}`);
      console.log('🏷️  Image type parameter:', imageType);
      
      // Set headers
      const headers = this.getFileUploadHeaders(file.name);
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Set content type
      xhr.setRequestHeader('Content-Type', file.type);

      // Send raw file bytes instead of FormData
      xhr.send(file);
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

    const data = await response.json();
    
    // Transform API response to match frontend interface
    return {
      upload_id: data.upload_id,
      filename: data.original_filename || data.filename,
      status: data.status === 'processed' ? 'completed' : data.status,
      upload_timestamp: data.upload_time || data.file_upload_time || data.upload_timestamp,
      analysis_result: data.diagnosis ? {
        diagnosis: data.diagnosis,
        confidence: data.confidence_score || data.confidence || 0,
        findings: data.findings || [],
        recommendations: data.recommendations || []
      } : undefined,
      metadata: {
        file_size: data.file_size || 0,
        image_dimensions: data.image_dimensions || { width: 0, height: 0 },
        file_type: data.file_type || 'unknown'
      }
    };
  }

  async getUserUploads(userId: string, limit = 50, offset = 0): Promise<UserUploadsResponse> {
    if (isDevMode) {
      console.log('🧪 Getting user uploads in dev mode for user:', userId);
      
      // Get uploads from localStorage that were created in this session
      const localUploads: UserUpload[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('upload_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.upload_id) {
              localUploads.push({
                upload_id: data.upload_id,
                filename: data.filename,
                status: data.status || 'completed',
                upload_timestamp: data.timestamp,
                diagnosis: data.diagnosis || (() => {
                  // Generate diagnosis based on image_type
                  if (data.image_type === 'MS') {
                    return Math.random() > 0.5 ? 'Tumor Detected' : 'Tumor Not Detected';
                  } else if (data.image_type === 'DMD') {
                    return 'DMD Detected';
                  } else if (data.image_type === 'FILLER') {
                    return Math.random() > 0.5 ? 'Filler Detected' : 'No Filler Detected';
                  }
                  return 'Analysis Complete';
                })(),
                confidence: data.confidence || (85 + Math.random() * 15),
              });
            }
          } catch (e) {
            console.warn('Failed to parse localStorage item:', key);
          }
        }
      }
      
      // Combine with mock data and sort by timestamp
      const allUploads = [...localUploads, ...mockUploads]
        .sort((a, b) => new Date(b.upload_timestamp).getTime() - new Date(a.upload_timestamp).getTime());
      
      // Return paginated mock data
      const start = offset;
      const end = start + limit;
      console.log('📊 Returning uploads:', allUploads.slice(start, end));
      
      return Promise.resolve({
        user_id: userId,
        uploads: allUploads.slice(start, end),
        count: allUploads.length,
      });
    }

    const response = await fetch(`${MICROSERVICE_URL}/user/${userId}/uploads`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch uploads');
    }

    const data = await response.json();
    
    // Transform API response to match frontend interface
    if (data.uploads) {
      data.uploads = data.uploads.map((upload: any) => ({
        upload_id: upload.upload_id,
        filename: upload.original_filename || upload.filename,
        status: upload.status,
        upload_timestamp: upload.upload_time || upload.file_upload_time || upload.upload_timestamp,
        diagnosis: upload.diagnosis,
        confidence: upload.confidence_score || upload.confidence,
      }));
    }

    return data;
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

  async saveUpload(userId: string, uploadId: string): Promise<{ message: string }> {
    if (isDevMode) {
      return Promise.resolve({ message: 'Upload saved successfully (development mode)' });
    }

    const params = new URLSearchParams({
      user_id: userId,
      upload_id: uploadId,
    });

    const response = await fetch(`${MICROSERVICE_URL}/save-upload?${params}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save upload');
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
    if (isDevMode) {
      // Return mock retry result
      return Promise.resolve({
        upload_id: uploadId,
        filename: `retried_file_${uploadId.slice(-3)}.jpg`,
        status: 'processing',
        upload_timestamp: new Date().toISOString(),
        analysis_result: {
          diagnosis: 'Retrying Analysis',
          confidence: 0,
          findings: ['Analysis restarted', 'Processing in progress'],
          recommendations: ['Please wait for analysis to complete']
        },
        metadata: {
          file_size: 1024000,
          image_dimensions: { width: 800, height: 600 },
          file_type: 'image/jpeg'
        }
      });
    }

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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/dicom'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.dcm'];

    // Check file type (MIME type)
    const isValidType = allowedTypes.includes(file.type);
    
    // Check file extension as fallback (DICOM files often don't have proper MIME type)
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const isValidExtension = allowedExtensions.includes(fileExtension);

    if (!isValidType && !isValidExtension) {
      return {
        valid: false,
        error: 'File type not supported. Please upload DICOM (.dcm), JPEG, or PNG images only.',
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

  // Helper function to convert file to base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  async uploadBatch(files: File[], onProgress?: (progress: number) => void): Promise<BatchUploadResponse> {
    if (isDevMode) {
      // Simulate batch upload in development mode
      return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          if (onProgress) {
            onProgress(progress);
          }
          if (progress >= 100) {
            clearInterval(interval);
            resolve({
              batch_id: `batch_dev_${Date.now()}`,
              message: 'Development mode batch upload simulation',
              total_files: files.length,
              status: 'queued',
            });
          }
        }, 200);
      });
    }

    // Add real implementation or a fallback return for non-dev mode
    // Example placeholder for real implementation:
    throw new Error('uploadBatch is not implemented for production mode');
  }

  /**
   * get an image for the preview
   */
  getUploadPreviewUrl(uploadId: string): string {
    return `${MICROSERVICE_URL}/upload/${uploadId}/preview`;
  }

  /**
   * get the url of an image
   */
  getUploadFileUrl(uploadId: string): string {
    return `${MICROSERVICE_URL}/upload/${uploadId}/file`;
  }

  // DICOM Service Integration
  
  /**
   * Get DICOM viewer URL for a specific upload
   */
  getDicomViewerUrl(uploadId: string): string {
    return `${DICOM_SERVICE_URL}/dicom/viewer/${uploadId}`;
  }

  /**
   * Check if upload is a DICOM file
   */
  async isDicomFile(uploadId: string): Promise<boolean> {
    if (isDevMode) {
      return uploadId.includes('dicom') || uploadId.includes('dcm');
    }

    try {
      const response = await fetch(`${DICOM_SERVICE_URL}/dicom/${uploadId}/info`, {
        headers: this.getAuthHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get DICOM metadata
   */
  async getDicomMetadata(uploadId: string): Promise<any> {
    if (isDevMode) {
      return {
        patientName: 'DEMO^PATIENT',
        studyDate: '20240101',
        modality: 'CT',
        studyDescription: 'Demo DICOM Study',
        seriesDescription: 'Demo Series',
        imageCount: 1,
      };
    }

    const response = await fetch(`${DICOM_SERVICE_URL}/dicom/${uploadId}/metadata`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch DICOM metadata');
    }

    return response.json();
  }

  /**
   * Get DICOM image frames
   */
  async getDicomFrames(uploadId: string): Promise<string[]> {
    if (isDevMode) {
      return [`${MICROSERVICE_URL}/upload/${uploadId}/preview`];
    }

    const response = await fetch(`${DICOM_SERVICE_URL}/dicom/${uploadId}/frames`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch DICOM frames');
    }

    return response.json();
  }

  /**
   * Health check for backend services
   */
  async healthCheck(): Promise<{ 
    microservice: boolean; 
    dicom: boolean; 
    urls: { microservice: string; dicom: string } 
  }> {
    const result = {
      microservice: false,
      dicom: false,
      urls: {
        microservice: MICROSERVICE_URL,
        dicom: DICOM_SERVICE_URL,
      },
    };

    if (isDevMode) {
      return { ...result, microservice: true, dicom: true };
    }

    // Check microservice
    try {
      const microResponse = await fetch(`${MICROSERVICE_URL}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      result.microservice = microResponse.ok;
    } catch {
      result.microservice = false;
    }

    // Check DICOM service
    try {
      const dicomResponse = await fetch(`${DICOM_SERVICE_URL}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      result.dicom = dicomResponse.ok;
    } catch {
      result.dicom = false;
    }

    return result;
  }
}

export const microserviceAPI = new MicroserviceAPI();