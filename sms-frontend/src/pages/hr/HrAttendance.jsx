import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardList, Clock, ShieldCheck, Settings, Users, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HrAttendance = () => {
  const { API_BASE_URL, branding } = useAuth();
  const [activeTab, setActiveTab] = useState('DTR Logs'); // 'DTR Logs' or 'Shift Configurations'
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Shift schedule configurations state
  const [shifts, setShifts] = useState([]);

  const [shiftForm, setShiftForm] = useState({ name: '', timeIn: '08:00', timeOut: '17:00', gracePeriod: '15 mins' });
  const themeColor = branding?.theme_color || '#2563eb';
  const [employeeShifts, setEmployeeShifts] = useState([]);

  const fetchDtrLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/employee-portal/dtr-logs`);
      if (res.data?.success) {
        setLogs(res.data.logs || []);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Error loading DTR logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/employee-portal/shifts/templates`);
      if (res.data?.success) {
        const mapped = res.data.templates.map(t => ({
          id: `SH-${t.id}`,
          name: t.shift_name,
          timeIn: t.time_in,
          timeOut: t.time_out,
          gracePeriod: "15 mins",
          status: "Active"
        }));
        setShifts(mapped);
      }
    } catch (err) {
      console.error("Error fetching shift templates:", err);
    }
  };

  const fetchEmployeeShifts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/employee-portal/shifts`);
      if (res.data?.success) {
        setEmployeeShifts(res.data.shifts || []);
      }
    } catch (err) {
      console.error("Error loading employee shifts:", err);
    }
  };

  const handleAssignShift = async (userId, shiftId) => {
    const sh = shifts.find(s => s.id === shiftId);
    if (!sh) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/employee-portal/shifts`, {
        user_id: userId,
        shift_id: sh.id,
        shift_name: sh.name,
        time_in: sh.timeIn,
        time_out: sh.timeOut
      });
      if (res.data?.success) {
        alert("Employee shift updated successfully!");
        fetchEmployeeShifts();
      }
    } catch (err) {
      console.error("Error assigning shift:", err);
      alert("Failed to assign shift.");
    }
  };

  useEffect(() => {
    fetchDtrLogs();
    fetchEmployeeShifts();
    fetchShifts();
  }, []);

  const handleAddShift = (e) => {
    e.preventDefault();
    if (!shiftForm.name) return;
    const newShift = {
      id: `SH-0${shifts.length + 1}`,
      name: shiftForm.name,
      timeIn: shiftForm.timeIn,
      timeOut: shiftForm.timeOut,
      gracePeriod: shiftForm.gracePeriod,
      status: "Active"
    };
    setShifts([...shifts, newShift]);
    setShiftForm({ name: '', timeIn: '08:00', timeOut: '17:00', gracePeriod: '15 mins' });
    alert("New shift schedule configuration deployed to system.");
  };

  // Stats calculation
  const onTimeCount = logs.filter(l => l.status === 'On Time').length;
  const lateCount = logs.filter(l => l.status === 'Late').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardList className="text-blue-600" size={32} style={{ color: themeColor }} />
            Attendance & Time Tracking
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Records daily check-ins, clock-in timings, compliance statistics, and employee shift schedules.</p>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0" style={{ color: themeColor, backgroundColor: `${themeColor}10` }}>
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Total present today</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{logs.length} Staff</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">On-Time Logs</p>
            <h3 className="text-2xl font-black text-slate-850 mt-0.5">{onTimeCount} logs</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Late compliance alerts</p>
            <h3 className="text-2xl font-black text-slate-850 mt-0.5">{lateCount} alerts</h3>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {['DTR Logs', 'Shift Configurations'].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              activeTab === t 
                ? 'border-blue-600 text-blue-600 font-black' 
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
            style={activeTab === t ? { borderBottomColor: themeColor, color: themeColor } : {}}
          >
            {t}
          </button>
        ))}
      </div>

      {/* TAB 1: DTR LOGS */}
      {activeTab === 'DTR Logs' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <Clock size={16} className="text-slate-400" /> Daily Clock-In Ledger
          </h3>
          
          {loading ? (
            <p className="text-xs text-slate-400 text-center py-10 font-bold">Querying logs...</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log, idx) => (
                <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0" style={{ color: themeColor, backgroundColor: `${themeColor}10` }}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{log.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Role: <span className="text-slate-700">{log.position}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Clock Hours</p>
                      <p className="text-xs font-mono font-bold text-slate-750 mt-0.5">{log.timeIn} - {log.timeOut}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Date Logged</p>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">{log.date}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      log.status === 'On Time' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SHIFT CONFIGURATIONS */}
      {activeTab === 'Shift Configurations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LIST SHIFTS */}
          <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Settings size={16} className="text-slate-400" /> Active Campus Shifts
            </h3>
            
            <div className="space-y-4">
              {shifts.map(sh => (
                <div key={sh.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 font-bold">{sh.id}</span>
                      <p className="font-bold text-slate-800">{sh.name}</p>
                    </div>
                    <p className="text-[10px] text-slate-450 mt-1">Clock: <span className="font-mono font-bold text-slate-700">{sh.timeIn} - {sh.timeOut}</span> (Grace Period: {sh.gracePeriod})</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${sh.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{sh.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ADD SHIFT */}
          <div className="lg:col-span-4 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={14} className="text-amber-500" /> Configure Shift
            </h3>
            <form onSubmit={handleAddShift} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Name *</label>
                <input type="text" required placeholder="e.g. Regular Academic Shift" value={shiftForm.name} onChange={e => setShiftForm({ ...shiftForm, name: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift In *</label>
                  <input type="time" required value={shiftForm.timeIn} onChange={e => setShiftForm({ ...shiftForm, timeIn: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Out *</label>
                  <input type="time" required value={shiftForm.timeOut} onChange={e => setShiftForm({ ...shiftForm, timeOut: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grace Period Allowance</label>
                <input type="text" value={shiftForm.gracePeriod} onChange={e => setShiftForm({ ...shiftForm, gracePeriod: e.target.value })} placeholder="e.g. 15 mins" className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" />
              </div>
              <button type="submit" className="w-full py-3 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all" style={{ backgroundColor: themeColor }}>Create Shift Scheme</button>
            </form>
          </div>

          {/* EMPLOYEE SHIFT ASSIGNMENTS */}
          <div className="lg:col-span-12 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Users size={16} className="text-slate-400" /> Employee Shift Assignments
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Employee Name</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Role</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Current Assigned Shift</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Assign New Shift</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeShifts.map((emp) => (
                    <tr key={emp.user_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/20">
                      <td className="py-3.5 pr-2 font-bold text-slate-800">{emp.full_name}</td>
                      <td className="py-3.5 pr-2 uppercase text-[10px] text-slate-450">{emp.role}</td>
                      <td className="py-3.5 pr-2">
                        {emp.shift_name ? (
                          <div>
                            <span className="font-bold text-slate-700">{emp.shift_name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{emp.time_in} - {emp.time_out}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-bold italic">Standard Shift (Default)</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <select
                          value={emp.shift_id || 'SH-01'}
                          onChange={(e) => handleAssignShift(emp.user_id, e.target.value)}
                          className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                        >
                          {shifts.filter(s => s.status === 'Active').map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.timeIn} - {s.timeOut})</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default HrAttendance;
