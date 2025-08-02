'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    clinicName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for development mode
const mockUser: User = {
  id: 1,
  email: 'demo@myometrics.com',
  firstName: 'Demo',
  lastName: 'User',
  role: 'admin', // Set as admin to access all features
  clinicName: 'Demo Clinic',
  dateJoined: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    // Check if user is already authenticated on mount
    const checkAuth = async () => {
      try {
        if (isDevMode) {
          // In development mode, auto-authenticate with mock user
          setUser(mockUser);
          setIsLoading(false);
          return;
        }

        if (authService.isAuthenticated()) {
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            // Verify with backend
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (!isDevMode) {
          authService.logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isDevMode]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (isDevMode) {
        // In development mode, accept any credentials
        setUser(mockUser);
        return;
      }

      const response = await authService.login({ email, password });
      setUser(response.user);
    } catch (error) {
      if (!isDevMode) {
        throw error;
      }
      // In dev mode, still authenticate even if backend fails
      setUser(mockUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    clinicName?: string;
  }) => {
    setIsLoading(true);
    try {
      if (isDevMode) {
        // In development mode, create a mock user with provided data
        const newMockUser = {
          ...mockUser,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          clinicName: userData.clinicName,
        };
        setUser(newMockUser);
        return;
      }

      const response = await authService.register(userData);
      setUser(response.user);
    } catch (error) {
      if (!isDevMode) {
        throw error;
      }
      // In dev mode, still authenticate even if backend fails
      const newMockUser = {
        ...mockUser,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        clinicName: userData.clinicName,
      };
      setUser(newMockUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (!isDevMode) {
        await authService.logout();
      }
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Always clear user state even if logout fails
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      if (isDevMode) {
        // In development mode, update the mock user
        const updatedUser = { ...user!, ...userData };
        setUser(updatedUser);
        return;
      }

      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
    } catch (error) {
      if (!isDevMode) {
        throw error;
      }
      // In dev mode, still update locally
      const updatedUser = { ...user!, ...userData };
      setUser(updatedUser);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
