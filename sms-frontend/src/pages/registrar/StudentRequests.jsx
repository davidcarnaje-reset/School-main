import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Search, Plus, CheckCircle, 
  X, User, Trash2, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StudentRequests = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [docFees, setDocFees] = useState([]);
  
  // Modals & Forms
  const [requestModal, setRequestModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedFee, setSelectedFee] = useState('');

  // States para sa Cancel Modal
  const [cancelModal, setCancelModal] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchDocFees();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/get_registrar_requests.php`);
      if (Array.isArray(res.data)) {
        setRequests(res.data);
      } else {
        setRequests([]);
      }
    } catch (err) { 
      console.error(err); 
      setRequests([]);
    } finally { 
      setLoading(false); 
    }
  };

  const fetchDocFees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/get_fees_catalog.php`);
      if (Array.isArray(res.data)) {
        const docs = res.data.filter(f => f.category === 'Document' || f.category === 'Other');
        setDocFees(docs);
      }
    } catch (err) { console.error(err); }
  };

  const searchStudent = async (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        const res = await axios.get(`${API_BASE_URL}/registrar/search_students.php?q=${query}`);
        if (Array.isArray(res.data)) {
          setStudents(res.data);
        } else {
          setStudents([]);
        }
      } catch (err) { 
        console.error(err); 
        setStudents([]);
      }
    } else {
      setStudents([]);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedStudent || !selectedFee) return alert("Piliin ang student at dokumento.");

    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/add_request.php`, {
        student_id: selectedStudent.student_id,
        fee_id: selectedFee
      });

      if (res.data.success) {
        alert("Request Added! Forwarded to Cashier for payment.");
        setRequestModal(false);
        fetchRequests();
        setSelectedStudent(null);
        setSelectedFee('');
        setSearchQuery('');
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (err) { console.error(err); }
  };

  // Logic para sa Cancel Confirmation
  const handleCancelClick = (req) => {
    setRequestToCancel(req);
    setCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!requestToCancel) return;
    
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/cancel_request.php`, { id: requestToCancel.id });
      if (res.data.success) {
        fetchRequests(); // I-refresh ang table after ma-cancel
        setCancelModal(false);
        setRequestToCancel(null);
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Server error while cancelling.");
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const styles = {
      'Pending Payment': 'bg-amber-50 text-amber-600 border-amber-100',
      'Paid': 'bg-blue-50 text-blue-600 border-blue-100',
      'Processing': 'bg-indigo-50 text-indigo-600 border-indigo-100',
      'Released': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'Cancelled': 'bg-red-50 text-red-500 border-red-100 line-through' // <--- BAGONG DAGDAG
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <FileText className="text-blue-500" size={32} /> Student Requests
          </h1>
          <p className="text-slate-500 font-medium">Manage TOR, Good Moral, and Certificate requests.</p>
        </div>
        <button 
          onClick={() => setRequestModal(true)}
          className="px-6 py-3 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
          style={{ backgroundColor: branding.theme_color || '#2563eb' }}
        >
          <Plus size={20} /> New Request
        </button>
      </div>

      {/* REQUESTS TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-8">Student</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requested Document</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Action</th> {/* BAGONG DAGDAG */}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="5" className="p-10 text-center font-bold text-slate-400">Loading requests...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold">No active requests found.</td></tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-5 pl-8">
                    <p className="font-bold text-slate-800">{req.first_name} {req.last_name}</p>
                    <p className="text-[10px] font-mono text-slate-400 uppercase">ID: {req.student_id}</p>
                  </td>
                  <td className="p-5 font-bold text-slate-600">{req.item_name}</td>
                  <td className="p-5 text-xs font-bold text-slate-500">{new Date(req.created_at).toLocaleDateString()}</td>
                  <td className="p-5 text-center">{getStatusBadge(req.status)}</td>
                  <td className="p-5 text-center">
                    {/* CANCEL BUTTON - Lalabas lang kapag Pending Payment pa */}
                    {req.status === 'Pending Payment' ? (
                      <button 
                        onClick={() => handleCancelClick(req)}
                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                        title="Cancel Request"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : req.status === 'Cancelled' ? (
                      <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Voided</span>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Locked</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- CUSTOM CANCEL CONFIRMATION MODAL --- */}
      {cancelModal && requestToCancel && (
        <div className="fixed inset-0 bg-slate-900/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl flex flex-col animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 text-center pt-8">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Cancel Request?</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Are you sure you want to cancel the <span className="font-bold text-slate-700">{requestToCancel.item_name}</span> request for <span className="font-bold text-slate-700">{requestToCancel.first_name}</span>?
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => { setCancelModal(false); setRequestToCancel(null); }} 
                className="flex-1 py-3 font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"
              >
                Go Back
              </button>
              <button 
                onClick={confirmCancel}
                className="flex-1 py-3 font-black text-white bg-red-500 hover:bg-red-600 shadow-md rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> Cancel It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW REQUEST MODAL */}
      {requestModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl flex flex-col animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase tracking-tight">Create New Request</h3>
              <button onClick={() => setRequestModal(false)} className="p-2 text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Student Search */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => searchStudent(e.target.value)}
                    placeholder="Type name or Student ID..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-sm"
                  />
                </div>
                {/* Search Results Dropdown */}
                {students.length > 0 && !selectedStudent && (
                  <div className="absolute z-10 w-full max-w-[350px] bg-white border border-slate-200 rounded-xl shadow-xl mt-1 overflow-hidden">
                    {students.map(s => (
                      <div 
                        key={s.student_id}
                        onClick={() => { setSelectedStudent(s); setSearchQuery(`${s.first_name} ${s.last_name}`); setStudents([]); }}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 flex items-center gap-3"
                      >
                        <div className="p-2 bg-slate-100 rounded-lg"><User size={14}/></div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{s.first_name} {s.last_name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{s.student_id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Document Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Document</label>
                <select 
                  value={selectedFee}
                  onChange={(e) => setSelectedFee(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-sm appearance-none"
                >
                  <option value="">-- Choose Document --</option>
                  {docFees.map(fee => (
                    <option key={fee.id} value={fee.id}>{fee.item_name} (₱{fee.amount})</option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                  <CheckCircle className="text-emerald-500" size={20} />
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase">Selected Student</p>
                    <p className="font-bold text-emerald-900">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[2.5rem] flex gap-3">
              <button onClick={() => setRequestModal(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
              <button 
                onClick={handleSubmitRequest}
                className="flex-1 py-3 font-black text-white rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700 transition-all"
              >
                Log Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRequests;