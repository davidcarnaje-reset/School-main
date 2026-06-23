import React, { useState, useCallback, useEffect } from 'react';
import { User, Mail, Phone, Briefcase, BookOpen, Clock, Award, Edit, Bookmark } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import OfflineBanner from '../../utils/offlinebanner';
import { PageHeader, InfoItem, Card, CardHeader, EmptyState } from '../../components/shared/TeacherComponents';
import { SHARED_STYLES, ANIMATION_DELAYS } from '../../components/shared/teacherConstants';

// ─── Profile Skeleton ─────────────────────────────────────────────────────────
const ProfileSkeleton = ({ themeColor }) => (
  <div className="w-full h-full overflow-y-auto pr-2 pb-10">
    <style>{`
      @keyframes profSkPulse {
        0% { background-color: ${themeColor}12; }
        50% { background-color: ${themeColor}2e; }
        100% { background-color: ${themeColor}12; }
      }
      .prof-sk { animation: profSkPulse 1.6s ease-in-out infinite; border-radius: 6px; }
    `}</style>

    <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center bg-white/40 backdrop-blur-md px-5 py-4 rounded-xl border border-white shadow-sm gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <div className="prof-sk" style={{ width: '120px', height: '22px' }} />
          <div className="prof-sk" style={{ width: '260px', height: '13px' }} />
        </div>
        <div className="prof-sk" style={{ width: '110px', height: '38px', borderRadius: '0.75rem' }} />
      </div>

      {/* Profile header card skeleton */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-[2.5rem] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          {/* Avatar */}
          <div className="prof-sk" style={{ width: '128px', height: '128px', borderRadius: '1.6rem', flexShrink: 0 }} />
          <div className="flex-1 w-full flex flex-col gap-4">
            <div className="prof-sk" style={{ width: '55%', height: '36px' }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="prof-sk" style={{ width: '100px', height: '28px', borderRadius: '0.75rem' }} />
              <div className="prof-sk" style={{ width: '120px', height: '28px', borderRadius: '0.75rem' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Info grid skeleton */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 items-start">
        {/* Contact card */}
        <div className="lg:col-span-1 w-full bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/60 bg-white/20">
            <div className="prof-sk" style={{ width: '100px', height: '14px' }} />
          </div>
          <div className="p-6 space-y-5">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex items-start gap-3">
                <div className="prof-sk" style={{ width: '32px', height: '32px', borderRadius: '0.5rem', flexShrink: 0 }} />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="prof-sk" style={{ width: '50%', height: '10px' }} />
                  <div className="prof-sk" style={{ width: '80%', height: '13px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teaching load skeleton */}
        <div className="lg:col-span-2 w-full bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/60 bg-white/20 flex justify-between">
            <div className="prof-sk" style={{ width: '160px', height: '14px' }} />
            <div className="prof-sk" style={{ width: '70px', height: '24px', borderRadius: '0.75rem' }} />
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="p-4 rounded-[1.5rem] border border-white bg-white/50" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="prof-sk" style={{ width: '50px', height: '22px', borderRadius: '0.5rem' }} />
                  <div className="prof-sk" style={{ width: '80px', height: '14px' }} />
                </div>
                <div className="prof-sk" style={{ width: '85%', height: '16px' }} />
                <div className="prof-sk" style={{ width: '70%', height: '28px', borderRadius: '0.75rem' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TeacherProfile = () => {
  const { user, API_BASE_URL, branding } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isServerOffline, setIsServerOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const navigate = useNavigate();

  const themeColor = branding?.theme_color || '#6366f1';

  const fetchTeacherData = useCallback(async (showLoading = true) => {
    if (!user?.id) return;
    if (showLoading) setIsLoading(true);
    setIsRetrying(true);
    try {
      const token = localStorage.getItem('sms_token') || '';
      const response = await axios.get(`${API_BASE_URL}/teacher/profile.php`, {
        params: { id: user.id },
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        timeout: 3000,
      });
      if (response.data.status === 'success') {
        const dbData = response.data.data;
        const nameParts = dbData.full_name?.split(' ') || user?.full_name?.split(' ') || ['Teacher', ''];
        setTeacher({
          ...dbData,
          id: dbData.id || user?.id,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' '),
          profile_image: dbData.profile_image || user?.profile_image,
          role: dbData.role || user?.role || 'Teacher',
          subjects: dbData.subjects || [],
        });
        setIsServerOffline(false);
      } else {
        throw new Error('No profile data found');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setIsServerOffline(true);
      const nameParts = user?.full_name?.split(' ') || ['Teacher', ''];
      setTeacher({
        id: user?.id,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        profile_image: user?.profile_image,
        role: user?.role || 'Teacher',
        subjects: [],
      });
    } finally {
      if (showLoading) setIsLoading(false);
      setTimeout(() => setIsRetrying(false), 800);
    }
  }, [user?.id, API_BASE_URL, user?.full_name, user?.role, user?.profile_image]);

  useEffect(() => {
    if (user?.id) fetchTeacherData(true);
  }, [user?.id, fetchTeacherData]);

  if (isLoading) return (
    <>
      <style>{`
        ${SHARED_STYLES}
        @keyframes profSkPulse {
          0% { background-color: ${themeColor}12; }
          50% { background-color: ${themeColor}2e; }
          100% { background-color: ${themeColor}12; }
        }
        .prof-sk { animation: profSkPulse 1.6s ease-in-out infinite; border-radius: 6px; }
      `}</style>
      <ProfileSkeleton themeColor={themeColor} />
    </>
  );

  if (!teacher) return null;

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

      <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-3 shrink-0 animate-stagger" style={{ animationDelay: ANIMATION_DELAYS.header }}>
          <PageHeader
            title="Your Profile"
            subtitle="View and manage your professional information and teaching credentials."
            action={
              <Link
                to="/teacher/profile/edit"
                className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl text-[11px] font-black shadow-lg transition-all hover:scale-105 active:scale-95 w-full sm:w-auto justify-center"
                style={{ backgroundColor: themeColor }}
              >
                <Edit size={14} /> Edit Profile
              </Link>
            }
          />
          {isServerOffline && (
            <OfflineBanner isServerOffline={isServerOffline} isRetrying={isRetrying} onRetry={() => fetchTeacherData(false)} />
          )}
        </div>

        <ProfileHeaderCard teacher={teacher} API_BASE_URL={API_BASE_URL} themeColor={themeColor} />

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 items-start">
          <ContactInfoCard teacher={teacher} themeColor={themeColor} />
          <TeachingLoadCard teacher={teacher} themeColor={themeColor} />
        </div>
      </div>
    </div>
  );
};

const ProfileHeaderCard = ({ teacher, API_BASE_URL, themeColor }) => (
  <Card className="shrink-0 p-6 sm:p-8 border-white/80 bg-white/70 backdrop-blur-xl rounded-[2.5rem]" animationDelay={ANIMATION_DELAYS.firstCard}>
    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
      <div className="relative p-1.5 rounded-[2rem] bg-white shadow-xl" style={{ border: `2px solid ${themeColor}20` }}>
        {teacher?.profile_image ? (
          <img src={`${API_BASE_URL}/uploads/profiles/${teacher.profile_image}`} alt="Profile" className="w-24 h-24 sm:w-32 sm:h-32 rounded-[1.6rem] object-cover" />
        ) : (
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[1.6rem] flex items-center justify-center text-white text-5xl font-black uppercase shadow-inner" style={{ backgroundColor: themeColor }}>
            {teacher?.firstName?.charAt(0)}{teacher?.lastName?.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1 w-full flex flex-col sm:flex-row sm:justify-between items-center sm:items-end gap-6">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 leading-tight tracking-tighter">
            {teacher.firstName} {teacher.lastName}
          </h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-white">
              <Briefcase size={12} style={{ color: themeColor }} /> {teacher.role}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-white">
              <Bookmark size={12} style={{ color: themeColor }} /> {teacher.department || 'Academic Dept'}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-2.5">
          <span className="px-4 py-2 bg-emerald-100/80 text-emerald-700 border border-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
            {teacher.status || 'Active Account'}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Employee ID: <span className="text-slate-800">{teacher.id}</span>
          </span>
        </div>
      </div>
    </div>
  </Card>
);

const ContactInfoCard = ({ teacher, themeColor }) => (
  <Card className="lg:col-span-1 w-full bg-white/70 backdrop-blur-xl border-white rounded-[2rem]" animationDelay={ANIMATION_DELAYS.firstCard + 100}>
    <CardHeader title="Contact Info" icon={User} />
    <div className="p-6 space-y-5">
      <InfoItem icon={<Mail size={16} style={{ color: themeColor }} />} label="Official Email" value={teacher.email} isMissing={!teacher.email} />
      <InfoItem icon={<Phone size={16} style={{ color: themeColor }} />} label="Phone Number" value={teacher.phone} isMissing={!teacher.phone} />
      <div className="pt-5 border-t border-slate-100">
        <InfoItem icon={<Award size={16} style={{ color: themeColor }} />} label="Date of Appointment" value={teacher.dateHired} isMissing={!teacher.dateHired} />
      </div>
    </div>
  </Card>
);

const TeachingLoadCard = ({ teacher, themeColor }) => (
  <Card className="lg:col-span-2 w-full bg-white/70 backdrop-blur-xl border-white rounded-[2rem]" animationDelay={ANIMATION_DELAYS.firstCard + 200}>
    <CardHeader
      title="Current Teaching Load"
      icon={BookOpen}
      action={
        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white shadow-sm" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>
          {teacher.subjects?.length || 0} Subjects
        </span>
      }
    />
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {teacher.subjects && teacher.subjects.length > 0 ? (
        teacher.subjects.map(subject => <SubjectItem key={subject.id} subject={subject} themeColor={themeColor} />)
      ) : (
        <div className="col-span-full py-10">
          <EmptyState icon={BookOpen} title="No teaching load assigned" message="Please contact the administrator for your schedule." />
        </div>
      )}
    </div>
  </Card>
);

const SubjectItem = ({ subject, themeColor }) => (
  <div className="p-4 rounded-[1.5rem] border border-white bg-white/50 hover:bg-white transition-all duration-300 shadow-sm group">
    <div className="flex justify-between items-start mb-3">
      <span className="text-[9px] font-black px-2 py-1 rounded-lg border border-white uppercase tracking-widest shadow-sm" style={{ backgroundColor: `${themeColor}10`, color: themeColor }}>
        {subject.code}
      </span>
      <div className="flex items-center gap-1.5 text-slate-400">
        <Clock size={12} />
        <span className="text-[10px] font-bold uppercase">{subject.schedule}</span>
      </div>
    </div>
    <h4 className="font-black text-slate-800 text-sm group-hover:text-slate-900 leading-tight mb-2">{subject.name}</h4>
    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-slate-100/50 px-3 py-1.5 rounded-xl border border-white">
      <User size={12} style={{ color: themeColor }} />
      {subject.section || 'TBA'}
    </div>
  </div>
);

export default TeacherProfile;