import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Clock, MapPin, AlertCircle, BookOpen, ArrowRight, Star, Sparkles, CheckCircle2 } from 'lucide-react';

const KidsSchedule = ({ scheduleData = [], tasksData = [] }) => {
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState('today'); // 'today' or 'all'

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0-6
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[dayOfWeek];

  const isClassScheduledOnDay = (classItem, dayNum) => {
    const daysStr = (classItem.days || '').trim().toUpperCase();
    const schedStr = (classItem.schedule || '').trim().toUpperCase();
    const combined = `${daysStr} ${schedStr}`;

    switch (dayNum) {
      case 0:
        return daysStr.includes('SU') || daysStr.includes('SUN') || combined.includes('SUNDAY');
      case 1:
        return daysStr.split(/[\s,]+/).some(d => d === 'M' || d === 'MON') || combined.includes('MWF') || combined.includes('MONDAY');
      case 2:
        return daysStr.split(/[\s,]+/).some(d => d === 'T' || d === 'TUE') || combined.includes('TTH') || combined.includes('TUESDAY');
      case 3:
        return daysStr.split(/[\s,]+/).some(d => d === 'W' || d === 'WED') || combined.includes('MWF') || combined.includes('WEDNESDAY');
      case 4:
        return daysStr.split(/[\s,]+/).some(d => d === 'TH' || d === 'THU') || combined.includes('TTH') || combined.includes('THURSDAY');
      case 5:
        return daysStr.split(/[\s,]+/).some(d => d === 'F' || d === 'FRI') || combined.includes('MWF') || combined.includes('FRIDAY');
      case 6:
        return daysStr.split(/[\s,]+/).some(d => d === 'S' || d === 'SAT') || combined.includes('SATURDAY');
      default:
        return false;
    }
  };

  const todayClasses = scheduleData.filter(c => isClassScheduledOnDay(c, dayOfWeek));
  const displayedClasses = filterMode === 'today' ? todayClasses : scheduleData;

  return (
    <div className="animate-in fade-in zoom-in duration-500 pb-12">
      {/* Fun Banner */}
      <div className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 p-6 md:p-10 rounded-[3rem] mb-8 text-white relative overflow-hidden shadow-xl">
        <Sun className="absolute right-6 top-4 opacity-25 animate-spin-slow" size={130} />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider mb-3">
            <Sparkles size={14} /> Happy {todayName}!
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">My Fun Schedule! ☀️</h1>
          <p className="font-bold opacity-90 text-sm md:text-base">
            {todayClasses.length > 0 
              ? `You have ${todayClasses.length} exciting classes scheduled for today.` 
              : "No classes scheduled for today! Enjoy your activities."}
          </p>
        </div>
      </div>

      {/* 1. MISSIONS & ACTIVITIES POSTED BY TEACHER */}
      {tasksData.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Star className="text-amber-500 fill-amber-500" /> My Fun Activities & Homework
            </h2>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-black rounded-full">
              {tasksData.length} {tasksData.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasksData.slice(0, 4).map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/lms/exam/${task.id}`)}
                className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-md border-b-4 border-amber-400 hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer group flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0 font-black">
                    <AlertCircle size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md">
                      {task.code || 'TASK'}
                    </span>
                    <h4 className="text-base font-black text-slate-800 dark:text-white group-hover:text-amber-600 transition-colors mt-0.5 line-clamp-1">
                      {task.title}
                    </h4>
                    <p className="text-xs font-bold text-slate-400">
                      {task.due_date ? `Due: ${task.due_date}` : 'No due date'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/lms/exam/${task.id}`);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1 shrink-0"
                >
                  Start <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. TODAY'S CLASSES / ALL CLASSES SELECTOR */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <BookOpen className="text-blue-500" /> {filterMode === 'today' ? `Today's Classes (${todayName})` : 'All Enrolled Classes'}
        </h2>

        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setFilterMode('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              filterMode === 'today' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Today ({todayClasses.length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              filterMode === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            All Classes ({scheduleData.length})
          </button>
        </div>
      </div>

      {displayedClasses.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] shadow-sm text-center border border-slate-100 dark:border-slate-700">
          <p className="text-slate-400 font-bold text-sm">No classes scheduled for today! You can review past lessons.</p>
          <button
            onClick={() => setFilterMode('all')}
            className="mt-4 px-5 py-2 bg-blue-500 text-white rounded-xl text-xs font-black shadow-md hover:bg-blue-600"
          >
            View All Classes
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedClasses.map((sched, i) => (
            <div
              key={sched.class_id || i}
              onClick={() => sched.class_id && navigate(`/lms/course/${sched.class_id}`)}
              className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-[2.5rem] shadow-lg border-b-8 border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-4 md:gap-6">
                {/* Big Colorful Time Block */}
                <div className={`${sched.color || 'bg-blue-500'} text-white w-24 h-24 md:w-28 md:h-28 rounded-[2rem] flex flex-col items-center justify-center shrink-0 shadow-inner`}>
                  <Clock size={24} className="mb-1" />
                  <span className="text-xs md:text-sm font-black text-center px-1 leading-tight">{sched.startTime || sched.time}</span>
                </div>
                
                {/* Subject Details */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                    {sched.code}
                  </span>
                  <h3 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white mt-1 group-hover:text-blue-500 transition-colors">
                    {sched.subject}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 text-rose-500">
                      <MapPin size={14} /> Room: {sched.room || 'TBA'}
                    </span>
                    <span>•</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      Teacher: {sched.teacher || 'TBA'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (sched.class_id) navigate(`/lms/course/${sched.class_id}`);
                }}
                className="self-end sm:self-center px-5 py-2.5 bg-blue-500 group-hover:bg-blue-600 text-white rounded-2xl font-black text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                Enter Class <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KidsSchedule;
