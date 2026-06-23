import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 🟢 IN-IMPORT ANG useNavigate
import {
  BookOpen, Clock, Layers, FileText,
  Bookmark, GraduationCap
} from 'lucide-react';
import OfflineBanner from '../../utils/offlinebanner';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, EmptyState } from '../../components/shared/TeacherComponents';
import { SHARED_STYLES, ANIMATION_DELAYS } from '../../components/shared/teacherConstants';

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SubjectSkeletonCard = ({ themeColor }) => (
  <div style={{
    background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.8)', borderRadius: '2rem',
    padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem',
    position: 'relative', overflow: 'hidden'
  }}>
    <style>{`
      @keyframes subjSkPulse {
        0% { background-color: ${themeColor}12; }
        50% { background-color: ${themeColor}2e; }
        100% { background-color: ${themeColor}12; }
      }
      .subj-sk { animation: subjSkPulse 1.6s ease-in-out infinite; border-radius: 6px; }
    `}</style>

    {/* Top row */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="subj-sk" style={{ width: '70px', height: '22px', borderRadius: '8px' }} />
      <div className="subj-sk" style={{ width: '60px', height: '22px', borderRadius: '8px' }} />
    </div>

    {/* Title */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
      <div className="subj-sk" style={{ width: '85%', height: '22px' }} />
      <div className="subj-sk" style={{ width: '55%', height: '13px' }} />
    </div>

    {/* Schedule box */}
    <div style={{ background: 'rgba(248,250,252,0.6)', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(226,232,240,1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="subj-sk" style={{ width: '34px', height: '34px', borderRadius: '0.75rem', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          <div className="subj-sk" style={{ width: '40%', height: '10px' }} />
          <div className="subj-sk" style={{ width: '70%', height: '13px' }} />
        </div>
      </div>
    </div>

    {/* Buttons */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div className="subj-sk" style={{ width: '100%', height: '42px', borderRadius: '0.75rem' }} />
      <div className="subj-sk" style={{ width: '100%', height: '38px', borderRadius: '0.75rem' }} />
    </div>
  </div>
);

const TeacherSubjects = () => {
  const { user, API_BASE_URL, branding } = useAuth();
  const navigate = useNavigate(); // 🟢 NAG-INITIALIZE NG useNavigate
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isServerOffline, setIsServerOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const themeColor = branding?.theme_color || '#6366f1';

  const fetchSubjects = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setIsRetrying(true);
    try {
      const token = localStorage.getItem('sms_token') || '';
      const response = await axios.get(`${API_BASE_URL}/teacher/get_my_schedule.php?teacher_id=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        setSubjects(response.data.data || []);
        setIsServerOffline(false);
      } else {
        throw new Error(response.data.message || 'Error fetching schedule');
      }
    } catch (error) {
      console.error('Fetch subjects error:', error);
      setIsServerOffline(true);
      setSubjects([]);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsRetrying(false), 800);
    }
  };

  useEffect(() => {
    if (user?.id) fetchSubjects();
  }, [user?.id]);

  return (
    <div className="w-full h-full overflow-y-auto custom-scroll pr-2 pb-10">
      <style>{`
        ${SHARED_STYLES}
        .custom-scroll::-webkit-scrollbar { width: 8px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: ${themeColor};
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background-color: ${themeColor}; opacity: 0.8; }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="My Subjects"
          subtitle="Pamahalaan ang iyong teaching load, modules, at lesson plans para sa semester na ito."
          badge={`${subjects.length} Assigned Subjects`}
        />

        <OfflineBanner isServerOffline={isServerOffline} isRetrying={isRetrying} onRetry={fetchSubjects} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
          {isLoading ? (
            [1, 2, 3, 4].map(n => <SubjectSkeletonCard key={n} themeColor={themeColor} />)
          ) : subjects.length > 0 ? (
            subjects.map((subject, index) => (
              <SubjectCard 
                key={subject.id || index} 
                subject={subject} 
                index={index} 
                isOffline={isServerOffline} 
                themeColor={themeColor} 
                navigate={navigate} // 🟢 IPINASA ANG navigate FUNCTION SA CARD
              />
            ))
          ) : !isServerOffline ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white shadow-sm">
              <EmptyState icon={BookOpen} title="Walang Assigned na Subject" message="Kasalukuyang wala pang nakatalagang subjects sa iyong account." />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

  const SubjectCard = ({ subject, index, isOffline, themeColor, navigate }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`animate-stagger group relative flex flex-col bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 transform-gpu ${
        isOffline ? 'opacity-70 grayscale-[0.5] pointer-events-none' : 'hover:shadow-2xl hover:-translate-y-2 hover:bg-white'
      }`}
      style={{ 
        animationDelay: `${ANIMATION_DELAYS.firstCard + index * ANIMATION_DELAYS.increment}ms`,
        cursor: 'default' // Default cursor para sa card body
      }}
    >
      <div className="absolute left-0 top-8 bottom-8 w-1.5 transition-all duration-300 rounded-r-full" style={{ backgroundColor: themeColor, opacity: isHovered ? 1 : 0.2 }} />

      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-200/50">
          <GraduationCap size={12} className="text-slate-500" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">{subject.grade_level || 'Grade'}</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl border font-black text-[10px] shadow-sm tracking-tight" style={{ backgroundColor: `${themeColor}15`, borderColor: `${themeColor}30`, color: themeColor }}>
          {subject.units} UNITS
        </div>
      </div>

      <div className="mb-6 flex-1 relative z-10">
        <h3 className="text-xl font-black text-slate-800 leading-tight tracking-tight mb-2 group-hover:text-slate-900 transition-colors">{subject.subject_description}</h3>
        <div className="flex items-center gap-2">
          <Bookmark size={14} style={{ color: themeColor }} className="shrink-0" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Section: {subject.section || 'TBA'}</span>
        </div>
      </div>

      <div className="bg-slate-50/60 rounded-2xl p-4 space-y-3 mb-6 border border-slate-100 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm"><Clock size={14} style={{ color: themeColor }} /></div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Schedule</span>
            <span className="text-[11px] font-bold text-slate-700 truncate">{subject.schedule || 'No Schedule Set'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-auto relative z-10">
        <button 
          onClick={() => navigate(`/teacher/activities/${subject.id}`)}
          className="w-full py-3 rounded-xl text-[12px] font-black transition-all flex items-center justify-center gap-2 shadow-sm border" 
          style={{ 
            backgroundColor: isHovered ? themeColor : '#ffffff', 
            color: isHovered ? '#ffffff' : '#475569', 
            borderColor: isHovered ? themeColor : '#e2e8f0',
            cursor: 'pointer' // 🟢 Ginawang click cursor
          }}
        >
          <Layers size={16} /> View Subject Tasks
        </button>
        
        <button 
          className="w-full py-2.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl text-[11px] font-bold hover:bg-white hover:text-slate-700 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
          style={{ cursor: 'pointer' }} // 🟢 Ginawang click cursor
        >
          <FileText size={14} /> Lesson Plan
        </button>
      </div>
    </div>
  );
};

export default TeacherSubjects;