import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Import existing visual layout components
import KidsSchedule from '../../components/lms/KidsSchedule';
import StandardSchedule from '../../components/lms/StandardSchedule';

const LmsSchedule = () => {
  const { user, API_BASE_URL } = useAuth();
  
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. FETCH REAL DB DATA ON COMPONENT LOAD
  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const studentId = user?.id || user?.username;
        if (!studentId) return;

        const res = await axios.get(`${API_BASE_URL}/lms/get_student_schedule.php?student_id=${studentId}`);
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
  
  const isKidsView = gradeLevelNum <= 6;

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Schedule...</p>
      </div>
    );
  }

  return isKidsView ? (
    <KidsSchedule scheduleData={schedule} />
  ) : (
    <StandardSchedule scheduleData={schedule} />
  );
};

export default LmsSchedule;