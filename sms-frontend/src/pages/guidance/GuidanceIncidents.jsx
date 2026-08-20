import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  AlertTriangle, Search, Filter, RefreshCw, X, Eye, 
  Check, MessageSquare, AlertCircle, Calendar, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const GuidanceIncidents = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Action remarks modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [targetStatus, setTargetStatus] = useState('');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/guidance/incidents`);
      if (res.data && res.data.success) {
        setIncidents(res.data.data);
      }
    } catch (err) {
      console.error("Fetch incidents error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [API_BASE_URL]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_BASE_URL}/guidance/incidents/${selectedIncident.id}`, {
        status: targetStatus,
        remarks: remarks
      });
      if (res.data && res.data.success) {
        alert("Incident status updated successfully.");
        setShowActionModal(false);
        setRemarks('');
        setSelectedIncident(null);
        fetchIncidents();
      }
    } catch (err) {
      alert("Failed to update incident log.");
    }
  };

  const triggerAction = (incident, status) => {
    setSelectedIncident(incident);
    setTargetStatus(status);
    setRemarks(incident.remarks || '');
    setShowActionModal(true);
  };

  const filteredIncidents = incidents.filter(item => {
    return statusFilter === 'ALL' || item.status === statusFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Incident Reports</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Monitor student bullying disclosures, mental distress flags, and safety concerns.
            </p>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 w-full md:w-auto">
          <Filter size={14} className="text-slate-400 ml-1" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer w-full md:w-auto"
          >
            <option value="ALL">All Reports</option>
            <option value="Reported">Reported</option>
            <option value="Under Review">Under Review</option>
            <option value="Investigating">Investigating</option>
            <option value="Action Taken">Action Taken</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
          Total: {filteredIncidents.length} incidents log entries
        </div>
      </div>

      {/* Main Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400 font-semibold">
            <RefreshCw className="animate-spin inline-block mr-2" size={16} />
            Loading incident logs...
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 font-medium">
            No incident reports recorded.
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <div key={incident.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
              
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`text-sm font-bold ${incident.is_anonymous === 1 ? 'text-purple-700' : 'text-slate-800'}`}>
                      {incident.student_name}
                    </h3>
                    {incident.is_anonymous === 0 && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                        {incident.student_id} • Grade {incident.grade_level}
                      </p>
                    )}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    incident.status === 'Reported' ? 'bg-amber-100 text-amber-700 border-amber-200 border' :
                    incident.status === 'Investigating' ? 'bg-purple-100 text-purple-700' :
                    incident.status === 'Action Taken' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {incident.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400">Incident Details:</p>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap">{incident.details}</p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-1 border-t border-slate-50">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Occurred: {incident.incident_date}
                  </span>
                  <span>Logged: {incident.created_at}</span>
                </div>

                {incident.remarks && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black uppercase text-slate-400">Action Resolution / Remarks:</p>
                    <p className="text-[11px] text-slate-600 italic mt-0.5">{incident.remarks}</p>
                  </div>
                )}
              </div>

              {/* Status Update Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                {incident.status === 'Reported' && (
                  <button
                    onClick={() => triggerAction(incident, 'Under Review')}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Set Under Review
                  </button>
                )}
                {incident.status === 'Under Review' && (
                  <button
                    onClick={() => triggerAction(incident, 'Investigating')}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Start Investigation
                  </button>
                )}
                {(incident.status === 'Investigating' || incident.status === 'Under Review') && (
                  <button
                    onClick={() => triggerAction(incident, 'Action Taken')}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 animate-pulse"
                  >
                    Resolve / Action Taken
                  </button>
                )}
                {incident.status === 'Action Taken' && (
                  <button
                    onClick={() => triggerAction(incident, 'Archived')}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-bold border border-slate-200 text-slate-400 hover:bg-slate-50"
                  >
                    Archive
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* RESOLUTION REMARKS MODAL */}
      {showActionModal && selectedIncident && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="text-blue-500" size={18} />
              <span>Update Incident (Set to {targetStatus})</span>
            </h3>
            
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Resolution notes / Remarks</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Describe resolution steps taken or investigation notes..."
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
                  Submit Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GuidanceIncidents;
