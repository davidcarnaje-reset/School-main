import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar as CalendarIcon, Clock, MapPin, User, ChevronLeft, 
  ChevronRight, AlertCircle, BookOpen, Edit3, StickyNote, Plus, X, Loader2, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StandardSchedule = ({ scheduleData = [] }) => {
  const { user, API_BASE_URL } = useAuth();
  
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  
  const [reminders, setReminders] = useState({});
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [newReminderText, setNewReminderText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const currentMonthNumber = currentDate.getMonth() + 1;
  
  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
  const startDayOfWeek = new Date(currentYear, currentDate.getMonth(), 1).getDay(); 
  
  const calendarCells = Array.from({ length: 35 }, (_, i) => {
    const dayNum = i - startDayOfWeek + 1;
    return dayNum > 0 && dayNum <= daysInMonth ? dayNum : null;
  });

  // ==========================================
  // [ FETCH NOTES FROM DATABASE ]
  // ==========================================
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const studentId = user?.id || user?.username;
        const res = await axios.get(`${API_BASE_URL}/lms/get_calendar_notes.php?student_id=${studentId}`);
        
        if (res.data.status === 'success') {
          // Binago natin para maging object array: { 18: [{id: 1, text: "note"}], ... }
          const notesMap = {};
          res.data.notes.forEach(note => {
            if (!notesMap[note.day]) notesMap[note.day] = [];
            notesMap[note.day].push({ id: note.id, text: note.note_text });
          });
          setReminders(notesMap);
        }
      } catch (err) {
        console.error("Fetch Notes Error:", err);
      }
    };
    if (user) fetchNotes();
  }, [user, API_BASE_URL]);

  // ==========================================
  // [ DYNAMIC SCHEDULE MAPPING ]
  // ==========================================
  const monthData = useMemo(() => {
    const dataMap = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeekForDate = new Date(currentYear, currentDate.getMonth(), day).getDay();
      const dayNameMap = { 'Su': 0, 'M': 1, 'T': 2, 'W': 3, 'Th': 4, 'F': 5, 'S': 6 };

      const classesForToday = scheduleData.filter(c => {
         if (!c.days) return false;
         return dayNameMap[c.days.trim()] === dayOfWeekForDate;
      });

      if (classesForToday.length > 0) {
        dataMap[day] = { classes: classesForToday, deadlines: [], assigned: [] };
      }
    }
    return dataMap;
  }, [scheduleData, currentYear, currentDate, daysInMonth]);

  // ==========================================
  // [ HANDLERS ]
  // ==========================================
  const handleDayClick = (day) => {
    setSelectedDay(day);
    setViewMode('timeline');
  };

  const addReminder = async () => {
    if (!newReminderText.trim()) return;
    setIsSavingNote(true);

    try {
      const studentId = user?.id || user?.username;
      const formattedDate = `${currentYear}-${String(currentMonthNumber).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

      const res = await axios.post(`${API_BASE_URL}/lms/save_calendar_note.php`, {
        student_id: studentId,
        note_date: formattedDate,
        note_text: newReminderText
      });

      if (res.data.status === 'success') {
        // Isama na ang ID galing sa DB para pwede agad i-delete kung gusto
        const newNote = { id: res.data.id, text: newReminderText };
        
        setReminders(prev => ({ 
          ...prev, 
          [selectedDay]: [...(prev[selectedDay] || []), newNote] 
        }));
        
        setNewReminderText("");
        setIsReminderModalOpen(false);
      } else {
        alert("Failed to save note to cloud.");
      }
    } catch (err) {
      console.error("Save Note Error:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  // ARCHITECT FEATURE: DELETE NOTE HANDLER
  const handleDeleteNote = async (noteId, day) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      const studentId = user?.id || user?.username;
      const res = await axios.post(`${API_BASE_URL}/lms/delete_calendar_note.php`, {
        id: noteId,
        student_id: studentId
      });

      if (res.data.status === 'success') {
        // Alisin natin sa React state para instant mawala sa UI
        setReminders(prev => {
          const updatedDayNotes = prev[day].filter(note => note.id !== noteId);
          return { ...prev, [day]: updatedDayNotes };
        });
      } else {
        alert("Failed to delete the note.");
      }
    } catch (err) {
      console.error("Delete Note Error:", err);
    }
  };

  if (viewMode === 'calendar') {
    return (
      <div className="animate-in zoom-in-95 fade-in duration-500 pb-10">
        {/* DARK MODE FIX: Container Background */}
        <div className="flex justify-between items-center mb-6 md:mb-8 bg-white dark:bg-slate-800 p-4 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
           <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 dark:bg-slate-700 text-[var(--primary-color)] dark:text-blue-400 rounded-xl flex items-center justify-center"><CalendarIcon size={20} className="md:w-6 md:h-6" /></div>
              <div>
                 <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">{currentMonth} {currentYear}</h2>
                 <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500">Academic Overview</p>
              </div>
           </div>
           <div className="flex gap-1 md:gap-2">
              <button className="p-2 md:p-3 bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-xl hover:bg-[var(--primary-color)] hover:text-white dark:hover:bg-[var(--primary-color)] transition-colors"><ChevronLeft size={18}/></button>
              <button className="p-2 md:p-3 bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-xl hover:bg-[var(--primary-color)] hover:text-white dark:hover:bg-[var(--primary-color)] transition-colors"><ChevronRight size={18}/></button>
           </div>
        </div>

        <div className="flex flex-wrap gap-3 md:gap-4 mb-4 md:mb-6 px-2 justify-center md:justify-start">
           <span className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"><div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[var(--primary-color)] dark:bg-blue-500"></div> Classes</span>
           <span className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"><div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500"></div> Deadlines</span>
           <span className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"><div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-orange-500"></div> Assigned</span>
        </div>

        {/* DARK MODE FIX: Main Calendar Grid */}
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 border border-slate-100 dark:border-slate-700 shadow-sm relative z-10 transition-colors">
           <div className="grid grid-cols-7 gap-1 md:gap-4 mb-2 md:mb-4">
             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
               <div key={day} className="text-center text-[9px] md:text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{day.substring(0,1)}<span className="hidden md:inline">{day.substring(1)}</span></div>
             ))}
           </div>
           
           <div className="grid grid-cols-7 gap-1 md:gap-4">
             {calendarCells.map((day, idx) => {
               const dayData = monthData[day];
               const dayReminders = reminders[day];
               const isToday = day === currentDate.getDate();
               const hasContent = dayData || dayReminders?.length > 0;

               return (
                 <div 
                   key={idx} 
                   onClick={() => day && handleDayClick(day)}
                   className={`
                     group relative min-h-[60px] md:min-h-[120px] rounded-xl md:rounded-2xl p-1 md:p-2 transition-all border-2 flex flex-col items-center md:items-start
                     ${day ? 'cursor-pointer hover:border-[var(--primary-color)] dark:hover:border-slate-500 hover:shadow-md bg-slate-50/50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700 hover:z-50' : 'bg-transparent border-transparent'}
                     ${isToday ? 'border-[var(--primary-color)] bg-blue-50/30 dark:bg-[var(--primary-color)]/10 dark:border-[var(--primary-color)]' : 'border-slate-100 dark:border-slate-700/50'}
                   `}
                 >
                   {day && (
                     <>
                        <span className={`text-[10px] md:text-sm font-black ${isToday ? 'text-[var(--primary-color)] dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{day}</span>
                        
                        <div className="mt-auto md:absolute md:bottom-2 md:left-2 md:right-2 flex flex-wrap gap-1 justify-center md:justify-start w-full">
                           {(dayData?.classes?.length > 0) && (
                              <div className="w-1.5 h-1.5 md:w-6 md:h-6 rounded-full md:rounded-lg bg-[var(--primary-color)] md:bg-blue-100 md:text-[var(--primary-color)] flex items-center justify-center"><BookOpen size={12} className="hidden md:block"/></div>
                           )}
                           {dayReminders?.length > 0 && (
                              <div className="w-1.5 h-1.5 md:w-6 md:h-6 rounded-full md:rounded-lg bg-purple-500 md:bg-purple-100 md:text-purple-600 flex items-center justify-center"><StickyNote size={12} className="hidden md:block"/></div>
                           )}
                        </div>

                        {hasContent && (
                           <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none transform scale-95 group-hover:scale-100 z-[150] border border-slate-700">
                              <p className="text-xs font-black text-blue-300 border-b border-slate-700 pb-2 mb-2">{currentMonth} {day}, {currentYear}</p>
                              <div className="space-y-2">
                                 {dayData?.classes?.length > 0 && <div className="flex justify-between items-center text-[10px]"><span className="text-slate-300 flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Classes:</span> <span className="font-bold">{dayData.classes.length}</span></div>}
                                 {dayReminders?.length > 0 && <div className="flex justify-between items-center text-[10px]"><span className="text-slate-300 flex items-center gap-1.5"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Notes:</span> <span className="font-bold text-purple-400">{dayReminders.length}</span></div>}
                              </div>
                           </div>
                        )}
                     </>
                   )}
                 </div>
               )
             })}
           </div>
        </div>
      </div>
    );
  }

  const currentData = monthData[selectedDay] || { classes: [], deadlines: [], assigned: [] };
  const currentReminders = reminders[selectedDay] || [];

  return (
    <div className="animate-in zoom-in-105 fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
         <div>
            <button onClick={() => setViewMode('calendar')} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[var(--primary-color)] transition-colors mb-3">
              <ChevronLeft size={16} /> Back to Calendar
            </button>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{currentMonth} {selectedDay}, {currentYear}</h2>
         </div>
         {/* DARK MODE FIX: Badge for Timeline View */}
         <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-sm font-bold text-[var(--primary-color)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-pulse"></span> {selectedDay === currentDate.getDate() ? 'Today' : 'Selected Date'}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative transition-colors">
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-2"><BookOpen className="text-[var(--primary-color)]" size={20} /> Class Schedule</h3>
            
            {currentData.classes?.length > 0 ? (
               <div className="relative">
                  <div className="absolute left-10 md:left-[4.5rem] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-700"></div>
                  <div className="space-y-8 relative z-10">
                     {currentData.classes.map((sched, idx) => (
                       <div key={sched.class_id || idx} className="flex gap-4 md:gap-8 group">
                          <div className="flex flex-col items-center w-16 md:w-24 shrink-0">
                             <span className="text-xs font-black text-slate-800 dark:text-slate-200">{sched.startTime}</span>
                             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{sched.endTime}</span>
                          </div>
                          {/* Timeline Dot */}
                          <div className={`w-4 h-4 rounded-full bg-white dark:bg-slate-800 border-4 ${sched.color ? sched.color.replace('bg-', 'border-') : 'border-blue-500'} shadow-sm mt-1 shrink-0 group-hover:scale-125 transition-transform`}></div>
                          
                          {/* Timeline Card */}
                          <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-[var(--primary-color)] dark:hover:border-slate-500 hover:shadow-md transition-all cursor-pointer">
                             <div className="flex justify-between items-start mb-2">
                                <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white">{sched.subject}</h3>
                                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg text-white ${sched.color || 'bg-[var(--primary-color)]'}`}>{sched.code}</span>
                             </div>
                             <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-4">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400"><User size={14} className="text-slate-400" /> {sched.teacher || 'TBA'}</div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400"><MapPin size={14} className="text-slate-400" /> {sched.room || 'TBA'}</div>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            ) : <div className="text-center py-12 text-slate-400 font-bold text-sm">No classes scheduled on this day.</div>}
         </div>

         <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-xl text-white">
               <h3 className="text-lg font-black text-white/90 mb-6 flex items-center gap-2"><AlertCircle className="text-red-400" size={18} /> Due & Assigned</h3>
               <div className="space-y-4">
                  {(!currentData.deadlines?.length && !currentData.assigned?.length) && <p className="text-center text-xs text-white/40 font-bold py-4">No tasks due for this day. Relax!</p>}
               </div>
            </div>
            
            {/* DARK MODE FIX: Notes Section */}
            <div className="bg-blue-50 dark:bg-slate-800 rounded-[2.5rem] p-6 md:p-8 border border-blue-100 dark:border-slate-700 transition-colors">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-[var(--primary-color)] dark:text-white flex items-center gap-2"><StickyNote className="text-[var(--primary-color)]" size={18} /> My Notes</h3>
                  <button onClick={() => setIsReminderModalOpen(true)} className="w-8 h-8 rounded-full bg-[var(--primary-color)]/20 dark:bg-[var(--primary-color)] text-[var(--primary-color)] dark:text-white flex items-center justify-center hover:bg-[var(--primary-color)] hover:text-white dark:hover:brightness-110 transition-colors"><Plus size={16} /></button>
               </div>
               <div className="space-y-3">
                  {currentReminders.map((note) => (
                     <div key={note.id} className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-sm border border-blue-50 dark:border-slate-600 flex items-start justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200 group transition-all">
                        <div className="flex items-start gap-3">
                           <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0"></div>
                           <p>{note.text}</p>
                        </div>
                        {/* ARCHITECT FIX: Delete Button shows on hover! */}
                        <button 
                           onClick={() => handleDeleteNote(note.id, selectedDay)} 
                           className="text-slate-300 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-50 dark:hover:bg-slate-600"
                           title="Delete note"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                  ))}
                  {currentReminders.length === 0 && <p className="text-center text-xs text-blue-300 dark:text-slate-500 font-bold py-2">No custom notes for this day.</p>}
               </div>
            </div>
         </div>
      </div>

      {isReminderModalOpen && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-90 duration-200 border border-slate-100 dark:border-slate-700">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-slate-800 dark:text-white">Add Quick Note</h3>
                  <button onClick={() => setIsReminderModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
               </div>
               <textarea 
                  value={newReminderText} 
                  onChange={(e) => setNewReminderText(e.target.value)} 
                  placeholder="E.g., Bring graphing calculator..." 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)]/20 mb-4 min-h-[100px] resize-none transition-colors"
               ></textarea>
               <button 
                  onClick={addReminder} 
                  disabled={isSavingNote} 
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--primary-color)] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-colors disabled:opacity-70"
               >
                  {isSavingNote && <Loader2 size={16} className="animate-spin" />}
                  {isSavingNote ? 'Saving to cloud...' : 'Save Note'}
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default StandardSchedule;