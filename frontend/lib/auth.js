'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }
    api
      .get('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('ombor:logout', onLogout);
    return () => window.removeEventListener('ombor:logout', onLogout);
  }, []);

  const login = useCallback(async (username, password) => {
    const d = await api.post('/auth/login', { username, password });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const can = useCallback(
    (action) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      if (action === 'write') return user.role === 'omborchi';
      return false; // 'admin' amallari
    },
    [user]
  );

  return <AuthContext.Provider value={{ user, ready, login, logout, can }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
