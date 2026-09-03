import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config/api';

export interface MerchantUser {
  id: string;
  mobile: string;
  name: string;
  role: 'admin' | 'super_admin';
}

interface MerchantAuthContextType {
  token: string | null;
  user: MerchantUser | null;
  loading: boolean;
  sendOtp: (mobile: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (mobile: string, code: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const MerchantAuthContext = createContext<MerchantAuthContextType | undefined>(undefined);

export const MerchantAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<MerchantUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Check for persisted merchant session on launch
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('@merchant_token');
        if (savedToken) {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });
          const data = await res.json();
          if (res.ok && data.success && (data.user.role === 'admin' || data.user.role === 'super_admin')) {
            setToken(savedToken);
            setUser(data.user);
          } else {
            await AsyncStorage.removeItem('@merchant_token');
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Failed to load merchant session:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  // 2. Request OTP for merchant login
  const sendOtp = async (mobile: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, role: 'admin' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to send OTP' };
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error:
          'Cannot reach server. Ensure express-backend is running, phone and PC are on the same Wi‑Fi, and DEV_MACHINE_IP in merchant-app/src/config/api.ts matches your PC IP (ipconfig).',
      };
    }
  };

  // 3. Verify OTP & validate merchant authorization
  const verifyOtp = async (mobile: string, code: string, name?: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, code, name, role: 'admin' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Verification failed' };
      }

      // Check role authorization
      if (data.user.role !== 'admin' && data.user.role !== 'super_admin') {
        return {
          success: false,
          error: 'Access Restricted: This phone number is not registered as an authorized store partner. Please contact the platform admin.'
        };
      }

      await AsyncStorage.setItem('@merchant_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error:
          'Cannot reach server. Ensure express-backend is running and DEV_MACHINE_IP in merchant-app/src/config/api.ts matches your PC IP.',
      };
    }
  };

  // 4. Logout
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@merchant_token');
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('Error during merchant logout:', err);
    }
  };

  return (
    <MerchantAuthContext.Provider value={{ token, user, loading, sendOtp, verifyOtp, logout }}>
      {children}
    </MerchantAuthContext.Provider>
  );
};

export const useMerchantAuth = () => {
  const context = useContext(MerchantAuthContext);
  if (!context) {
    throw new Error('useMerchantAuth must be used within a MerchantAuthProvider');
  }
  return context;
};
