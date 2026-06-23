import React from 'react';
import { X, Save, Lock, User, Phone, MapPin, Mail, Hash, CheckCircle2, AlertCircle } from 'lucide-react';

const ProfileModal = ({ 
  isOpen, 
  onClose, 
  branding, 
  studentData, 
  editForm, 
  setEditForm, 
  previewUrl, 
  handleFileChange, 
  handleUpdateProfile, 
  API_BASE_URL 
}) => {
  if (!isOpen) return null;

  // LMS Access Logic: Verified if any payment is made
  const isVerified = Number(studentData?.paid_amount || 0) > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in duration-300">
        
        {/* Modal Header */}
        <div style={{ backgroundColor: branding.theme_color }} className="px-10 py-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <User size={20} />
            <h3 className="font-black text-xs uppercase tracking-widest">Update Profile Information</h3>
          </div>
          <button onClick={onClose} type="button" className="hover:bg-white/20 p-2 rounded-xl transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleUpdateProfile} className="p-10 overflow-y-auto space-y-8">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Profile Image Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-40 h-40 rounded-[2rem] overflow-hidden bg-slate-100 border-4 border-white shadow-xl relative group">
                {previewUrl ? (
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                ) : studentData?.profile_image ? (
                  <img src={`${API_BASE_URL}/uploads/profiles/${studentData.profile_image}`} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <User size={60} className="text-slate-300" />
                  </div>
                )}
              </div>
              
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 ${isVerified ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
                {isVerified ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {isVerified ? 'LMS Access Verified' : 'Payment Required'}
                </span>
              </div>

              <label className="bg-slate-900 text-white px-5 py-2.5 rounded-xl cursor-pointer text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md mt-2">
                Change Photo
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
            </div>
            
            {/* Input Fields */}
            <div className="flex-1 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                    <Hash size={10}/> Student ID
                  </label>
                  <div className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-black text-slate-400 flex justify-between items-center cursor-not-allowed">
                    {studentData?.student_id || '---'} <Lock size={12}/>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                    <Hash size={10}/> LRN
                  </label>
                  <div className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-black text-slate-400 flex justify-between items-center cursor-not-allowed">
                    {studentData?.lrn || 'N/A'} <Lock size={12}/>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                    <Mail size={10}/> Email Address
                  </label>
                  <input 
                    type="email"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={editForm?.email || ''} 
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                    <Phone size={10}/> Contact Number
                  </label>
                  <input 
                    type="text"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={editForm?.contact_no || ''} 
                    onChange={(e) => setEditForm({...editForm, contact_no: e.target.value})}
                    placeholder="e.g. 09123456789"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                    <MapPin size={10}/> Home Address
                  </label>
                  <textarea 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[80px] resize-none"
                    value={editForm?.address || ''} 
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    placeholder="Enter full address"
                  />
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            style={{ backgroundColor: branding.theme_color }} 
            className="w-full py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Save size={16} /> Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;