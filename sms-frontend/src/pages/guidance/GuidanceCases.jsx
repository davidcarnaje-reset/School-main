import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Eye, Trash2, X, Search, Filter,
  RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, Calendar, Heart, BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const GuidanceCases = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [cases, setCases] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  
  // Lists
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form States
  const [newCaseForm, setNewCaseForm] = useState({
    student_id: '',
    case_title: '',
    case_type: 'Anxiety',
    severity: 'Medium',
    notes: ''
  });
  const [newSessionForm, setNewSessionForm] = useState({
    session_date: new Date().toISOString().split('T')[0],
    action_plan: '',
    remarks: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/guidance/cases`);
      if (res.data && res.data.success) {
        setCases(res.data.data);
      }
      
      const studRes = await axios.get(`${API_BASE_URL}/registrar/get_students_list.php`);
      if (Array.isArray(studRes.data)) {
        setStudents(studRes.data);
      }
    } catch (err) {
      console.error("Fetch cases error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async (caseId) => {
    setSessionsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/guidance/cases/${caseId}/sessions`);
      if (res.data && res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error("Fetch sessions error:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_BASE_URL]);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/guidance/cases`, newCaseForm);
      if (res.data && res.data.success) {
        alert("Case file logged successfully.");
        setShowAddModal(false);
        setNewCaseForm({ student_id: '', case_title: '', case_type: 'Anxiety', severity: 'Medium', notes: '' });
        fetchData();
      }
    } catch (err) {
      alert("Failed to create case: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateStatus = async (caseId, status) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/guidance/cases/${caseId}`, { status });
      if (res.data && res.data.success) {
        alert("Case status updated to " + status);
        fetchData();
      }
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/guidance/cases/${selectedCase.id}/sessions`, newSessionForm);
      if (res.data && res.data.success) {
        alert("Session notes recorded successfully.");
        setNewSessionForm({ session_date: new Date().toISOString().split('T')[0], action_plan: '', remarks: '' });
        fetchSessions(selectedCase.id);
      }
    } catch (err) {
      alert("Failed to record session note.");
    }
  };

  const openSessions = (c) => {
    setSelectedCase(c);
    setShowSessionsModal(true);
    fetchSessions(c.id);
  };

  // Filter Logic
  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.case_title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || c.case_type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-600/10 text-red-600 rounded-2xl">
            <Heart size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Student Counseling Cases</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Keep logs of counseling records, session action plans, and track mental health concerns.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md"
        >
          <Plus size={16} />
          <span>Open Case File</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, case title..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 w-full md:w-auto">
            <Filter size={14} className="text-slate-400 ml-1" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer w-full md:w-auto"
            >
              <option value="ALL">All Case Types</option>
              <option value="Anxiety">Anxiety / Depression</option>
              <option value="Bullying">Bullying incident</option>
              <option value="Family">Family issues</option>
              <option value="Behavioral">Behavioral concern</option>
              <option value="Academic">Academic stress</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 w-full md:w-auto">
            <CheckCircle2 size={14} className="text-slate-400 ml-1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer w-full md:w-auto"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Under Observation">Under Observation</option>
              <option value="Resolved">Resolved</option>
              <option value="Referred">Referred</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Cases Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-4">Student</th>
                <th className="p-4">Case Title</th>
                <th className="p-4">Type</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Status</th>
                <th className="p-4">Logged Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 font-semibold">
                    <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                    Loading cases...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 font-medium">
                    No counseling case files found.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{c.student_name}</div>
                      <div className="text-[10px] font-bold text-slate-400">{c.student_id} • Grade {c.grade_level}</div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-700">{c.case_title}</p>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-600">{c.case_type}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        c.severity === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                        c.severity === 'High' ? 'bg-amber-100 text-amber-700' :
                        c.severity === 'Medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <select 
                        value={c.status}
                        onChange={(e) => handleUpdateStatus(c.id, e.target.value)}
                        className={`text-xs font-bold p-1 rounded-lg border outline-none bg-transparent cursor-pointer ${
                          c.status === 'Active' ? 'text-blue-700 border-blue-200 bg-blue-50/20' :
                          c.status === 'Resolved' ? 'text-emerald-700 border-emerald-200 bg-emerald-50/20' :
                          c.status === 'Referred' ? 'text-purple-700 border-purple-200 bg-purple-50/20' :
                          'text-slate-600 border-slate-200'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Under Observation">Under Observation</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Referred">Referred</option>
                      </select>
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-semibold">{c.created_at}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openSessions(c)}
                        className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all"
                        title="View Case Sessions"
                      >
                        <BookOpen size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: OPEN CASE FILE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Heart className="text-red-500 animate-pulse" size={18} />
                <span>Open Student Counseling Record</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateCase} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Select Student</label>
                <select 
                  required
                  value={newCaseForm.student_id}
                  onChange={(e) => setNewCaseForm({...newCaseForm, student_id: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                >
                  <option value="">-- Choose student account --</option>
                  {students.map(s => (
                    <option key={s.student_id} value={s.student_id}>{s.first_name} {s.last_name} ({s.student_id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Case Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Behavioral issue in class or bullying reports"
                  value={newCaseForm.case_title}
                  onChange={(e) => setNewCaseForm({...newCaseForm, case_title: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Category Type</label>
                  <select 
                    value={newCaseForm.case_type}
                    onChange={(e) => setNewCaseForm({...newCaseForm, case_type: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                  >
                    <option value="Anxiety">Anxiety / Mental Health</option>
                    <option value="Bullying">Bullying / Harassment</option>
                    <option value="Family">Family issue</option>
                    <option value="Behavioral">Behavioral concern</option>
                    <option value="Academic">Academic stress</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Severity</label>
                  <select 
                    value={newCaseForm.severity}
                    onChange={(e) => setNewCaseForm({...newCaseForm, severity: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Counseling Initial Notes</label>
                <textarea 
                  rows={3}
                  placeholder="Record summary details..."
                  value={newCaseForm.notes}
                  onChange={(e) => setNewCaseForm({...newCaseForm, notes: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg mt-4 transition-all"
              >
                Log Case File
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SESSIONS LOGS AND NEW ENTRY */}
      {showSessionsModal && selectedCase && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800">Counseling Sessions history</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Case: {selectedCase.case_title} ({selectedCase.student_name})</p>
              </div>
              <button onClick={() => setShowSessionsModal(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm"><X size={18} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Sessions logs list */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Session logs</h4>
                {sessionsLoading ? (
                  <div className="text-center py-12 text-slate-400 italic">
                    <RefreshCw className="animate-spin inline-block mr-2" size={14} />
                    Loading session entries...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-medium">
                    No sessions recorded for this student yet.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {sessions.map(s => (
                      <div key={s.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                          <span>Session Date: {s.session_date}</span>
                          <span>Logged: {s.created_at}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Remarks / Observation:</p>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">{s.remarks || '---'}</p>
                        </div>
                        {s.action_plan && (
                          <div className="pt-2 border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-700">Action Plan / Next Steps:</p>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">{s.action_plan}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Write session note form */}
              <form onSubmit={handleAddSession} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 self-start">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                  <Calendar size={14} className="text-blue-500" />
                  <span>Record new session notes</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Session Date *</label>
                  <input 
                    type="date"
                    required
                    max={new Date().toLocaleDateString('en-CA')}
                    value={newSessionForm.session_date}
                    onChange={(e) => setNewSessionForm({...newSessionForm, session_date: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Remarks & counseling Notes</label>
                  <textarea 
                    rows={3}
                    placeholder="Provide details about the session discussion..."
                    value={newSessionForm.remarks}
                    onChange={(e) => setNewSessionForm({...newSessionForm, remarks: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Action Plan</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. follow-up check next Monday or coordinate with parents"
                    value={newSessionForm.action_plan}
                    onChange={(e) => setNewSessionForm({...newSessionForm, action_plan: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg mt-2 transition-all"
                >
                  Save Session notes
                </button>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GuidanceCases;
