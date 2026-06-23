// src/components/lms/ProfileOverview.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Mail, Phone, MapPin, User, BookOpen, Users, Edit3 } from 'lucide-react';

const ProfileOverview = () => {
  const { user, API_BASE_URL } = useAuth(); 
  const [data, setData] = useState({ profile: null, subjects: [], teachers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const studentId = user?.id || user?.student_id || user?.username; 
        
        if (!studentId) {
          console.warn("Walang student ID na nakita.");
          setLoading(false);
          return; 
        }

        const response = await axios.get(`${API_BASE_URL}/lms/get_profile_overview.php?student_id=${studentId}`);
        
        if (response.data && !response.data.error) {
          setData(response.data);
        } else {
          console.error("API Error:", response.data.error);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfileData();
  }, [user, API_BASE_URL]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[var(--primary-color)]" size={40} />
        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Loading Profile...</p>
      </div>
    );
  }

  const { profile = null, subjects = [], teachers = [] } = data || {};

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10">
      
      {/* TOP BANNER
        FIX: Pinalitan ang bg-[#2563eb] ng bg-[var(--primary-color)] para sumunod sa theme settings.
      */}
      <div className="bg-[var(--primary-color)] rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6 text-white shadow-lg shadow-slate-500/10 dark:shadow-none relative overflow-hidden transition-colors">
        
        <div className="relative z-10 shrink-0">
          <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-black border-4 border-white/30 shadow-inner">
            {getInitials(profile?.first_name, profile?.last_name)}
          </div>
          <button className="absolute bottom-1 right-1 bg-white text-[var(--primary-color)] p-2.5 rounded-full hover:bg-slate-100 transition shadow-md">
             <Edit3 size={16} strokeWidth={3} />
          </button>
        </div>
        
        <div className="text-center md:text-left flex-1 z-10">
          <div className="mb-2">
             <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm">
                Student Profile
             </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4 drop-shadow-sm">
            {profile?.first_name || 'No Name'} {profile?.last_name || ''}
          </h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <span className="px-4 py-1.5 bg-black/10 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/10">ID: {profile?.student_id || 'N/A'}</span>
            <span className="px-4 py-1.5 bg-black/10 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/10">{profile?.grade_level || 'N/A'} {profile?.program_code ? `- ${profile.program_code}` : ''}</span>
            <span className="px-4 py-1.5 bg-black/10 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/10">S.Y. {profile?.school_year || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PERSONAL INFO CARD */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
              <User size={18} className="text-[var(--primary-color)]" strokeWidth={3} />
              PERSONAL INFO
            </h2>
            <button className="bg-blue-50 dark:bg-slate-700 text-[var(--primary-color)] dark:text-slate-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider hover:bg-blue-100 dark:hover:bg-slate-600 transition">
              Edit
            </button>
          </div>
          
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-400 shrink-0">
                <Mail size={18} strokeWidth={2.5} />
              </div>
              <div className="pt-1 overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Email Address</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{profile?.email || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-400 shrink-0">
                <Phone size={18} strokeWidth={2.5} />
              </div>
              <div className="pt-1 overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Phone Number</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{profile?.mobile_no || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-400 shrink-0">
                <MapPin size={18} strokeWidth={2.5} />
              </div>
              <div className="pt-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Address</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                  {profile?.address_city ? `${profile.address_city}, ` : ''}{profile?.address_province || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SUBJECTS ENROLLED CARD */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 md:col-span-1 transition-colors">
          <h2 className="text-base font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <BookOpen size={18} className="text-[var(--primary-color)]" strokeWidth={3} />
            SUBJECTS ENROLLED
          </h2>
          <div className="space-y-3">
            {subjects?.length > 0 ? (
              subjects.map((sub, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-[var(--primary-color)] dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary-color)]/10 dark:bg-slate-700 flex items-center justify-center text-[var(--primary-color)] dark:text-slate-300 font-black text-sm group-hover:scale-110 group-hover:text-[var(--primary-color)] dark:group-hover:text-white transition-transform shrink-0">
                    {sub?.subject_code?.charAt(0) || '-'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate group-hover:text-[var(--primary-color)] dark:group-hover:text-white transition-colors">{sub.subject_code}</p>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate mt-0.5 uppercase tracking-wide">{sub.subject_description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No subjects currently enrolled.</p>
              </div>
            )}
          </div>
        </div>

        {/* TEACHERS CARD */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <h2 className="text-base font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Users size={18} className="text-[var(--primary-color)]" strokeWidth={3} />
            INSTRUCTORS
          </h2>
          <div className="space-y-4">
            {teachers?.length > 0 ? (
              teachers.map((teacher, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary-color)]/10 dark:bg-slate-700 text-[var(--primary-color)] dark:text-slate-300 flex items-center justify-center font-black text-sm border-2 border-white dark:border-slate-600 shadow-sm shrink-0">
                    {teacher.image ? (
                      <img src={`/assets/uploads/${teacher.image}`} alt={teacher.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(teacher?.name?.split(' ')[0], teacher?.name?.split(' ')[1])
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate">{teacher.name}</p>
                    <span className="inline-block px-2.5 py-0.5 mt-1 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                      Instructor
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No assigned teachers.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileOverview;