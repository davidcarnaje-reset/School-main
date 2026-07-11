import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [branding, setBranding] = useState({
    school_name: 'SMS Portal',
    theme_color: '#2563eb',
    school_logo: null
  });

  // ====================================================================
  // ARCHITECT'S CORE ROUTING LAYER
  // Bound strictly to port 5000 Node.js API environment gateway
  // ====================================================================
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  const fetchBranding = async () => {
    try {
      // 🚀 RESTFUL UPDATE: Tinanggal ang legacy .php extension file callback!
      const res = await axios.get(`${API_BASE_URL}/admin/branding`);
      if (res.data && res.data.status === 'success') {
        setBranding(res.data.data);
        document.documentElement.style.setProperty('--primary-color', res.data.data.theme_color);
      }
    } catch (err) {
      console.error("🔑 [AUTH CONTEXT API ALERT] Branding payload retrieval crashed:", err.message);
    }
  };

  useEffect(() => {
    // 1. Check sessionStorage first (temporary sessions like admin)
    let token = sessionStorage.getItem('sms_token') || sessionStorage.getItem('token');
    let savedUser = sessionStorage.getItem('user');

    // 2. If not in sessionStorage, check localStorage (persistent sessions like student/staff)
    if (!token || !savedUser) {
      token = localStorage.getItem('sms_token') || localStorage.getItem('token');
      savedUser = localStorage.getItem('user');

      // If we found an admin session in localStorage, clear it immediately
      // to ensure admin sessions are strictly non-persistent!
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.role === 'admin') {
            localStorage.removeItem('token');
            localStorage.removeItem('sms_token');
            localStorage.removeItem('user');
            token = null;
            savedUser = null;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('sms_token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('sms_token');
        sessionStorage.removeItem('user');
      }
    } else {
      setUser(null);
    }

    fetchBranding();
    setLoading(false);
  }, []);

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return '/vite.svg';
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      return logoPath;
    }
    return `${API_BASE_URL}/uploads/branding/${logoPath}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('sms_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('sms_token');
    sessionStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading, branding, fetchBranding, API_BASE_URL, getLogoUrl }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);