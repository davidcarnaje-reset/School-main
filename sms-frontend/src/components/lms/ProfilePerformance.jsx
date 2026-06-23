// src/components/lms/ProfilePerformance.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend 
} from 'recharts';
import { Loader2, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const ProfilePerformance = () => {
  const { user, API_BASE_URL } = useAuth();
  const studentId = user?.id || user?.student_id || user?.username;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("");

  useEffect(() => {
    const fetchPerformance = async () => {
      if (!studentId) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/lms/get_student_performance.php?student_id=${studentId}`);
        if (response.data.status === 'success') {
          setData(response.data);
          if (response.data.availableSubjects?.length > 0) {
            setSelectedSubject(response.data.availableSubjects[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching performance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [studentId, API_BASE_URL]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[var(--primary-color)]" size={40} />
        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Loading Analytics...</p>
      </div>
    );
  }

  // DARK MODE HELPER FOR RECHARTS
  const isDark = document.documentElement.classList.contains('dark');
  const chartTextColor = isDark ? '#94a3b8' : '#64748b'; // slate-400 vs slate-500
  const chartGridColor = isDark ? '#334155' : '#f1f5f9'; // slate-700 vs slate-100
  const tooltipBgColor = isDark ? '#1e293b' : '#ffffff'; // slate-800 vs white
  const tooltipTextColor = isDark ? '#f8fafc' : '#1e293b'; // slate-50 vs slate-800

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-10">
      
      {/* HEADER BANNER - FIX: Adaptive Background depending on Theme Color */}
      <div className="bg-[var(--primary-color)] md:rounded-[2.5rem] rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white shadow-lg shadow-slate-500/10 dark:shadow-none transition-colors">
        <div>
          <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-3 inline-block">Analytics</span>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight drop-shadow-sm">Academic Performance</h1>
          <p className="text-white/80 font-medium mt-2 text-sm md:text-base">Track your real-time engagement, submissions, and grades.</p>
        </div>
      </div>

      {/* QUICK STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 md:gap-5 hover:border-indigo-100 dark:hover:border-indigo-500/50 transition-colors group">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-[1.2rem] md:rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
            <TrendingUp size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">General Weighted Average</h3>
            <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">{data?.stats?.gwa || 'N/A'}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 md:gap-5 hover:border-[var(--primary-color)] transition-colors group">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-[1.2rem] md:rounded-[1.5rem] bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
            <Clock size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total LMS Usage</h3>
            <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
              {data?.stats?.total_minutes || 0} <span className="text-xs md:text-sm text-slate-400 dark:text-slate-500 font-bold">mins</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 md:gap-5 hover:border-emerald-100 dark:hover:border-emerald-500/50 transition-colors sm:col-span-2 md:col-span-1 group">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-[1.2rem] md:rounded-[1.5rem] bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
            <CheckCircle size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Completed Tasks</h3>
            <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">{data?.stats?.completed_tasks || 0}</p>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: TIME SPENT */}
        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1 uppercase tracking-wide">LMS Weekly Usage</h3>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-6">Minutes spent per day (Last 7 Days)</p>
          <div className="h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.timeSpent} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                <XAxis dataKey="day" tick={{fontSize: 10, fill: chartTextColor, fontWeight: 700}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fill: chartTextColor, fontWeight: 700}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: `1px solid ${chartGridColor}`, backgroundColor: tooltipBgColor, color: tooltipTextColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                {/* FIX: Adaptive stroke color based on CSS variable */}
                <Line type="monotone" dataKey="minutes" name="Minutes" stroke="var(--primary-color, #2563EB)" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: isDark ? '#1e293b' : '#fff' }} activeDot={{ r: 6, stroke: 'var(--primary-color, #2563EB)', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: LATE VS ON TIME */}
        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1 uppercase tracking-wide">Task Submission Rate (%)</h3>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-6">Ratio of On-Time vs Late passes per subject</p>
          <div className="h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.submissionData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                <XAxis dataKey="subject" tick={{fontSize: 10, fill: chartTextColor, fontWeight: 700}} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{fontSize: 10, fill: chartTextColor, fontWeight: 700}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: isDark ? '#334155' : '#f8fafc'}} contentStyle={{ borderRadius: '1rem', border: `1px solid ${chartGridColor}`, backgroundColor: tooltipBgColor, color: tooltipTextColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, color: chartTextColor, paddingTop: '10px' }} />
                {/* FIX: Primary Color para sa On Time */}
                <Bar dataKey="onTime" stackId="a" fill="var(--primary-color, #2563EB)" name="On Time" radius={[0, 0, 4, 4]} />
                <Bar dataKey="late" stackId="a" fill="#EF4444" name="Late" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: OVERALL GRADES */}
        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1 uppercase tracking-wide">Overall Grades Trend</h3>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-6">Average General Weighted Grade per Quarter</p>
          <div className="h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.overallGrades} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                <XAxis dataKey="quarter" tick={{fontSize: 10, fill: chartTextColor, fontWeight: 700}} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{fontSize: 10, fill: chartTextColor, fontWeight: 700}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: `1px solid ${chartGridColor}`, backgroundColor: tooltipBgColor, color: tooltipTextColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="grade" name="Grade" stroke="#8B5CF6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: isDark ? '#1e293b' : '#fff' }} activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: SUBJECT GRADES (With Dropdown) */}
        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden transition-colors">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 gap-2">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">Subject Performance</h3>
            <select 
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-[var(--primary-color)] outline-none cursor-pointer w-full sm:w-auto transition-colors"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {data?.availableSubjects?.length > 0 ? (
                data.availableSubjects.map(subj => <option key={subj} value={subj}>{subj}</option>)
              ) : (
                <option value="">No Data</option>
              )}
            </select>
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-6">Scores per activity in the selected subject</p>
          <div className="h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.subjectGrades ? data.subjectGrades[selectedSubject] : []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                <XAxis dataKey="activity" tick={{fontSize: 10, fill: chartTextColor, fontWeight: 700}} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{fontSize: 10, fill: chartTextColor, fontWeight: 700}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: `1px solid ${chartGridColor}`, backgroundColor: tooltipBgColor, color: tooltipTextColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                <Line type="stepAfter" dataKey="grade" name="Score (%)" stroke="#10B981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: isDark ? '#1e293b' : '#fff' }} activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePerformance;