import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Megaphone, Calendar, Info, FileText, DollarSign, ShieldAlert, Bell } from 'lucide-react';
import OfflineBanner from '../../utils/offlinebanner';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/shared/TeacherComponents';
import { DEPARTMENT_STYLES, PRIORITY_TYPES, ANIMATION_DELAYS, SHARED_STYLES } from '../../components/shared/teacherConstants';
import ReadNotificationModal from '../../components/shared/ReadNotificationModal';

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────────
const getAvatarStyle = (roleStr, themeColor, isUrgent) => {
  const role = (roleStr || '').toLowerCase();
  if (isUrgent) return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', text: '#B91C1C' };
  if (role.includes('cashier')) return { bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.2)', text: '#B45309' }; 
  if (role.includes('registrar')) return { bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.2)', text: '#6D28D9' }; 
  if (role.includes('guidance')) return { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', text: '#047857' }; 
  return { bg: `${themeColor}15`, border: `${themeColor}30`, text: themeColor }; 
};

const formatDate = (dateString) => dateString 
  ? new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : 'Recently';

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────
const AnnouncementSkeleton = () => (
  <div className="glass-panel p-5 mb-3 flex flex-col gap-3">
    <div className="flex justify-between items-center mb-1">
      <div className="flex items-center gap-3"><div className="notif-sk w-10 h-10 rounded-xl" /><div className="notif-sk w-24 h-3 rounded-full" /></div>
      <div className="notif-sk w-16 h-5 rounded-full" />
    </div>
    <div className="notif-sk w-3/4 h-5 rounded-md" />
    <div className="notif-sk w-full h-3 rounded-full" /><div className="notif-sk w-5/6 h-3 rounded-full" />
  </div>
);

// 🟢 FIX: Dynamic Color para sa Priority Badge base sa Theme Color
const PriorityBadge = ({ label, isUrgent, themeColor }) => (
  <span 
    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shrink-0 transition-colors"
    style={{
      backgroundColor: isUrgent ? 'rgba(239,68,68,0.1)' : `${themeColor}15`,
      color: isUrgent ? '#DC2626' : themeColor,
      border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.2)' : `${themeColor}30`}`
    }}
  >
    {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
    {isUrgent ? <ShieldAlert size={12} /> : <Info size={12} />}
    {label}
  </span>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const TeacherNotify = () => {
  const { user, API_BASE_URL, branding } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isServerOffline, setIsServerOffline] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const themeColor = branding?.theme_color || '#2563eb';
  const iconMap = useMemo(() => ({ FileText, DollarSign, ShieldAlert, Megaphone }), []);

  const fetchAnnouncements = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/teacher/get_announcements.php`, {
        params: { user_id: user.id, role: user.role || 'teacher', fetch_type: 'general' },
        headers: { Authorization: `Bearer ${localStorage.getItem('sms_token') || ''}` },
      });
      if (response.data.status === 'success') {
        setAnnouncements((response.data.data || []).filter(n => n.type !== 'Task Reminder'));
        setIsServerOffline(false);
      }
    } catch {
      setIsServerOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [user, API_BASE_URL]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handleOpenModal = (ann) => setSelectedNotif({
    id: ann.id, type: ann.type || 'Announcement', title: ann.title || 'Untitled',
    message: ann.message || 'No description provided.', sender: ann.sender_name || ann.sender_role || 'Admin',
    sender_role: ann.sender_role?.toLowerCase() || '', time: formatDate(ann.created_at),
    attachment: ann.attachment, reaction: ann.reaction
  });

  return (
    <div className="w-full h-full overflow-y-auto pr-2 pb-10 custom-scroll" style={{ '--theme-color': themeColor }}>
      <style>{`
        ${SHARED_STYLES}
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background-color: var(--theme-color); opacity: 0.4; border-radius: 10px; }
        
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 20px;
          box-shadow: 0 4px 24px -6px rgba(0, 0, 0, 0.05);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); /* Smoother transition */
        }
        .notif-sk { animation: pulse 1.5s infinite; background: rgba(0,0,0,0.05); }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      
      <div className="max-w-3xl mx-auto space-y-4 relative z-10 pt-2">
        {/* HEADER */}
        <div className="glass-panel p-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${themeColor}15` }}>
              <Bell size={20} style={{ color: themeColor }} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">Announcements</h1>
              <p className="text-[11px] font-bold text-slate-500">School memos and updates</p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl text-[11px] font-black" style={{ background: `${themeColor}15`, color: themeColor }}>
            {announcements.length} Updates
          </div>
        </div>

        <OfflineBanner isServerOffline={isServerOffline} onRetry={fetchAnnouncements} />

        {/* LIST */}
        <div className="space-y-3.5">
          {isLoading ? (
            [1, 2, 3].map(n => <AnnouncementSkeleton key={n} />)
          ) : announcements.length > 0 ? (
            announcements.map((announcement, i) => (
              <AnnouncementCard
                key={announcement.id || i} announcement={announcement} index={i}
                iconMap={iconMap} themeColor={themeColor} onClick={() => handleOpenModal(announcement)}
                API_BASE_URL={API_BASE_URL}
              />
            ))
          ) : !isServerOffline ? (
            <div className="glass-panel py-12 flex justify-center">
              <EmptyState icon={Megaphone} title="All caught up!" message="No general announcements right now." />
            </div>
          ) : null}
        </div>
      </div>

      <ReadNotificationModal
        isOpen={!!selectedNotif} onClose={() => setSelectedNotif(null)}
        notification={selectedNotif} onReactionUpdate={(id, r) => setAnnouncements(p => p.map(n => n.id === id ? { ...n, reaction: r } : n))}
      />
    </div>
  );
};

