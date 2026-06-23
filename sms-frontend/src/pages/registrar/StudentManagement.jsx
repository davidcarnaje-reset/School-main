import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  UserPlus, X, Mail, RefreshCw, Calendar, Phone, GraduationCap, 
  BookOpen, User, Users, CreditCard, ChevronRight, ChevronLeft, Check, MapPin, Camera,
  Search, Filter, Printer
} from 'lucide-react'; 
import { useAuth } from '../../context/AuthContext';

const StudentManagement = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]); // BAGONG STATE PARA SA COURSES/STRANDS
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false); 
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [viewModal, setViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // --- DAGDAG: PROVINCE AT CITY DATA ---
  const PHILIPPINE_PLACES = {
    "Bulacan": ["Obando", "Meycauayan", "Marilao", "Bocaue", "Malolos", "Baliuag"],
    "Metro Manila": ["Valenzuela", "Caloocan", "Quezon City", "Manila", "Malabon", "Navotas"],
    "Pampanga": ["San Fernando", "Angeles", "Mabalacat", "Guagua"],
    "Rizal": ["Antipolo", "Taytay", "Cainta", "Binangonan"]
  };

  const gradeLevels = [
    'Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'College'
  ];

  // --- FETCH DATA ---
const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Students
      const stdResponse = await axios.get(`${API_BASE_URL}/registrar/get_students_list.php`);
      if (Array.isArray(stdResponse.data)) setStudents(stdResponse.data);

      // 2. REAL FETCH PARA SA PROGRAMS (Pinalitan na natin ang Mock Data)
      const progResponse = await axios.get(`${API_BASE_URL}/registrar/get_academic_programs.php`);
      if (Array.isArray(progResponse.data)) {
        // Kukunin lang natin yung mga "Active" na programs
        setPrograms(progResponse.data.filter(p => p.status === 'Active'));
      }

    } catch (error) { 
      console.error("Error fetching data:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setViewModal(true);
  };

  const handlePrint = () => window.print();

  // IN-UPDATE ANG INITIAL STATE PARA MAY STRAND AT MAJOR
  const initialFormState = {
    // STEP 1
    lrn: '', first_name: '', middle_name: '', last_name: '', suffix: '', 
    nickname: '', gender: 'Male', dob: '', place_of_birth: '', 
    nationality: 'Filipino', religion: '', civil_status: 'Single',
    // STEP 2
    email: '', mobile_no: '', alt_mobile_no: '', 
    address_house: '', address_brgy: '', address_city: '', address_province: '', address_zip: '',
    // STEP 3
    father_name: '', father_occ: '', father_contact: '',
    mother_name: '', mother_occ: '', mother_contact: '',
    guardian_name: '', guardian_rel: '', guardian_contact: '', guardian_address: '',
    // STEP 4 UPDATES
    enrollment_type: 'New', school_year: '2026-2027', grade_level: 'Grade 7', 
    program_id: '', // Dito ise-save yung ID nung napiling strand o course
    section: 'TBA', prev_school: '', prev_school_address: '',
    scholarship_type: 'None', payment_plan: 'Full Payment'
  };

  const [formData, setFormData] = useState(initialFormState);

  // --- DAGDAG: INPUT FORMATTERS ---
  const handlePhoneInput = (val, field) => {
    if (val === '') {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }
    let cleaned = val;
    if (!cleaned.startsWith('+639')) cleaned = '+639' + cleaned.replace(/\D/g, '');
    const digits = cleaned.slice(4).replace(/\D/g, '').slice(0, 9);
    setFormData(prev => ({ ...prev, [field]: `+639${digits}` }));
  };

  const handleNumberOnly = (val, field, max) => {
    const cleaned = val.replace(/\D/g, '').slice(0, max);
    setFormData(prev => ({ ...prev, [field]: cleaned }));
  };

  // --- DAGDAG: VALIDATION LOGIC ---
  const isStepValid = () => {
    if (currentStep === 1) {
      const { first_name, last_name, dob, gender, lrn } = formData;
      const isLrnValid = !lrn || lrn.length === 12; // Required 12 if not blank
      return first_name && last_name && dob && gender && isLrnValid;
    }
    if (currentStep === 2) {
      const { email, mobile_no, address_city, address_province, address_zip, address_house, address_brgy } = formData;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmailValid = emailRegex.test(email);
      const isPhoneValid = mobile_no && mobile_no.length === 13; // Must be exactly 13 (+639xxxxxxxxx)
      return isEmailValid && isPhoneValid && address_city && address_province && address_zip && address_house && address_brgy;
    }
    if (currentStep === 3) {
      // Parents contact must be valid format if provided
      const fContactValid = !formData.father_contact || formData.father_contact === '+639' || formData.father_contact.length === 13;
      const mContactValid = !formData.mother_contact || formData.mother_contact === '+639' || formData.mother_contact.length === 13;
      return fContactValid && mContactValid;
    }
    if (currentStep === 4) {
      const needsProgram = ['Grade 11', 'Grade 12', 'College'].includes(formData.grade_level);
      if (needsProgram && !formData.program_id) return false;
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (isStepValid()) setCurrentStep(prev => prev + 1);
  };
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStepValid()) return;
    setSaveLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/registrar/add_student.php`, formData);
      if (response.data.success) {
        setShowModal(false);
        setFormData(initialFormState);
        setCurrentStep(1);
        fetchData();
        alert("Enrolled successfully! ID: " + response.data.student_id);
      } else { alert(response.data.message); }
    } catch (err) { alert("Server Error"); } finally { setSaveLoading(false); }
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchLower) || (student.student_id && student.student_id.toLowerCase().includes(searchLower));
    const matchesGrade = gradeFilter === 'All' || student.grade_level === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  // HELPER PARA SA DROPDOWNS NG SHS / COLLEGE
  const getProgramOptions = () => {
    if (formData.grade_level === 'Grade 11' || formData.grade_level === 'Grade 12') {
      return programs
        .filter(p => p.department === 'SHS')
        .map(p => ({ value: p.id, label: `${p.program_code} - ${p.program_description}` }));
    } else if (formData.grade_level === 'College') {
      return programs
        .filter(p => p.department === 'College')
        .map(p => ({ 
          value: p.id, 
          label: p.major ? `${p.program_code} Major in ${p.major}` : `${p.program_code} - ${p.program_description}` 
        }));
    }
    return [];
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-4">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${currentStep >= step ? 'text-white' : 'bg-slate-100 text-slate-400'}`}
               style={currentStep >= step ? {backgroundColor: branding.theme_color || '#2563eb'} : {}}>
            {currentStep > step ? <Check size={14} /> : step}
          </div>
          {step < 4 && <div className={`w-12 h-1 mx-2 rounded ${currentStep > step ? 'bg-blue-500' : 'bg-slate-100'}`} style={currentStep > step ? {backgroundColor: branding.theme_color || '#2563eb'} : {}} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <GraduationCap className="text-blue-500" size={32} /> Student Masterlist
          </h1>
          <p className="text-slate-500 text-sm italic">Enterprise Registrar Module</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all shadow-sm">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => { setFormData(initialFormState); setShowModal(true); }} className="group relative overflow-hidden text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-xl font-bold transition-all hover:scale-105 active:scale-95" style={{backgroundColor: branding.theme_color || '#2563eb'}}>
            <UserPlus size={20} /> <span>Create Profile</span>
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search by Student Name, ID, or LRN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-slate-700 shadow-sm" />
        </div>
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-slate-700 shadow-sm appearance-none cursor-pointer">
            <option value="All">All Grade Levels</option>
            {gradeLevels.map(grade => <option key={grade} value={grade}>{grade}</option>)}
          </select>
        </div>
      </div>

      {/* STUDENT TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
         <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
               <tr>
                  <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student ID & Name</th>
                  <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grade & Program</th>
                  <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact & Address</th>
                  <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
          {loading ? (
            <tr>
              <td colSpan="4" className="p-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="animate-spin text-blue-500" size={32} />
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Fetching student records...</p>
                </div>
              </td>
            </tr>
          ) : filteredStudents.length === 0 ? (
            <tr>
              <td colSpan="4" className="p-20 text-center">
                <div className="opacity-40 flex flex-col items-center">
                  <Search size={48} className="text-slate-400 mb-3" />
                  <p className="font-black text-slate-600 text-lg">No Results Found</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your search or grade filter.</p>
                </div>
              </td>
            </tr>
          ) : (
            filteredStudents.map((s) => (
              <tr 
                key={s.student_id} 
                onClick={() => handleViewProfile(s)} 
                className="hover:bg-blue-50/50 transition-all duration-200 group cursor-pointer active:scale-[0.99]"
              >
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm transition-all group-hover:rotate-6 group-hover:scale-110 overflow-hidden bg-slate-200"
                      style={s.profile_image ? {} : { backgroundColor: branding.theme_color || '#2563eb' }}
                    >
                      {/* DITO YUNG LOGIC SA TABLE: Picture o First Letter */}
                      {s.profile_image ? (
                        <img src={`${API_BASE_URL}/uploads/profiles/${s.profile_image}`} className="w-full h-full object-cover" alt="profile" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                      ) : (
                        <span className="uppercase">{s.first_name?.charAt(0)}</span>
                      )}
                      {/* Ito yung lalabas kung sakaling broken link ang image */}
                      <span className="hidden uppercase">{s.first_name?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {s.first_name} {s.last_name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                        ID: {s.student_id}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-5 text-sm">
                  <p className="font-bold text-slate-600 flex items-center gap-1">
                    <BookOpen size={14} className="text-blue-500 shrink-0" /> 
                    {s.grade_level} {['Grade 11', 'Grade 12', 'College'].includes(s.grade_level) && s.program_code ? `- ${s.program_code}` : ''}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">LRN: {s.lrn || 'NOT PROVIDED'}</p>
                </td>
                <td className="p-5">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Phone size={12} className="text-blue-500" /> {s.mobile_no || 'N/A'}
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate max-w-[150px]" title={s.address_house}>
                    <MapPin size={10} /> {s.address_house || 'N/A'}
                  </p>
                </td>
                <td className="p-5">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter shadow-sm flex w-fit items-center gap-1.5 ${
                    s.is_verified 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${s.is_verified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {s.is_verified ? 'PORTAL ACTIVE' : 'PENDING INVITE'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
         </table>
      </div>

      {/* MULTI-STEP MODAL FOR CREATING PROFILE */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Student Registration Wizard</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  {currentStep === 1 && "Step 1: Personal Profile"}
                  {currentStep === 2 && "Step 2: Contact & Address"}
                  {currentStep === 3 && "Step 3: Family Background"}
                  {currentStep === 4 && "Step 4: Academic Details"}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-white shadow-sm p-3 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <StepIndicator />

              {/* STEP 1: PERSONAL INFO */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-1">
                    <Input label="LRN (12 Digits)" value={formData.lrn} onChange={v => handleNumberOnly(v, 'lrn', 12)} placeholder="12-digit LRN" maxLength="12"/>
                  </div>
                  <div className="md:col-span-2"></div>
                  <Input label="First Name" value={formData.first_name} onChange={v=>setFormData({...formData, first_name:v})} required/>
                  <Input label="Middle Name" value={formData.middle_name} onChange={v=>setFormData({...formData, middle_name:v})}/>
                  <Input label="Last Name" value={formData.last_name} onChange={v=>setFormData({...formData, last_name:v})} required/>
                  <Input label="Suffix" value={formData.suffix} onChange={v=>setFormData({...formData, suffix:v})} placeholder="Jr, Sr, III"/>
                  <Select label="Gender" value={formData.gender} onChange={v=>setFormData({...formData, gender:v})} options={['Male', 'Female', 'Other']}/>
                  
                  {/* LIMIT MAX DATE FOR DOB TO TODAY */}
                  <Input label="Date of Birth" type="date" value={formData.dob} onChange={v=>setFormData({...formData, dob:v})} max={new Date().toISOString().split('T')[0]} required/>
                  
                  <Input label="Place of Birth" value={formData.place_of_birth} onChange={v=>setFormData({...formData, place_of_birth:v})}/>
                  <Input label="Nationality" value={formData.nationality} onChange={v=>setFormData({...formData, nationality:v})}/>
                  <Input label="Religion" value={formData.religion} onChange={v=>setFormData({...formData, religion:v})}/>
                </div>
              )}

              {/* STEP 2: CONTACT & ADDRESS */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                  <Input label="Email Address" type="email" value={formData.email} onChange={v=>setFormData({...formData, email:v})} required/>
                  <Input label="Mobile Number" value={formData.mobile_no} onChange={v => handlePhoneInput(v, 'mobile_no')} placeholder="+639..." required/>
                  <div className="md:col-span-2"><Input label="House No. / Street" value={formData.address_house} onChange={v=>setFormData({...formData, address_house:v})} required/></div>
                  <Input label="Barangay" value={formData.address_brgy} onChange={v=>setFormData({...formData, address_brgy:v})} required/>
                  
                  {/* DYNAMIC PROVINCE/CITY DROPDOWNS */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Province *</label>
                    <select value={formData.address_province} onChange={e => setFormData({...formData, address_province: e.target.value, address_city: ''})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-sm">
                        <option value="">-- Select Province --</option>
                        {Object.keys(PHILIPPINE_PLACES).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">City / Municipality *</label>
                    <select disabled={!formData.address_province} value={formData.address_city} onChange={e => setFormData({...formData, address_city: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-sm disabled:opacity-50">
                        <option value="">-- Select City --</option>
                        {formData.address_province && PHILIPPINE_PLACES[formData.address_province].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <Input label="Zip Code" value={formData.address_zip} onChange={v => handleNumberOnly(v, 'address_zip', 5)} required maxLength="5"/>
                </div>
              )}

              {/* STEP 3: FAMILY BACKGROUND */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl">
                    <h4 className="md:col-span-3 text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2"><Users size={14}/> Father's Information</h4>
                    <Input label="Full Name" value={formData.father_name} onChange={v=>setFormData({...formData, father_name:v})}/>
                    <Input label="Occupation" value={formData.father_occ} onChange={v=>setFormData({...formData, father_occ:v})}/>
                    <Input label="Contact No." value={formData.father_contact} onChange={v => handlePhoneInput(v, 'father_contact')} placeholder="+639..."/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl">
                    <h4 className="md:col-span-3 text-xs font-black text-pink-500 uppercase tracking-widest flex items-center gap-2"><Users size={14}/> Mother's Information</h4>
                    <Input label="Full Name" value={formData.mother_name} onChange={v=>setFormData({...formData, mother_name:v})}/>
                    <Input label="Occupation" value={formData.mother_occ} onChange={v=>setFormData({...formData, mother_occ:v})}/>
                    <Input label="Contact No." value={formData.mother_contact} onChange={v => handlePhoneInput(v, 'mother_contact')} placeholder="+639..."/>
                  </div>
                </div>
              )}

              {/* STEP 4: ACADEMIC DETAILS (UPDATED FOR SHS/COLLEGE) */}
              {currentStep === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                  <Select label="Enrollment Type" value={formData.enrollment_type} onChange={v=>setFormData({...formData, enrollment_type:v})} options={['New', 'Transferee', 'Continuing']}/>
                  
                  {/* GRADE LEVEL */}
                  <Select 
                    label="Grade Level" 
                    value={formData.grade_level} 
                    onChange={v=>{
                       // Reset program_id if grade level changes
                       setFormData({...formData, grade_level:v, program_id: ''})
                    }} 
                    options={gradeLevels}
                  />
                  
                  {/* CONDITIONAL SHS STRAND OR COLLEGE COURSE */}
                  {(formData.grade_level === 'Grade 11' || formData.grade_level === 'Grade 12' || formData.grade_level === 'College') && (
                    <div className="md:col-span-2 bg-blue-50/50 p-5 rounded-2xl border border-blue-100 animate-in fade-in duration-300">
                       <label className="text-[10px] font-black text-blue-500 uppercase ml-1 tracking-widest mb-1.5 block">
                          {formData.grade_level === 'College' ? 'Select Course & Major *' : 'Select SHS Strand *'}
                       </label>
                       <select 
                          value={formData.program_id} 
                          onChange={e=>setFormData({...formData, program_id: e.target.value})}
                          className="w-full p-4 bg-white border border-blue-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-slate-700 shadow-sm"
                       >
                          <option value="">-- Select an option --</option>
                          {getProgramOptions().map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                       </select>
                    </div>
                  )}

                  <Input label="Previous School" value={formData.prev_school} onChange={v=>setFormData({...formData, prev_school:v})}/>
                  <Select label="Payment Plan" value={formData.payment_plan} onChange={v=>setFormData({...formData, payment_plan:v})} options={['Full Payment', 'Installment']}/>
                  
                  <div className="md:col-span-2 bg-amber-50 p-6 rounded-3xl flex items-start gap-4 border border-amber-100">
                     <Mail className="text-amber-500 shrink-0" />
                     <p className="text-xs text-amber-800 font-medium">Upon submission, an official <b>Student ID</b> will be generated and an invitation will be sent to <b>{formData.email || 'the provided email'}</b>.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-50 flex justify-between bg-slate-50/20">
              <button disabled={currentStep === 1} onClick={prevStep} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all">
                <ChevronLeft size={20}/> Previous
              </button>
              
              {currentStep < 4 ? (
                <button 
                  onClick={nextStep} 
                  disabled={!isStepValid()}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${isStepValid() ? 'active:scale-95' : 'opacity-50 grayscale cursor-not-allowed'}`} 
                  style={{backgroundColor: branding.theme_color || '#2563eb'}}
                >
                  Next Step <ChevronRight size={20}/>
                </button>
              ) : (
                <button 
                  onClick={handleSubmit} 
                  disabled={saveLoading || !isStepValid()} 
                  className={`flex items-center gap-2 px-10 py-3 rounded-xl font-black text-white shadow-xl transition-all ${isStepValid() ? 'active:scale-95' : 'opacity-50 grayscale cursor-not-allowed'}`} 
                  style={{backgroundColor: branding.theme_color || '#2563eb'}}
                >
                  {saveLoading ? <RefreshCw className="animate-spin" /> : <><Check size={20}/> Finish Enrollment</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

{/* STUDENT PROFILE VIEW MODAL (PRINT/PDF) */}
{viewModal && selectedStudent && (
  <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm print:p-0 print:bg-white">
    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden print:shadow-none print:max-h-full print:rounded-none animate-in slide-in-from-bottom-4 duration-300">
      
      {/* MODAL HEADER (HIDDEN ON PRINT) */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><User size={24}/></div>
          <h3 className="font-black text-slate-800 tracking-tight">Student Full Profile</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all shadow-lg">
             <Printer size={18} /> Print to PDF
          </button>
          <button onClick={() => setViewModal(false)} className="p-2.5 bg-slate-100 text-slate-400 hover:text-red-500 rounded-xl transition-colors"><X size={20}/></button>
        </div>
      </div>

      <div className="p-8 overflow-y-auto flex-1 print:overflow-visible font-sans">
        
        {/* COMPACT LETTERHEAD (ONLY ON PRINT) */}
        <div className="hidden print:flex items-center justify-center gap-4 mb-6 border-b-2 border-slate-800 pb-4">
          <img src={`${API_BASE_URL}/uploads/branding/${branding.school_logo}`} className="w-16 h-16 object-cover" alt="School Logo" />
          <div className="text-left">
            <h1 className="text-xl font-black text-slate-900 uppercase leading-tight">{branding.school_name}</h1>
            <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Office of the School Registrar</p>
            <p className="text-[8px] text-slate-400 italic">Official Student Academic Record</p>
          </div>
        </div>

        {/* PROFILE HEADER (SCREEN & PRINT) */}
        <div className="flex justify-between items-start mb-6 border-b pb-6" style={{borderColor: branding.theme_color || '#2563eb'}}>
           <div className="flex items-center gap-6">
              {/* SMALLER PROFILE IMAGE */}
              <div className="relative">
                 <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-200 shadow-md flex items-center justify-center">
                    {/* DITO YUNG LOGIC SA MODAL: Picture o First Letter */}
                    {selectedStudent.profile_image ? (
                       <img 
                          src={`${API_BASE_URL}/uploads/profiles/${selectedStudent.profile_image}`} 
                          className="w-full h-full object-cover"
                          alt="Profile"
                          onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                       />
                    ) : (
                       <div className="flex items-center justify-center w-full h-full text-slate-400 font-black text-4xl uppercase">
                          {selectedStudent.first_name?.charAt(0)}
                       </div>
                    )}
                    {/* Ito yung lalabas kung sakaling broken link ang image */}
                    <div className="hidden items-center justify-center w-full h-full text-slate-400 font-black text-4xl uppercase">
                        {selectedStudent.first_name?.charAt(0)}
                    </div>
                 </div>
              </div>

              <div>
                 <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Official Enrollment File</p>
                 <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none mb-2">
                    {selectedStudent.first_name} {selectedStudent.middle_name} {selectedStudent.last_name}
                 </h2>
                 <div className="flex flex-wrap items-center gap-3">
                    <p className="font-mono text-sm font-bold text-slate-500">ID: {selectedStudent.student_id}</p>
                    <span className="h-3 w-[1px] bg-slate-300"></span>
                    <p className="font-bold text-slate-600 uppercase text-[10px] flex items-center gap-1">
                       <BookOpen size={12} className="text-blue-500"/> 
                       {selectedStudent.grade_level} 
                       {['Grade 11', 'Grade 12', 'College'].includes(selectedStudent.grade_level) && selectedStudent.program_code ? ` | ${selectedStudent.program_code}` : ''}
                    </p>
                    <span className="h-3 w-[1px] bg-slate-300"></span>
                    
                    {/* ENROLLMENT STATUS INDICATOR */}
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ${
                      selectedStudent.enrollment_status === 'Enrolled' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      selectedStudent.enrollment_status === 'Assessed' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                      'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {selectedStudent.enrollment_status || 'Ready to Enroll'}
                    </span>
                 </div>
              </div>
           </div>
           
           <div className="text-right print:hidden">
              <img src={`${API_BASE_URL}/uploads/branding/${branding.school_logo}`} className="w-12 h-12 rounded-lg object-cover mb-1 ml-auto" alt="Logo" />
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{branding.school_name}</p>
           </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* I. PERSONAL */}
          <div className="col-span-3">
            <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-3 border-b pb-1">I. Personal Information & Contact</h4>
            <div className="grid grid-cols-4 gap-y-4">
                <InfoBox label="First Name" value={selectedStudent.first_name} bold />
                <InfoBox label="Middle Name" value={selectedStudent.middle_name} />
                <InfoBox label="Last Name" value={selectedStudent.last_name} bold />
                <InfoBox label="Suffix" value={selectedStudent.suffix} />
                
                <InfoBox label="LRN" value={selectedStudent.lrn} />
                <InfoBox label="Gender" value={selectedStudent.gender} />
                <InfoBox label="Date of Birth" value={selectedStudent.dob} />
                <InfoBox label="Email Address" value={selectedStudent.email} bold />
                
                <InfoBox label="Mobile Number" value={selectedStudent.mobile_no} bold />
                <div className="col-span-3"><InfoBox label="Home Address" value={selectedStudent.address_house} bold /></div>
            </div>
          </div>

          {/* II. PARENTS */}
          <div className="col-span-3">
             <h4 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 border-b pb-1">II. Parent / Guardian Details</h4>
             <div className="grid grid-cols-3 gap-y-4">
                <InfoBox label="Father's Name" value={selectedStudent.father_name} />
                <InfoBox label="Father Contact" value={selectedStudent.father_contact} />
                <div className="hidden md:block"></div>
                <InfoBox label="Mother's Name" value={selectedStudent.mother_name} />
                <InfoBox label="Mother Contact" value={selectedStudent.mother_contact} />
                <div className="hidden md:block"></div>
                <InfoBox label="Guardian Name" value={selectedStudent.guardian_name} />
                <InfoBox label="Guardian Contact" value={selectedStudent.guardian_contact} />
             </div>
          </div>

          {/* III. ACADEMIC RECORD */}
          <div className="col-span-3">
            <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-3 border-b pb-1">III. Academic Record</h4>
            <div className="grid grid-cols-3 gap-y-4">
                <InfoBox label="School Year" value={selectedStudent.school_year} bold />
                <InfoBox label="Grade Level" value={selectedStudent.grade_level} bold />
                
                {['Grade 11', 'Grade 12', 'College'].includes(selectedStudent.grade_level) && (
                   <div className="col-span-1">
                      <InfoBox label={selectedStudent.grade_level === 'College' ? 'Course & Major' : 'SHS Strand'} value={selectedStudent.program_desc || selectedStudent.program_code} bold />
                   </div>
                )}
                
                <InfoBox label="Enrollment Type" value={selectedStudent.enrollment_type} />
                <div className="col-span-2"><InfoBox label="Previous School" value={selectedStudent.prev_school} /></div>
            </div>
          </div>
        </div>

        {/* SIGNATURES ON PRINT */}
        <div className="hidden print:flex justify-between mt-12 pt-6 border-t border-slate-300">
           <div className="text-center w-56">
              <div className="border-b border-slate-800 mb-1"></div>
              <p className="text-[8px] font-black uppercase text-slate-500">Registrar Signature</p>
           </div>
           <div className="text-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Date Printed</p>
              <p className="text-[10px] font-bold">{new Date().toLocaleDateString()}</p>
           </div>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

// Reusable Components WITH SUPPORT FOR MAX AND MAXLENGTH
const Input = ({ label, type="text", value, onChange, placeholder, required=false, max, maxLength }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label} {required && '*'}</label>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required} max={max} maxLength={maxLength}
           className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-sm" />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <select value={value} onChange={e=>onChange(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-sm">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const InfoBox = ({ label, value, bold=false }) => (
  <div className="space-y-1">
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    <p className={`text-sm ${bold ? 'font-black text-slate-800' : 'font-medium text-slate-600'}`}>
      {value || '---'}
    </p>
  </div>
);

export default StudentManagement;