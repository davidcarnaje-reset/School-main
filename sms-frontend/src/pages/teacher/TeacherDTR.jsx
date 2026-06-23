import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, CalendarDays, MapPin } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; 

const TeacherDTR = () => {
  const { user, API_BASE_URL, branding } = useAuth();
  const themeColor = branding?.theme_color || '#2563eb';
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  // Live Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch DTR Record Today
  useEffect(() => {
    if (user?.id) {
      const fetchTodayDTR = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/teacher/get_dtr_today.php`, {
            params: { teacher_id: user.id }
          });
          if (res.data.status === 'success') {
            setTodayRecord(res.data.data); 
          }
        } catch (error) {
          console.error("Error fetching DTR:", error);
        }
      };
      fetchTodayDTR();
    }
  }, [user, API_BASE_URL]);

  const handleTimeLog = (logType) => {
    setIsLoading(true);
    setLocationStatus('Checking location...');

    // 🟢 Kunin ang GPS Location ng Teacher
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setIsLoading(false);
      setLocationStatus('');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocationStatus('Saving record...');

        try {
        const response = await axios.post(`${API_BASE_URL}/teacher/log_dtr.php`, 
  {
    teacher_id: user.id,
    log_type: logType,
    latitude: lat,
    longitude: lng
  },
  {
    // 🟢 Idagdag ito para pumasa sa Auth Gatekeeper ng PHP
    headers: { Authorization: `Bearer ${localStorage.getItem('sms_token')}` }
  }
);

          // 🟢 FIX: Mas malinaw na error catching
          if (response.data && response.data.status === 'success') {
            alert(`Successfully logged ${logType.replace('_', ' ')}!`);
            
            const loggedTime = new Date().toLocaleTimeString('en-US', { hour12: false });
            setTodayRecord(prev => ({
              ...prev,
              [logType]: loggedTime
            }));
          } else {
            // Kung sakaling hindi JSON ang ibinato ng PHP, ito ang sasalo para hindi 'undefined'
            console.error("Raw Server Response:", response.data);
            alert(response.data?.message || `Server Error: Paki-check ang F12 (Console) para sa totoong PHP Error.`);
          }
        } catch (error) {
          console.error("Axios Error:", error);
          alert("Failed to connect to the server. Paki-check ang console.");
        } finally {
          setIsLoading(false);
          setLocationStatus('');
        }
      },
      (error) => {
        alert("Please ALLOW Location Services to use the DTR.");
        setIsLoading(false);
        setLocationStatus('');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Pilitin ang accurate GPS
    );
  };


  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
        
        <div className="absolute top-[-50%] right-[-10%] w-96 h-96 rounded-full blur-[100px] -z-10 opacity-15" style={{ backgroundColor: themeColor }} />

        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* LEFT: Live Clock */}
          <div className="text-center md:text-left">
            <h2 className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-2 flex items-center justify-center md:justify-start gap-2">
              <CalendarDays size={16} />
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <div className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <p className="text-sm text-slate-500 mt-2 font-semibold flex items-center justify-center md:justify-start gap-1">
              <MapPin size={14} /> GPS Security Enabled
            </p>
            {locationStatus && <p className="text-xs font-bold text-blue-500 mt-2 animate-pulse">{locationStatus}</p>}
          </div>

          {/* RIGHT: Action Buttons */}
          <div className="flex gap-4 w-full md:w-auto">
            
            <button 
              onClick={() => handleTimeLog('time_in')}
              disabled={isLoading || !!todayRecord?.time_in}
              className="flex-1 md:flex-none flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 text-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group min-w-[140px]"
            >
              <LogIn size={32} className="mb-2 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm">TIME IN</span>
              <span className="text-xs font-bold text-slate-400 mt-1">
                {todayRecord?.time_in || '--:--'}
              </span>
            </button>

            <button 
              onClick={() => handleTimeLog('time_out')}
              disabled={isLoading || !todayRecord?.time_in || !!todayRecord?.time_out}
              className="flex-1 md:flex-none flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 hover:border-rose-500 hover:bg-rose-50 text-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group min-w-[140px]"
            >
              <LogOut size={32} className="mb-2 text-rose-500 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm">TIME OUT</span>
              <span className="text-xs font-bold text-slate-400 mt-1">
                {todayRecord?.time_out || '--:--'}
              </span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDTR;