'use client';

import React, { useState, useEffect } from 'react';
import { imageCache } from '@/lib/cache/imageCache';

interface CacheStats {
  count: number;
  size: string;
  maxAge: string;
}

export default function ImageCacheManager() {
  const [cacheStats, setCacheStats] = useState<CacheStats>({ count: 0, size: '0 MB', maxAge: '7 days' });
  const [showManager, setShowManager] = useState(false);

  const updateStats = () => {
    const stats = imageCache.getCacheStats();
    setCacheStats(stats);
  };

  useEffect(() => {
    updateStats();
  }, []);

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear all cached images? This will free up storage space but images will need to be reloaded from the server.')) {
      imageCache.clearCache();
      updateStats();
      alert('Image cache cleared successfully!');
    }
  };

  if (!showManager) {
    return (
      <button
        onClick={() => setShowManager(true)}
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        title={`${cacheStats.count} images cached (${cacheStats.size})`}
      >
        📦 Cache ({cacheStats.count})
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Image Cache</h3>
        <button
          onClick={() => setShowManager(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Cached Images:</span>
          <span className="font-medium text-gray-900 dark:text-white">{cacheStats.count}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Storage Used:</span>
          <span className="font-medium text-gray-900 dark:text-white">{cacheStats.size}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Max Age:</span>
          <span className="font-medium text-gray-900 dark:text-white">{cacheStats.maxAge}</span>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <button
          onClick={updateStats}
          className="w-full px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700 transition-colors"
        >
          Refresh Stats
        </button>
        
        <button
          onClick={handleClearCache}
          className="w-full px-3 py-2 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-700 transition-colors"
        >
          Clear Cache
        </button>
      </div>
      
      <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
        <p>🗂️ Images are cached locally for faster loading</p>
        <p>🕒 Cache expires automatically after {cacheStats.maxAge}</p>
        <p>💾 Cache is cleared if storage gets full</p>
      </div>
    </div>
  );
}