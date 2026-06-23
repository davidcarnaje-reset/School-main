import React, { useState, useEffect, useCallback } from 'react';
import { School, Users, Clock, AlertCircle, Zap, BookOpen, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getActiveSchoolYear } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { DashboardSkeleton, StatCard, PageHeader, ClassDetailsModal } from '../../components/shared/TeacherComponents';
import { STAT_CARD_COLORS } from '../../components/shared/teacherConstants';
import ReadNotificationModal from '../../components/shared/ReadNotificationModal';
import OfflineBanner from '../../utils/offlinebanner';



const TeacherDashboard = () => {
  const { syStart, syEnd, semester } = getActiveSchoolYear();
  const { user, API_BASE_URL, branding } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ classes: 0, students: 0, nextSchedule: '--', pendingGrading: 0 });
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]); 
  
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedNotif, setSelectedNotif] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isServerOffline, setIsServerOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const themeColor = branding?.theme_color || '#2563eb';

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (!user?.id) return;
    if (showLoading) setIsLoading(true);
    setIsRetrying(true);
    
    try {
      const token = localStorage.getItem('sms_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [sectionsRes, notifRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/teacher/get_sections.php?teacher_id=${user.id}`, { headers }),
        axios.get(`${API_BASE_URL}/teacher/get_announcements.php`, {
          params: { user_id: user.id, role: user.role || 'teacher', fetch_type: 'specific' },
          headers: headers
        })
      ]);

      let hasError = false;

      // Process Sections (Assigned Classes)
      if (sectionsRes.status === 'fulfilled' && sectionsRes.value.data.status === 'success') {
        const data = sectionsRes.value.data.data || [];
        setSchedules(data);
        setStats(prev => ({
          ...prev,
          classes: data.length,
          students: sectionsRes.value.data.total_overall_students || 0,
          nextSchedule: data[0]?.schedule || '--',
        }));
      } else {
        hasError = true;
      }

      // Process Notifications (Reminders)
      if (notifRes.status === 'fulfilled' && notifRes.value.data.status === 'success') {
        const allNotifs = notifRes.value.data.data || [];
        
        // Filter: ONLY specific notifications for this teacher (not 'all')
        const reminderNotifs = allNotifs.filter(n => {
          const recipientId = String(n.recipient_id || '');
          const currentUserId = String(user.id);
          
          // Check if this is a specific notification for this user
          const isNotAll = recipientId.toLowerCase() !== 'all';
          const matchesUser = recipientId === currentUserId;
          
          return isNotAll && matchesUser;
        });
        
       const formattedTasks = reminderNotifs.slice(0, 6).map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          due: new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          type: n.type || 'Announcement',
          sender: n.sender_name || n.sender_role || 'Admin',
          sender_role: n.sender_role ? n.sender_role.toLowerCase() : '',
          time: n.created_at ? new Date(n.created_at).toLocaleString() : 'Recently',
          attachment: n.attachment,
          reaction: n.reaction, // <--- IDAGDAG ITO
          status: n.type === 'Urgent Alert' ? 'Urgent' : 
                  n.type === 'Task Reminder' ? 'Pending' : 'Announcement',
        }));

        setTasks(formattedTasks);
      } else {
        console.log('Notification fetch failed or returned error');
      }

      setIsServerOffline(hasError && !schedules.length);

    } catch (e) {
      console.error("Dashboard Fetch Error:", e);
      setIsServerOffline(true);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setIsRetrying(false);
      }, 800);
    }
  }, [user?.id, user?.role, API_BASE_URL]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) return <DashboardSkeleton themeColor={themeColor} />;

  const handleUpdateReaction = (notifId, newReaction) => {
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === notifId ? { ...task, reaction: newReaction } : task
    ));
  };

  return (
    <div className="flex flex-col lg:h-full lg:overflow-hidden pb-8 lg:pb-0">
      
      {/* 🟢 CLASS DETAILS MODAL */}
      {selectedClass && (
        <ClassDetailsModal 
          class={selectedClass} 
          onClose={() => setSelectedClass(null)} 
          navigate={navigate} 
          themeColor={themeColor} 
        />
      )}
      

      {/* 🟢 READ NOTIFICATION MODAL */}
      <ReadNotificationModal 
        isOpen={!!selectedNotif} 
        onClose={() => setSelectedNotif(null)} 
        notification={selectedNotif} 
        onReactionUpdate={handleUpdateReaction}
      />

      <div className="shrink-0 space-y-6 mb-6">
        <PageHeader title="Overview" subtitle={`Magandang araw! ${user?.full_name?.split(' ')[0]}.`} badge={`SY ${syStart}-${syEnd} | ${semester}`} themeColor={themeColor} />
        <OfflineBanner isServerOffline={isServerOffline} isRetrying={isRetrying} onRetry={() => fetchDashboardData(false)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard icon={<School size={20} />} label="My Classes" value={stats.classes} color={STAT_CARD_COLORS.classes.color} bg={STAT_CARD_COLORS.classes.bg} />
          <StatCard icon={<Users size={20} />} label="Total Students" value={stats.students} color={STAT_CARD_COLORS.students.color} bg={STAT_CARD_COLORS.students.bg} />
          <StatCard icon={<Clock size={20} />} label="Next Class" value={stats.nextSchedule} color={STAT_CARD_COLORS.schedule.color} bg={STAT_CARD_COLORS.schedule.bg} />
          <StatCard icon={<AlertCircle size={20} />} label="Pending Grades" value={stats.pendingGrading} color={STAT_CARD_COLORS.grading.color} bg={STAT_CARD_COLORS.grading.bg} isHighlight />
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:min-h-0">
        {/* ASSIGNED CLASSES */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-md rounded-[2rem] border border-white flex flex-col overflow-hidden shadow-sm min-h-[400px] lg:min-h-0 lg:h-full">
          <div className="px-6 py-5 border-b border-white/50 bg-white/30 shrink-0 flex justify-between items-center">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" /> Assigned Classes
            </h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              {schedules.length} Active
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scroll p-4 lg:p-6 space-y-3">
            {schedules.map(sched => (
              <div key={sched.id} className="flex items-center justify-between p-4 bg-white/70 rounded-2xl border border-white hover:bg-white hover:shadow-md transition-all group cursor-pointer" onClick={() => setSelectedClass(sched)}>
                <div className="truncate pr-4 flex-1">
                  <h4 className="font-black text-slate-800 text-sm truncate">{sched.subject}</h4>
                  <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">{sched.level} • {sched.section_name}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="hidden md:block text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">{sched.schedule}</span>
                </div>
              </div>
            ))}
            {schedules.length === 0 && !isServerOffline && (
              <div className="h-full flex flex-col items-center justify-center opacity-50">
                <BookOpen size={48} className="mb-3 text-slate-400" />
                <p className="font-bold text-slate-500">No assigned classes yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* REMINDERS */}
        <div className="lg:col-span-1 bg-white/60 backdrop-blur-md rounded-[2rem] border border-white flex flex-col overflow-hidden shadow-sm min-h-[400px] lg:min-h-0 lg:h-full">
          <div className="px-6 py-5 border-b border-white/50 bg-white/30 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Reminders</h3>
            </div>
            {tasks.length > 0 && <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-md border shadow-sm">Recent</span>}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scroll p-4 lg:p-6 space-y-3">
            {tasks.map(task => {
              const isUrgent = task.status === 'Urgent';
              const bgClass = isUrgent ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500';
              const TaskIcon = isUrgent ? Zap : AlertCircle;

              return (
                <div 
                  key={task.id} 
                  onClick={() => setSelectedNotif(task)} 
                  className="p-4 bg-white/70 rounded-2xl border border-white hover:bg-white hover:shadow-md transition-all cursor-pointer group flex items-start gap-3"
                  style={{ '--theme-color': themeColor }} /* 🟢 INJECT THE BRAND COLOR AS CSS VARIABLE */
                >
                  <div className={`p-2 rounded-xl mt-0.5 shadow-sm border border-white ${bgClass}`}>
                    <TaskIcon size={14} />
                  </div>
                  <div className="flex-1">
                    {/* 🟢 USE THE CSS VARIABLE PARA SA GROUP-HOVER */}
                    <p className="text-xs font-black text-slate-800 leading-tight group-hover:text-[var(--theme-color)] transition-colors line-clamp-2">
                      {task.title}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1.5 flex items-center gap-1">
                      <span>{task.type}</span>
                      <span className="opacity-50">•</span>
                      <span>{task.due}</span>
                    </p>
                  </div>
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-60 py-10">
                <CheckCircle size={40} className="mb-3 text-emerald-400" />
                <p className="font-bold text-slate-600 text-sm">You're all caught up!</p>
                <p className="text-xs text-slate-400 mt-1">No reminders for now.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;