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
    const token = localStorage.getItem('sms_token') || localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        setUser(null);
        localStorage.clear(); // Isang bagsakang linis para sa stale tracking values
      }
    } else {
      setUser(null);
      localStorage.clear(); // Clean clear on missing token parameters
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
    localStorage.clear(); // Siguraduhing sunog ang lahat ng active credentials tokens
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