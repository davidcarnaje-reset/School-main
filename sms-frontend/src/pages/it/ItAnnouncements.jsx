import React, { useState } from 'react';
import { Megaphone, PlusCircle, AlertCircle, CheckCircle } from 'lucide-react';

const ItAnnouncements = () => {
  const [bulletins, setBulletins] = useState([
    { id: 1, title: "Urgent: Scheduled LMS System Maintenance", content: "The digital classroom (LMS) portal will undergo system upgrade on July 18, 2026, from 01:00 AM to 03:00 AM. Access will be temporarily offline.", date: "July 13, 2026", type: "outage" },
    { id: 2, title: "Network Password Security Guidelines", content: "Please update your portal passwords following the complexity requirements: Minimum 10 characters, capital letter, and a special symbol.", date: "July 12, 2026", type: "notice" }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Megaphone className="text-blue-600" size={32} />
            IT Announcements & Alerts
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Broadcast system maintenance schedules, outage updates, and security notices to staff and students.</p>
        </div>
        <button 
          onClick={() => alert("Post bulletin form will be handled soon.")}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle size={16} />
          Publish Announcement
        </button>
      </div>

      {/* BULLETINS LIST */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">Active Bulletins</h3>
        <div className="space-y-6">
          {bulletins.map((b) => (
            <div key={b.id} className="p-6 border border-slate-100 rounded-3xl bg-slate-50/50 flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${b.type === 'outage' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>
                <AlertCircle size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <h4 className="text-base font-black text-slate-800 tracking-tight leading-tight">{b.title}</h4>
                  <span className="text-[10px] font-bold text-slate-400 font-mono bg-white border border-slate-100 px-2.5 py-1 rounded-full">{b.date}</span>
                </div>
                <p className="text-slate-600 text-sm font-medium mt-2 leading-relaxed">{b.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ItAnnouncements;
