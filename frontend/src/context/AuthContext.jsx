import { createContext, useContext, useMemo, useState } from 'react';
import { authApi } from '../lib/api';

export const AuthContext = createContext();

const readStoredUser = () => {
  localStorage.removeItem('uit_user');
  localStorage.removeItem('uit_token');

  const storedUser = sessionStorage.getItem('uit_user');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    sessionStorage.removeItem('uit_user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => sessionStorage.getItem('uit_token'));

  const saveSession = (authData) => {
    const nextUser = authData.user;
    const nextToken = authData.access_token;

    setUser(nextUser);
    setToken(nextToken);
    sessionStorage.setItem('uit_user', JSON.stringify(nextUser));
    sessionStorage.setItem('uit_token', nextToken);

    return authData;
  };

  const login = async (credentials) => {
    const response = await authApi.post('/api/v1/auth/login', credentials);
    return saveSession(response.data);
  };

  const register = async (userData) => {
    const response = await authApi.post('/api/v1/auth/register', userData);

    if (response.data?.access_token && response.data?.user) {
      return saveSession(response.data);
    }

    return response.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('uit_user');
    sessionStorage.removeItem('uit_token');
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
