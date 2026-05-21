import { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthResponse, CurrentUserDto, Role } from '../types';
import api from '../services/api';
import type { CredentialResponse } from '@react-oauth/google';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentialResponse: CredentialResponse) => Promise<User>;
  loginByEmail: (email: string) => Promise<User>;
  logout: () => void;
  refreshMe: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'user';
const TOKEN_KEY = 'accessToken';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async (): Promise<User | null> => {
    const res = await api.get<CurrentUserDto>('/api/auth/me');
    const u: User = {
      userId: res.data.userId,
      email: res.data.email,
      fullName: res.data.fullName,
      role: res.data.role as Role,
      groupId: res.data.groupId,
      lecturerId: res.data.lecturerId,
      isLeader: res.data.isLeader,
    };
    setUser(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    return u;
  };

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(USER_KEY);
      }
      // Refresh thông tin user khi reload để có groupId mới nhất
      fetchMe().catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentialResponse: CredentialResponse): Promise<User> => {
    const response = await api.post<AuthResponse>('/api/auth/google', {
      idToken: credentialResponse.credential,
    });
    localStorage.setItem(TOKEN_KEY, response.data.accessToken);
    const me = await fetchMe();
    if (!me) throw new Error('Failed to load user profile');
    return me;
  };

  const loginByEmail = async (email: string): Promise<User> => {
    const response = await api.post<AuthResponse>('/api/auth/email-login', { email });
    localStorage.setItem(TOKEN_KEY, response.data.accessToken);
    const me = await fetchMe();
    if (!me) throw new Error('Failed to load user profile');
    return me;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Không dùng window.location.href để tránh full page reload gây nháy theme
    // PrivateRoute sẽ tự redirect về /login khi user === null
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginByEmail, logout, refreshMe: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
