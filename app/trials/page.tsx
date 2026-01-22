'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { 
  clinicalTrialsAPI, 
  ClinicalTrial, 
  Company, 
  RecruitmentStatus 
} from '@/lib/api/clinicalTrials';

export default function TrialsPage() {
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [recruitmentStatuses, setRecruitmentStatuses] = useState<RecruitmentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Load trials from database
  useEffect(() => {
    const loadTrials = async () => {
      try {
        setLoading(true);
        const [trialsData, companiesData, statusesData] = await Promise.all([
          clinicalTrialsAPI.getTrials(currentPage, 20),
          clinicalTrialsAPI.getCompanies(),
          clinicalTrialsAPI.getRecruitmentStatuses(),
        ]);
        
        setTrials(trialsData.trials);
        setTotalPages(Math.ceil(trialsData.total / trialsData.limit));
        setCompanies(companiesData);
        setRecruitmentStatuses(statusesData);
      } catch (error) {
        console.error('Failed to load trials:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrials();
  }, [currentPage]);

  // Search functionality
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      return;
    }

    try {
      setLoading(true);
      const searchResults = await clinicalTrialsAPI.searchTrials(searchTerm);
      setTrials(searchResults);
      setTotalPages(1);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset search and reload all trials
  const handleClearSearch = async () => {
    setSearchTerm('');
    setCurrentPage(1);
    try {
      setLoading(true);
      const trialsData = await clinicalTrialsAPI.getTrials(1, 20);
      setTrials(trialsData.trials);
      setTotalPages(Math.ceil(trialsData.total / trialsData.limit));
    } catch (error) {
      console.error('Failed to reload trials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete trial
  const handleDeleteTrial = async (trialId: number) => {
    if (!confirm('Are you sure you want to delete this trial?')) {
      return;
    }

    try {
      await clinicalTrialsAPI.deleteTrial(trialId);
      setTrials(trials.filter(trial => trial.id !== trialId));
    } catch (error) {
      console.error('Failed to delete trial:', error);
      alert('Failed to delete trial. Please try again.');
    }
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Clinical Trials Database</h1>
            <p className="text-muted mt-1">Manage clinical trials stored in Aiven PostgreSQL</p>
          </div>
          
          {/* Search Section */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search trials..."
              className="px-3 py-2 border rounded-md"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search
            </button>
            {searchTerm && (
              <button 
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted">Loading clinical trials from database...</p>
          </div>
        ) : trials.length === 0 ? (
          <div className="card text-center py-12">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
              {searchTerm ? 'No results found' : 'No clinical trials'}
            </h2>
            <p className="text-muted">
              {searchTerm 
                ? `No trials match "${searchTerm}". Try different search terms.`
                : 'No clinical trials found in the database. Add new trials via the Upload page.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: 'var(--hover-background)' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Trial ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Registration Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Sponsor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Target Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {trials.map((trial) => {
                      const status = recruitmentStatuses.find(s => s.id === trial.recruitment_status_id);
                      const sponsor = companies.find(c => c.id === trial.primary_sponsor_id);
                      
                      return (
                        <tr key={trial.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{trial.public_title}</p>
                              <p className="text-xs text-muted truncate max-w-xs">{trial.scientific_title}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              status?.status === 'Recruiting' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              status?.status === 'Active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {status?.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>{trial.trial_id_source}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm" style={{ color: 'var(--text)' }}>
                              {trial.registration_date ? new Date(trial.registration_date).toLocaleDateString() : '-'}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-muted">{sponsor?.name || 'Unknown'}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm" style={{ color: 'var(--text)' }}>
                              {trial.target_size && trial.target_size > 0 ? trial.target_size.toLocaleString() : '-'}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button 
                              onClick={() => trial.id && handleDeleteTrial(trial.id)} 
                              className="text-sm text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                
                <span className="text-sm text-muted">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Navigation>
  );
}
