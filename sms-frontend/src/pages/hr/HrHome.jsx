import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, Cake, Calendar, Gift, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreateAnnouncementModal from '../../components/shared/CreateAnnouncementModal';

const HrHome = () => {
  const { branding, API_BASE_URL, user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const themeColor = branding?.theme_color || '#2563eb';
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Announcements (General Staff Memos)
      const currentUserId = user?.id || 1;
      const currentRole = user?.role || 'hr';
      const annRes = await axios.get(`${API_BASE_URL}/teacher/get_announcements.php`, {
        params: { user_id: currentUserId, role: currentRole, fetch_type: 'specific' }
      });
      if (annRes.data?.status === 'success') {
        setAnnouncements(annRes.data.data || []);
      }

      // 2. Fetch Staff Birthdays
      const bdayRes = await axios.get(`${API_BASE_URL}/admin/birthdays`);
      if (bdayRes.data?.success) {
        setBirthdays(bdayRes.data.birthdays || []);
      }
    } catch (error) {
      console.error("Error fetching HR Home data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center font-black animate-pulse text-slate-400 uppercase tracking-widest gap-4">
        <Loader2 className="animate-spin text-blue-650" style={{ color: themeColor }} size={40} />
        Loading HR Hub...
      </div>
    );
  }

  // Filter birthdays for "Today" vs "Upcoming"
  const todayBirthdays = birthdays.filter(b => b.daysUntil === 0 || b.daysUntil === 365);
  const upcomingBirthdays = birthdays.filter(b => b.daysUntil > 0 && b.daysUntil < 365).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-800">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-1 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" /> Human Resources Hub
          </p>
          <h1 className="text-3xl font-black tracking-tight leading-none">
            Welcome back, {user?.full_name?.split(' ')[0] || 'HR Officer'}!
          </h1>
          <p className="mt-2 text-slate-300 font-medium text-sm">
            View staff notices, check campus celebrants, and manage employee lifecycles.
          </p>
        </div>
        <span className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-black uppercase tracking-wider border border-indigo-500/30">
          General Overview
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ANNOUNCEMENTS NEWS FEED (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-850 tracking-tight flex items-center gap-2">
              <Megaphone className="text-indigo-600" size={24} />
              Announcements & Memos
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md shadow-indigo-200 flex items-center gap-2"
              >
                <Megaphone size={14} /> Post Announcement
              </button>
              <span className="text-xs text-slate-400 font-bold font-mono">{announcements.length} Active Notices</span>
            </div>
          </div>

          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center">
                <AlertCircle className="opacity-25 mb-3" size={48} />
                <p className="text-sm font-bold uppercase tracking-wider">No active announcements</p>
                <p className="text-xs text-slate-400 mt-1">Announcements sent to staff will appear here.</p>
              </div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                        {ann.sender_image ? (
                          <img src={`${API_BASE_URL}/uploads/profiles/${ann.sender_image}`} className="w-full h-full object-cover" alt="Sender" />
                        ) : (
                          <Megaphone size={18} className="text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 leading-tight">{ann.title}</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
                          Posted by: <span className="text-slate-600 font-bold">{ann.sender_name || ann.sender_role}</span> • {new Date(ann.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {ann.type === 'Urgent Alert' && (
                      <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                        Urgent
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed font-semibold whitespace-pre-wrap pl-13">
                    {ann.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: BIRTHDAYS (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-850 tracking-tight flex items-center gap-2">
              <Cake className="text-pink-600" size={24} />
              Staff Birthdays
            </h2>
            <Gift className="text-pink-400 shrink-0" size={20} />
          </div>

          {/* TODAY'S CELEBRANTS */}
          {todayBirthdays.length > 0 && (
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-[2rem] p-6 shadow-xl space-y-4 border border-pink-400 animate-pulse">
              <div className="flex items-center gap-2">
                <Gift size={20} className="text-amber-300" />
                <h3 className="text-sm font-black uppercase tracking-widest leading-none">Celebrating Today! 🎂</h3>
              </div>
              <div className="divide-y divide-white/20">
                {todayBirthdays.map((b, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-black leading-tight">{b.full_name || `${b.first_name} ${b.last_name}`}</p>
                      <p className="text-[10px] text-pink-100 font-black uppercase tracking-wider mt-0.5">{b.role}</p>
                    </div>
                    <span className="text-[10px] bg-white/20 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-white/10 shrink-0">
                      Happy Birthday!
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UPCOMING CELEBRANTS */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-450 flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" /> Upcoming Birthdays
            </h3>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-6 text-center">No upcoming birthdays found.</p>
            ) : (
              <div className="space-y-4">
                {upcomingBirthdays.map((b, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-black border border-pink-100 shrink-0 uppercase">
                        {(b.first_name || 'E').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate leading-tight">{b.full_name || `${b.first_name} ${b.last_name}`}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5 truncate">{b.role}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-black text-slate-700 leading-tight">
                        {new Date(b.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[9px] text-pink-600 font-black mt-0.5 uppercase tracking-tighter">
                        in {b.daysUntil} days
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      <CreateAnnouncementModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          fetchData();
        }}
      />
    </div>
  );
};

export default HrHome;
