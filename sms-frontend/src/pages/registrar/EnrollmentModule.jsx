import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ClipboardList, CheckCircle, Clock, Printer, X, Search, 
  CreditCard, BookOpen, CheckSquare, Square, AlertCircle, Layers, User
} from 'lucide-react'; 
import { useAuth } from '../../context/AuthContext';

const EnrollmentModule = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [students, setStudents] = useState([]);
  const [feesCatalog, setFeesCatalog] = useState([]);
  const [sections, setSections] = useState([]); // ARCHITECT FIX: Bagong state para sa Sections
  const [loading, setLoading] = useState(false);

  const [enrollModal, setEnrollModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [corModal, setCorModal] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  // ARCHITECT FIX: Idinagdag ang student_status at section_id
const [enrollForm, setEnrollForm] = useState({
    school_year: '2026-2027',
    grade_level: '',
    student_status: 'Regular', 
    section_id: '',
    selected_fees: [],
    selected_classes: [] // <--- IDAGDAG ITO
  });


  useEffect(() => {
    fetchData();
    fetchFeesCatalog();
  }, [activeTab]);

  const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/registrar/get_students_by_status.php`, {
          params: { status: activeTab }
        });
        setStudents(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setStudents([]); 
      } finally { setLoading(false); }
  };

// 1. Update fetchAvailableClasses para mag-pasa ng programId
const fetchAvailableClasses = async (programId, gradeLevel) => {
      try {
          const res = await axios.get(`${API_BASE_URL}/registrar/get_available_classes.php`, {
              params: { program_id: programId, grade_level: gradeLevel } // 🛑 Ipapasa natin pareho
          });
          if (res.data.success) setAvailableClasses(res.data.classes);
      } catch (error) { console.error(error); }
  };

  // Patawag nito pagbukas ng Subject Picker
const handleOpenSubjectPicker = () => {
      // 🛑 Ipinasa natin pareho ang program_id at grade_level
      fetchAvailableClasses(selectedStudent.program_id, selectedStudent.grade_level);
      setShowSubjectPicker(true);
  };

  const toggleClassSelection = (classId) => {
      setEnrollForm(prev => ({
          ...prev,
          selected_classes: prev.selected_classes.includes(classId)
              ? prev.selected_classes.filter(id => id !== classId)
              : [...prev.selected_classes, classId]
      }));
  };

  const fetchFeesCatalog = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/registrar/get_fees_catalog.php`);
      if (Array.isArray(response.data)) setFeesCatalog(response.data);
    } catch (error) { console.error("Error fetching catalog", error); }
  };

  // ARCHITECT FIX: Kukunin ang mga sections na pwede sa grade level ng bata
  const fetchSections = async (gradeLevel, programId) => {
      try {
          const res = await axios.get(`${API_BASE_URL}/registrar/get_sections_for_enrollment.php`, {
              params: { grade_level: gradeLevel, program_id: programId }
          });
          if (res.data.success) {
              setSections(res.data.sections);
          }
      } catch (error) { console.error("Error fetching sections", error); }
  };

  // Helper para malaman kung College
  const isCollegeLevel = (grade) => {
      if (!grade) return false;
      const lower = grade.toLowerCase();
      return lower.includes('college') || lower.includes('year');
  };

  const handleOpenEnroll = (student) => {
    setSelectedStudent(student);
    
    // Kunin ang mga sections na available para sa student na ito
    fetchSections(student.grade_level, student.program_id);

    const matchedFees = feesCatalog.filter(f => {
        const isMandatory = f.category === 'Mandatory';
        const isCorrectTuition = f.category === 'Tuition' && f.item_name.toLowerCase().includes(student.grade_level.toLowerCase());
        return isMandatory || isCorrectTuition;
    }).map(f => f.id);

    // Default form setup
    setEnrollForm({ 
        school_year: '2026-2027',
        grade_level: student.grade_level,
        student_status: 'Regular', // Default sa Regular
        section_id: '',
        selected_fees: matchedFees,
        selected_classes: []
    });
    setEnrollModal(true);
  };

  const toggleFee = (feeId) => {
    setEnrollForm(prev => ({
      ...prev,
      selected_fees: prev.selected_fees.includes(feeId) 
        ? prev.selected_fees.filter(id => id !== feeId) 
        : [...prev.selected_fees, feeId]
    }));
  };

  const submitEnrollment = async () => {
    // 🛑 ARCHITECT FIX: Validation para sa Section
    if (enrollForm.student_status === 'Regular' && !enrollForm.section_id) {
        alert("Please select a block section for this regular student.");
        return;
    }

    if (enrollForm.selected_fees.length === 0) {
        alert("Please select at least one fee for assessment.");
        return;
    }

    try {
      const payload = {
        student_id: selectedStudent.student_id,
        school_year: enrollForm.school_year,
        student_status: enrollForm.student_status,
        section_id: enrollForm.section_id,
        selected_fees: enrollForm.selected_fees,
        selected_classes: enrollForm.selected_classes 
      };
      
      const response = await axios.post(`${API_BASE_URL}/registrar/process_enrollment.php`, payload);
      
      if(response.data.success) {
         alert("Successfully Assessed & Sectioned! Forwarded to Cashier.");
         setEnrollModal(false);
         setActiveTab('assessed'); 
      } else {
         alert(response.data.message);
      }
    } catch (error) {
      alert("Error processing enrollment. Check console for details.");
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name} ${s.student_id}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardList className="text-blue-500" size={32} /> Enrollment Module
          </h1>
          <p className="text-slate-500 text-sm italic">Assessment and Subject Sectioning</p>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex w-full md:w-auto p-1 bg-slate-50 rounded-xl border border-slate-100 overflow-x-auto">
          <button onClick={() => setActiveTab('pending')} className={`flex items-center whitespace-nowrap gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            <Clock size={16} /> 1. Ready to Assess
          </button>
          <button onClick={() => setActiveTab('assessed')} className={`flex items-center whitespace-nowrap gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'assessed' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            <CreditCard size={16} /> 2. Assessed
          </button>
          <button onClick={() => setActiveTab('enrolled')} className={`flex items-center whitespace-nowrap gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'enrolled' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            <CheckCircle size={16} /> 3. Officially Enrolled
          </button>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Search student..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700" />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Info</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grade Level</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Action / Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
               <tr><td colSpan="3" className="p-10 text-center font-bold text-slate-400">Loading...</td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan="3" className="p-10 text-center text-slate-400 font-bold">No records found.</td></tr>
            ) : (
              filteredStudents.map((s, idx) => (
  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
    {/* 1. STUDENT INFO WITH AVATAR */}
    <td className="p-4">
      <div className="flex items-center gap-4 text-left">
        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm group-hover:shadow-md transition-all">
          {s.profile_image ? (
            <img 
              src={s.profile_image} 
              alt="Profile" 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${s.first_name}+${s.last_name}&background=random`; }}
            />
          ) : (
            <span className="font-black text-slate-400 text-lg uppercase">{s.first_name[0]}{s.last_name[0]}</span>
          )}
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-sm leading-tight uppercase">
            {s.first_name} {s.last_name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              ID: {s.student_id}
            </span>
          </div>
        </div>
      </div>
    </td>

    {/* 2. PROGRAM & GRADE LEVEL WITH ICON */}
    <td className="p-4 text-left">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
          <BookOpen size={16} />
        </div>
        <div>
          <p className="font-bold text-slate-700 text-sm leading-none">{s.grade_level}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">
            {s.program_description || 'General Academics'}
          </p>
        </div>
      </div>
    </td>

    {/* 3. DYNAMIC ACTION BUTTONS / STATUS BADGES */}
    <td className="p-4">
      <div className="flex items-center justify-center gap-3">
        {activeTab === 'pending' && (
          <button 
            onClick={() => handleOpenEnroll(s)} 
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-100"
          >
            <CheckSquare size={14} /> Assess & Enroll
          </button>
        )}

        {activeTab === 'assessed' && (
          <div className="flex flex-col items-center">
             <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full font-black text-[10px] border border-amber-100 uppercase tracking-widest">
                <Clock size={12} className="animate-pulse" /> Pending Payment
             </span>
             <p className="text-[9px] font-bold text-slate-400 mt-1 italic">Waiting for Cashier</p>
          </div>
        )}

        {activeTab === 'enrolled' && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setSelectedStudent(s); setCorModal(true); }} 
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
            >
              <Printer size={14} /> COR
            </button>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
              <CheckCircle size={14} />
            </div>
          </div>
        )}
      </div>
    </td>
  </tr>
))
            )}
          </tbody>
        </table>
      </div>

