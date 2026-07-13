import React, { useState } from 'react';
import { LifeBuoy, AlertTriangle, Plus, PlusCircle, CheckCircle, Clock } from 'lucide-react';

const ItHelpDesk = () => {
  const [tickets, setTickets] = useState([
    { id: "T-8091", title: "Registrar PC screen flickering and blackouts", user: "Mary Grace (Registrar Staff)", priority: "High", status: "Open", date: "July 13, 2026" },
    { id: "T-8092", title: "Cannot access payroll catalog page", user: "David Carnaje (Cashier)", priority: "High", status: "In Progress", date: "July 13, 2026" },
    { id: "T-8093", title: "Requesting Wi-Fi access configurations in Room 304", user: "Prof. Lopez (Faculty)", priority: "Low", status: "Resolved", date: "July 12, 2026" },
    { id: "T-8094", title: "Printer setup and driver installation request", user: "Ana Cruz (HR)", priority: "Medium", status: "Open", date: "July 11, 2026" },
  ]);

  const [incidents, setIncidents] = useState([
    { id: "INC-21", title: "Primary fiber connection dropped", impact: "High", status: "Resolved", time: "July 10, 14:15 - 15:30" },
    { id: "INC-22", title: "Backup DB replication lag warning", impact: "Medium", status: "Investigating", time: "July 13, 08:30 - Present" }
  ]);

  const [title, setTitle] = useState('');
  const [user, setUser] = useState('');
  const [priority, setPriority] = useState('Medium');

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!title || !user) return;
    const newTicket = {
      id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
      title,
      user,
      priority,
      status: "Open",
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };
    setTickets([newTicket, ...tickets]);
    setTitle('');
    setUser('');
    alert("New support ticket registered successfully!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <LifeBuoy className="text-blue-600" size={32} />
          Help Desk & Support Tickets
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Manage hardware, network, and application concern logs raised by staff users.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TICKETS DIRECTORY */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4">Active Support Queue</h3>
            
            <div className="space-y-4">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 border border-slate-100 hover:border-slate-200 bg-slate-50/50 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 font-mono">{t.id}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${t.priority === 'High' ? 'bg-red-50 text-red-500' : t.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                        {t.priority} Priority
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mt-1.5">{t.title}</h4>
                    <p className="text-slate-400 text-xs font-semibold mt-1">Requested by: <span className="text-slate-600 font-bold">{t.user}</span> • {t.date}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' : t.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'Resolved' ? 'bg-emerald-500' : t.status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INCIDENT REPORTS */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4">Critical Infrastructure Incidents</h3>
            
            <div className="space-y-4">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex items-start gap-3">
                  <AlertTriangle className={`shrink-0 mt-0.5 ${inc.impact === 'High' ? 'text-red-500' : 'text-amber-500'}`} size={20} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-700">{inc.title}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${inc.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{inc.status}</span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 mt-1">Impact Level: {inc.impact} • Time Log: {inc.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* CREATE TICKET FORM */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl h-fit">
          <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2 mb-6">
            <PlusCircle className="text-blue-600" size={22} />
            Log Support Request
          </h3>
          
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">Subject / Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of concern"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">User / Department</label>
              <input 
                type="text" 
                value={user} 
                onChange={(e) => setUser(e.target.value)}
                placeholder="Name (e.g. Jane of Accounting)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">Priority Level</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Submit Ticket
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default ItHelpDesk;
