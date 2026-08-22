import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clipboard, Check, X, FileText, Calendar, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HrLeave = () => {
  const { API_BASE_URL, branding } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});

  // Leave balance tracking for active staff (standard configuration)
  const [balances, setBalances] = useState([
    { name: "Prof. Del Rosario", role: "Faculty", vacationUsed: 3, vacationLeft: 12, sickUsed: 2, sickLeft: 13 },
    { name: "Clara Santos", role: "Registrar", vacationUsed: 5, vacationLeft: 10, sickUsed: 1, sickLeft: 14 },
    { name: "Jobel Jobert", role: "IT Staff", vacationUsed: 1, vacationLeft: 14, sickUsed: 4, sickLeft: 11 }
  ]);

  const themeColor = branding?.theme_color || '#2563eb';

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/employee-portal/approvals`);
      if (res.data?.success) {
        // Filter only Leave requests
        const filtered = (res.data.requests || []).filter(r => r.request_type === 'Leave');
        setRequests(filtered);
      }
    } catch (error) {
      console.error("Error loading leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const handleAction = async (id, status) => {
    try {
      const actionRemarks = remarks[id] || '';
      const res = await axios.post(`${API_BASE_URL}/employee-portal/approvals/status`, {
        id,
        status,
        remarks: actionRemarks,
        approved_by_email: 'hr@school.edu' // HR actor
      });
      if (res.data?.success) {
        alert(`Leave request has been ${status.toLowerCase()}!`);
        fetchLeaveRequests();
      }
    } catch (error) {
      console.error(error);
      alert("Error evaluating leave request.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Clipboard className="text-blue-600" size={32} style={{ color: themeColor }} />
          Leave & Absence Management
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Handles applications for vacation or sick leave, tracks leave balances compliance, and coordinates manager approvals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEAVE APPLICATIONS QUEUE */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1">
              <FileText size={16} className="text-slate-400" /> Leave Application Queue
            </h3>
            <button onClick={fetchLeaveRequests} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-blue-600"><RefreshCw size={14} /></button>
          </div>
          
          {loading ? (
            <p className="text-xs text-slate-400 text-center py-10 font-bold">Querying leave queue...</p>
          ) : requests.length === 0 ? (
            <p className="text-xs text-slate-400 font-bold text-center py-10">No pending leave applications in queue.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((r) => {
                let d = { request_date: r.created_at, notes: '', entries: [] };
                try {
                  d = typeof r.details === 'string' ? JSON.parse(r.details) : r.details;
                } catch(e) {
                  d = { request_date: r.created_at, notes: r.details, entries: [{ type: r.request_type, reason: r.details }] };
                }

                const firstEntry = d.entries?.[0] || {};

                return (
                  <div key={r.id} className="p-5 border border-slate-100 rounded-3xl bg-slate-50/50 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-slate-200 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-400">ID #{r.id}</span>
                        <h4 className="text-sm font-bold text-slate-800">{r.first_name} {r.last_name} ({r.position})</h4>
                      </div>
                      
                      <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" /> Duration: <strong>{firstEntry.dateFrom ? `${new Date(firstEntry.dateFrom).toLocaleDateString()} - ${new Date(firstEntry.dateTo).toLocaleDateString()}` : r.details}</strong>
                      </p>
                      
                      <p className="text-[11px] text-slate-450 font-medium leading-normal">Reason: "{firstEntry.reason || d.notes || r.details}"</p>
                      {r.remarks && <p className="text-[10px] text-blue-600 font-bold italic">Approver remark: "{r.remarks}"</p>}
                    </div>

                    <div className="flex items-center gap-4 ml-auto md:ml-0">
                      {r.status === 'Pending' ? (
                        <div className="space-y-2 w-48">
                          <input 
                            type="text" 
                            placeholder="Approval remarks..." 
                            value={remarks[r.id] || ''}
                            onChange={e => setRemarks({ ...remarks, [r.id]: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-semibold outline-none focus:border-blue-500"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleAction(r.id, "Approved")} className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm"><Check size={12} /> Approve</button>
                            <button onClick={() => handleAction(r.id, "Rejected")} className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm"><X size={12} /> Reject</button>
                          </div>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          r.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>{r.status}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* STAFF LEAVE BALANCE TRACKER */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1">
            <Sparkles size={14} className="text-amber-500" /> Leave Balance Tracker
          </h3>
          
          <div className="space-y-4 divide-y divide-slate-50">
            {balances.map((b, idx) => (
              <div key={idx} className="pt-3 first:pt-0 space-y-2 text-xs font-semibold">
                <div>
                  <p className="font-bold text-slate-800 leading-tight">{b.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase mt-0.5">{b.role}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px]">
                  <div className="p-2 bg-emerald-50/50 rounded-xl border border-emerald-100 text-emerald-800">
                    <p className="font-black uppercase tracking-wider">Vacation Leave</p>
                    <p className="text-base font-black mt-1 font-mono">{b.vacationLeft} <span className="text-[9px] font-bold">days left</span></p>
                  </div>
                  <div className="p-2 bg-blue-50/50 rounded-xl border border-blue-100 text-blue-800">
                    <p className="font-black uppercase tracking-wider">Sick Leave</p>
                    <p className="text-base font-black mt-1 font-mono">{b.sickLeft} <span className="text-[9px] font-bold">days left</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default HrLeave;
