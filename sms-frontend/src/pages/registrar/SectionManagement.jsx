import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutGrid, Plus, Search, Layers, Users, BookOpen, GraduationCap, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SectionDetailsModal from '../../components/registrar/SectionDetailsModal';

const SectionManagement = () => {
  const { API_BASE_URL } = useAuth();
  const [sections, setSections] = useState([]);
  const [allPrograms, setAllPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🛑 States para sa Details Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

  const handleCardClick = (section) => {
      setSelectedSection(section);
      setShowDetailsModal(true);
  };

  // Dropdown Options
  const gradeLevels = [
    "Kinder", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
    "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", 
    "1st Year", "2nd Year", "3rd Year", "4th Year"
  ];

  const [formData, setFormData] = useState({
    section_name: '',
    grade_level: '',
    department: 'K-10',
    program_id: '',
    max_capacity: 40
  });

  useEffect(() => { fetchSectionsAndPrograms(); }, []);

  const fetchSectionsAndPrograms = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/manage_sections.php`);
      setSections(res.data.sections || []);
      setAllPrograms(res.data.programs || []);
    } catch (err) { console.error("Fetch Error:", err); }
    setLoading(false);
  };

  const handleLevelChange = (level) => {
    let dept = 'K-10';
    if (['Grade 11', 'Grade 12'].includes(level)) dept = 'SHS';
    if (['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(level)) dept = 'College';
    
    setFormData({ ...formData, grade_level: level, department: dept, program_id: '' });
  };

  const filteredPrograms = allPrograms.filter(p => p.department === formData.department);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/manage_sections.php`, formData);
      if (res.data.status === 'success') {
        setShowModal(false);
        fetchSectionsAndPrograms();
        setFormData({ section_name: '', grade_level: '', department: 'K-10', program_id: '', max_capacity: 40 });
      }
    } catch (err) { alert("Error saving section"); }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
            <LayoutGrid className="text-blue-600" size={32} /> Section Management
          </h1>
          <p className="text-slate-400 text-sm font-bold italic">Dynamic Class Grouping & Capacity Control</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
        >
          <Plus size={20} /> Create Section
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border-2 border-slate-50 flex items-center gap-4">
        <Search className="text-slate-300 ml-4" size={24} />
        <input 
          type="text" 
          placeholder="Filter by name, level, or strand..." 
          className="flex-1 p-2 font-bold text-slate-600 outline-none bg-transparent"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.filter(s => s.section_name.toLowerCase().includes(searchTerm.toLowerCase())).map((s) => (
          <div 
            key={s.id} 
            className="bg-white rounded-[2.5rem] p-8 shadow-sm border-2 border-slate-50 hover:border-blue-200 transition-all group relative cursor-pointer"
            onClick={() => handleCardClick(s)}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                s.department === 'College' ? 'bg-purple-100 text-purple-600' : 
                s.department === 'SHS' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {s.department}
              </span>
              <Layers className="text-slate-100 group-hover:text-blue-100 transition-colors" size={40} />
            </div>

            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">{s.section_name}</h2>
            <p className="text-blue-600 font-black text-xs uppercase mt-2 tracking-widest">{s.grade_level}</p>
            
            {s.program_code && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <GraduationCap size={16} className="text-slate-400" />
                <p className="text-[10px] font-bold text-slate-500 uppercase truncate">
                  {s.program_code} - {s.major || s.program_description}
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-6">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-slate-300" />
                <span className="text-xs font-black text-slate-600 uppercase">Limit: {s.max_capacity}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Active</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🛑 ARCHITECT FIX: Dito natin tatawagin ang Dashboard Modal 🛑 */}
      <SectionDetailsModal 
          isOpen={showDetailsModal} 
          onClose={() => setShowDetailsModal(false)} 
          section={selectedSection} 
      />

      {/* MODAL PARA SA ADD SECTION */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
              <h2 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Plus className="text-blue-600" /> New Section Record
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-all"><X className="text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Level</label>
                  <select 
                    required 
                    className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500"
                    onChange={(e) => handleLevelChange(e.target.value)}
                  >
                    <option value="">Select Level</option>
                    {gradeLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                </div>

                {(formData.department === 'SHS' || formData.department === 'College') && (
                  <div className="col-span-2 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">
                      {formData.department === 'SHS' ? 'Select Strand' : 'Select Program / Course'}
                    </label>
                    <select 
                      required 
                      className="w-full p-4 bg-blue-50 text-blue-900 border-2 border-blue-100 rounded-2xl font-bold outline-none"
                      onChange={(e) => setFormData({...formData, program_id: e.target.value})}
                    >
                      <option value="">-- Choose Program --</option>
                      {filteredPrograms.map(p => (
                        <option key={p.id} value={p.id}>{p.program_code} - {p.program_description} {p.major && `(${p.major})`}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section Name</label>
                  <input required type="text" placeholder="e.g. Einstein" className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500"
                    onChange={e => setFormData({...formData, section_name: e.target.value})} />
                </div>

                <div className="col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Capacity</label>
                  <input type="number" defaultValue="40" className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500"
                    onChange={e => setFormData({...formData, max_capacity: e.target.value})} />
                </div>
              </div>

              <button className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 mt-4 active:scale-95">
                Save Section Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionManagement;