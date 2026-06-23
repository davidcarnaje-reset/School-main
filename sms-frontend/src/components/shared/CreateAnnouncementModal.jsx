import React, { useState, useRef, useEffect } from 'react';
import { X, Megaphone, Send, AlertTriangle, Clock, Users, User, Globe, Image as ImageIcon, Paperclip, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import CustomAlert from './CustomAlert'; // Siguraduhin na tama ang path papunta sa CustomAlert.jsx

const CreateAnnouncementModal = ({ isOpen, onClose }) => {
  const { user, API_BASE_URL } = useAuth();

  // 1. Form States
  const [formData, setFormData] = useState({
    type: 'Announcement',
    targetType: 'role', 
    targetRole: 'student',
    targetUserId: '',
    title: '',
    message: '',
    dueDate: '',
    image: null 
  });

  // 2. UI & Loading States
  const [specificRoleFilter, setSpecificRoleFilter] = useState('student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchedUsers, setFetchedUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const fileInputRef = useRef(null);

  // 3. ARCHITECT UPDATE: CustomAlert State
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Fetch Users logic para sa specific targeting
  useEffect(() => {
    if (formData.targetType === 'user' && isOpen) {
      const fetchUsersByRole = async () => {
        setIsLoadingUsers(true);
        try {
          const response = await axios.get(`${API_BASE_URL}/notifications/get_users_for_dropdown.php?role=${specificRoleFilter}`);
          if (response.data.success) {
            setFetchedUsers(response.data.data);
          } else {
            setFetchedUsers([]);
          }
        } catch (error) {
          console.error("Error fetching users:", error);
          setFetchedUsers([]);
        } finally {
          setIsLoadingUsers(false);
        }
      };
      
      fetchUsersByRole();
    }
  }, [specificRoleFilter, formData.targetType, isOpen, API_BASE_URL]);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setFormData({ ...formData, image: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('type', formData.type);
      payload.append('targetType', formData.targetType);
      
      // 🛑 ARCHITECT FIX: Kung 'user' (specific) ang target, 
      // gamitin natin yung 'specificRoleFilter' para tama ang role sa DB.
      // Kung hindi naman specific user, gamitin ang original na targetRole.
      const finalRole = formData.targetType === 'user' ? specificRoleFilter : formData.targetRole;
      payload.append('targetRole', finalRole);

      payload.append('targetUserId', formData.targetUserId);
      payload.append('title', formData.title);
      payload.append('message', formData.message);
      payload.append('dueDate', formData.dueDate);
      payload.append('sender_id', user?.id || 1);
      payload.append('sender_role', user?.role || 'admin');

      if (formData.image) {
        payload.append('image', formData.image);
      }

      const response = await axios.post(`${API_BASE_URL}/notifications/create_notification.php`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setAlertConfig({
          isOpen: true,
          type: 'success',
          title: 'Broadcast Success',
          message: response.data.message
        });
        
        setFormData({
          type: 'Announcement', targetType: 'role', targetRole: 'student', 
          targetUserId: '', title: '', message: '', dueDate: '', image: null
        });
      } else {
        setAlertConfig({
          isOpen: true,
          type: 'error',
          title: 'Sending Failed',
          message: response.data.message
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'System Error',
        message: 'Hindi maka-connect sa server.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
          
          {/* HEADER */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                <Megaphone size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-800">Create Notification</h2>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* FORM BODY */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <form id="notifForm" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Notification Type</label>
                  <div className="relative">
                    <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none">
                      <option value="Announcement">📢 General Announcement</option>
                      <option value="Task Reminder">⚡ Task Reminder</option>
                      <option value="Urgent Alert">🚨 Urgent Alert</option>
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {formData.type === 'Urgent Alert' ? <AlertTriangle size={18} className="text-red-500"/> : 
                       formData.type === 'Task Reminder' ? <Clock size={18} className="text-amber-500"/> : 
                       <Megaphone size={18} className="text-blue-500"/>}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Send To</label>
                  <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200">
                    <button type="button" onClick={() => setFormData({...formData, targetType: 'all'})} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${formData.targetType === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Globe size={14} /> All</button>
                    <button type="button" onClick={() => setFormData({...formData, targetType: 'role'})} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${formData.targetType === 'role' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Users size={14} /> Role</button>
                    <button type="button" onClick={() => setFormData({...formData, targetType: 'user'})} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${formData.targetType === 'user' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><User size={14} /> Specific</button>
                  </div>
                </div>
              </div>

              {formData.targetType === 'role' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Select Specific Role</label>
                  <select value={formData.targetRole} onChange={(e) => setFormData({...formData, targetRole: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500">
                    <option value="student">All Students</option>
                    <option value="teacher">All Teachers</option>
                    <option value="registrar">All Registrars</option>
                    <option value="cashier">All Cashiers</option>
                    <option value="admin">All Admins</option>
                  </select>
                </div>
              )}

              {formData.targetType === 'user' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 relative">
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 block">1. Select Role</label>
                    <select value={specificRoleFilter} onChange={(e) => { setSpecificRoleFilter(e.target.value); setFormData({...formData, targetUserId: ''}); }} className="w-full p-3 bg-white border border-blue-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500">
                      <option value="student">Students</option>
                      <option value="teacher">Teachers</option>
                      <option value="registrar">Registrars</option>
                      <option value="cashier">Cashiers</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                      2. Select Specific User
                      {isLoadingUsers && <Loader2 size={12} className="animate-spin text-blue-600" />}
                    </label>
                    <select 
                      value={formData.targetUserId} 
                      required 
                      onChange={(e) => setFormData({...formData, targetUserId: e.target.value})} 
                      className="w-full p-3 bg-white border border-blue-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-50"
                      disabled={isLoadingUsers || fetchedUsers.length === 0}
                    >
                      <option value="" disabled>
                        {isLoadingUsers ? "Loading users..." : (fetchedUsers.length === 0 ? "No users found" : "Select a user...")}
                      </option>
                      {fetchedUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.id})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className={formData.type === 'Task Reminder' ? 'md:col-span-2' : 'md:col-span-3'}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Title / Subject</label>
                  <input type="text" required placeholder="Ex. Submit Midterm Grades" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500" />
                </div>
                {formData.type === 'Task Reminder' && (
                  <div className="animate-in fade-in zoom-in-95">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Due Date</label>
                    <input type="date" required value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full p-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm font-bold text-amber-700 outline-none focus:border-amber-500" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Message Content</label>
                <textarea required rows="4" placeholder="Type your complete message here..." value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 resize-none"></textarea>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Attach Image (Optional)</label>
                <div className="flex items-center gap-4">
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">
                    <ImageIcon size={16} /> Choose Image
                  </button>
                  {formData.image && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-xl font-bold animate-in fade-in">
                      <Paperclip size={14} /> {formData.image.name}
                      <button type="button" onClick={() => setFormData({...formData, image: null})} className="ml-2 text-red-500 hover:text-red-700"><X size={14} /></button>
                    </div>
                  )}
                </div>
              </div>

            </form>
          </div>

          {/* FOOTER */}
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
            <button type="submit" form="notifForm" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2">
              <Send size={16} className={isSubmitting ? 'animate-pulse' : ''} />
              {isSubmitting ? 'Sending...' : 'Send Notification'}
            </button>
          </div>

        </div>
      </div>

      {/* 4. ARCHITECT UPDATE: RENDER CUSTOM ALERT MODAL */}
      <CustomAlert 
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertConfig({ ...alertConfig, isOpen: false });
          // Kung success ang alert, isara na rin ang main creation modal
          if (alertConfig.type === 'success') onClose();
        }}
      />
    </>
  );
};

export default CreateAnnouncementModal;