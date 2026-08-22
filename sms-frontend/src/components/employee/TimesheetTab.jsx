import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TimesheetTab = ({ timesheet, timeAdjForm, setTimeAdjForm, handleTimeAdjustment, themeColor }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
                  className={`aspect-square p-2.5 rounded-2xl border flex flex-col justify-between transition-all ${
                    log 
                      ? 'bg-white border-slate-150 shadow-sm hover:shadow-md' 
                      : 'bg-slate-50/30 border-slate-100'
                  }`}
                >
                  <span className={`text-[10px] font-black ${log ? 'text-blue-650' : 'text-slate-400'}`} style={log ? { color: themeColor } : {}}>
                    {day}
                  </span>
                  
                  {log ? (
                    <div className="flex-1 flex flex-col justify-center space-y-0.5 mt-1">
                      <div className="text-[9px] font-bold text-emerald-600 leading-none">
                        IN: {formatTimeAMPM(log.time_in)}
                      </div>
                      <div className="text-[9px] font-bold text-slate-500 leading-none">
                        OUT: {formatTimeAMPM(log.time_out)}
                      </div>
                      
                      {parseFloat(log.ot_hours) > 0 && (
                        <div className="text-[8px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded font-black w-fit mt-1 uppercase tracking-tighter">
                          OT: {parseFloat(log.ot_hours)} hrs
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-[9px] text-slate-350 font-bold uppercase tracking-wider">
                      Off
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
    </div>
  );
};

export default TimesheetTab;
