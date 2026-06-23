import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Library, Plus, RefreshCw, X, Check, Trash2, AlertCircle } from 'lucide-react'; // <-- Dinagdag ang AlertCircle
import { useAuth } from '../../context/AuthContext';

const AcademicPrograms = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // --- BAGONG STATES PARA SA DELETE MODAL ---
  const [deleteModal, setDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);

  const [formData, setFormData] = useState({
    department: 'SHS',
    program_code: '',
    program_description: '',
    major: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/get_academic_programs.php`);
      if (Array.isArray(res.data)) {
        setPrograms(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/add_academic_program.php`, formData);
      if (res.data.success) {
        alert("Program added successfully!");
        setShowModal(false);
        setFormData({ department: 'SHS', program_code: '', program_description: '', major: '', status: 'Active' });
        fetchPrograms();
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Server error.");
    } finally {
      setSaveLoading(false);
    }
  };

  // --- BINAGONG DELETE LOGIC (Bubukas lang ng UI Modal) ---
  const handleDeleteClick = (id, programCode) => {
    setProgramToDelete({ id, programCode });
    setDeleteModal(true);
  };

  // --- ITO YUNG TOTOONG MAGBUBURA SA DATABASE ---
  const confirmDelete = async () => {
    if (!programToDelete) return;
    
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/delete_academic_program.php`, { id: programToDelete.id });
      if (res.data.success) {
        fetchPrograms(); // I-refresh ang table after ma-delete
        setDeleteModal(false);
        setProgramToDelete(null);
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Server error while deleting.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Library className="text-blue-500" size={32} /> Academic Programs
          </h1>
          <p className="text-slate-500 font-medium">Manage SHS Strands and College Courses.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchPrograms} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-blue-500 transition-all">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-3 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
            style={{ backgroundColor: branding.theme_color || '#2563eb' }}
          >
            <Plus size={20} /> Add Program
          </button>
        </div>
      </div>

      {/* PROGRAMS TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-8">Dept. & Code</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description & Major</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="4" className="p-10 text-center font-bold text-slate-400">Loading programs...</td></tr>
            ) : programs.length === 0 ? (
              <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-bold">No programs found.</td></tr>
            ) : (
              programs.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-5 pl-8">
                    <p className="font-bold text-slate-800 text-lg">{p.program_code}</p>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                      p.department === 'College' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {p.department}
                    </span>
                  </td>
                  <td className="p-5">
                    <p className="font-bold text-slate-600">{p.program_description}</p>
                    {p.major && <p className="text-xs font-bold text-slate-400 uppercase mt-1">Major in {p.major}</p>}
                  </td>
                  <td className="p-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      p.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    {/* IN-UPDATE NA DELETE BUTTON */}
                    <button 
                      onClick={() => handleDeleteClick(p.id, p.program_code)}
                      className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                      title="Delete Program"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {deleteModal && programToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl flex flex-col animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 text-center pt-8">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Delete Program?</h3>
              <p className="text-sm text-slate-500 font-medium">
                Are you sure you want to delete <span className="font-bold text-red-500">{programToDelete.programCode}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => { setDeleteModal(false); setProgramToDelete(null); }} 
                className="flex-1 py-3 font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 font-black text-white bg-red-500 hover:bg-red-600 shadow-md rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl flex flex-col animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase tracking-tight">Add New Program</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>
            
            <div className="p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Department</label>
                <select value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700">
                  <option value="SHS">Senior High School (SHS)</option>
                  <option value="College">College</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Program / Strand Code *</label>
                <input required type="text" placeholder="e.g. BSIT or STEM" value={formData.program_code} onChange={e=>setFormData({...formData, program_code: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700 uppercase" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Description *</label>
                <input required type="text" placeholder="e.g. Bachelor of Science in Information Technology" value={formData.program_description} onChange={e=>setFormData({...formData, program_description: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700" />
              </div>

              {formData.department === 'College' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Major (Optional)</label>
                  <input type="text" placeholder="e.g. Web Development" value={formData.major} onChange={e=>setFormData({...formData, major: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700" />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[2.5rem] flex gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
              <button type="submit" disabled={saveLoading} className="flex-1 py-3 font-black text-white rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700 transition-all flex justify-center items-center gap-2">
                {saveLoading ? <RefreshCw size={18} className="animate-spin"/> : <><Check size={18}/> Save Program</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AcademicPrograms;