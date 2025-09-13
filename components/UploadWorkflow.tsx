'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { microserviceAPI, UploadResponse, BatchUploadResponse, BatchStatusResponse } from '@/lib/api';

interface UploadProgress {
  percentage: number;
  stage: 'uploading' | 'analyzing' | 'complete';
}

interface UploadWorkflowProps {
  onUploadComplete?: (result: UploadResponse | BatchUploadResponse) => void;
}

export default function UploadWorkflow({ onUploadComplete }: UploadWorkflowProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ percentage: 0, stage: 'uploading' });
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [batchResult, setBatchResult] = useState<BatchUploadResponse | null>(null);
  const [batchStatus, setBatchStatus] = useState<BatchStatusResponse | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const [hidePanel, setHidePanel] = useState(false);

  useEffect(() => {
  const stored = localStorage.getItem("hidePanel");
  if (stored !== null) {
    setHidePanel(stored === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hidePanel", hidePanel.toString());
  }, [hidePanel]);

  useEffect(() => {
    const saved = localStorage.getItem("uploadProgress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.stage) {
          setUploadProgress(parsed);
        }
      } catch (e) {
        console.error("Ошибка парсинга uploadProgress", e);
      }
    }
  }, []); 
  useEffect(() => {
    if (uploadProgress.stage !== "uploading" || uploadProgress.percentage > 0) {
      localStorage.setItem("uploadProgress", JSON.stringify(uploadProgress));
    }
  }, [uploadProgress]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const savedFiles = localStorage.getItem("savedFiles");
    if (savedFiles) {
      setSelectedFiles(JSON.parse(savedFiles)); // loading files metadata from local storage
    }

    const hidden = localStorage.getItem("hidePanel");
    if (hidden === "true") {
      setHidePanel(true);
    }
  }, []);

  // Optimized polling with exponential backoff
  const startBatchStatusPolling = (batchId: string) => {
    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    let pollCount = 0;
    const maxPollCount = 30; // Maximum 30 polls (about 10 minutes total)
    
    const poll = async () => {
      try {
        pollCount++;
        const status = await microserviceAPI.getBatchStatus(batchId);
        setBatchStatus(status);
        
        if (status.status === 'completed' || status.status === 'failed') {
          // Stop polling - batch is done
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          
          setUploadProgress({ percentage: 100, stage: 'complete' });
          
          if (onUploadComplete && batchResult) {
            onUploadComplete(batchResult);
            localStorage.setItem('isPanelHidden', 'false');
          }
          
          // Redirect to batch results page
          setTimeout(() => {
            router.push(`/batch/${batchId}`);
          }, 2000);
          
        } else if (pollCount >= maxPollCount) {
          // Stop polling after max attempts
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setError('Batch processing is taking longer than expected. Please check the batch status manually.');
          
        } else {
          // Update progress and continue polling
          setUploadProgress({ 
            percentage: status.progress_percentage, 
            stage: status.status === 'processing' ? 'analyzing' : 'uploading' 
          });
          
          // Schedule next poll with exponential backoff
          const nextInterval = Math.min(5000 + (pollCount * 2000), 30000); // 5s, 7s, 9s... max 30s
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          pollIntervalRef.current = setTimeout(poll, nextInterval);
        }
        
      } catch (err) {
        console.error('Batch status polling error:', err);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setError('Failed to fetch batch status. Please refresh to check manually.');
      }
    };

    // Start first poll after 3 seconds
    pollIntervalRef.current = setTimeout(poll, 3000);
  };

  // Helper function to determine if file is DICOM
  const isDicomFile = (file: File | null): boolean => {
    if (!file) return false;
    return file.name.toLowerCase().endsWith('.dcm') || 
           file.type === 'application/dicom' ||
           file.name.toLowerCase().includes('dicom');
  };

  // Helper function to traverse folders and extract files
  const traverseFileTree = async (item: any, path: string = ''): Promise<File[]> => {
    return new Promise((resolve) => {
      if (item.isFile) {
        item.file((file: File) => {
          resolve([file]);
        });
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        const files: File[] = [];
        
        const readEntries = () => {
          dirReader.readEntries(async (entries: any[]) => {
            if (entries.length === 0) {
              resolve(files);
              return;
            }
            
            const promises = entries.map(entry => 
              traverseFileTree(entry, path + item.name + '/')
            );
            
            try {
              const results = await Promise.all(promises);
              files.push(...results.flat());
              readEntries(); // Continue reading if there are more entries
            } catch (error) {
              resolve(files);
            }
          });
        };
        
        readEntries();
      } else {
        resolve([]);
      }
    });
  };

  // Helper function to filter valid medical image files
  const filterMedicalFiles = (files: File[]): File[] => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.dcm'];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/dicom'];
    
    return files.filter(file => {
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      const isValidType = allowedTypes.includes(file.type);
      const isValidExtension = allowedExtensions.includes(fileExtension);
      
      return isValidType || isValidExtension;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const items = Array.from(e.dataTransfer.items);
    
    if (items.length > 0) {
      setError('Processing files...');
      
      try {
        const allFiles: File[] = [];
        
        // Process each dropped item (could be files or folders)
        const promises = items.map(async (item) => {
          if (item.kind === 'file') {
            const entry = item.webkitGetAsEntry();
            if (entry) {
              return await traverseFileTree(entry);
            } else {
              // Fallback for browsers that don't support webkitGetAsEntry
              const file = item.getAsFile();
              return file ? [file] : [];
            }
          }
          return [];
        });

        const results = await Promise.all(promises);
        allFiles.push(...results.flat());

        // Filter to only include valid medical image files
        const validFiles = filterMedicalFiles(allFiles);
        
        if (validFiles.length === 0) {
          setError('No valid medical image files found. Please ensure the folder contains DICOM (.dcm), JPEG, or PNG files.');
          return;
        }

        if (validFiles.length !== allFiles.length) {
          const filteredCount = allFiles.length - validFiles.length;
          setError(`Found ${validFiles.length} valid files (${filteredCount} files were filtered out as they are not medical images).`);
          // Clear the error after showing the info message
          setTimeout(() => setError(''), 3000);
        } else {
          setError(''); // Clear any previous errors
        }

        handleFileSelection(validFiles);
        
      } catch (error) {
        setError('Error processing dropped items. Please try selecting files directly.');
        console.error('Drop processing error:', error);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const validFiles = filterMedicalFiles(fileArray);
      
      if (validFiles.length === 0) {
        setError('No valid medical image files selected. Please select DICOM (.dcm), JPEG, or PNG files.');
        return;
      }

      if (validFiles.length !== fileArray.length) {
        const filteredCount = fileArray.length - validFiles.length;
        setError(`Selected ${validFiles.length} valid files (${filteredCount} files were filtered out as they are not medical images).`);
        // Clear the error after showing the info message
        setTimeout(() => setError(''), 3000);
      }

      handleFileSelection(validFiles);
    }
  }; 

  const saveFilesMetadata = (files: File[]) => {
    const metadata = files.map(file => ({
      name: file.name,
      size: file.size
    }));
    localStorage.setItem("savedFiles", JSON.stringify(metadata));
  };

  useEffect(() => {
    const saved = localStorage.getItem("savedFiles");
    if (saved) {
      setSelectedFiles(JSON.parse(saved)); // selectedFiles будет массив объектов {name, size}
    }
  }, []);


  const handleFileSelection = (files: File[]) => {
  if (files.length === 1) {
    const validation = microserviceAPI.validateFile(files[0]);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    setIsBatchMode(false);
    } else {
      const validation = microserviceAPI.validateBatchFiles(files);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return;
      }
      setIsBatchMode(true);
    }

    setSelectedFiles(files);
    saveFilesMetadata(files);
    setError('');
    setUploadResult(null);
    setBatchResult(null);
    setBatchStatus(null);

    localStorage.removeItem("analysisResult");
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setError('');
    

    try {
      setUploadProgress({ percentage: 0, stage: 'uploading' });
      
      if (isBatchMode) {
        // Batch upload
        const result = await microserviceAPI.uploadBatch(selectedFiles, (progress) => {
          setUploadProgress({ percentage: progress, stage: 'uploading' });
        });

        setBatchResult(result);
        
        // Start optimized polling for batch status
        startBatchStatusPolling(result.batch_id);
        
      } else {
        // Single file upload
        const result = await microserviceAPI.uploadFile(selectedFiles[0], (progress) => {
          setUploadProgress({ percentage: progress, stage: 'uploading' });
        });

        setUploadResult(result);
        setUploadProgress({ percentage: 100, stage: 'analyzing' });
        
        // Get current user for save operation
        const user = localStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          await microserviceAPI.saveUpload(userData.id.toString(), result.upload_id);
        }

        setUploadProgress({ percentage: 100, stage: 'complete' });

        if (onUploadComplete) {
          onUploadComplete(result);
        }

        // Redirect to upload details page after a brief delay
        /*
        setTimeout(() => {
          router.push(`/upload/${result.upload_id}`);
        }, 7000);
        */
      }

    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setUploadProgress({ percentage: 0, stage: 'uploading' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFiles([]);
    setError('');
    setUploadResult(null);
    setBatchResult(null);
    setBatchStatus(null);
    setIsBatchMode(false);
    localStorage.removeItem("savedFiles");
    localStorage.removeItem("uploadProgress");
    localStorage.setItem("hidePanel", "false");
    setHidePanel(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("savedFiles");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedFiles(parsed);
        setHidePanel(true);
      } catch (e) {
        console.error("Ошибка парсинга savedFiles", e);
      }
    }
}, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalFileSize = () => {
    return selectedFiles.reduce((total, file) => total + file.size, 0);
  };

  // Remove the DICOM detection effect since we no longer need it

  const getStageDescription = () => {
    switch (uploadProgress.stage) {
      case 'uploading':
        return 'Uploading file to server...';
      case 'analyzing':
        return 'Running AI analysis...';
      case 'complete':
        return 'Analysis complete!';
      default:
        return '';
    }
  };
  useEffect(() => {
  const saved = localStorage.getItem("savedFiles");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      setSelectedFiles(parsed); 
      setHidePanel(true); 
    } catch (e) {
      console.error("Error parsing saved files", e);
    }
  }
}, []);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {(selectedFiles.length === 0 ) ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            borderColor: dragActive ? 'var(--primary)' : 'var(--border)',
            backgroundColor: dragActive ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent'
          }}
        >
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full" 
                 style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium" style={{ color: 'var(--text)' }}>
                Drop your medical images or folders here, or click to browse
              </p>
              <p className="text-sm text-muted mt-1">
                Supports DICOM (.dcm), JPEG, PNG • Max 10MB per file • Drag folders or select multiple files
              </p>
              <div className="mt-3 space-x-2">
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute('webkitdirectory');
                      fileInputRef.current.click();
                    }
                  }}
                  className="text-sm px-3 py-1 rounded border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  Select Files
                </button>
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.setAttribute('webkitdirectory', '');
                      fileInputRef.current.click();
                    }
                  }}
                  className="text-sm px-3 py-1 rounded border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  Select Folder
                </button>
              </div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".dcm,application/dicom,image/jpeg,image/jpg,image/png"
            onChange={handleFileInputChange}
            multiple
          />
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Selected Files {isBatchMode && `(${selectedFiles.length} files)`}
            </h3>
            <button
              onClick={handleRemoveFile}
              className="text-red-500 hover:text-red-700 p-1"
              title="Remove files"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {isBatchMode && hidePanel ? (
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" 
                     style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--primary)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Batch Upload Mode</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {selectedFiles.length} files • {formatFileSize(getTotalFileSize())} total
                  </p>
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-muted ml-2">{formatFileSize(file.size)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--primary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium" style={{ color: 'var(--text)' }}>{selectedFiles[0]?.name}</p>
                <p className="text-sm text-muted">{formatFileSize(selectedFiles[0]?.size || 0)}</p>
              </div>
            </div>
          )}

          {!isUploading &&(
            <button
              onClick={handleUpload}
              className="btn-primary w-full"
            >
              {isBatchMode ? `Upload and Analyze Batch (${selectedFiles.length} files)` : 'Upload and Analyze'}
            </button>
          )}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Processing Upload
              </h3>
              <span className="text-sm text-muted">
                {uploadProgress.percentage}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${uploadProgress.percentage}%`,
                  background: 'linear-gradient(135deg, var(--sci-blue) 0%, var(--sci-dark-blue) 100%)'
                }}
              />
            </div>
            
            <p className="text-sm text-muted">{getStageDescription()}</p>
          </div>
        </div>
      )}  

      {/* Analysis Progress */}
      {uploadProgress.stage === 'analyzing' && (
        <div className="card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                AI Analysis in Progress
              </h3>
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent" 
                     style={{ borderColor: 'var(--primary)' }}></div>
                <span className="text-sm text-muted">Processing...</span>
              </div>
            </div>
            
            <p className="text-sm text-muted">
              Our AI is analyzing the medical image. This may take a few minutes.
            </p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {(((uploadResult && uploadProgress.stage === 'complete') || (batchResult && batchStatus?.status === 'completed')) || hidePanel)  && (
        <div className="card border-green-200 dark:border-green-800">

          <div className="absolute top-2 right-2">
          <button
            type="button"
            onClick={() => {
              handleUpload;
              setHidePanel(true);
            }}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <svg
              className="w-4 h-4 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                  {batchResult ? 'Batch Analysis Complete!' : 'Analysis Complete!'}
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {batchResult ? `Batch ID: ${batchResult.batch_id}` : `Upload ID: ${uploadResult?.upload_id}`}
                </p>
              </div>
            </div>

            {uploadResult && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Diagnosis:</p>
                    <p className="text-green-700 dark:text-green-300">{uploadResult.diagnosis}</p>
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Confidence:</p>
                    <p className="text-green-700 dark:text-green-300">{uploadResult.confidence}%</p>
                  </div>
                </div>
              </div>
            )}

            {batchStatus && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Total Files:</p>
                    <p className="text-green-700 dark:text-green-300">{batchStatus.total_files}</p>
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Processed:</p>
                    <p className="text-green-700 dark:text-green-300">{batchStatus.processed_files}</p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-muted">
                <button
                onClick={() => router.push("/mockupui")}
                className="btn-primary w-full"
              >
                {'Redirect to the results page'}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="card border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Upload Error</h3>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
