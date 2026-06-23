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

  // ==========================================
  // ARCHITECT'S UPDATE: BASE URL CONFIGURATION
  // ==========================================
  // Piliin kung alin ang gamit ninyo. Naka-fallback sa localhost in case makalimutan ang .env
  
  // Option A (Para sa Vite):
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.100.14/sms-api';
  
  // Option B (Para sa Create React App - i-uncomment kung ito ang gamit):
  // const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost/sms-api';


  const fetchBranding = async () => {
    try {
      // Ginamit na natin ang variable imbes na hardcoded link!
      const res = await axios.get(`${API_BASE_URL}/admin/branding.php`);
      if (res.data) {
        setBranding(res.data);
        document.documentElement.style.setProperty('--primary-color', res.data.theme_color);
      }
    } catch (err) {
      console.error("Branding fetch error:", err);
    }
  };

  useEffect(() => {
    // Note: Sa Phase 2 natin aayusin ang LocalStorage to Token. 
    // Wag muna natin baguhin para hindi kayo malito ngayon.
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    fetchBranding();
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    // Idinagdag ko ang API_BASE_URL sa provider para magamit din ng ibang pages (e.g. pag nag-fetch ng grades)
    <AuthContext.Provider value={{ user, setUser, logout, loading, branding, fetchBranding, API_BASE_URL }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);