// src/components/lms/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProfileSettings = () => {
  const { user, API_BASE_URL, logout } = useAuth();
  
  const userId = user?.id || user?.student_id || user?.username;
  const userRole = user?.role || 'student';

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    dark_mode: 0,
    theme_color: '#2563eb',
    kiddie_mode: 0, 
    email_notif: 1  
  });

  const THEME_COLORS = [
    { name: 'Indigo', hex: '#4f46e5' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Purple', hex: '#8b5cf6' },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/settings/get_settings.php?user_id=${userId}&user_role=${userRole}`);
        if (res.data.status === 'success') {
          const dbSettings = res.data.settings;
          setSettings({
            dark_mode: parseInt(dbSettings.dark_mode) || 0,
            theme_color: dbSettings.theme_color || '#4f46e5',
            kiddie_mode: dbSettings.dashboard_type === 'kiddie' ? 1 : 0,
            email_notif: parseInt(dbSettings.email_notifications) || 0
          });

          // INITIAL LOAD THEME
          const htmlElement = document.documentElement;
          if (parseInt(dbSettings.dark_mode) === 1) {
            htmlElement.classList.add('dark');
            htmlElement.style.colorScheme = 'dark'; // <--- Ito yung hindi lumalabas kanina!
          } else {
            htmlElement.classList.remove('dark');
            htmlElement.style.colorScheme = 'light';
          }

          if (dbSettings.theme_color) {
            htmlElement.style.setProperty('--primary-color', dbSettings.theme_color);
          }
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [userId, userRole, API_BASE_URL]);

  const updateSetting = async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    if (key === 'theme_color') {
      document.documentElement.style.setProperty('--primary-color', value);
    }

    try {
      await axios.post(`${API_BASE_URL}/settings/update_settings.php`, {
        user_id: userId,
        user_role: userRole,
        setting_key: key,
        setting_value: value
      });
    } catch (err) {
      console.error(`Failed to save ${key}`, err);
    }
  };

  // SUPER FORCE TOGGLE
  const handleDarkModeToggle = () => {
    const isDark = settings.dark_mode == 1; 
    const newValue = isDark ? 0 : 1;
    
    // PILITIN ANG DOM AGAD-AGAD
    const htmlElement = document.documentElement;
    if (newValue === 1) {
      htmlElement.classList.add('dark');
      htmlElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.style.colorScheme = 'light';
    }

    setSettings(prev => ({ ...prev, dark_mode: newValue }));

    axios.post(`${API_BASE_URL}/settings/update_settings.php`, {
      user_id: userId,
      user_role: userRole,
      setting_key: 'dark_mode',
      setting_value: newValue
    }).catch(err => console.error("Failed to save dark mode", err));
  };

  if (loading) return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="max-w-4xl animate-in fade-in duration-500 pb-10 dark:text-white">
      <div className="mb-8 border-b border-slate-200 dark:border-slate-700 pb-4">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">System Settings</h1>
        <p className="text-sm font-bold text-slate-400 mt-1">Customize your LMS experience and preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-sm font-black text-slate-800 dark:text-white mb-6">Appearance & Interface</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Dark Mode</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.dark_mode == 1}
                    onChange={handleDarkModeToggle} 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:!bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Kiddie Dashboard Mode</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" disabled />
                  <div className="w-11 h-6 bg-slate-100 rounded-full peer dark:bg-slate-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Theme Color</span>
                <div className="flex items-center gap-3">
                  {THEME_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => updateSetting('theme_color', color.hex)}
                      className={`w-6 h-6 rounded-full transition-all flex items-center justify-center ${settings.theme_color === color.hex ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-800 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden opacity-50 pointer-events-none">
          <div className="p-6">
            <h2 className="text-sm font-black text-slate-800 dark:text-white mb-6">Notifications</h2>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Email notifications for new activities</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked readOnly />
                <div className="w-11 h-6 bg-blue-600 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:translate-x-full"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
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