{/* ENROLLMENT / ASSESSMENT MODAL */}
      {enrollModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Assessment & Sectioning</h3>
                <p className="text-xs text-slate-500 font-bold uppercase mt-1">{selectedStudent.first_name} {selectedStudent.last_name} | {selectedStudent.grade_level}</p>
              </div>
              <button onClick={() => setEnrollModal(false)} className="p-2 bg-white text-slate-400 rounded-xl hover:text-red-500 shadow-sm"><X size={20}/></button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8">
              
              {/* 🛑 ARCHITECT FIX: ACADEMIC PLACEMENT BLOCK 🛑 */}
              <div>
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Layers size={14}/> Academic Placement
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Lalabas lang ito kung College */}
                    {isCollegeLevel(selectedStudent.grade_level) && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Student Classification</label>
                            <select 
                                value={enrollForm.student_status} 
                                onChange={(e) => setEnrollForm({...enrollForm, student_status: e.target.value, section_id: ''})}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm focus:border-blue-500"
                            >
                                <option value="Regular">Regular (Block Section)</option>
                                <option value="Irregular">Irregular (Custom Subjects)</option>
                            </select>
                        </div>
                    )}

                    {/* Lalabas ito kapag K-12, OR kapag College tapos "Regular" ang pinili */}
                    {enrollForm.student_status === 'Regular' ? (
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Assign Block Section</label>
                            <select 
                                required
                                value={enrollForm.section_id} 
                                onChange={(e) => setEnrollForm({...enrollForm, section_id: e.target.value})}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm focus:border-blue-500"
                            >
                                <option value="">-- Select Available Section --</option>
                                  {sections.map(sec => (
                                      <option key={sec.id} value={sec.id}>
                                          {sec.section_name} ({sec.grade_level})  {/* Idinagdag natin yung grade_level dito para makita kung 1st Year o 2nd Year */}
                                      </option>
                                  ))}
                            </select>
                        </div>
                    ) : (
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Custom Subjects</label>
                          <button type="button" onClick={handleOpenSubjectPicker} className="w-full p-4 border-2 border-dashed border-blue-200 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all flex justify-between items-center">
                                  <span>+ Select Individual Subjects</span>
                                  <span className="bg-blue-100 px-3 py-1 rounded-full text-[10px]">{enrollForm.selected_classes?.length || 0} Selected</span>
                              </button>
                        </div>
                    )}
                </div>
              </div>

              {/* EXISTING ASSESSMENT OF FEES BLOCK */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2"><CreditCard size={14}/> Assessment of Fees</h4>
                
                {feesCatalog.length === 0 ? (
                    <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-400 font-bold">Walang laman ang Fees Catalog.</p>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                      {feesCatalog.map(fee => {
                        const isSelected = enrollForm.selected_fees.includes(fee.id);
                        return (
                          <div key={fee.id} onClick={() => toggleFee(fee.id)} className={`p-4 border-b border-slate-100 flex justify-between items-center cursor-pointer transition-all ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}>
                            {/* ... Fee List Display ... */}
                            <div className="flex items-center gap-3">
                              <div className={`${isSelected ? 'text-blue-600' : 'text-slate-300'}`}>
                                {isSelected ? <CheckSquare size={22} /> : <Square size={22} />}
                              </div>
                              <div>
                                <p className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{fee.item_name}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">{fee.category}</p>
                              </div>
                            </div>
                            <p className={`font-black ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>₱{parseFloat(fee.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                          </div>
                        );
                      })}
                      <div className="p-5 bg-slate-900 flex justify-between items-center text-white">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Assessment</p>
                        <p className="text-2xl font-black">
                          ₱{feesCatalog.filter(f => enrollForm.selected_fees.includes(f.id)).reduce((sum, f) => sum + parseFloat(f.amount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setEnrollModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={submitEnrollment} disabled={feesCatalog.length === 0} className="px-8 py-2.5 rounded-xl font-black text-white shadow-lg bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-2">
                <CheckCircle size={18}/> Confirm & Forward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COR PRINT MODAL */}
{/* COR PRINT MODAL */}
{corModal && selectedStudent && (
  <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm print:p-0 print:bg-white">
    <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden print:shadow-none print:max-h-full print:rounded-none animate-in zoom-in duration-300">
      
      {/* MODAL HEADER (HIDDEN ON PRINT) */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Printer size={24}/></div>
          <h3 className="font-black text-slate-800 tracking-tight">Print Enrollment Form</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all shadow-lg">
              <Printer size={18} /> Print to PDF
          </button>
          <button onClick={() => setCorModal(false)} className="p-2.5 bg-slate-100 text-slate-400 hover:text-red-500 rounded-xl transition-colors"><X size={20}/></button>
        </div>
      </div>

      <div className="p-12 overflow-y-auto flex-1 print:overflow-visible font-sans bg-white">
        
        {/* OFFICIAL LETTERHEAD (ONLY ON PRINT) */}
        <div className="hidden print:flex items-center justify-center gap-4 mb-8 border-b-4 border-double border-slate-800 pb-6">
          <img src={`${API_BASE_URL}/uploads/branding/${branding.school_logo}`} className="w-20 h-20 object-cover" alt="Logo" />
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900 uppercase leading-tight">{branding.school_name}</h1>
            <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">Office of the School Registrar</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Certificate of Registration - S.Y. 2026-2027</p>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="space-y-8">
          <div className="flex justify-between items-end border-b-2 border-slate-100 pb-4">
            <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Student Name</p>
              <h2 className="text-2xl font-black text-slate-800 uppercase">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student ID</p>
              <p className="font-mono text-lg font-bold text-slate-800">{selectedStudent.student_id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade Level</p>
                 <p className="font-bold text-slate-700">{selectedStudent.grade_level}</p>
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment Status</p>
                 <p className="font-black text-emerald-600 uppercase tracking-tight">Officially Enrolled</p>
               </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">School Seal</p>
               <div className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-full mx-auto flex items-center justify-center text-[8px] font-bold text-slate-300 text-center uppercase">Place Seal Here</div>
            </div>
          </div>
        </div>

        {/* SIGNATURE SECTION (FOR PRINT) */}
        <div className="hidden print:grid grid-cols-2 gap-20 mt-24">
           <div className="text-center">
              <div className="border-b-2 border-slate-800 mb-2"></div>
              <p className="text-[10px] font-black uppercase text-slate-600">Registrar Signature</p>
           </div>
           <div className="text-center">
              <div className="border-b-2 border-slate-800 mb-2"></div>
              <p className="text-[10px] font-black uppercase text-slate-600">Parent/Guardian Signature</p>
           </div>
        </div>

      </div>
    </div>
  </div>
)}

{/* SUBJECT PICKER MODAL FOR IRREGULARS */}
      {showSubjectPicker && (
        <div className="fixed inset-0 bg-slate-900/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Select Subjects</h3>
                <p className="text-xs text-slate-500 font-bold uppercase mt-1">Irregular Load Configuration</p>
              </div>
              <button onClick={() => setShowSubjectPicker(false)} className="p-2 bg-white text-slate-400 rounded-xl hover:text-red-500 shadow-sm"><X size={20}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                <div className="grid grid-cols-1 gap-3">
                    {availableClasses.map(cls => {
                        const isSelected = enrollForm.selected_classes.includes(cls.class_assignment_id);
                        return (
                            <div key={cls.class_assignment_id} onClick={() => toggleClassSelection(cls.class_assignment_id)} className={`p-4 bg-white rounded-2xl border flex items-center gap-4 cursor-pointer transition-all shadow-sm ${isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'}`}>
                                <div className={`${isSelected ? 'text-blue-600' : 'text-slate-300'}`}>
                                    {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-black text-slate-800 text-sm">{cls.subject_code} - {cls.subject_description}</h4>
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{cls.units} Units</span>
                                    </div>
                                    <div className="flex gap-4 mt-2 text-[10px] font-bold text-slate-500 uppercase">
                                        <p className="flex items-center gap-1"><Clock size={12}/> {cls.schedule}</p>
                                        <p className="flex items-center gap-1"><User size={12}/> {cls.first_name} {cls.last_name}</p>
                                        <p className="flex items-center gap-1"><Layers size={12}/> {cls.section_name}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
              <p className="text-sm font-black text-slate-600">Total Selected: <span className="text-blue-600">{enrollForm.selected_classes.length} Classes</span></p>
              <button onClick={() => setShowSubjectPicker(false)} className="px-8 py-3 rounded-xl font-black text-white shadow-lg bg-slate-800 hover:bg-slate-700 transition-all flex items-center gap-2">
                 Done Selecting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentModule;