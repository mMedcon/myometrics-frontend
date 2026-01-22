/**
 * API utility for Clinical Trials database operations
 * Connects to Aiven PostgreSQL database
 */

export interface ClinicalTrial {
  id?: number;
  trial_id_source: string;
  public_title: string;
  scientific_title: string;
  primary_sponsor_id: number;
  recruitment_status_id: number;
  registration_date: string;
  target_size?: number;
}

export interface Company {
  id: number;
  name: string;
  country?: string;
}

export interface TrialCondition {
  id: number;
  name: string;
  description?: string;
}

export interface TrialPhase {
  id: number;
  phase: string;
  description: string;
}

export interface TrialCountry {
  id: number;
  country_code: string;
  country_name: string;
}

export interface RecruitmentStatus {
  id: number;
  status: string;
  description: string;
}

class ClinicalTrialsAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_MICROSERVICE_URL || 'http://localhost:8000';
  }

  // Clinical Trials CRUD Operations
  async createTrial(trial: Omit<ClinicalTrial, 'id'>): Promise<ClinicalTrial> {
    const response = await fetch(`${this.baseUrl}/clinical-trials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(trial),
    });

    if (!response.ok) {
      throw new Error(`Failed to create trial: ${response.statusText}`);
    }

    return response.json();
  }

  async getTrials(page = 1, limit = 20): Promise<{trials: ClinicalTrial[], total: number, page: number, limit: number}> {
    const response = await fetch(
      `${this.baseUrl}/clinical-trials?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch trials: ${response.statusText}`);
    }

    return response.json();
  }

  async getTrialById(id: number): Promise<ClinicalTrial> {
    const response = await fetch(`${this.baseUrl}/clinical-trials/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trial: ${response.statusText}`);
    }

    return response.json();
  }

  async updateTrial(id: number, trial: Partial<ClinicalTrial>): Promise<ClinicalTrial> {
    const response = await fetch(`${this.baseUrl}/clinical-trials/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(trial),
    });

    if (!response.ok) {
      throw new Error(`Failed to update trial: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteTrial(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/clinical-trials/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete trial: ${response.statusText}`);
    }
  }

  // Reference Data Methods
  async getCompanies(): Promise<Company[]> {
    const response = await fetch(`${this.baseUrl}/clinical-trials/companies`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch companies: ${response.statusText}`);
    }

    return response.json();
  }

  async createCompany(company: Omit<Company, 'id'>): Promise<Company> {
    const response = await fetch(`${this.baseUrl}/clinical-trials/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(company),
    });

    if (!response.ok) {
      throw new Error(`Failed to create company: ${response.statusText}`);
    }

    return response.json();
  }

  async getTrialConditions(): Promise<TrialCondition[]> {
    const response = await fetch(`${this.baseUrl}/clinical-trials/conditions`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch conditions: ${response.statusText}`);
    }

    return response.json();
  }

  async getTrialPhases(): Promise<TrialPhase[]> {
    const response = await fetch(`${this.baseUrl}/clinical-trials/phases`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch phases: ${response.statusText}`);
    }

    return response.json();
  }

  async getTrialCountries(): Promise<TrialCountry[]> {
    const response = await fetch(`${this.baseUrl}/clinical-trials/countries`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.statusText}`);
    }

    return response.json();
  }

  async getRecruitmentStatuses(): Promise<RecruitmentStatus[]> {
    const response = await fetch(`${this.baseUrl}/clinical-trials/recruitment-statuses`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recruitment statuses: ${response.statusText}`);
    }

    return response.json();
  }

  // Search and Filter Methods
  async searchTrials(query: string, filters?: {
    sponsor_id?: number;
    status_id?: number;
    phase_id?: number;
    country_id?: number;
  }): Promise<ClinicalTrial[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${this.baseUrl}/clinical-trials/search?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search trials: ${response.statusText}`);
    }

    return response.json();
  }

  // Helper method to get auth token
  private getAuthToken(): string {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.token || '';
      }
    }
    return '';
  }

  // Utility method to generate trial ID from source
  generateTrialIdSource(prefix = 'MYOMETRICS'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}

export const clinicalTrialsAPI = new ClinicalTrialsAPI();