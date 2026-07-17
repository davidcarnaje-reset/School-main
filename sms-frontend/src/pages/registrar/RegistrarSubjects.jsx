import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, Plus, Search, Layers, FileText, 
  Trash2, X, CheckCircle, RefreshCw, GraduationCap, Filter, AlertTriangle
} from 'lucide-react';
import SubjectDetailsModal from '../../components/registrar/SubjectDetailsModal';
import { useAuth } from '../../context/AuthContext';

const RegistrarSubjects = () => {
  const { branding, token, API_BASE_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [curriculumFilter, setCurriculumFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);

  // 🛑 ARCHITECT ADDITION: State para sa Custom Delete Modal
  const [deleteModal, setDeleteModal] = useState({ show: false, subject: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // States para sa Subject Details Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectClasses, setSubjectClasses] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);

  const LEVEL_CONFIG = {
    'K-10': { levels: ['Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'], needsProgram: false },
    'SHS': { levels: ['Grade 11', 'Grade 12'], needsProgram: true },
    'College': { levels: ['1st Year', '2nd Year', '3rd Year', '4th Year'], needsProgram: true }
  };

  // ARCHITECT FIX: Idinagdag ang subject_type sa initial form para mapadala sa DB
  const initialForm = {
    level_category: 'K-10', subject_type: 'None', subject_code: '', subject_description: '',
    units: 0, grade_level_applicable: 'Grade 1', program_id: '', semester: 'N/A',
    curriculum_year: '2024-2025'
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/get_subjects.php`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSubjects(res.data.subjects || []);
        setPrograms(res.data.programs || []);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleLevelCategoryChange = (cat) => {
    const newUnits = (cat === 'College') ? 3 : 0;
    
    // ARCHITECT FIX: Dynamic na default subject_type base sa category
    let newSubjectType = 'None';
    if (cat === 'College') newSubjectType = 'GE';
    if (cat === 'SHS') newSubjectType = 'Core';

    setFormData({
      ...formData, 
      level_category: cat, 
      grade_level_applicable: LEVEL_CONFIG[cat].levels[0],
      program_id: '', 
      semester: cat === 'K-10' ? 'N/A' : '1st', 
      units: newUnits,
      subject_type: newSubjectType // Idinagdag ang subject_type dito
    });
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/add_subject.php`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.data.success) {
        setShowModal(false); setFormData(initialForm); fetchData(); 
      } else { alert("Error: " + res.data.message); }
    } catch (error) { alert("Server Error"); }
    finally { setSaveLoading(false); }
  };

  // 🛑 ARCHITECT FIX: Bubuksan lang natin yung Custom Modal, hindi na window.confirm
  const handleDeleteClick = (e, subject) => {
      e.stopPropagation(); // Pigilan bumukas yung Details Modal
      setDeleteModal({ show: true, subject });
  };

  // 🛑 ARCHITECT FIX: Ito ang tatawag sa bagong PHP file natin
  const confirmDelete = async () => {
      setIsDeleting(true);
      try {
          const res = await axios.post(`${API_BASE_URL}/registrar/delete_subject.php`, 
              { subject_id: deleteModal.subject.id },
              { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
          );
          
          if(res.data.success) {
              setDeleteModal({ show: false, subject: null });
              fetchData(); // I-refresh ang table para mawala yung binura
          } else {
              alert("Error: " + res.data.message);
          }
      } catch (error) {
          console.error(error);
          alert("Server Error while deleting subject.");
      } finally {
          setIsDeleting(false);
      }
  };

  const handleRowClick = async (subject) => {
      setSelectedSubject(subject);
      setShowDetailsModal(true);
      setDetailsLoading(true);
      try {
          const res = await axios.get(`${API_BASE_URL}/registrar/get_subject_details.php`, {
              params: { subject_id: subject.id },
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) { setSubjectClasses(res.data.classes); }
      } catch (error) { console.error("Error fetching details", error); }
      finally { setDetailsLoading(false); }
  };

  const filteredSubjects = (subjects || []).filter(s => {
    const matchesSearch = `${s.subject_code} ${s.subject_description}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || s.level_category === categoryFilter;
    const matchesCurriculum = curriculumFilter === 'All' || s.curriculum_year === curriculumFilter;
    return matchesSearch && matchesCategory && matchesCurriculum;
  });

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3 uppercase">
            <BookOpen className="text-blue-600" size={32} /> Subject Registry
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 italic">Curriculum Management & Masterlist</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl active:scale-95">
          <Plus size={20} /> New Subject
        </button>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search by subject code or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 shadow-sm transition-all" />
        </div>
        <div className="relative w-full md:w-60">
           <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 shadow-sm transition-all appearance-none cursor-pointer">
              <option value="All">All Categories</option>
              <option value="College">College Subjects</option>
              <option value="SHS">Senior High (SHS)</option>
              <option value="K-10">K-10 (Kinder - Gr.10)</option>
           </select>
        </div>
        <div className="relative w-full md:w-60">
           <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <select value={curriculumFilter} onChange={(e) => setCurriculumFilter(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 shadow-sm transition-all appearance-none cursor-pointer">
              <option value="All">All Curricula</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
           </select>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-10 whitespace-nowrap">Subject Details</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Level & Category</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Program / Strand</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">Units</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="5" className="py-20 text-center font-black text-slate-300 uppercase animate-pulse tracking-widest">Synchronizing Subject Catalog...</td></tr>
                ) : filteredSubjects.length === 0 ? (
                  <tr><td colSpan="5" className="py-20 text-center font-black text-slate-300 uppercase tracking-widest">{categoryFilter !== 'All' ? `No ${categoryFilter} subjects found.` : 'No subjects found in the registry.'}</td></tr>
                ) : (
                  filteredSubjects.map((item) => (
                    <tr key={item.id} onClick={() => handleRowClick(item)} className="hover:bg-blue-50/50 transition-colors group cursor-pointer">
                      <td className="p-6 pl-10">
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{item.subject_code}</p>
                           <p className="text-xs font-bold text-slate-500 mt-1">{item.subject_description}</p>
                           <div className="flex gap-2 items-center mt-1">
                             {item.subject_type && item.subject_type !== 'None' && (
                               <span className="text-[9px] font-black uppercase text-indigo-500">{item.subject_type}</span>
                             )}
                             <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                               Curriculum: {item.curriculum_year || '2024-2025'}
                             </span>
                           </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="space-y-2">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest w-max flex ${
                            item.level_category === 'College' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 
                            item.level_category === 'SHS' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>
                            {item.level_category || 'K-10'}
                          </span>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <GraduationCap size={12}/> {item.grade_level_applicable}
                          </p>
                        </div>
                      </td>
                      <td className="p-6">
                         <span className={`text-xs font-bold ${item.program_code ? 'text-slate-700' : 'text-blue-500 italic'}`}>
                             {item.program_code || 'General Education (All)'}
                         </span>
                      </td>
                      <td className="p-6 text-center">
                         <span className="text-lg font-black text-slate-600">{item.units}<span className="text-[10px] text-slate-400 font-bold ml-0.5">u</span></span>
                      </td>
                      <td className="p-6 text-center">
                         {/* 🛑 ARCHITECT FIX: Binago ang onClick para tawagin ang Custom Modal */}
                         <button onClick={(e) => handleDeleteClick(e, item)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-300 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm">
                            <Trash2 size={16}/>
                         </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
      </div>

      <SubjectDetailsModal 
          isOpen={showDetailsModal} 
          onClose={() => setShowDetailsModal(false)} 
          subject={selectedSubject} 
          classes={subjectClasses} 
          loading={detailsLoading} 
      />

      {/* 🛑 ARCHITECT ADDITION: CUSTOM DELETE WARNING MODAL 🛑 */}
      {deleteModal.show && deleteModal.subject && (
        <div className="fixed inset-0 bg-slate-900/60 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-black text-center text-slate-800 uppercase tracking-tighter mb-2">Delete Subject?</h3>
                <p className="text-center font-bold text-slate-500 text-sm mb-6">
                    Are you sure you want to delete <span className="text-red-500 font-black">{deleteModal.subject.subject_code}</span>? 
                </p>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-8">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-relaxed text-center">
                        Warning: This will permanently delete all schedules and student enrollments connected to this subject!
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button onClick={() => setDeleteModal({show: false, subject: null})} disabled={isDeleting} className="flex-1 py-4 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-100 transition-all">
                        Cancel
                    </button>
                    <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-red-600 transition-all flex justify-center items-center gap-2">
                        {isDeleting ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* SMART MODAL (ADD SUBJECT) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          {/* KEEP YOUR ORIGINAL ADD FORM HERE */}
          <form onSubmit={handleSave} className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Register Subject</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Curriculum Database</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>

            <div className="p-10 overflow-y-auto space-y-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Category</label>
                 <div className="grid grid-cols-3 gap-3">
                    {Object.keys(LEVEL_CONFIG).map(cat => (
                       <button key={cat} type="button" onClick={() => handleLevelCategoryChange(cat)}
                          className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${formData.level_category === cat ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-300'}`}>
                          {cat}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Subject Code *</label>
                  <input required type="text" placeholder="MATH101" value={formData.subject_code} onChange={e=>setFormData({...formData, subject_code: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Units (Credit)</label>
                  <input type="number" min="0" value={formData.units} onChange={e => setFormData({...formData, units: e.target.value})} disabled={formData.level_category !== 'College'} className={`w-full p-4 rounded-2xl outline-none font-bold transition-all ${formData.level_category !== 'College' ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70' : 'bg-slate-100 text-slate-800 focus:ring-2 focus:ring-blue-500' }`} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Full Description *</label>
                  <input required type="text" placeholder="e.g. Fundamentals of Mathematics" value={formData.subject_description} onChange={e=>setFormData({...formData, subject_description: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Grade / Year Level</label>
                  <select value={formData.grade_level_applicable} onChange={e=>setFormData({...formData, grade_level_applicable: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500">
                    {LEVEL_CONFIG[formData.level_category].levels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Curriculum Year *</label>
                  <select value={formData.curriculum_year} onChange={e=>setFormData({...formData, curriculum_year: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500">
                    <option value="2023-2024">2023-2024</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                  </select>
                </div>
                
                {/* ARCHITECT FIX: Dito nilagay ang Subject Type Selection para sa College at SHS */}
                {LEVEL_CONFIG[formData.level_category].needsProgram && (
                   <div className="space-y-1.5 animate-in slide-in-from-top-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Subject Type</label>
                     <select required value={formData.subject_type} onChange={e => setFormData({...formData, subject_type: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500">
                       {formData.level_category === 'College' && (
                         <>
                           <option value="GE">General Education (GE)</option>
                           <option value="Major">Major Subject</option>
                         </>
                       )}
                       {formData.level_category === 'SHS' && (
                         <>
                           <option value="Core">Core Subject</option>
                           <option value="Applied">Applied Subject</option>
                         </>
                       )}
                     </select>
                   </div>
                )}

                {LEVEL_CONFIG[formData.level_category].needsProgram && (
                   <div className="col-span-2 space-y-1.5 animate-in slide-in-from-top-2">
                     <label className="text-[10px] font-black text-blue-500 uppercase ml-1">Program / Course Link</label>
                      <select required value={formData.program_id} onChange={e => setFormData({...formData, program_id: e.target.value})} className="w-full p-4 bg-blue-50 border-2 border-blue-100 text-blue-900 rounded-2xl font-bold outline-none">
                        <option value="" disabled>-- Choose Program / Strand --</option>
                        <option value="GE">{formData.level_category === 'SHS' ? 'Applicable to All Strands' : 'Applicable to All Courses'}</option>
                        {programs.filter(p => p.department === (formData.level_category === 'SHS' ? 'SHS' : 'College')).map(p => (
                           <option key={p.id} value={p.id}>{p.program_code}</option>
                        ))}
                      </select>
                   </div>
                )}
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
              <button type="submit" disabled={saveLoading} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2 hover:bg-blue-700">
                {saveLoading ? <RefreshCw className="animate-spin" size={18}/> : <><CheckCircle size={18}/> Register Subject</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RegistrarSubjects;