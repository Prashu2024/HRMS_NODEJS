import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'hrms_token';
const USER_KEY  = 'hrms_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  // initializing stays true for one tick so the router never redirects
  // to /login before localStorage has been read
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Auth state is already hydrated synchronously from localStorage above.
    // We just need to flip the flag after the first render so ProtectedRoute
    // doesn't redirect before the token is available.
    setInitializing(false);
  }, []);

  // Keep axios Authorization header in sync with token
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post('/api/v1/users/login', { username, password });
      const { token: jwt, user: userData } = res.data.data;
      localStorage.setItem(TOKEN_KEY, jwt);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
      setToken(jwt);
      setUser(userData);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid username or password';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async ({ username, email, password, role = 'staff' }) => {
    setLoading(true);
    try {
      await api.post('/api/v1/users/register', { username, email, password, role });
      return { success: true };
    } catch (err) {
      // Backend returns { status:'error', message:'...' }
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Registration failed. Please try again.';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, initializing, isAuthenticated: Boolean(token), login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}