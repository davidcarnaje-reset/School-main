import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Calendar, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Visual layout components
import KidsSchedule from '../../components/lms/KidsSchedule';
import StandardSchedule from '../../components/lms/StandardSchedule';

const LmsSchedule = () => {
  const { user, API_BASE_URL } = useAuth();
  
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'fun'

  // 1. FETCH REAL DB DATA ON COMPONENT LOAD
  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const studentId = user?.id || user?.username;
        if (!studentId) return;

        const res = await axios.get(`${API_BASE_URL}/lms/get_student_schedule.php?student_id=${studentId}&_t=${Date.now()}`);
        if (res.data.status === 'success') {
          setSchedule(res.data.schedule || []);
        }
      } catch (err) {
        console.error("Schedule Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchSchedule();
  }, [user, API_BASE_URL]);

  // 2. THEME SELECTOR LOGIC
  const gradeLevelStr = user?.grade_level || 'Grade 10'; 
  const gradeLevelNum = parseInt(gradeLevelStr.replace(/\D/g, '')) || 10;
  const isElementaryKid = gradeLevelNum <= 6;

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Syncing Official Schedule...</p>
      </div>
    );
  }

  return (
    <div>
      {/* View Switcher for Kids (allowing them to see full Academic Calendar or Fun Cards) */}
      {isElementaryKid && (
        <div className="flex justify-end mb-4">
          <div className="inline-flex bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'calendar'
                  ? 'bg-[var(--primary-color)] text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Calendar size={14} /> Full Calendar
            </button>
            <button
              onClick={() => setViewMode('fun')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'fun'
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <LayoutGrid size={14} /> Daily Visuals
            </button>
          </div>
        </div>
      )}

      {/* Render Selected View */}
      {viewMode === 'fun' && isElementaryKid ? (
        <KidsSchedule scheduleData={schedule} />
      ) : (
        <StandardSchedule scheduleData={schedule} />
      )}
    </div>
  );
};

export default LmsSchedule;