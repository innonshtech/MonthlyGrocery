import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config/api';

export interface User {
  id: string;
  mobile: string;
  name: string;
  role: 'consumer' | 'admin' | 'super_admin';
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  city: string | null;
  area: string | null;
  setCityAndArea: (city: string | null, area: string | null) => Promise<void>;
  sendOtp: (mobile: string, role: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (mobile: string, code: string, name?: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [city, setCityState] = useState<string | null>(null);
  const [area, setAreaState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Check for persisted session and location on launch
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('@auth_token');
        const savedCity = await AsyncStorage.getItem('@user_city');
        const savedArea = await AsyncStorage.getItem('@user_area');
        
        if (savedCity) setCityState(savedCity);
        if (savedArea) setAreaState(savedArea);

        if (savedToken) {
          // Verify token and fetch profile
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setToken(savedToken);
            setUser(data.user);
          } else {
            // Token expired or invalid -> clear
            await AsyncStorage.removeItem('@auth_token');
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  // 2. Request OTP
  const sendOtp = async (mobile: string, role: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to send OTP' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  // 3. Verify OTP and login
  const verifyOtp = async (mobile: string, code: string, name?: string, role?: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, code, name, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Verification failed' };
      }

      // Save token in memory and local storage
      await AsyncStorage.setItem('@auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  // 4. Set Location
  const setCityAndArea = async (newCity: string | null, newArea: string | null) => {
    try {
      if (newCity) {
        await AsyncStorage.setItem('@user_city', newCity);
      } else {
        await AsyncStorage.removeItem('@user_city');
      }
      if (newArea) {
        await AsyncStorage.setItem('@user_area', newArea);
      } else {
        await AsyncStorage.removeItem('@user_area');
      }
      setCityState(newCity);
      setAreaState(newArea);
    } catch (err) {
      console.error('Failed to save location details:', err);
    }
  };

  // 5. Logout
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@auth_token');
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, city, area, setCityAndArea, sendOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
