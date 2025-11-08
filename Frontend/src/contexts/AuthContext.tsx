import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginRequest, RegisterRequest, ApiResponse, LoginResponse, RegisterResponse } from '@/types';
import { login as apiLogin, signup as apiSignup } from '@/lib/api';

const findTokenAndUserInResponse = (data: unknown): { token: string | null; user: User | null } => {
  let token: string | null = null;
  let user: User | null = null;
  
  const search = (obj: unknown, path: string = ''): void => {
    if (token && user) return;
    
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const value = (obj as Record<string, unknown>)[key];
        const currentPath = path ? `${path}.${key}` : key;
        
        if (key.toLowerCase().includes('token') && typeof value === 'string' && value.length > 20) {
          token = value;
        }
        
        if (key.toLowerCase().includes('user') && typeof value === 'object' && value !== null && 'id' in value && 'email' in value) {
          user = value as User;
        }
        
        if (!token && typeof value === 'string' && value.length > 50 && value.split('.').length === 3) {
          token = value;
        }
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          search(value, currentPath);
        }
        
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              search(item, `${currentPath}[${index}]`);
            }
          });
        }
      });
    }
  };
  
  search(data);
  
  if (!token && typeof data === 'string' && data.length > 50 && data.split('.').length === 3) {
    token = data;
  }
  
  return { token, user };
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<ApiResponse<LoginResponse>>;
  signup: (userData: RegisterRequest) => Promise<ApiResponse<RegisterResponse>>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => ({ success: false, error: 'AuthContext not initialized' }),
  signup: async () => ({ success: false, error: 'AuthContext not initialized' }),
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const validateToken = useCallback((token: string): boolean => {
    if (!token || token === 'undefined') return false;
    
    if (token.length === 0) return false;
    
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    if (parts.some(part => part.length === 0)) return false;
    
    return true;
  }, []);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser && storedToken !== 'undefined' && storedUser !== 'undefined') {
          const isTokenValid = validateToken(storedToken);
          
          if (isTokenValid) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else if (storedToken && storedToken !== 'undefined') {
          const isTokenValid = validateToken(storedToken);
          if (isTokenValid) {
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
          }
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [validateToken]);

  const login = useCallback(async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiLogin(credentials);
      
      if (response.success && response.data) {
        const { token, user } = findTokenAndUserInResponse(response.data);
        
        if (token && token.length > 0 && token !== 'undefined') {
          setUser(user || null);
          setToken(token);
          setIsAuthenticated(true);
          
          localStorage.setItem('token', token);
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
          }
        } else {
          const errorMsg = 'Invalid token received from server';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } else {
        const errorMsg = response.error || 'Login failed';
        setError(errorMsg);
      }
      
      return response;
    } catch {
      const errorMessage = 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiSignup(userData);
      
      if (response.success && response.data) {
        const { token, user } = findTokenAndUserInResponse(response.data);
        
        if (token && token.length > 0 && token !== 'undefined') {
          setUser(user || null);
          setToken(token);
          setIsAuthenticated(true);
          
          localStorage.setItem('token', token);
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
          }
        } else {
          const errorMsg = 'Invalid token received from server';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } else {
        const errorMsg = response.error || 'Signup failed';
        setError(errorMsg);
      }
      
      return response;
    } catch {
      const errorMessage = 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setError(null);

    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {
      console.warn('Failed to clear localStorage:');
    }
  }, []);

  useEffect(() => {
    const handleUnauthorized = (event: CustomEvent) => {
      if (event.detail.status === 401) {
        logout();
      }
    };

    window.addEventListener('unauthorized', handleUnauthorized as EventListener);
    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized as EventListener);
    };
  }, [logout]);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
  }), [user, token, isAuthenticated, isLoading, error, login, signup, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;