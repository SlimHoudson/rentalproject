import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext({
  user: null,
  token: null,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => { },
  loading: true,
  isAdmin: false,
});

// Safe JSON parser for localStorage
const safeJSONParse = (key, fallback = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load dari localStorage saat pertama kali app dibuka
  useEffect(() => {
    const savedToken = localStorage.getItem('luxedrive_token');
    const savedUser = safeJSONParse('luxedrive_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data;

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('luxedrive_token', data.token);
      localStorage.setItem('luxedrive_user', JSON.stringify(data.user));
      return { success: true, role: data.user.role };
    } catch (err) {
      return { success: false, message: err.message || 'Email atau kata sandi salah.' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('luxedrive_token');
    localStorage.removeItem('luxedrive_user');
  };

  const register = async (name, email, password) => {
    try {
      await api.post('/auth/register', { name, email, password });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Registrasi gagal.' };
    }
  };

  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    setUser(updated);
    localStorage.setItem('luxedrive_user', JSON.stringify(updated));
    return { success: true, user: updated };
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      const data = res.data;
      setUser(data.user);
      localStorage.setItem('luxedrive_user', JSON.stringify(data.user));
    } catch (err) {
      console.error('Failed to refresh user:', err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, refreshUser, loading, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
