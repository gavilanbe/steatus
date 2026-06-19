import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, usersApi } from '../lib/api';

interface User {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  contactCount?: number;
  pendingRequests?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { login: string; password: string }) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { displayName?: string; avatarUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('auth_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const loadUserProfile = async () => {
    try {
      const response = await usersApi.getProfile();
      setUser(response.user);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { login: string; password: string }) => {
    try {
      const response = await authApi.login(credentials);
      const { token: newToken, user: userData } = response;
      
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }) => {
    try {
      const response = await authApi.register(data);
      const { token: newToken, user: userData } = response;
      
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: { displayName?: string; avatarUrl?: string }) => {
    try {
      const response = await usersApi.updateProfile(data);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}