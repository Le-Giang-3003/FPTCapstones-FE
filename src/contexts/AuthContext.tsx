import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import type { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithEmail: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/auth/me');
      const { userId, email, fullName, role, groupId } = res.data;
      const parsedUser: User = {
        id: userId,
        email,
        fullName,
        role: role as Role,
        isActive: true,
        groupId: groupId ?? undefined,
      };
      setUser(parsedUser);
      localStorage.setItem('user', JSON.stringify(parsedUser));
    } catch (err) {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (accessToken && savedUser) {
      setUser(JSON.parse(savedUser));
      setLoading(false);
      // Validate profile with API in the background
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = async (idToken: string) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/google', { idToken });
      const { accessToken, role, email, fullName } = res.data;
      
      localStorage.setItem('accessToken', accessToken);
      const resMe = await api.get('/api/auth/me');
      const parsedUser: User = {
        id: resMe.data.userId,
        email,
        fullName,
        role: role as Role,
        isActive: true,
        groupId: resMe.data.groupId ?? undefined,
      };

      setUser(parsedUser);
      localStorage.setItem('user', JSON.stringify(parsedUser));
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/email-login', { email });
      const { accessToken, role, fullName } = res.data;
      
      localStorage.setItem('accessToken', accessToken);
      const resMe = await api.get('/api/auth/me');
      const parsedUser: User = {
        id: resMe.data.userId,
        email,
        fullName,
        role: role as Role,
        isActive: true,
        groupId: resMe.data.groupId ?? undefined,
      };

      setUser(parsedUser);
      localStorage.setItem('user', JSON.stringify(parsedUser));
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, logout }}>
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