// ─── ANNOUNCEMENT CARD COMPONENT ─────────────────────────────────────────────
const AnnouncementCard = ({ announcement, index, iconMap, themeColor, onClick, API_BASE_URL }) => {
  const roleStr = (announcement.sender_role || 'general').toLowerCase();
  const DepartmentIcon = iconMap[DEPARTMENT_STYLES[roleStr]?.icon] || Megaphone;
  const isUrgent = announcement.type === 'Urgent Alert';
  const av = getAvatarStyle(roleStr, themeColor, isUrgent);

  return (
    <div
      onClick={onClick}
      className={`glass-panel cursor-pointer relative overflow-hidden flex flex-col p-5 sm:p-6 animate-in fade-in-up group ${index % 2 === 0 ? 'animation-delay-100' : 'animation-delay-150'}`}
      style={{ borderLeft: isUrgent ? '4px solid #EF4444' : '1px solid rgba(255,255,255,0.8)' }}
      // 🟢 FIX: Dynamic Glass Hover Tint Effect base sa inyong Theme Color!
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, ${themeColor}0D 100%)`;
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.005)';
        e.currentTarget.style.borderColor = `${themeColor}40`;
        e.currentTarget.style.boxShadow = `0 12px 32px -8px ${themeColor}35`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
        e.currentTarget.style.boxShadow = '0 4px 24px -6px rgba(0, 0, 0, 0.05)';
      }}
    >
      {/* Accent Progress Bar sa Taas */}
      <div className="absolute top-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-700 ease-in-out" style={{ background: `linear-gradient(90deg, ${themeColor}, transparent)` }} />
      {isUrgent && <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />}

      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 overflow-hidden shadow-sm" style={{ background: av.bg, border: `1px solid ${av.border}` }}>
            {announcement.type === 'System Message' ? (
              <DepartmentIcon size={18} style={{ color: av.text }} />
            ) : announcement.sender_image ? (
              <img src={`${API_BASE_URL}/uploads/profiles/${announcement.sender_image}`} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[15px] font-black" style={{ color: av.text }}>
                {(announcement.sender_name || announcement.sender_role || 'A').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1" style={{ color: av.text }}>
              {announcement.sender_role ? `${announcement.sender_role} Office` : 'General Notice'}
            </p>
            <p className="text-xs font-bold text-slate-500">
              From: <span className="text-slate-800">{announcement.sender_name || announcement.sender_role || 'Admin'}</span>
            </p>
          </div>
        </div>
        {/* 🟢 FIX: Ipinasa ang themeColor dito para magamit ang base color ninyo */}
        <PriorityBadge label={announcement.type || 'Announcement'} isUrgent={isUrgent} themeColor={themeColor} />
      </div>

      {/* CONTENT */}
      <div className="flex-1 mb-2">
        <h3 
          className="text-[17px] sm:text-[19px] font-black text-slate-800 tracking-tight leading-snug mb-2 line-clamp-2 transition-colors duration-300"
          // 🟢 FIX: Hover color ng Title nagbabago dynamically
          onMouseEnter={(e) => e.target.style.color = themeColor}
          onMouseLeave={(e) => e.target.style.color = ''}
        >
          {announcement.title || 'Untitled Announcement'}
        </h3>
        <p className="text-[13px] text-slate-600 font-medium leading-relaxed line-clamp-2">
          {announcement.message || 'No description provided.'}
        </p>
      </div>

      {/* MINIMAL FOOTER */}
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mt-2">
        <Calendar size={13} style={{ color: themeColor }} />
        <span className="uppercase tracking-widest">{formatDate(announcement.created_at)}</span>
      </div>
    </div>
  );
};

export default TeacherNotify;