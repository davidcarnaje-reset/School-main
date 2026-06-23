import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Palette, School, Save, RefreshCw, Upload, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
const BrandingSettings = () => {
  // ARCHITECT UPDATE 1: Idinagdag ang API_BASE_URL mula sa Context
  const { branding, API_BASE_URL } = useAuth(); 
  
  const [settings, setSettings] = useState({
    school_name: '',
    theme_color: '#2563eb',
    school_logo: ''
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      // ARCHITECT UPDATE 2: Gamitin ang dynamic URL
      const res = await axios.get(`${API_BASE_URL}/admin/branding.php`);
      if (res.data) {
        setSettings({
          school_name: res.data.school_name || '',
          theme_color: res.data.theme_color || '#2563eb',
          // Siguraduhin na ang logo ay may tamang path
          school_logo: res.data.school_logo ? `${API_BASE_URL}/uploads/branding/${res.data.school_logo}` : ''
        });
      }
    } catch (err) {
      console.error("Error fetching branding:", err);
    }
  };

const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file)); 
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('school_name', settings.school_name);
    formData.append('theme_color', settings.theme_color);
    if (selectedFile) {
      formData.append('logo', selectedFile);
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/admin/branding.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert("System Branding Updated!");
        window.location.reload(); 
      }
    } catch (err) {
      alert("Error updating branding. Check your PHP connection.");
    } finally {
      setLoading(false);
    }
  };
  
  // ... rest of the code stays the same ...

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Branding Engine</h1>
        <p className="text-slate-500 text-sm">Customize the system appearance, identity, and logo.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* LOGO UPLOAD SECTION */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                {preview || settings.school_logo ? (
                  <img 
                    src={preview || settings.school_logo} 
                    alt="School Logo" 
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <ImageIcon size={40} className="text-slate-300" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl cursor-pointer shadow-lg hover:bg-blue-700 transition-all">
                <Upload size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">School System Logo</p>
          </div>

          <div className="space-y-6">
            {/* School Name */}
            <div>
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                <School size={14} />
                <span>School Name</span>
              </label>
              <input 
                type="text"
                required
                value={settings.school_name || ''} 
                onChange={(e) => setSettings({...settings, school_name: e.target.value})}
                className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700"
                placeholder="Ex. St. Jude College"
              />
            </div>

            {/* Theme Color */}
            <div>
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                <Palette size={14} />
                <span>Primary Theme Color</span>
              </label>
              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input 
                  type="color"
                  value={settings.theme_color || '#2563eb'}
                  onChange={(e) => setSettings({...settings, theme_color: e.target.value})}
                  className="w-12 h-12 rounded-lg cursor-pointer border-none bg-transparent"
                />
                <div>
                  <div className="text-sm font-bold text-slate-700 uppercase tracking-tight">
                    {settings.theme_color}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">This will be applied to buttons and sidebar highlights.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
              <span>Save System Branding</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandingSettings;