'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';

interface Trial {
  id: string;
  title: string;
  description: string;
  status: 'recruiting' | 'active' | 'completed';
  startDate?: string;
  phase?: string;
  sponsor?: string;
}

export default function TrialsPage() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('clinicalTrials');
      if (raw) setTrials(JSON.parse(raw));
    } catch (err) {
      console.warn('Failed to load trials from localStorage', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDelete = (id: string) => {
    const updated = trials.filter(t => t.id !== id);
    setTrials(updated);
    try { localStorage.setItem('clinicalTrials', JSON.stringify(updated)); } catch (err) { console.warn(err); }
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Clinical Trials</h1>
            <p className="text-muted mt-1">List of clinical trials added via the Upload page</p>
          </div>
        </div>

        {isLoading ? (
          <div className="card text-center py-12">
            <p className="text-muted">Loading clinical trials...</p>
          </div>
        ) : trials.length === 0 ? (
          <div className="card text-center py-12">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>No clinical trials</h2>
            <p className="text-muted">You have not added any clinical trials yet. Use the Upload page to add new entries.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--hover-background)' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Phase</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Sponsor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {trials.map(t => (
                    <tr key={t.id} className="transition-colors" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{t.title}</p>
                          <p className="text-xs text-muted font-mono">{t.id.slice(0,8)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          t.status === 'recruiting' ? 'bg-green-100 text-green-800' :
                          t.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm" style={{ color: 'var(--text)' }}>{t.phase || '-'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm" style={{ color: 'var(--text)' }}>{t.startDate || '-'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-muted">{t.sponsor || '-'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleDelete(t.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
}
