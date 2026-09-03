import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config/api';
import { normalizePincode } from '../utils/locationParams';
import { fetchAreasForCity } from '../services/areasApi';

export interface User {
  id: string;
  mobile: string;
  name: string;
  role: 'consumer' | 'admin' | 'super_admin';
  email?: string;
  avatar_url?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  city: string | null;
  area: string | null;
  pincode: string | null;
  setCityAndArea: (
    city: string | null,
    area: string | null,
    pincode?: string | null,
  ) => Promise<void>;
  sendOtp: (mobile: string, role: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (mobile: string, code: string, name?: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (updatedFields: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [city, setCityState] = useState<string | null>(null);
  const [area, setAreaState] = useState<string | null>(null);
  const [pincode, setPincodeState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('@auth_token');
        const savedCity = await AsyncStorage.getItem('@user_city');
        const savedArea = await AsyncStorage.getItem('@user_area');
        const savedPincode = await AsyncStorage.getItem('@user_pincode');

        if (savedCity) setCityState(savedCity);
        if (savedArea) setAreaState(savedArea);
        if (savedPincode) {
          setPincodeState(savedPincode);
        } else if (savedCity && savedArea) {
          const list = await fetchAreasForCity(savedCity);
          const match = list.find(
            (a) => a.name.trim().toLowerCase() === savedArea.trim().toLowerCase(),
          );
          if (match?.pincode) {
            setPincodeState(match.pincode);
            await AsyncStorage.setItem('@user_pincode', match.pincode);
          }
        }

        if (savedToken) {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setToken(savedToken);
            setUser(data.user);
          } else {
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
    } catch {
      return {
        success: false,
        error:
          'Cannot reach server. Start the backend and run: adb reverse tcp:8001 tcp:8001',
      };
    }
  };

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

      await AsyncStorage.setItem('@auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch {
      return {
        success: false,
        error:
          'Cannot reach server. Start the backend and run: adb reverse tcp:8001 tcp:8001',
      };
    }
  };

  const setCityAndArea = async (
    newCity: string | null,
    newArea: string | null,
    newPincode?: string | null,
  ) => {
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

      const normalizedPin = newPincode != null ? normalizePincode(newPincode) : '';
      if (normalizedPin) {
        await AsyncStorage.setItem('@user_pincode', normalizedPin);
        setPincodeState(normalizedPin);
      } else {
        await AsyncStorage.removeItem('@user_pincode');
        setPincodeState(null);
      }

      setCityState(newCity);
      setAreaState(newArea);
    } catch (err) {
      console.error('Failed to save location details:', err);
    }
  };

  const updateUser = async (updatedFields: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updatedFields };
      setUser(updated);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        '@auth_token',
        '@user_city',
        '@user_area',
        '@user_pincode',
      ]);
      setToken(null);
      setUser(null);
      setCityState(null);
      setAreaState(null);
      setPincodeState(null);
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        city,
        area,
        pincode,
        setCityAndArea,
        sendOtp,
        verifyOtp,
        updateUser,
        logout,
      }}
    >
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
