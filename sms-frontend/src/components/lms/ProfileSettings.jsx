// src/components/lms/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Check, Sparkles } from 'lucide-react';

const ProfileSettings = () => {
  const { user, API_BASE_URL, logout } = useAuth();
  
  const userId = user?.id || user?.student_id || user?.username;
  const userRole = user?.role || 'student';

  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', or null

  // Initialize immediately from localStorage cache for instant zero-flicker response
  const [settings, setSettings] = useState(() => {
    const cachedDark = localStorage.getItem('lms_dark_mode');
    const cachedTheme = localStorage.getItem('lms_theme_color');
    const cachedKiddie = localStorage.getItem('lms_kiddie_mode');
    const cachedEmail = localStorage.getItem('lms_email_notif');

    return {
      dark_mode: cachedDark !== null ? parseInt(cachedDark, 10) : (document.documentElement.classList.contains('dark') ? 1 : 0),
      theme_color: cachedTheme || '#4f46e5',
      kiddie_mode: cachedKiddie !== null ? parseInt(cachedKiddie, 10) : 0, 
      email_notif: cachedEmail !== null ? parseInt(cachedEmail, 10) : 1  
    };
  });

  const THEME_COLORS = [
    { name: 'Indigo', hex: '#4f46e5' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Purple', hex: '#8b5cf6' },
  ];

  // Sync with Database on Mount
  useEffect(() => {
    const fetchSettings = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/settings/get_settings.php?user_id=${userId}&user_role=${userRole}`);
        if (res.data.status === 'success' && res.data.settings) {
          const dbSettings = res.data.settings;
          const newDarkMode = parseInt(dbSettings.dark_mode, 10) || 0;
          const newTheme = dbSettings.theme_color || '#4f46e5';
          const newKiddie = dbSettings.dashboard_type === 'kiddie' ? 1 : 0;
          const newEmail = parseInt(dbSettings.email_notifications, 10) || 0;

          // Save to LocalStorage cache
          localStorage.setItem('lms_dark_mode', String(newDarkMode));
          localStorage.setItem('lms_theme_color', newTheme);
          localStorage.setItem('lms_kiddie_mode', String(newKiddie));
          localStorage.setItem('lms_email_notif', String(newEmail));

          setSettings({
            dark_mode: newDarkMode,
            theme_color: newTheme,
            kiddie_mode: newKiddie,
            email_notif: newEmail
          });

          // Apply to DOM
          const htmlElement = document.documentElement;
          if (newDarkMode === 1) {
            htmlElement.classList.add('dark');
            htmlElement.style.colorScheme = 'dark';
          } else {
            htmlElement.classList.remove('dark');
            htmlElement.style.colorScheme = 'light';
          }

          if (newTheme) {
            htmlElement.style.setProperty('--primary-color', newTheme);
          }
        }
      } catch (err) {
        console.warn("DB settings load warning (using local cache):", err.message);
      }
    };
    fetchSettings();
  }, [userId, userRole, API_BASE_URL]);

  const showSaveNotice = () => {
    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus(null);
    }, 2500);
  };

  // Generic Setting Updater: Cache First, Then Cloud
  const updateSetting = async (key, value) => {
    // 1. Update State
    setSettings(prev => ({ ...prev, [key]: value }));

    // 2. Cache Immediately in LocalStorage
    if (key === 'dark_mode') {
      localStorage.setItem('lms_dark_mode', String(value));
      const htmlElement = document.documentElement;
      if (value === 1) {
        htmlElement.classList.add('dark');
        htmlElement.style.colorScheme = 'dark';
      } else {
        htmlElement.classList.remove('dark');
        htmlElement.style.colorScheme = 'light';
      }
    } else if (key === 'theme_color') {
      localStorage.setItem('lms_theme_color', value);
      document.documentElement.style.setProperty('--primary-color', value);
    } else if (key === 'kiddie_mode') {
      localStorage.setItem('lms_kiddie_mode', String(value));
    } else if (key === 'email_notif') {
      localStorage.setItem('lms_email_notif', String(value));
    }

    showSaveNotice();

    // 3. Persist to Database Asynchronously
    try {
      await axios.post(`${API_BASE_URL}/settings/update_settings.php`, {
        user_id: userId,
        user_role: userRole,
        setting_key: key,
        setting_value: value
      });
    } catch (err) {
      console.warn(`Failed to persist ${key} to cloud (cached locally):`, err.message);
    }
  };

  const handleDarkModeToggle = () => {
    const isDark = settings.dark_mode === 1;
    const newValue = isDark ? 0 : 1;
    updateSetting('dark_mode', newValue);
  };

  const handleKiddieToggle = () => {
    const isKiddie = settings.kiddie_mode === 1;
    const newValue = isKiddie ? 0 : 1;
    updateSetting('kiddie_mode', newValue);
  };

  const handleEmailToggle = () => {
    const isEmail = settings.email_notif === 1;
    const newValue = isEmail ? 0 : 1;
    updateSetting('email_notif', newValue);
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl animate-in fade-in duration-500 pb-10 dark:text-white">
      
      {/* HEADER SECTION */}
      <div className="mb-8 border-b border-slate-200 dark:border-slate-700 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">System Settings</h1>
          <p className="text-sm font-bold text-slate-400 mt-1">Customize your LMS experience and preferences.</p>
        </div>

        {/* Persistence Status Badge */}
        {saveStatus === 'saved' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-black uppercase tracking-wider animate-in fade-in slide-in-from-top-2 duration-300">
            <Check size={14} /> Saved & Cached
          </div>
        )}
      </div>

      <div className="space-y-6">
        
        {/* SECTION 1: APPEARANCE & INTERFACE */}
        <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <div className="p-6">
            <h2 className="text-sm font-black text-slate-800 dark:text-white mb-6 uppercase tracking-wider">Appearance & Interface</h2>

            <div className="space-y-4">
              
              {/* 1. Dark Mode Switch */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">Dark Mode</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Switch between light and dark visual aesthetics</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.dark_mode === 1}
                    onChange={handleDarkModeToggle} 
                  />
                  <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
                </label>
              </div>

              {/* 2. Kiddie Dashboard Mode Switch */}
              <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-700/50">
                <div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">Kiddie Dashboard Mode</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Fun animated interface tailored for young learners</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.kiddie_mode === 1}
                    onChange={handleKiddieToggle}
                  />
                  <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
                </label>
              </div>

              {/* 3. Theme Color Palette */}
              <div className="flex items-center justify-between py-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">Theme Color</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Select your preferred accent highlights</span>
                </div>
                <div className="flex items-center gap-3">
                  {THEME_COLORS.map((color) => {
                    const isSelected = settings.theme_color?.toLowerCase() === color.hex.toLowerCase();
                    return (
                      <button
                        key={color.hex}
                        onClick={() => updateSetting('theme_color', color.hex)}
                        className={`w-7 h-7 rounded-full transition-all flex items-center justify-center relative ${
                          isSelected 
                            ? 'ring-4 ring-offset-2 ring-slate-400 dark:ring-offset-slate-800 scale-110 shadow-md' 
                            : 'hover:scale-110 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {isSelected && <Check size={14} className="text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* SECTION 2: NOTIFICATIONS */}
        <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <div className="p-6">
            <h2 className="text-sm font-black text-slate-800 dark:text-white mb-6 uppercase tracking-wider">Notifications</h2>
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">Email notifications for new activities</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Get notified when assignments or exams are published</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.email_notif === 1}
                  onChange={handleEmailToggle}
                />
                <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 3: SYSTEM ACTIONS */}
        <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <div className="p-6 flex items-center justify-between">
            <button className="px-5 py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
              About SMS System
            </button>
            <button 
              onClick={logout}
              className="px-5 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
            >
              Logout Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileSettings;