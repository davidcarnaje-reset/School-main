import React from 'react';
import { Calendar, Clock, ShieldCheck } from 'lucide-react';

const CustodianReservations = () => {
  const bookings = [
    { facility: "Audio Visual Room 1", staff: "Prof. Lopez (Science Seminar)", time: "09:00 AM - 11:30 AM", date: "July 15, 2026", status: "Approved" },
    { facility: "Main Gymnasium Court", staff: "Coach Ramos (PE Class)", time: "01:00 PM - 03:00 PM", date: "July 16, 2026", status: "Approved" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Calendar className="text-blue-600" size={32} />
          Facilities & Room Bookings
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Approve and log reservations for institutional conference halls, laboratories, and the gymnasium.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Reservations Schedule</h3>
        <div className="space-y-4">
          {bookings.map((b, i) => (
            <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{b.facility}</h4>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Reserved by: <span className="text-slate-800 font-bold">{b.staff}</span></p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Duration: {b.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-500">{b.date}</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ShieldCheck size={12} />
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CustodianReservations;
