import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        withCredentials: true
      });
      setUser(data);
    } catch (error) {
      setUser(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, adminPasskey) => {
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/login`,
        { email, password, admin_passkey: adminPasskey || undefined },
        { withCredentials: true }
      );
      setUser(data);
      return { success: true, user: data };
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (detail?.code === 'admin_passkey_required') {
        return { success: false, requiresAdminPasskey: true };
      }
      let message = 'Login failed';
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map(e => e.msg || JSON.stringify(e)).join(' ');
      }
      return { success: false, error: message };
    }
  };

  const register = async (email, password, name) => {
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/register`,
        { email, password, name },
        { withCredentials: true }
      );
      setUser(data);
      return { success: true, user: data };
    } catch (error) {
      const detail = error.response?.data?.detail;
      let message = 'Registration failed';
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map(e => e.msg || JSON.stringify(e)).join(' ');
      }
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
