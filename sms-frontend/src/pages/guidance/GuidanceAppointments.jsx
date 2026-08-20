import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Calendar, Check, X, Clock, HelpCircle, User,
  RefreshCw, CheckCircle2, AlertTriangle, UserCheck, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const GuidanceAppointments = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Remarks state for modal action
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState(''); // 'Approved', 'Cancelled', 'Completed'

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/guidance/appointments`);
      if (res.data && res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      console.error("Fetch appointments error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [API_BASE_URL]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_BASE_URL}/guidance/appointments/${selectedAppt.id}`, {
        status: actionType,
        remarks: remarks
      });
      if (res.data && res.data.success) {
        alert(`Appointment status updated to ${actionType}.`);
        setShowActionModal(false);
        setRemarks('');
        setSelectedAppt(null);
        fetchAppointments();
      }
    } catch (err) {
      alert("Failed to update appointment.");
    }
  };

  const triggerAction = (appt, type) => {
    setSelectedAppt(appt);
    setActionType(type);
    setRemarks(appt.remarks || '');
    setShowActionModal(true);
  };

  const filteredAppts = appointments.filter(appt => {
    return statusFilter === 'ALL' || appt.status === statusFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
            <Calendar size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Counseling Appointments</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Review and manage counseling session request schedules from students.
            </p>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 w-full md:w-auto">
          <Clock size={14} className="text-slate-400 ml-1" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer w-full md:w-auto"
          >
            <option value="ALL">All Schedules</option>
            <option value="Pending">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
          Total: {filteredAppts.length} appointments
        </div>
      </div>

      {/* Appointments List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400 font-semibold">
            <RefreshCw className="animate-spin inline-block mr-2" size={16} />
            Loading schedules...
          </div>
        ) : filteredAppts.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 font-medium">
            No counseling schedules logged.
          </div>
        ) : (
          filteredAppts.map((appt) => (
            <div key={appt.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
              
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">{appt.student_name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{appt.student_id} • Grade {appt.grade_level}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  appt.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                  appt.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                  appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {appt.status}
                </span>
              </div>

              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <div className="flex items-center space-x-2">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <span>Date: {appt.appointment_date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={14} className="text-slate-400 shrink-0" />
                  <span>Time: {appt.appointment_time.slice(0, 5)}</span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400">Reason / Distress details:</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">{appt.reason}</p>
                </div>
                {appt.remarks && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                    <p className="text-[9px] font-black uppercase text-slate-400">Remarks:</p>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">{appt.remarks}</p>
                  </div>
                )}
              </div>

              {/* Actions row */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                {appt.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => triggerAction(appt, 'Cancelled')}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-bold border border-slate-200 text-slate-500 hover:bg-slate-50"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => triggerAction(appt, 'Approved')}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Approve
                    </button>
                  </>
                )}
                {appt.status === 'Approved' && (
                  <>
                    <button
                      onClick={() => triggerAction(appt, 'Cancelled')}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-bold border border-slate-200 text-slate-500 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => triggerAction(appt, 'Completed')}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Mark Completed
                    </button>
                  </>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* ACTION REMARKS MODAL */}
      {showActionModal && selectedAppt && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="text-blue-500" size={18} />
              <span>Update Appointment (Set to {actionType})</span>
            </h3>
            
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Add Counseling Remarks / details</label>
                <textarea 
                  rows={4}
                  placeholder="Provide meeting link, room number, or notes for the student..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all shadow-md"
                >
                  Submit Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GuidanceAppointments;
