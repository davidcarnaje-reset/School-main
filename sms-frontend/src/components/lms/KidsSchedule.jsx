import React from 'react';
import { Sun, Clock, MapPin } from 'lucide-react';

const KidsSchedule = ({ scheduleData }) => {
  return (
    <div className="animate-in fade-in zoom-in duration-500">
      {/* Fun Banner */}
      <div className="bg-gradient-to-r from-cyan-400 to-blue-500 p-8 rounded-[3rem] mb-8 text-white relative overflow-hidden shadow-xl">
         <Sun className="absolute right-10 top-5 opacity-20 animate-spin-slow" size={120} />
         <h1 className="text-3xl md:text-4xl font-black mb-2">My Fun Schedule! ☀️</h1>
         <p className="font-bold opacity-90">Let's see what we are learning today.</p>
      </div>

      <div className="space-y-6">
        {scheduleData.map((sched, i) => (
          <div key={i} className="bg-white p-4 rounded-[2.5rem] shadow-lg border-b-8 border-slate-200 flex items-center gap-6">
             {/* Big Colorful Time Block */}
             <div className={`${sched.color} text-white w-28 h-28 rounded-[2rem] flex flex-col items-center justify-center shrink-0 shadow-inner`}>
                <Clock size={28} className="mb-1" />
                <span className="text-sm font-black">{sched.startTime}</span>
             </div>
             
             {/* Subject Details */}
             <div>
                <h3 className="text-2xl font-black text-slate-800">{sched.subject}</h3>
                <p className="text-slate-500 font-bold flex items-center gap-2 mt-1">
                   <MapPin size={18} className="text-rose-400" /> Room: {sched.room}
                </p>
                <p className="text-sm font-bold text-indigo-500 mt-2 bg-indigo-50 inline-block px-3 py-1 rounded-full">
                   Teacher {sched.teacher}
                </p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KidsSchedule;