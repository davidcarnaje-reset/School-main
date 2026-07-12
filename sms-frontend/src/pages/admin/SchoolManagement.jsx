import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, Check, GraduationCap, Palette, Loader2, Globe, Sliders } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SchoolPermissionsModal from '../../components/admin/SchoolPermissionsModal';

const SchoolManagement = () => {
  const { API_BASE_URL, getLogoUrl, fetchBranding } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  
  // Permissions Config modal states
  const [selectedSchoolForPerms, setSelectedSchoolForPerms] = useState(null);
  const [isPermsOpen, setIsPermsOpen] = useState(false);

  const openPermsModal = (school) => {
    setSelectedSchoolForPerms(school);
    setIsPermsOpen(true);
  };
  
  // Form states
  const [name, setName] = useState('');
  const [themeColor, setThemeColor] = useState('#2563eb');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [status, setStatus] = useState('Active');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/schools`);
      if (res.data.success) {
        setSchools(res.data.schools);
      }
    } catch (err) {
      console.error("Error fetching schools:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const openCreateModal = () => {
    setEditingSchool(null);
    setName('');
    setThemeColor('#2563eb');
    setLogoFile(null);
    setLogoPreview('');
    setStatus('Active');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (school) => {
    setEditingSchool(school);
    setName(school.name);
    setThemeColor(school.theme_color || '#2563eb');
    setLogoFile(null);
    setLogoPreview(school.logo ? getLogoUrl(school.logo) : '');
    setStatus(school.status || 'Active');
    setError('');
    setModalOpen(true);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('School name is required.');
      return;
    }

    setFormLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('theme_color', themeColor);
    formData.append('status', status);
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      if (editingSchool) {
        const res = await axios.put(`${API_BASE_URL}/schools/${editingSchool.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          // If we edited the active selected school, refresh branding
          const activeId = localStorage.getItem('selected_school_id');
          if (activeId && parseInt(activeId, 10) === editingSchool.id) {
            fetchBranding(editingSchool.id);
          }
          setModalOpen(false);
          fetchSchools();
        }
      } else {
        const res = await axios.post(`${API_BASE_URL}/schools`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          setModalOpen(false);
          fetchSchools();
        }
      }
    } catch (err) {
      console.error("Error saving school:", err);
      setError(err.response?.data?.message || 'Error occurred while saving school.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this school campus? All associated data will be deleted.")) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/schools/${id}`);
        if (res.data.success) {
          fetchSchools();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete school.');
      }
    }
  };

  const handleSelectSchool = (school) => {
    localStorage.setItem('selected_school_id', school.id);
    fetchBranding(school.id);
    alert(`Active campus set to: ${school.name}`);
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Globe className="text-blue-600" size={32} />
            Campus Registry
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage school networks, setup campuses, and control configurations.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="group relative overflow-hidden bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          Create New Campus
        </button>
      </div>

      {loading ? (
        <div className="h-60 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4" size={40} />
          <p className="text-sm font-bold uppercase tracking-widest">Loading campuses...</p>
        </div>
      ) : schools.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
          <GraduationCap className="mx-auto text-slate-300 mb-4" size={60} />
          <h3 className="text-xl font-bold text-slate-800">No School Campuses Registered</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">Register your first school campus to launch the tenant portal settings.</p>
          <button onClick={openCreateModal} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100">Create Campus</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => {
            const isActive = localStorage.getItem('selected_school_id') === String(school.id);
            return (
              <div 
                key={school.id} 
                className={`bg-white rounded-[2.5rem] p-6 border transition-all duration-300 relative group flex flex-col justify-between min-h-[300px] ${isActive ? 'border-2 border-blue-500 shadow-xl shadow-blue-50' : 'border-slate-100 shadow-lg hover:shadow-2xl hover:border-slate-200'}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner">
                      {school.logo ? (
                        <img src={getLogoUrl(school.logo)} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-slate-300 text-lg uppercase" style={{ backgroundColor: school.theme_color }}>
                          {school.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => openPermsModal(school)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all"
                        title="Manage Permissions & Modules"
                      >
                        <Sliders size={16} />
                      </button>
                      <button 
                        onClick={() => openEditModal(school)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                        title="Edit Details"
                      >
                        <Edit size={16} />
                      </button>
                      {school.id !== 1 && (
                        <button 
                          onClick={() => handleDelete(school.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Campus"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-800 tracking-tight line-clamp-1">{school.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${school.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      {school.status}
                    </span>
                    <span className="text-[10px] font-black uppercase text-slate-400">ID: {school.id}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-4 text-xs font-bold text-slate-500">
                    <Palette size={14} className="text-slate-400" />
                    <span>Theme color:</span>
                    <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: school.theme_color || '#2563eb' }}></div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {isActive ? (
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                      <Check size={18} strokeWidth={3} className="bg-blue-50 p-0.5 rounded-full" />
                      Active Campus Context
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleSelectSchool(school)}
                      className="text-xs font-black text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-4 py-2.5 rounded-xl transition-all"
                    >
                      Select to Manage
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                {editingSchool ? 'Edit Campus Details' : 'Create New Campus'}
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-1">Configure campus logo, naming, and theme parameters.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-xs font-bold text-red-600">
                  ⚠️ {error}
                </div>
              )}

              {/* Logo Upload Section */}
              <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden border border-slate-200 shrink-0 shadow-inner">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <GraduationCap size={28} className="text-slate-300" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wide">Campus Logo</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoChange}
                    className="mt-1 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                  />
                </div>
              </div>

              {/* School Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">School Campus Name</label>
                <input 
                  type="text" 
                  required
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Primordial Academy (Laguna Campus)"
                  className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold"
                />
              </div>

              {/* Theme Color & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Theme Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={themeColor} 
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0"
                    />
                    <input 
                      type="text" 
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      placeholder="#2563eb"
                      className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none transition-all text-xs font-bold uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none transition-all text-xs font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {formLoading && <Loader2 size={14} className="animate-spin" />}
                  Save Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SchoolPermissionsModal 
        isOpen={isPermsOpen} 
        onClose={() => setIsPermsOpen(false)} 
        school={selectedSchoolForPerms} 
      />
    </div>
  );
};

export default SchoolManagement;
