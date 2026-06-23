import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react'; // Para sa loading state
import { useAuth } from '../../context/AuthContext';

// Import natin ang mga components
import KidsDashboard from '../../components/lms/KidsDashboard';
import StandardDashboard from '../../components/lms/StandardDashboard';

const LmsDashboard = () => {
  const { user, API_BASE_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Real Database States
  const [myCourses, setMyCourses] = useState([]);
  const [nextLessons, setNextLessons] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Kunin ang ID (user.id o user.username base sa huling debug natin)
        const studentIdentifier = user?.id || user?.username;
        
        if (!studentIdentifier) return;

        // Kumonekta sa ating get_dashboard.php
        const response = await axios.get(`${API_BASE_URL}/lms/get_dashboard.php?student_id=${studentIdentifier}&_t=${Date.now()}`);
        
        if (response.data.status === 'success') {
          setMyCourses(response.data.courses || []);
          setNextLessons(response.data.nextLessons || []);
          setStats(response.data.stats || null);
        }
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchDashboardData();
  }, [user, API_BASE_URL]);

  // THEME SELECTOR LOGIC
  const gradeLevelStr = user?.grade_level || 'Grade 10'; 
  const gradeLevelNum = parseInt(gradeLevelStr.replace(/\D/g, '')) || 10;
  const isKidsView = gradeLevelNum <= 6;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 font-black uppercase tracking-widest gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
        Syncing Classroom Data...
      </div>
    );
  }

  // Render the selected component with REAL data
  return isKidsView ? (
    <KidsDashboard courses={myCourses} stats={stats} />
  ) : (
    <StandardDashboard 
      courses={myCourses} 
      nextLessons={nextLessons} 
      stats={stats} 
    />
  );
};

export default LmsDashboard;