'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { syncUserData, getSharedData } from '@/lib/api/auth0';

export default function DataSync() {
  const { data: session } = useSession();
  const [sharedData, setSharedData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSyncData = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      // Example: sync current app data
      const dataToSync = {
        preferences: { theme: 'dark', language: 'ru' },
        profile: { completed: true },
        lastActivity: new Date().toISOString()
      };
      
      await syncUserData(dataToSync, 'myometrics');
      alert('Данные синхронизированы!');
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Ошибка синхронизации');
    } finally {
      setLoading(false);
    }
  };

  const handleGetSharedData = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      const data = await getSharedData();
      setSharedData(data);
    } catch (error) {
      console.error('Failed to get shared data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <p>Требуется авторизация</p>;
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Синхронизация данных между приложениями</h3>
      
      <div className="space-y-4">
        <button 
          onClick={handleSyncData}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Синхронизируем...' : 'Синхронизировать данные'}
        </button>
        
        <button 
          onClick={handleGetSharedData}
          disabled={loading}
          className="btn btn-outline"
        >
          Получить данные из других приложений
        </button>
        
        {sharedData && (
          <div className="mt-6">
            <h4 className="text-md font-medium mb-2">Данные из других приложений:</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
              {JSON.stringify(sharedData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}