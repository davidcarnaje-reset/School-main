import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserPlus, Pencil, Trash2, X, Shield, Mail, RefreshCw, Calendar, Phone, User } from 'lucide-react'; 
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser, branding, API_BASE_URL } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false); 
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [emailError, setEmailError] = useState('');
  
  // 1. UPDATED FORM DATA (Wala nang password, hinati ang pangalan)
  const initialFormState = {
    username: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    birthday: '',
    phone_number: '',
    role: 'registrar'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });

  const fetchUsers = async () => {
    try {
      // FIX: Ginawang dynamic at tinuro sa /admin/ folder
      const response = await axios.get(`${API_BASE_URL}/admin/get_users.php`);
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [API_BASE_URL]);

  // REAL-TIME EMAIL VALIDATION
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (formData.email && !isEditMode && showModal) { 
        try {
          // FIX: Tinuro sa /auth/ folder kung nasaan na ang check_email.php
          const res = await axios.get(`${API_BASE_URL}/auth/check_email.php?email=${formData.email}`);
          if (res.data.exists) {
            setEmailError('This email is already registered to another account.');
          } else {
            setEmailError('');
          }
        } catch (err) { console.error(err); }
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.email, isEditMode, showModal, API_BASE_URL]);

  const handleAddUser = async (e) => {
    if (e) e.preventDefault();
    if (emailError || saveLoading) return; 

    setSaveLoading(true); 
    try {
      const payload = isEditMode ? { ...formData, id: selectedUserId } : formData;
      // FIX: Tinuro sa /admin/ folder at dynamic URL
      const endpoint = isEditMode ? 'update_user.php' : 'add_user.php';
      const response = await axios.post(`${API_BASE_URL}/admin/${endpoint}`, payload);

      if (response.data && response.data.success) {
        setShowModal(false);
        setFormData(initialFormState);
        setEmailError('');
        await fetchUsers(); 
        
        setTimeout(() => {
          alert("Success: " + response.data.message);
        }, 100);
      } else {
        alert("Failed: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Critical Error:", error);
      alert("May problema sa pag-save. Check PHP connection.");
    } finally {
      setSaveLoading(false);
    }
  };

  const confirmDelete = (id, name) => setDeleteModal({ show: true, id, name });

  const executeDelete = async () => {
    try {
      // FIX: Tinuro sa /admin/ folder at dynamic URL
      const response = await axios.post(`${API_BASE_URL}/admin/delete_user.php`, { id: deleteModal.id });
      if (response.data.success) {
        setDeleteModal({ show: false, id: null, name: '' });
        fetchUsers();
      }
    } catch (error) { alert("Error deleting user"); }
  };

  const openEditModal = (user) => {
    setIsEditMode(true);
    setSelectedUserId(user.id);
    setEmailError(''); 
    setFormData({
      first_name: user.first_name || '',
      middle_name: user.middle_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      username: user.username || '',
      birthday: user.birthday || '',
      phone_number: user.phone_number || '',
      role: user.role || 'registrar',
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Staff Management</h1>
          <p className="text-slate-500 text-sm">Invite and manage system personnel.</p>
        </div>
        <button 
          onClick={() => { 
            setIsEditMode(false); 
            setFormData(initialFormState);
            setEmailError('');
            setShowModal(true); 
          }}
          className="shine-effect group text-white px-6 py-3 rounded-2xl flex items-center space-x-2 shadow-xl shadow-blue-200 transition-all duration-300 active:scale-95 border border-white/20"
          style={{ backgroundColor: branding.theme_color || '#2563eb' }}
        >
          <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-sm tracking-tight">Invite Staff</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personnel</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role & Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-10 text-slate-400 italic">Loading staff...</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id || Math.random()} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                             style={{ backgroundColor: branding.theme_color || '#2563eb' }}>
                          {user.full_name?.charAt(0) || user.first_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-sm">{user.full_name || `${user.first_name} ${user.last_name}`}</p>
                          <p className="text-[10px] text-slate-400 font-medium">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-600 text-sm font-medium">{user.email || 'No email'}</p>
                      <p className="text-[10px] text-slate-400">{user.phone_number || 'No phone'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter
                          ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 
                            user.role === 'registrar' ? 'bg-blue-100 text-blue-600' : 
                            'bg-emerald-100 text-emerald-600'}`}>
                          {user.role}
                        </span>
                        {/* Status Indicator */}
                        {user.is_verified == 1 ? (
                          <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><Shield size={10}/> Verified</span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1"><Mail size={10}/> Pending</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => openEditModal(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Pencil size={16} /></button>
                        <button 
                          disabled={user.id === currentUser?.id}
                          onClick={() => confirmDelete(user.id, user.full_name)}
                          className={`p-2 rounded-xl transition-all ${user.id === currentUser?.id ? 'opacity-0 cursor-default' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL - Updated width, layout, and SCROLLABLE FIX */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          
          {/* NILAGYAN NG max-h-[90vh] at flex flex-col DITO */}
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* HEADER - Nilagyan ng shrink-0 para hindi lumiit */}
            <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <UserPlus className="text-blue-500" />
                {isEditMode ? 'Update Staff Member' : 'Invite New Staff'}
              </h3>
              <button onClick={() => {setShowModal(false); setEmailError('');}} className="text-slate-400 hover:text-slate-600 bg-white shadow-sm p-2 rounded-full"><X size={20} /></button>
            </div>
            
            {/* FORM - Nilagyan ng overflow-y-auto para ito lang ang mag-scroll */}
            <form onSubmit={handleAddUser} className="p-6 md:p-8 space-y-5 overflow-y-auto">
              
              {/* Pangalan Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">First Name</label>
                  <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
                    value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} placeholder="Juan" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Middle Name</label>
                  <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
                    value={formData.middle_name} onChange={(e) => setFormData({...formData, middle_name: e.target.value})} placeholder="Optional" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Last Name</label>
                  <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
                    value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} placeholder="Dela Cruz" />
                </div>
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Mail size={10} /> Email Address</label>
                  <input type="email" required className={`w-full p-3 border rounded-xl outline-none transition-all text-sm ${emailError ? 'border-red-400 bg-red-50' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                    placeholder="juan@school.edu" value={formData.email} onChange={(e) => {setEmailError(''); setFormData({...formData, email: e.target.value});}} />
                  {emailError && <p className="text-[10px] text-red-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">⚠️ {emailError}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Phone size={10} /> Phone Number</label>
                  <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
                    placeholder="09123456789" value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
                </div>
              </div>

              {/* Account Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Calendar size={10} /> Birthday</label>
                  <input type="date" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm text-slate-600"
                    value={formData.birthday} onChange={(e) => setFormData({...formData, birthday: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><User size={10} /> Username</label>
                  <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
                    value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} placeholder="juandc" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Position</label>
                  <select value={formData.role} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-bold text-slate-700"
                    onChange={(e) => setFormData({...formData, role: e.target.value})}>
                    <option value="registrar">Registrar</option>
                    <option value="cashier">Cashier</option>
                    <option value="it">IT</option>
                    <option value="admin">Administrator</option>
                    <option value="Teacher">Teacher</option>
                  </select>
                </div>
              </div>

              {/* Notice Area */}
              {!isEditMode && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mt-4 shrink-0">
                  <Mail className="text-blue-500 mt-0.5 shrink-0" size={16} />
                  <div>
                    <p className="text-xs font-bold text-blue-800">Account Invitation</p>
                    <p className="text-[11px] text-blue-600 mt-0.5">Ang staff na ito ay makakatanggap ng email link upang i-verify ang kanilang account at gumawa ng sariling password.</p>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={saveLoading || emailError}
                className="shine-effect w-full py-4 rounded-xl text-white font-black shadow-xl mt-6 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 shrink-0"
                style={{ 
                  backgroundColor: branding.theme_color || '#2563eb',
                  opacity: (saveLoading || emailError) ? 0.7 : 1,
                  cursor: (saveLoading || emailError) ? 'not-allowed' : 'pointer'
                }}
              >
                {saveLoading ? (
                  <><RefreshCw className="animate-spin" size={18} /><span>Processing...</span></>
                ) : (
                  <span>{isEditMode ? 'Save Changes' : 'Send Invitation'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={40} /></div>
            <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Confirm Delete</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">Are you sure you want to remove <span className="font-bold text-slate-800">{deleteModal.name}</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ show: false, id: null, name: '' })} className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={executeDelete} className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;