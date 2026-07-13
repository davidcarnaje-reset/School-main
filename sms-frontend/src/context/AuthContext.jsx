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

  const [activePermissions, setActivePermissions] = useState(null);

  // ====================================================================
  // ARCHITECT'S CORE ROUTING LAYER
  // Bound strictly to port 5000 Node.js API environment gateway
  // ====================================================================
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Global Axios interceptor to automatically add school ID and Authorization header
  axios.interceptors.request.use((config) => {
    const schoolId = localStorage.getItem('selected_school_id') || 
                     (sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')).school_id : null) ||
                     (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).school_id : null);
    if (schoolId) {
      config.headers['x-school-id'] = schoolId;
    }
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });

  const fetchBranding = async (schoolId) => {
    try {
      const activeSchoolId = schoolId || localStorage.getItem('selected_school_id') || 1;
      // 🚀 RESTFUL UPDATE: Tinanggal ang legacy .php extension file callback!
      const res = await axios.get(`${API_BASE_URL}/admin/branding?school_id=${activeSchoolId}`);
      if (res.data && res.data.status === 'success') {
        setBranding(res.data.data);
        document.documentElement.style.setProperty('--primary-color', res.data.data.theme_color);
      }
    } catch (err) {
      console.error("🔑 [AUTH CONTEXT API ALERT] Branding payload retrieval crashed:", err.message);
    }
  };

  const fetchPermissions = async (schoolId) => {
    try {
      const activeSchoolId = schoolId || localStorage.getItem('selected_school_id') || (user ? user.school_id : 1);
      const res = await axios.get(`${API_BASE_URL}/schools/${activeSchoolId}/permissions`);
      if (res.data && res.data.success) {
        setActivePermissions(res.data.permissions);
      }
    } catch (err) {
      console.error("🔑 [AUTH CONTEXT API ALERT] Permissions retrieval failed:", err.message);
    }
  };

  useEffect(() => {
    if (user && user.school_id) {
      fetchPermissions(user.school_id);
    } else {
      const savedSchoolId = localStorage.getItem('selected_school_id');
      if (savedSchoolId) {
        fetchPermissions(savedSchoolId);
      }
    }
  }, [user]);

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
    fetchPermissions();
    setLoading(false);
  }, []);

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return '/vite.svg';
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      return logoPath;
    }
    return `${API_BASE_URL}/uploads/branding/${logoPath}`;
  };

  const getProfileImageUrl = (imagePath) => {
    if (!imagePath || imagePath === 'default.png' || imagePath === 'default.jpg') {
      return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${API_BASE_URL}/uploads/profiles/${imagePath}`;
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
    <AuthContext.Provider value={{ user, setUser, logout, loading, branding, fetchBranding, activePermissions, fetchPermissions, API_BASE_URL, getLogoUrl, getProfileImageUrl }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);