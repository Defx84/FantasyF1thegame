import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

interface User {
  id: string;
  username: string;
  email: string;
  isAppAdmin?: boolean; // Add optional isAppAdmin property
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (username: string, email: string, password: string, termsAccepted: boolean) => Promise<{ success: boolean; message: string }>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false); // Prevent multiple session checks

  const getToken = () => {
    // For httpOnly cookies, we can't access them from JavaScript
    // The token will be automatically sent with requests
    return null;
  };

  useEffect(() => {
    // Check for existing session only once
    if (sessionChecked) return;
    
    const checkSession = async () => {
      try {
        setSessionChecked(true); // Mark as checked to prevent loops
        const response = await api.get('/api/auth/me');
        if (response.status === 200) {
          const userData = response.data;
          setUser(userData.user);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        // Don't redirect or refresh - just log the error
        // This prevents infinite loops
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [sessionChecked]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', {
      email,
      password
    });

    if (response.status !== 200) {
      throw new Error('Login failed');
    }

    const data = response.data;
    
    // Store token in localStorage for cross-domain compatibility
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    
    setUser(data.user);
  };

  const logout = async () => {
    try {
      const response = await api.post('/api/auth/logout');
      if (response.status !== 200) {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear user state and localStorage token
      setUser(null);
      localStorage.removeItem('accessToken');
      
      // Redirect to welcome page
      window.location.href = '/';
    }
  };

  const signup = async (username: string, email: string, password: string, termsAccepted: boolean) => {
    const response = await api.post('/api/auth/register', {
      username,
      email,
      password,
      termsAccepted
    });

    if (response.status !== 201) {
      const errorData = response.data;
      throw new Error(errorData.error || 'Signup failed');
    }

    return {
      success: true,
      message: 'Account created successfully! Please log in.'
    };
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 