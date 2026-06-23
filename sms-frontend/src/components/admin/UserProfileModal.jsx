import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Settings, X, Camera, UserCircle, Save, Lock } from 'lucide-react';

const UserProfileModal = ({ isOpen, onClose, user, branding, logout }) => {
  const { API_BASE_URL } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Kung hindi open ang modal, wag i-render sa screen
  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const submitProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    const formData = new FormData();
    formData.append('id', user?.id || user?.student_id); 
    formData.append('full_name', profileData.full_name);
    formData.append('role', user?.role); // <--- HUWAG KALIMUTAN ITO
    // TINANGGAL NA NATIN YUNG PASSWORD APPEND DITO
    if (profileImage) formData.append('profile_image', profileImage);

    try {
     const res = await axios.post(`${API_BASE_URL}/admin/update_user_profile.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert("Profile updated! Please log in again to see changes.");
        logout(); 
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Server error updating profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
      <form onSubmit={submitProfileUpdate} className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl flex flex-col animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Settings size={20} className="text-blue-500" /> Account Settings
          </h3>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-red-500">
            <X size={20}/>
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          {/* IMAGE UPLOAD SECTION */}
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-4 border-slate-50 shadow-md">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview"/>
                ) : user?.profile_image ? (
                  <img src={`${API_BASE_URL}/uploads/profiles/${user.profile_image}`} className="w-full h-full object-cover" alt="Current"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-300">
                    {user?.full_name?.charAt(0)}
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={24} />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-3 tracking-widest">Click photo to update</p>
          </div>

          {/* USER DETAILS - TINANGGAL ANG PASSWORD FIELD */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest flex items-center gap-1.5">
                <UserCircle size={12}/> Full Name
              </label>
             <div className="relative">
                <input 
                  type="text" 
                  required
                  value={profileData.full_name} 
                  onChange={e=>setProfileData({...profileData, full_name: e.target.value})} 
                  readOnly={user?.role !== 'admin'} 
                  className={`w-full p-4 pr-12 border border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-700 
                    ${user?.role !== 'admin' 
                      ? 'bg-slate-200 cursor-not-allowed text-slate-500' 
                      : 'bg-slate-50 focus:border-blue-500' 
                    }`} 
                />
                
                {/* LALABAS LANG ANG LOCK ICON KUNG HINDI ADMIN */}
                {user?.role !== 'admin' && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </div>
                )}
              </div>

              {user?.role !== 'admin' && (
                <p className="text-[10px] text-red-500 italic ml-2 mt-1 font-medium">
                  * Please contact the Administrator to change your registered name.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[2.5rem] flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
          <button type="submit" disabled={profileLoading} className="flex-1 py-3 font-black text-white rounded-xl shadow-lg transition-all flex justify-center items-center gap-2" style={{ backgroundColor: branding.theme_color || '#2563eb' }}>
            {profileLoading ? <span className="animate-spin">⌛</span> : <><Save size={18}/> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfileModal;