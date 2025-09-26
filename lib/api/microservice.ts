// Microservice API service for image uploads and analysis
const MICROSERVICE_URL = process.env.NEXT_PUBLIC_MICROSERVICE_URL || 'http://localhost:8000';
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

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
              message: 'Development mode upload simulation',
              diagnosis: 'Normal',
              confidence: 94.5,
            });
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

      xhr.open('POST', `${MICROSERVICE_URL}/upload`);
      
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
      // Return paginated mock data
      const start = offset;
      const end = start + limit;
      return Promise.resolve({
        user_id: userId,
        uploads: mockUploads.slice(start, end),
        count: mockUploads.length,
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

    try {
      // Convert files to base64
      const filePromises = files.map(async (file) => ({
        filename: file.name,
        content: await this.fileToBase64(file)
      }));

      if (onProgress) onProgress(25);

      const filesData = await Promise.all(filePromises);
      
      if (onProgress) onProgress(50);

      const response = await fetch(`${MICROSERVICE_URL}/upload/batch`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ files: filesData }),
      });

      if (onProgress) onProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Batch upload failed');
      }

      return response.json();
    } catch (error) {
      throw new Error(`Batch upload failed: ${error}`);
    }
  }

  async getBatchStatus(batchId: string): Promise<BatchStatusResponse> {
    if (isDevMode) {
      // Mock batch status
      const mockProgress = Math.floor(Math.random() * 100);
      const statuses: Array<'queued' | 'processing' | 'completed' | 'failed'> = ['queued', 'processing', 'completed'];
      const status = mockProgress < 30 ? 'queued' : mockProgress < 80 ? 'processing' : 'completed';
      
      return Promise.resolve({
        batch_id: batchId,
        status,
        total_files: 5,
        processed_files: Math.floor((mockProgress / 100) * 5),
        progress_percentage: mockProgress,
      });
    }

    const response = await fetch(`${MICROSERVICE_URL}/upload/batch/${batchId}/status`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch batch status');
    }

    return response.json();
  }

  async getUserBatches(userId: string): Promise<UserBatchesResponse> {
    if (isDevMode) {
      // Mock user batches
      const mockBatches: UserBatch[] = [
        {
          batch_id: 'batch_001',
          status: 'completed',
          total_files: 3,
          processed_files: 3,
          upload_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          progress_percentage: 100,
        },
        {
          batch_id: 'batch_002',
          status: 'processing',
          total_files: 5,
          processed_files: 3,
          upload_timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          progress_percentage: 60,
        },
      ];

      return Promise.resolve({
        user_id: userId,
        batches: mockBatches,
        count: mockBatches.length,
      });
    }

    const response = await fetch(`${MICROSERVICE_URL}/user/${userId}/batches`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch user batches');
    }

    return response.json();
  }

  async getBatchFiles(batchId: string): Promise<BatchFilesResponse> {
    if (isDevMode) {
      // Mock batch files
      const mockFiles: BatchFile[] = [
        {
          upload_id: 'upload_batch_001',
          filename: 'batch_scan_001.jpg',
          status: 'completed',
          upload_timestamp: new Date().toISOString(),
          diagnosis: 'Normal',
          confidence: 92.1,
        },
        {
          upload_id: 'upload_batch_002',
          filename: 'batch_scan_002.dcm',
          status: 'processing',
          upload_timestamp: new Date().toISOString(),
        },
      ];

      return Promise.resolve({
        batch_id: batchId,
        files: mockFiles,
        count: mockFiles.length,
      });
    }

    const response = await fetch(`${MICROSERVICE_URL}/upload/batch/${batchId}/files`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch batch files');
    }

    return response.json();
  }

  async getUploadFileInfo(uploadId: string): Promise<UploadFileInfo> {
    const response = await fetch(`${MICROSERVICE_URL}/upload/${uploadId}/info`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch file info');
    }
    return response.json();
  }

  async getUploadFileBlob(uploadId: string): Promise<Blob> {
    const response = await fetch(`${MICROSERVICE_URL}/upload/${uploadId}/file`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch image file');
    }
    return response.blob();
  }

  // Utility function to validate multiple files for batch upload
  validateBatchFiles(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (files.length === 0) {
      return { valid: false, errors: ['No files selected'] };
    }

    if (files.length > 50) {
      errors.push('Too many files. Maximum 50 files per batch.');
    }

    let totalSize = 0;
    files.forEach((file, index) => {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
      }
      totalSize += file.size;
    });

    const maxBatchSize = 100 * 1024 * 1024; // 100MB total
    if (totalSize > maxBatchSize) {
      errors.push('Total batch size exceeds 100MB limit.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const microserviceAPI = new MicroserviceAPI();
