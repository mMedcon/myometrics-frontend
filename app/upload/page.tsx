'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import UploadWorkflow from '@/components/UploadWorkflow';
import ServiceStatusChecker from '@/components/ServiceStatusChecker';
import { 
  clinicalTrialsAPI, 
  ClinicalTrial, 
  Company, 
  RecruitmentStatus, 
  TrialPhase 
} from '@/lib/api/clinicalTrials';

export default function UploadPage() {
  const [selectedDetection, setSelectedDetection] = useState<'dmd' | 'tumor' | 'filler' | null>(null);
  const [error, setError] = useState('');
   const [imageType, setImageType] = useState<"MS" | "DMD" | "FILLER" | "">("");
  const [activeTab, setActiveTab] = useState<'upload' | 'resources' | 'trials'>('upload');
  
  // Clinical trials state
  const [clinicalTrials, setClinicalTrials] = useState<ClinicalTrial[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [recruitmentStatuses, setRecruitmentStatuses] = useState<RecruitmentStatus[]>([]);
  const [trialPhases, setTrialPhases] = useState<TrialPhase[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [trialForm, setTrialForm] = useState({
    trial_id_source: '',
    public_title: '',
    scientific_title: '',
    primary_sponsor_id: 0,
    recruitment_status_id: 1,
    registration_date: new Date().toISOString().split('T')[0],
    target_size: 0,
  });

    // Function to validate detection type selection
  const handleUploadAttempt = () => {
    if (!selectedDetection) {
      setError('Please select a detection type before proceeding with upload and analysis.');
      return;
    }
    // Clear error if validation passes
    setError('');
  };

  // Clear error when user makes a selection
  const handleDetectionSelection = (type: 'dmd' | 'tumor' | 'filler') => {
    setSelectedDetection(type);
    if (type === 'dmd') {
      setImageType('DMD');
    } else if (type === 'tumor') {
      setImageType('MS');
    } else if (type === 'filler') {
      setImageType('FILLER');
    }
    setError('');
  };

  // Handle clinical trial form submission
  const handleAddTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialForm.public_title.trim() || !trialForm.scientific_title.trim()) {
      return;
    }
    
    setLoading(true);
    try {
      // Generate trial ID if not provided
      if (!trialForm.trial_id_source.trim()) {
        trialForm.trial_id_source = clinicalTrialsAPI.generateTrialIdSource();
      }

      // Create trial in database
      const newTrial = await clinicalTrialsAPI.createTrial(trialForm);
      
      // Update local state
      setClinicalTrials(prev => [newTrial, ...prev]);
      
      // Reset form
      setTrialForm({
        trial_id_source: '',
        public_title: '',
        scientific_title: '',
        primary_sponsor_id: companies[0]?.id || 1,
        recruitment_status_id: 1,
        registration_date: new Date().toISOString().split('T')[0],
        target_size: 0,
      });
      
      console.log('Clinical trial added successfully:', newTrial);
    } catch (error) {
      console.error('Failed to add clinical trial:', error);
      // TODO: Show user-friendly error message
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load all reference data in parallel
        const [trialsData, companiesData, statusesData, phasesData] = await Promise.all([
          clinicalTrialsAPI.getTrials(1, 50),
          clinicalTrialsAPI.getCompanies(),
          clinicalTrialsAPI.getRecruitmentStatuses(),
          clinicalTrialsAPI.getTrialPhases(),
        ]);
        
        setClinicalTrials(trialsData.trials);
        setCompanies(companiesData);
        setRecruitmentStatuses(statusesData);
        setTrialPhases(phasesData);
        
        // Set default values for form
        if (companiesData.length > 0) {
          setTrialForm(prev => ({ ...prev, primary_sponsor_id: companiesData[0].id }));
        }
        
      } catch (error) {
        console.error('Failed to load clinical trials data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'trials') {
      loadInitialData();
    }
  }, [activeTab]);

  return (
    <Navigation>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Backend Services Status */}
        <ServiceStatusChecker />
        
        {/* Tabs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1 rounded-md ${activeTab === 'upload' ? 'bg-sci-blue text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Upload
          </button>
          <a
            href="https://mmedcon-finance-fveerhawl-mmedcon-techs-projects.vercel.app/clinical-trials"
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-sci-blue hover:text-white`}
          >
            Resources
          </a>
          <button
            onClick={() => setActiveTab('trials')}
            className={`px-3 py-1 rounded-md ${activeTab === 'trials' ? 'bg-sci-blue text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Clinical Trials
          </button>
        </div>

        

        {activeTab === 'upload' ? (
          <>
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            Upload Medical Image
          </h1>
          <p className="text-muted mt-2">
            Upload a medical image for AI-powered analysis and diagnosis
          </p>
        </div>

         {/* Detection Type Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Select Detection Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedDetection === 'dmd' 
                  ? 'border-sci-blue bg-sci-blue bg-opacity-10' 
                  : 'border-gray-300 hover:border-sci-blue'
              }`}
              onClick={() => handleDetectionSelection('dmd')}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="detection"
                  value="dmd"
                  checked={selectedDetection === 'dmd'}
                  onChange={() => handleDetectionSelection('dmd')}
                  className="text-sci-blue"
                />
                <div>
                  <h3 className="font-medium" style={{ color: 'var(--text)' }}>DMD Detection</h3>
                  <p className="text-sm text-muted">
                    Duchenne Muscular Dystrophy analysis using MRI scans
                  </p>
                </div>
              </div>
            </div>
            
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedDetection === 'tumor' 
                  ? 'border-sci-blue bg-sci-blue bg-opacity-10' 
                  : 'border-gray-300 hover:border-sci-blue'
              }`}
              onClick={() => handleDetectionSelection('tumor')}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="detection"
                  value="tumor"
                  checked={selectedDetection === 'tumor'}
                  onChange={() => handleDetectionSelection('tumor')}
                  className="text-sci-blue"
                />
                <div>
                  <h3 className="font-medium" style={{ color: 'var(--text)' }}>MS</h3>
                  <p className="text-sm text-muted">
                    Brain tumor identification and classification
                  </p>
                </div>
              </div>
            </div>
            
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedDetection === 'filler' 
                  ? 'border-sci-blue bg-sci-blue bg-opacity-10' 
                  : 'border-gray-300 hover:border-sci-blue'
              }`}
              onClick={() => handleDetectionSelection('filler')}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="detection"
                  value="filler"
                  checked={selectedDetection === 'filler'}
                  onChange={() => handleDetectionSelection('filler')}
                  className="text-sci-blue"
                />
                <div>
                  <h3 className="font-medium" style={{ color: 'var(--text)' }}>Filler Localisation</h3>
                  <p className="text-sm text-muted">
                    Dermal filler detection and localization analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Selection Required</h3>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}
        {/* Guidelines */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Upload Guidelines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2" style={{ color: 'var(--text)' }}>Supported Formats</h3>
              <ul className="text-muted space-y-1">
                <li>• JPEG (.jpg, .jpeg)</li>
                <li>• PNG (.png)</li>
                <li>• DICOM (.dcm)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2" style={{ color: 'var(--text)' }}>Requirements</h3>
              <ul className="text-muted space-y-1">
                <li>• Maximum file size: 10MB</li>
                <li>• High resolution preferred</li>
                <li>• Clear, well-lit images</li>
                <li>• Clinical review required</li>
              </ul>
            </div>
          </div>
        </div>

  {/* Clinical Workflow Notice */}
  <div className="card" style={{ borderColor: 'var(--sci-blue)', backgroundColor: 'color-mix(in srgb, var(--sci-blue) 5%, transparent)' }}>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 mt-0.5 flex-shrink-0">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--sci-blue)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium mb-1" style={{ color: 'var(--sci-blue)' }}>Clinical Review Process</h3>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                All uploaded images undergo automatic anonymization and require clinical review before AI analysis. 
                This ensures patient privacy and clinical oversight of the diagnostic process.
              </p>
              {/* Prominent link button (always visible) */}
        <div className="mt-3">
          <a
            href="https://mmedcon-finance-fveerhawl-mmedcon-techs-projects.vercel.app/clinical-trials"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 rounded-md bg-sci-blue text-white font-medium hover:opacity-90"
          >
            Go to Clinical Trials
          </a>
        </div>
              <p className="text-sm mt-2">
                <a
                  href="https://mmedcon-finance-fveerhawl-mmedcon-techs-projects.vercel.app/clinical-trials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sci-blue underline"
                >
                </a>
              </p>
            </div>
          </div>
        </div>
          {/* Upload Workflow Component - Only show when detection type is selected */}
          {selectedDetection && (
            <UploadWorkflow 
              detectionType={selectedDetection as 'dmd' | 'tumor'} 
              imageType={imageType}
              onUploadAttempt={handleUploadAttempt}
            />
          )}
          </>
        ) : activeTab === 'resources' ? (
          <div className="card">
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Resources</h2>
            <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>
              Useful links and materials about clinical research and the review process are collected here.
            </p>
            <a
              href="https://mmedcon-finance-fveerhawl-mmedcon-techs-projects.vercel.app/clinical-trials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sci-blue underline"
            >
              Learn more about clinical research
            </a>
            <div className="mt-4 text-sm text-muted">
              <p>Placeholder for future resources: guides, documentation links, and more.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Clinical Trials Management */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                Add Clinical Trial
              </h2>
              
              <form onSubmit={handleAddTrial} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Trial ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={trialForm.trial_id_source}
                    onChange={(e) => setTrialForm({...trialForm, trial_id_source: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Auto-generated if left empty"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for auto-generation</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Public Title *
                  </label>
                  <input
                    type="text"
                    value={trialForm.public_title}
                    onChange={(e) => setTrialForm({...trialForm, public_title: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter public trial title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Scientific Title *
                  </label>
                  <textarea
                    value={trialForm.scientific_title}
                    onChange={(e) => setTrialForm({...trialForm, scientific_title: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md h-20 resize-vertical"
                    placeholder="Detailed scientific title of the trial"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                      Primary Sponsor
                    </label>
                    <select
                      value={trialForm.primary_sponsor_id}
                      onChange={(e) => setTrialForm({...trialForm, primary_sponsor_id: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                      Recruitment Status
                    </label>
                    <select
                      value={trialForm.recruitment_status_id}
                      onChange={(e) => setTrialForm({...trialForm, recruitment_status_id: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      {recruitmentStatuses.map(status => (
                        <option key={status.id} value={status.id}>
                          {status.status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                      Registration Date
                    </label>
                    <input
                      type="date"
                      value={trialForm.registration_date}
                      onChange={(e) => setTrialForm({...trialForm, registration_date: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                      Target Size (Participants)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={trialForm.target_size}
                      onChange={(e) => setTrialForm({...trialForm, target_size: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Expected number of participants"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-sci-blue text-white rounded-md font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Clinical Trial'}
                </button>
              </form>
            </div>
            
            {/* Clinical Trials List */}
            {clinicalTrials.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                  Clinical Trials ({clinicalTrials.length})
                </h3>
                
                <div className="space-y-3">
                  {clinicalTrials.map((trial) => {
                    const status = recruitmentStatuses.find(s => s.id === trial.recruitment_status_id);
                    const sponsor = companies.find(c => c.id === trial.primary_sponsor_id);
                    
                    return (
                      <div key={trial.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium" style={{ color: 'var(--text)' }}>{trial.public_title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status?.status === 'Recruiting' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            status?.status === 'Active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {status?.status || 'Unknown'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted mb-2">{trial.scientific_title}</p>
                        
                        <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <span>ID: {trial.trial_id_source}</span>
                          {trial.registration_date && <span>Registered: {new Date(trial.registration_date).toLocaleDateString()}</span>}
                          {trial.target_size && trial.target_size > 0 && <span>Target Size: {trial.target_size}</span>}
                          {sponsor && <span>Sponsor: {sponsor.name}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </Navigation>
  );
}
