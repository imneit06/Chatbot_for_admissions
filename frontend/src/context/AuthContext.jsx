import { createContext, useContext, useMemo, useState } from 'react';
import api from '../lib/api';

export const AuthContext = createContext();

const readStoredUser = () => {
  const storedUser = localStorage.getItem('uit_user');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('uit_user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('uit_token'));

  const saveSession = (authData) => {
    const nextUser = authData.user;
    const nextToken = authData.access_token;

    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem('uit_user', JSON.stringify(nextUser));
    localStorage.setItem('uit_token', nextToken);

    return authData;
  };

  const login = async (credentials) => {
    const response = await api.post('/api/v1/auth/login', credentials);
    return saveSession(response.data);
  };

  const register = async (userData) => {
    const response = await api.post('/api/v1/auth/register', userData);
    return saveSession(response.data);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('uit_user');
    localStorage.removeItem('uit_token');
  };

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  }), [user, token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
