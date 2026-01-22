/**
 * Image caching utility for storing uploaded images in localStorage/IndexedDB
 */

interface CachedImage {
  id: string;
  dataUrl: string;
  filename: string;
  timestamp: number;
  size: number;
}

class ImageCache {
  private static instance: ImageCache;
  private cache: Map<string, CachedImage> = new Map();
  private readonly CACHE_KEY = 'myometrics_image_cache';
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB max cache size
  private readonly MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  private constructor() {
    this.loadCacheFromStorage();
  }

  public static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }

  /**
   * Load cache from localStorage
   */
  private loadCacheFromStorage(): void {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const data: CachedImage[] = JSON.parse(cached);
        data.forEach(item => {
          // Check if image is not expired
          if (Date.now() - item.timestamp < this.MAX_CACHE_AGE) {
            this.cache.set(item.id, item);
          }
        });
        this.cleanupExpiredEntries();
      }
    } catch (error) {
      console.warn('Failed to load image cache from localStorage:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const cacheArray = Array.from(this.cache.values());
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheArray));
    } catch (error) {
      console.warn('Failed to save image cache to localStorage:', error);
      // If localStorage is full, try to clear some space
      this.clearOldestEntries(5);
      try {
        const cacheArray = Array.from(this.cache.values());
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheArray));
      } catch (retryError) {
        console.error('Failed to save image cache after cleanup:', retryError);
      }
    }
  }

  /**
   * Convert File to data URL
   */
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Cache an uploaded image
   */
  public async cacheImage(uploadId: string, file: File): Promise<void> {
    try {
      const dataUrl = await this.fileToDataUrl(file);
      const cachedImage: CachedImage = {
        id: uploadId,
        dataUrl,
        filename: file.name,
        timestamp: Date.now(),
        size: dataUrl.length
      };

      // Check if adding this image would exceed cache size limit
      const currentSize = this.getCurrentCacheSize();
      if (currentSize + cachedImage.size > this.MAX_CACHE_SIZE) {
        this.clearOldestEntries(Math.ceil(this.cache.size / 4)); // Clear 25% of cache
      }

      this.cache.set(uploadId, cachedImage);
      this.saveCacheToStorage();
      
      console.log(`Image cached for upload ${uploadId}: ${file.name}`);
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  }

  /**
   * Get cached image by upload ID
   */
  public getCachedImage(uploadId: string): string | null {
    const cached = this.cache.get(uploadId);
    if (cached) {
      // Check if image is not expired
      if (Date.now() - cached.timestamp < this.MAX_CACHE_AGE) {
        console.log(`Using cached image for upload ${uploadId}: ${cached.filename}`);
        return cached.dataUrl;
      } else {
        // Remove expired image
        this.cache.delete(uploadId);
        this.saveCacheToStorage();
      }
    }
    return null;
  }

  /**
   * Check if image is cached
   */
  public isImageCached(uploadId: string): boolean {
    return this.getCachedImage(uploadId) !== null;
  }

  /**
   * Remove specific image from cache
   */
  public removeFromCache(uploadId: string): void {
    if (this.cache.delete(uploadId)) {
      this.saveCacheToStorage();
      console.log(`Removed cached image for upload ${uploadId}`);
    }
  }

  /**
   * Clear all cached images
   */
  public clearCache(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.CACHE_KEY);
    }
    console.log('Image cache cleared');
  }

  /**
   * Get current cache size in bytes
   */
  private getCurrentCacheSize(): number {
    return Array.from(this.cache.values()).reduce((total, item) => total + item.size, 0);
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { count: number; size: string; maxAge: string } {
    const count = this.cache.size;
    const sizeBytes = this.getCurrentCacheSize();
    const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
    const maxAgeDays = (this.MAX_CACHE_AGE / (24 * 60 * 60 * 1000)).toString();
    
    return {
      count,
      size: `${sizeMB} MB`,
      maxAge: `${maxAgeDays} days`
    };
  }

  /**
   * Remove expired entries from cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [id, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.MAX_CACHE_AGE) {
        this.cache.delete(id);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.saveCacheToStorage();
      console.log(`Cleaned up ${removedCount} expired cached images`);
    }
  }

  /**
   * Remove oldest entries to free up space
   */
  private clearOldestEntries(count: number): void {
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );
    
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.cache.delete(entries[i][0]);
    }
    
    console.log(`Cleared ${Math.min(count, entries.length)} oldest cached images`);
  }
}

export const imageCache = ImageCache.getInstance();