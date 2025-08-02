// Django backend API service for user management and audit logs
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// Mock data for development mode
const mockUserActivity: UserActivity = {
  uploads_today: 5,
  uploads_this_week: 23,
  uploads_this_month: 87,
  last_login: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  recent_uploads: [
    {
      id: 'upload_001',
      filename: 'cardiac_scan_001.jpg',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'completed'
    },
    {
      id: 'upload_002',
      filename: 'cardiac_scan_002.jpg',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'completed'
    },
    {
      id: 'upload_003',
      filename: 'cardiac_scan_003.jpg',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      status: 'processing'
    }
  ]
};

const mockAnalyticsData: AnalyticsData = {
  user_activity: {
    daily_uploads: [
      { date: '2025-08-01', count: 23 },
      { date: '2025-08-02', count: 19 },
      { date: '2025-08-03', count: 31 },
      { date: '2025-08-04', count: 28 },
      { date: '2025-08-05', count: 25 },
      { date: '2025-08-06', count: 33 },
      { date: '2025-08-07', count: 29 },
    ],
    weekly_uploads: [
      { week: 'Week 1', count: 156 },
      { week: 'Week 2', count: 198 },
      { week: 'Week 3', count: 174 },
      { week: 'Week 4', count: 211 },
    ],
    monthly_uploads: [
      { month: 'June', count: 687 },
      { month: 'July', count: 739 },
      { month: 'August', count: 523 },
    ]
  },
  diagnosis_trends: [
    { diagnosis: 'Normal', count: 523, trend: 'up', percentage_change: 12.3 },
    { diagnosis: 'Myocardial Infarction', count: 312, trend: 'down', percentage_change: -5.7 },
    { diagnosis: 'Arrhythmia', count: 187, trend: 'stable', percentage_change: 1.2 },
    { diagnosis: 'Cardiomyopathy', count: 124, trend: 'up', percentage_change: 8.9 },
  ],
  system_health: {
    active_users: 1247,
    total_uploads: 12847,
    success_rate: 94.3,
    average_processing_time: 1.7
  }
};

const mockNotificationSettings: NotificationSettings = {
  email_notifications: true,
  upload_completed: true,
  analysis_ready: true,
  system_alerts: false,
};

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  resource_type: string;
  resource_id: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  details: Record<string, any>;
}

export interface UserActivity {
  uploads_today: number;
  uploads_this_week: number;
  uploads_this_month: number;
  last_login: string;
  recent_uploads: Array<{
    id: string;
    filename: string;
    timestamp: string;
    status: string;
  }>;
}

export interface AnalyticsData {
  user_activity: {
    daily_uploads: Array<{
      date: string;
      count: number;
    }>;
    weekly_uploads: Array<{
      week: string;
      count: number;
    }>;
    monthly_uploads: Array<{
      month: string;
      count: number;
    }>;
  };
  diagnosis_trends: Array<{
    diagnosis: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
    percentage_change: number;
  }>;
  system_health: {
    active_users: number;
    total_uploads: number;
    success_rate: number;
    average_processing_time: number;
  };
}

export interface NotificationSettings {
  email_notifications: boolean;
  upload_completed: boolean;
  analysis_ready: boolean;
  system_alerts: boolean;
}

class DjangoAPI {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getUserActivity(userId?: number): Promise<UserActivity> {
    if (isDevMode) {
      return Promise.resolve(mockUserActivity);
    }

    const endpoint = userId ? `/users/${userId}/activity/` : '/users/me/activity/';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch user activity');
    }

    return response.json();
  }

  async getAnalytics(): Promise<AnalyticsData> {
    if (isDevMode) {
      return Promise.resolve(mockAnalyticsData);
    }

    const response = await fetch(`${API_BASE_URL}/analytics/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch analytics data');
    }

    return response.json();
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    if (isDevMode) {
      return Promise.resolve(mockNotificationSettings);
    }

    const response = await fetch(`${API_BASE_URL}/users/me/notifications/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch notification settings');
    }

    return response.json();
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    if (isDevMode) {
      // Update mock settings and return
      Object.assign(mockNotificationSettings, settings);
      return Promise.resolve(mockNotificationSettings);
    }

    const response = await fetch(`${API_BASE_URL}/users/me/notifications/`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update notification settings');
    }

    return response.json();
  }

  async logAction(action: string, resourceType: string, resourceId: string, details?: Record<string, any>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/audit-logs/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
      }),
    });

    if (!response.ok) {
      console.error('Failed to log action:', action);
    }
  }

  async exportData(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/users/me/export/?format=${format}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to export data');
    }

    return response.blob();
  }

  async deleteAccount(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/me/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete account');
    }
  }

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    services: Record<string, 'up' | 'down'>;
    last_check: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/health/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.json();
  }
}

export const djangoAPI = new DjangoAPI();
