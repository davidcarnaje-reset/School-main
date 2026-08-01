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
        <form onSubmit={isVerified ? handleUpdateProfile : (e) => e.preventDefault()} className="p-10 overflow-y-auto space-y-8">
          
          {/* Payment Required Informative Banner */}
          {!isVerified && (
            <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="text-orange-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Account Created - Payment Required
                </div>
                <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                  Mayroon ka nang opisyal na student account sa system, subalit kailangan munang magbayad ng paunang tuition / enrollment fee sa Cashier bago ma-edit ang iyong profile details at ma-unlock ang buong access.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Profile Image Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-40 h-40 rounded-[2rem] overflow-hidden bg-slate-100 border-4 border-white shadow-xl relative group">
                {previewUrl ? (
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                ) : studentData?.profile_image && studentData.profile_image !== 'null' && studentData.profile_image !== 'undefined' ? (
                  <img src={studentData.profile_image.startsWith('http') ? studentData.profile_image : `${API_BASE_URL}/uploads/profiles/${studentData.profile_image}`} className="w-full h-full object-cover" alt="Profile" />
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

              {isVerified ? (
                <label className="bg-slate-900 text-white px-5 py-2.5 rounded-xl cursor-pointer text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md mt-2">
                  Change Photo
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
              ) : (
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5 mt-2">
                  <Lock size={12}/> Photo Locked
                </div>
              )}
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
                    disabled={!isVerified}
                    className={`w-full p-3 border rounded-xl text-[11px] font-bold outline-none transition-all ${
                      isVerified 
                        ? 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20' 
                        : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    value={editForm?.email || ''} 
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    placeholder={isVerified ? "Enter email" : "No email available (Unpaid)"}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                    <Phone size={10}/> Contact Number
                  </label>
                  <input 
                    type="text"
                    disabled={!isVerified}
                    className={`w-full p-3 border rounded-xl text-[11px] font-bold outline-none transition-all ${
                      isVerified 
                        ? 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20' 
                        : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    value={editForm?.contact_no || ''} 
                    onChange={(e) => setEditForm({...editForm, contact_no: e.target.value})}
                    placeholder={isVerified ? "e.g. 09123456789" : "No contact number available (Unpaid)"}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                    <MapPin size={10}/> Home Address
                  </label>
                  <textarea 
                    disabled={!isVerified}
                    className={`w-full p-3 border rounded-xl text-[11px] font-bold outline-none min-h-[80px] resize-none transition-all ${
                      isVerified 
                        ? 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20' 
                        : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    value={editForm?.address || ''} 
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    placeholder={isVerified ? "Enter full address" : "No address available (Unpaid)"}
                  />
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!isVerified}
            style={{ backgroundColor: isVerified ? branding.theme_color : '#94a3b8' }} 
            className={`w-full py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
              isVerified 
                ? 'shadow-lg hover:brightness-110 active:scale-[0.98]' 
                : 'opacity-60 cursor-not-allowed shadow-none'
            }`}
          >
            {isVerified ? (
              <>
                <Save size={16} /> Save Changes
              </>
            ) : (
              <>
                <Lock size={16} /> Editing Disabled (Payment Required)
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;