import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, Calendar, CheckCircle2, ShieldAlert, LogIn, LogOut, MapPin } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const TimesheetTab = ({ timesheet, timeAdjForm, setTimeAdjForm, handleTimeAdjustment, themeColor, employeeShift }) => {
  const { user, API_BASE_URL } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockLoading, setClockLoading] = useState(false);
  const [clockStatus, setClockStatus] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = Array.isArray(timesheet) ? timesheet.find(l => (l.log_date?.split('T')[0] === todayStr || l.log_date === todayStr)) : null;

  const handleClockLog = (logType) => {
    setClockLoading(true);
    setClockStatus('Verifying GPS location...');

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setClockLoading(false);
      setClockStatus('');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setClockStatus('Saving DTR record...');
        try {
          const res = await axios.post(`${API_BASE_URL}/employee-portal/log-clock`, {
            email: user?.email || user?.username,
            log_type: logType,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });

          if (res.data?.success) {
            alert(res.data.message || `Successfully logged ${logType.replace('_', ' ')}!`);
            window.location.reload();
          } else {
            alert(res.data?.message || "Failed to log DTR time.");
          }
        } catch (err) {
          console.error("Clock log error:", err);
          alert(err.response?.data?.message || "Failed to log DTR time. Please check your location permissions.");
        } finally {
          setClockLoading(false);
          setClockStatus('');
        }
      },
      (err) => {
        console.error("GPS error:", err);
        alert("Please ALLOW Location Services on your device to log your DTR time.");
        setClockLoading(false);
        setClockStatus('');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const monthsList = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const yearsList = [2024, 2025, 2026, 2027, 2028];

  // Helper to format time to 12-hour AM/PM format (e.g., 6:56 AM)
  const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return '';
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12; // 0 should be 12
    return `${hour}:${minute} ${ampm}`;
  };

  // Helper to handle month transition
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Calendar Math
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    // JavaScript getDay() returns 0 for Sunday, 1 for Monday, etc.
    const startDay = new Date(year, month, 1).getDay();
    // Adjust so Monday is 0, Tuesday is 1, ..., Sunday is 6
    return startDay === 0 ? 6 : startDay - 1;
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDayIndex = getFirstDayOfMonth(selectedYear, selectedMonth);

  // Generate calendar grid array
  const calendarCells = [];
  // Fill initial empty cells
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Fill month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  // Find matching DTR log for a specific calendar day
  const findLogForDay = (day) => {
    if (!day) return null;
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return timesheet.find(log => log.log_date.split('T')[0] === formattedDate || log.log_date === formattedDate);
  };

  return (
    <div className="space-y-6">
      
      {/* LIVE DTR CLOCK & TIME IN / TIME OUT ACTION BANNER */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <span className="text-xs font-bold text-slate-400 tracking-widest uppercase flex items-center justify-center md:justify-start gap-2 mb-1">
              <Calendar size={14} />
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <div className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight font-sans">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                <MapPin size={13} className="text-emerald-500" /> GPS Location Geofence Active
              </span>
            </div>
            {clockStatus && <p className="text-xs font-bold text-blue-600 mt-2 animate-pulse">{clockStatus}</p>}
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button
              onClick={() => handleClockLog('time_in')}
              disabled={clockLoading || Boolean(todayLog?.time_in)}
              className="flex-1 md:flex-none flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed group min-w-[130px]"
            >
              <LogIn size={28} className="mb-1 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="font-extrabold text-xs tracking-wider">TIME IN</span>
              <span className="text-[10px] font-bold text-slate-400 mt-1 font-mono">
                {todayLog?.time_in ? formatTimeAMPM(todayLog.time_in) : '--:--'}
              </span>
            </button>

            <button
              onClick={() => handleClockLog('time_out')}
              disabled={clockLoading || !todayLog?.time_in || Boolean(todayLog?.time_out)}
              className="flex-1 md:flex-none flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-slate-100 hover:border-rose-500 hover:bg-rose-50 text-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed group min-w-[130px]"
            >
              <LogOut size={28} className="mb-1 text-rose-500 group-hover:scale-110 transition-transform" />
              <span className="font-extrabold text-xs tracking-wider">TIME OUT</span>
              <span className="text-[10px] font-bold text-slate-400 mt-1 font-mono">
                {todayLog?.time_out ? formatTimeAMPM(todayLog.time_out) : '--:--'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* INTERACTIVE CALENDAR WORKSPACE */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800">Attendance Log History</h3>
              <p className="text-xs text-slate-450 mt-1 font-semibold font-sans">Visual calendar sheet showing daily clock-in/out and overtime parameters.</p>
            </div>
            
            {/* MONTH / YEAR SELECTOR */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-600">
                <ChevronLeft size={16} />
              </button>
              
              <select 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent border-0 outline-none text-xs font-black text-slate-700 cursor-pointer"
              >
                {monthsList.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>

              <select 
                value={selectedYear} 
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent border-0 outline-none text-xs font-black text-slate-700 cursor-pointer"
              >
                {yearsList.map((y, idx) => (
                  <option key={idx} value={y}>{y}</option>
                ))}
              </select>

              <button onClick={handleNextMonth} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-600">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* WEEK DAYS HEADINGS */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>

          {/* CALENDAR CELLS GRID */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((day, idx) => {
              if (!day) {
                return <div key={idx} className="aspect-square bg-slate-50/20 rounded-2xl border border-dashed border-slate-100/50"></div>;
              }

              const log = findLogForDay(day);

              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedDayDetail({ day, log })}
                  className={`aspect-square p-2.5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer hover:border-blue-300 hover:scale-105 active:scale-95 ${
                    log 
                      ? 'bg-white border-slate-150 shadow-sm hover:shadow-md' 
                      : 'bg-slate-50/30 border-slate-100'
                  }`}
                >
                  <span className={`text-[10px] font-black ${log ? 'text-blue-650' : 'text-slate-400'}`} style={log ? { color: themeColor } : {}}>
                    {day}
                  </span>
                  
                  {log ? (
                    <div className="flex-1 flex flex-col justify-end mt-1">
                      <div className="text-[9px] font-bold text-emerald-600 leading-none hidden md:block">
                        IN: {formatTimeAMPM(log.time_in)}
                      </div>
                      <div className="text-[9px] font-bold text-slate-500 leading-none hidden md:block mt-0.5">
                        OUT: {formatTimeAMPM(log.time_out)}
                      </div>
                      
                      {/* Mobile dots indicators */}
                      <div className="flex justify-center gap-1 md:hidden mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {log.time_out && <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>}
                      </div>

                      {parseFloat(log.ot_hours) > 0 && (
                        <div className="text-[8px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded font-black w-fit mt-1 uppercase tracking-tighter hidden md:block">
                          OT: {parseFloat(log.ot_hours)} hrs
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-[9px] text-slate-350 font-bold uppercase tracking-wider">
                      <span className="hidden md:inline">Off</span>
                      <span className="md:hidden text-[6px] opacity-40">•</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TIME ADJUSTMENT REQUEST FORM */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Time Adjustment Request</h3>
          <form onSubmit={handleTimeAdjustment} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Log Date</label>
              <input type="date" required value={timeAdjForm.log_date} onChange={e => setTimeAdjForm({ ...timeAdjForm, log_date: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time In</label>
                <input type="time" required value={timeAdjForm.time_in} onChange={e => setTimeAdjForm({ ...timeAdjForm, time_in: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Out</label>
                <input type="time" required value={timeAdjForm.time_out} onChange={e => setTimeAdjForm({ ...timeAdjForm, time_out: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adjustment Reason</label>
              <textarea required rows={3} value={timeAdjForm.reason} onChange={e => setTimeAdjForm({ ...timeAdjForm, reason: e.target.value })} placeholder="e.g. Forgot to clock out, client official visit..." className="w-full p-3 bg-slate-50 border border-slate-155 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700" />
            </div>
            <button type="submit" className="w-full py-3 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all" style={{ backgroundColor: themeColor }}>Submit Adjustment</button>
          </form>
        </div>

      </div>

      {/* SHIFT DETAILS MODAL */}
      {selectedDayDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-2xl w-full max-w-md space-y-6 relative animate-in zoom-in-95 duration-200">
            {/* CLOSE BUTTON */}
            <button 
              onClick={() => setSelectedDayDetail(null)} 
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>

            {/* HEADER */}
            <div className="space-y-1.5 border-b border-slate-100 pb-4">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5" style={{ color: themeColor }}>
                <Calendar size={12} /> Day Details & Shift Record
              </span>
              <h3 className="text-xl font-black text-slate-800">
                {monthsList[selectedMonth]} {selectedDayDetail.day}, {selectedYear}
              </h3>
            </div>

            {/* ASSIGNED SHIFT */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Work Shift</p>
              <div>
                <p className="font-bold text-slate-800 text-sm">{employeeShift?.shift_name || "Standard Academic Shift"}</p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Prescribed hours: <span className="font-mono font-bold text-slate-700">{employeeShift?.time_in || "08:00 AM"} - {employeeShift?.time_out || "05:00 PM"}</span>
                </p>
              </div>
            </div>

            {/* LOG TIMINGS */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Logs</p>
              {selectedDayDetail.log ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-emerald-100 bg-emerald-50/20 rounded-2xl">
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Clock In</p>
                    <p className="text-sm font-mono font-bold text-slate-800 mt-1">{formatTimeAMPM(selectedDayDetail.log.time_in)}</p>
                  </div>
                  <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Clock Out</p>
                    <p className="text-sm font-mono font-bold text-slate-800 mt-1">{selectedDayDetail.log.time_out ? formatTimeAMPM(selectedDayDetail.log.time_out) : "No log"}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 font-semibold text-xs py-6">
                  No clock-in/out record found for this day. (Off-duty / Weekend / Absent)
                </div>
              )}
            </div>

            {/* STATUS BADGE & OVERTIME */}
            {selectedDayDetail.log && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Status</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    selectedDayDetail.log.status === 'On Time' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                  }`}>
                    {selectedDayDetail.log.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overtime Hours</p>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                    {parseFloat(selectedDayDetail.log.ot_hours || 0) > 0 ? `${parseFloat(selectedDayDetail.log.ot_hours)} hrs` : "None filed"}
                  </p>
                </div>
              </div>
            )}

            {/* ACTION */}
            <button 
              onClick={() => setSelectedDayDetail(null)} 
              className="w-full py-3 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all"
              style={{ backgroundColor: themeColor }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetTab;
