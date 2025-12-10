import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authApi } from '../services/apiClient';
import { User } from '../types/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // getCurrentUser will trigger token refresh via interceptor if needed
        const response: any = await authApi.getCurrentUser();
        setUser(response.data);
      } catch (error: any) {
        // If we get here, either:
        // 1. Token refresh failed (refresh token expired/invalid)
        // 2. Network error
        // 3. User doesn't exist (unlikely)
        
        // Only clear auth if it's an auth-related error
        // Don't clear on network errors - user might still be authenticated
        const errorCode = error?.error?.code || error?.response?.data?.error?.code;
        if (errorCode === 'UNAUTHORIZED' || errorCode === 'REFRESH_ERROR' || errorCode === 'INVALID_TOKEN') {
          setUser(null);
          localStorage.removeItem('access_token');
        } else {
          // For other errors (network, etc.), keep the token but don't set user
          // This prevents redirect loops while allowing retry
          console.warn('Failed to get current user (non-auth error):', error);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);
  
  const login = async (username: string, password: string) => {
    const response: any = await authApi.login(username, password);
    setUser(response.data.user);
    localStorage.setItem('access_token', response.data.accessToken);
  };
  
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    localStorage.removeItem('access_token');
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};



