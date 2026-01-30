import { getSession } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function apiRequest(endpoint: string, options: any = {}) {
  const session = await getSession();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...((session as any)?.accessToken && {
        'Authorization': `Bearer ${(session as any).accessToken}`
      }),
      ...options.headers
    },
    ...options
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
}

// Sync user data to Auth0 metadata
export async function syncUserData(data: any, appName = 'myometrics') {
  return apiRequest('/api/auth0/sync/', {
    method: 'POST',
    body: JSON.stringify({
      data,
      app_name: appName
    })
  });
}

// Get user profile with Auth0 metadata
export async function getUserProfile() {
  return apiRequest('/api/auth0/profile/');
}

// Get shared data from other apps
export async function getSharedData() {
  return apiRequest('/api/auth0/shared/');
}

// Send data to another app's API
export async function sendDataToApp(targetAppUrl: string, data: any) {
  const session = await getSession();
  
  return fetch(`${targetAppUrl}/api/auth0/receive/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(session as any)?.accessToken}`
    },
    body: JSON.stringify({
      source_app: 'myometrics', // or 'mmedcon-finance'
      user_data: data
    })
  });
}