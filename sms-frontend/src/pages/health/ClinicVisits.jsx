import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Search, RefreshCw, X, Plus, Calendar, Clock, Activity, 
  HelpCircle, UserCheck, MessageSquare, ClipboardList, BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ClinicVisits = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [visits, setVisits] = useState([]);
  const [students, setStudents] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const [visitForm, setVisitForm] = useState({
    student_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: new Date().toTimeString().slice(0, 5),
    complaint: '',
    treatment: '',
    medicine_dispensed: '',
    medicine_qty: 0,
    outcome: 'Returned to Class',
    remarks: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, sRes, mRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/health/visits`),
        axios.get(`${API_BASE_URL}/health/profiles`),
        axios.get(`${API_BASE_URL}/health/inventory`)
      ]);
      if (vRes.data && vRes.data.success) setVisits(vRes.data.data);
      if (sRes.data && sRes.data.success) setStudents(sRes.data.data);
      if (mRes.data && mRes.data.success) setMedicines(mRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_BASE_URL]);

  const handleCreateVisit = async (e) => {
    e.preventDefault();
    if (!visitForm.student_id) {
      alert("Please select a student.");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/health/visits`, visitForm);
      if (res.data && res.data.success) {
        alert("Sick bay log created successfully.");
        setShowNewVisitModal(false);
        setVisitForm({
          student_id: '',
          visit_date: new Date().toISOString().split('T')[0],
          visit_time: new Date().toTimeString().slice(0, 5),
          complaint: '',
          treatment: '',
          medicine_dispensed: '',
          medicine_qty: 0,
          outcome: 'Returned to Class',
          remarks: ''
        });
        fetchData();
      }
    } catch (err) {
      alert("Failed to submit consultation details.");
    }
  };

  const filteredVisits = visits.filter(v => {
    return (
      v.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.complaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.medicine_dispensed?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl">
            <Activity size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Clinic Consultation Logs</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Log daily sick bay consultations, track student chief complaints, medicines given, and medical outcomes.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewVisitModal(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md self-start"
        >
          <Plus size={16} />
          <span>Log Clinic Visit</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, complaint, or medicine..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-rose-500 text-xs font-semibold text-slate-700"
          />
        </div>
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
          Total: {filteredVisits.length} logs
        </div>
      </div>

      {/* Main Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400 font-semibold">
            <RefreshCw className="animate-spin inline-block mr-2" size={16} />
            Loading logs...
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 font-medium">
            No sick bay consultation logs recorded.
          </div>
        ) : (
          filteredVisits.map((visit) => (
            <div key={visit.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
              
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{visit.student_name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{visit.student_id} • Grade {visit.grade_level}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    visit.outcome === 'Sent Home' ? 'bg-red-100 text-red-700' :
                    visit.outcome === 'Rested' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {visit.outcome}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
                  <div className="bg-rose-50/20 p-3 rounded-2xl border border-rose-100/50">
                    <p className="text-[9px] font-black uppercase text-rose-500">Chief Complaint:</p>
                    <p className="text-slate-800 font-bold mt-0.5 leading-relaxed">{visit.complaint}</p>
                  </div>
                  {visit.treatment && (
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400">Treatment/First Aid:</p>
                      <p className="text-slate-600 mt-0.5">{visit.treatment}</p>
                    </div>
                  )}
                  {visit.medicine_dispensed && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                      <p className="text-[9px] font-black uppercase text-slate-400">Medicine Dispensed:</p>
                      <p className="text-slate-700 font-bold mt-0.5">{visit.medicine_dispensed} ({visit.medicine_qty} qty)</p>
                    </div>
                  )}
                  {visit.remarks && (
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400">Nurse Remarks:</p>
                      <p className="text-[11px] text-slate-500 italic mt-0.5">{visit.remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  Date: {visit.visit_date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  Time: {visit.visit_time.slice(0, 5)}
                </span>
              </div>

            </div>
          ))
        )}
      </div>

      {/* NEW VISIT MODAL */}
      {showNewVisitModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-6 md:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="pb-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Activity className="text-rose-600" size={18} />
                <span>Log Clinic consultation Visit</span>
              </h3>
              <button onClick={() => setShowNewVisitModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateVisit} className="space-y-4 overflow-y-auto pr-1 py-4 shrink-0">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Select Patient Student *</label>
                <select 
                  required
                  value={visitForm.student_id}
                  onChange={(e) => setVisitForm({...visitForm, student_id: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-bold text-slate-700"
                >
                  <option value="">-- Select Student --</option>
                  {students.map(s => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.student_name} ({s.student_id} - Grade {s.grade_level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Date *</label>
                  <input 
                    type="date" required max={new Date().toLocaleDateString('en-CA')}
                    value={visitForm.visit_date}
                    onChange={(e) => setVisitForm({...visitForm, visit_date: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Time *</label>
                  <input 
                    type="time" required
                    value={visitForm.visit_time}
                    onChange={(e) => setVisitForm({...visitForm, visit_time: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Chief Complaint *</label>
                <textarea 
                  rows={2} required
                  placeholder="Fever, headache, stomachache, cut, dizziness..."
                  value={visitForm.complaint}
                  onChange={(e) => setVisitForm({...visitForm, complaint: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Treatment / Medicine Dispensed</label>
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    value={visitForm.medicine_dispensed}
                    onChange={(e) => setVisitForm({...visitForm, medicine_dispensed: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-bold text-slate-700"
                  >
                    <option value="">-- Select Medicine --</option>
                    {medicines.map(m => (
                      <option key={m.id} value={m.medicine_name}>
                        {m.medicine_name} ({m.stock_qty} left)
                      </option>
                    ))}
                  </select>
                  <input 
                    type="number" min="0" placeholder="Qty dispensed"
                    value={visitForm.medicine_qty}
                    onChange={(e) => setVisitForm({...visitForm, medicine_qty: parseInt(e.target.value, 10)})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">First Aid / Other Treatment</label>
                <input 
                  type="text" placeholder="e.g. Ice pack applied, wound cleaned, rested in clinic"
                  value={visitForm.treatment}
                  onChange={(e) => setVisitForm({...visitForm, treatment: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Outcome *</label>
                  <select 
                    value={visitForm.outcome}
                    onChange={(e) => setVisitForm({...visitForm, outcome: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-bold text-slate-700"
                  >
                    <option value="Returned to Class">Returned to Class</option>
                    <option value="Rested">Rested in Clinic</option>
                    <option value="Sent Home">Sent Home</option>
                    <option value="Referred to Hospital">Referred to Hospital</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Remarks</label>
                  <input 
                    type="text" placeholder="Other notes"
                    value={visitForm.remarks}
                    onChange={(e) => setVisitForm({...visitForm, remarks: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowNewVisitModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition-all shadow-md"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClinicVisits;
