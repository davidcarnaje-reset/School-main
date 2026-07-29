import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutGrid, Plus, Search, Layers, Users, BookOpen, GraduationCap, X, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SectionDetailsModal from '../../components/registrar/SectionDetailsModal';

const SectionManagement = () => {
  const { API_BASE_URL } = useAuth();
  const [sections, setSections] = useState([]);
  const [allPrograms, setAllPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('ALL');
  
  // 🛑 States para sa Details Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

  // 🛑 States para sa Edit at Delete Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editFormData, setEditFormData] = useState({
    id: '',
    section_name: '',
    grade_level: '',
    department: 'K-10',
    program_id: '',
    max_capacity: 40
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSection, setDeletingSection] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCardClick = (section) => {
      setSelectedSection(section);
      setShowDetailsModal(true);
  };

  const handleEditClick = (e, section) => {
    e.stopPropagation();
    setEditingSection(section);
    setEditFormData({
      id: section.id,
      section_name: section.section_name,
      grade_level: section.grade_level,
      department: section.department,
      program_id: section.program_id || '',
      max_capacity: section.max_capacity
    });
    setShowEditModal(true);
  };

  const handleEditLevelChange = (level) => {
    let dept = 'K-10';
    if (['Grade 11', 'Grade 12'].includes(level)) dept = 'SHS';
    if (['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(level)) dept = 'College';
    
    setEditFormData({ ...editFormData, grade_level: level, department: dept, program_id: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/update_section.php`, editFormData);
      if (res.data.status === 'success') {
        setShowEditModal(false);
        fetchSectionsAndPrograms();
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (err) {
      alert("Error updating section: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteClick = (e, section) => {
    e.stopPropagation();
    setDeletingSection(section);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/delete_section.php`, { id: deletingSection.id });
      if (res.data.status === 'success') {
        setShowDeleteModal(false);
        fetchSectionsAndPrograms();
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (err) {
      alert("Error deleting section: " + (err.response?.data?.message || err.message));
    } finally {
      setIsDeleting(false);
    }
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

  const filteredSections = sections.filter((s) => {
    // 1. Department filter
    if (selectedDeptFilter !== 'ALL' && s.department !== selectedDeptFilter) {
      return false;
    }

    // 2. Grade Level filter
    if (selectedLevelFilter !== 'ALL' && s.grade_level !== selectedLevelFilter) {
      return false;
    }

    // 3. Search query filter (name, level, department, program code, description, major)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      const matchName = s.section_name?.toLowerCase().includes(term);
      const matchLevel = s.grade_level?.toLowerCase().includes(term);
      const matchDept = s.department?.toLowerCase().includes(term);
      const matchCode = s.program_code?.toLowerCase().includes(term);
      const matchDesc = s.program_description?.toLowerCase().includes(term);
      const matchMajor = s.major?.toLowerCase().includes(term);

      if (!matchName && !matchLevel && !matchDept && !matchCode && !matchDesc && !matchMajor) {
        return false;
      }
    }

    return true;
  });

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

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        {/* Search Input */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border-2 border-slate-50 flex items-center gap-4 flex-1">
          <Search className="text-slate-300 ml-4" size={24} />
          <input 
            type="text" 
            value={searchTerm}
            placeholder="Filter by name, level, or strand..." 
            className="flex-1 p-2 font-bold text-slate-600 outline-none bg-transparent"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 mr-2 transition-all"
              title="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-[2rem] border-2 border-slate-50 shadow-sm overflow-x-auto">
          {['ALL', 'K-10', 'SHS', 'College'].map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDeptFilter(dept)}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedDeptFilter === dept
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Grade Level Dropdown Filter */}
        <div className="bg-white p-2 rounded-[2rem] border-2 border-slate-50 shadow-sm flex items-center">
          <select
            value={selectedLevelFilter}
            onChange={(e) => setSelectedLevelFilter(e.target.value)}
            className="px-4 py-2.5 bg-transparent text-slate-600 font-bold text-xs outline-none cursor-pointer"
          >
            <option value="ALL">All Grade Levels</option>
            {gradeLevels.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>
      </div>

      {/* GRID */}
      {filteredSections.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-slate-50 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-700 uppercase">No Sections Found</h3>
          <p className="text-slate-400 text-sm font-medium mt-1">Try adjusting your search terms or filter criteria.</p>
          {(searchTerm || selectedDeptFilter !== 'ALL' || selectedLevelFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDeptFilter('ALL');
                setSelectedLevelFilter('ALL');
              }}
              className="mt-4 px-6 py-2.5 bg-blue-50 text-blue-600 font-black text-xs uppercase rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSections.map((s) => (
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
                <div className="flex items-center gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleEditClick(e, s)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-blue-600 cursor-pointer"
                    title="Edit Section"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, s)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-red-600 cursor-pointer"
                    title="Delete Section"
                  >
                    <Trash2 size={16} />
                  </button>
                  <Layers className="text-slate-100 group-hover:text-blue-100 transition-colors ml-2" size={32} />
                </div>
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
      )}

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

      {/* MODAL PARA SA EDIT SECTION */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
              <h2 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Edit className="text-blue-600" /> Edit Section Record
              </h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white rounded-full transition-all"><X className="text-slate-400" /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-10 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Level</label>
                  <select 
                    required 
                    value={editFormData.grade_level}
                    className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500"
                    onChange={(e) => handleEditLevelChange(e.target.value)}
                  >
                    <option value="">Select Level</option>
                    {gradeLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                </div>

                {(editFormData.department === 'SHS' || editFormData.department === 'College') && (
                  <div className="col-span-2 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">
                      {editFormData.department === 'SHS' ? 'Select Strand' : 'Select Program / Course'}
                    </label>
                    <select 
                      required 
                      value={editFormData.program_id}
                      className="w-full p-4 bg-blue-50 text-blue-900 border-2 border-blue-100 rounded-2xl font-bold outline-none"
                      onChange={(e) => setEditFormData({...editFormData, program_id: e.target.value})}
                    >
                      <option value="">-- Choose Program --</option>
                      {allPrograms.filter(p => p.department === editFormData.department).map(p => (
                        <option key={p.id} value={p.id}>{p.program_code} - {p.program_description} {p.major && `(${p.major})`}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section Name</label>
                  <input 
                    required 
                    type="text" 
                    value={editFormData.section_name}
                    placeholder="e.g. Einstein" 
                    className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500"
                    onChange={e => setEditFormData({...editFormData, section_name: e.target.value})} 
                  />
                </div>

                <div className="col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Capacity</label>
                  <input 
                    type="number" 
                    value={editFormData.max_capacity}
                    className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500"
                    onChange={e => setEditFormData({...editFormData, max_capacity: e.target.value})} 
                  />
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 mt-4 active:scale-95">
                Update Section Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl p-10 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Delete Section?</h2>
            <p className="text-slate-500 text-sm font-bold mt-2">
              Are you sure you want to delete <span className="text-red-600 font-black">{deletingSection?.section_name}</span>?
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-4 text-left">
              <p className="text-xs font-bold text-amber-700 leading-relaxed">
                ⚠️ WARNING: This will permanently delete this section record. It will fail if there are active schedules or enrolled students connected to this section.
              </p>
            </div>
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-red-200"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionManagement;