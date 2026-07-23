import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  UserPlus, X, Mail, RefreshCw, Calendar, Phone, GraduationCap, 
  BookOpen, User, Users, CreditCard, ChevronRight, ChevronLeft, Check, MapPin, Camera,
  Search, Filter, Printer, Briefcase, Sparkles, HelpCircle
} from 'lucide-react'; 
import { useAuth } from '../../context/AuthContext';
import HelpTutorialModal from '../../components/shared/HelpTutorialModal';

// Reusable Components WITH SUPPORT FOR MAX AND MAXLENGTH
function Input({ label, type="text", value, onChange, placeholder, required=false, max, maxLength }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label} {required && '*'}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required} max={max} maxLength={maxLength}
             className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-sm" />
    </div>
  );
}

function DatePicker({ label, value, onChange, required=false }) {
  const parts = value ? value.split('-') : ['', '', ''];
  const selYear = parts[0] || '';
  const selMonth = parts[1] || '';
  const selDay = parts[2] || '';

  const months = [
    { num: '01', name: 'January' },
    { num: '02', name: 'February' },
    { num: '03', name: 'March' },
    { num: '04', name: 'April' },
    { num: '05', name: 'May' },
    { num: '06', name: 'June' },
    { num: '07', name: 'July' },
    { num: '08', name: 'August' },
    { num: '09', name: 'September' },
    { num: '10', name: 'October' },
    { num: '11', name: 'November' },
    { num: '12', name: 'December' }
  ];

  const getDaysInMonth = (m, y) => {
    if (!m) return 31;
    const year = parseInt(y) || 2024;
    const month = parseInt(m);
    return new Date(year, month, 0).getDate();
  };

  const daysCount = getDaysInMonth(selMonth, selYear);
  const days = Array.from({ length: daysCount }, (_, i) => (i + 1).toString().padStart(2, '0'));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 85 }, (_, i) => (currentYear - i).toString());

  const handleUpdate = (type, val) => {
    let y = selYear;
    let m = selMonth;
    let d = selDay;

    if (type === 'year') y = val;
    if (type === 'month') m = val;
    if (type === 'day') d = val;

    if (y && m && d) {
      const maxD = getDaysInMonth(m, y);
      if (parseInt(d) > maxD) d = maxD.toString().padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    } else if (y || m || d) {
      const defaultY = y || currentYear.toString();
      const defaultM = m || '01';
      const defaultD = d || '01';
      onChange(`${defaultY}-${defaultM}-${defaultD}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className="md:col-span-3 bg-slate-50/80 p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
          <Calendar size={14} className="text-blue-600" />
          {label} {required && '*'}
        </label>
        {value ? (
          <span className="text-xs font-black text-blue-700 bg-blue-100/70 px-3 py-1 rounded-full border border-blue-200 shadow-sm flex items-center gap-1">
            <Check size={12} />
            {new Date(value + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-slate-400 italic">Select Month, Day, & Year</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* MONTH */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Month</label>
          <select 
            value={selMonth} 
            onChange={e => handleUpdate('month', e.target.value)} 
            required={required}
            className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-xs font-bold text-slate-700 shadow-sm cursor-pointer"
          >
            <option value="">-- Month --</option>
            {months.map(m => <option key={m.num} value={m.num}>{m.num} - {m.name}</option>)}
          </select>
        </div>

        {/* DAY */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Day</label>
          <select 
            value={selDay} 
            onChange={e => handleUpdate('day', e.target.value)} 
            required={required}
            className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-xs font-bold text-slate-700 shadow-sm cursor-pointer"
          >
            <option value="">-- Day --</option>
            {days.map(d => <option key={d} value={d}>{parseInt(d)}</option>)}
          </select>
        </div>

        {/* YEAR */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Year</label>
          <select 
            value={selYear} 
            onChange={e => handleUpdate('year', e.target.value)} 
            required={required}
            className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-xs font-bold text-slate-700 shadow-sm cursor-pointer"
          >
            <option value="">-- Year --</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-sm">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function InfoBox({ label, value, bold=false }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`text-sm ${bold ? 'font-black text-slate-800' : 'font-medium text-slate-600'}`}>
        {value || '---'}
      </p>
    </div>
  );
}

const StudentManagement = () => {
  const { branding, API_BASE_URL, getLogoUrl, getProfileImageUrl } = useAuth();
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
  const [successData, setSuccessData] = useState(null);

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

  const initialFormState = {
    // STEP 1
    lrn: '', first_name: '', middle_name: '', last_name: '', suffix: '', 
    nickname: '', gender: 'Male', dob: '', place_of_birth: '', 
    nationality: 'Filipino', religion: '', civil_status: 'Single',
    // STEP 2
    email: '', mobile_no: '', alt_mobile_no: '', 
    address_house: '', address_brgy: '', address_city: '', address_province: '', address_zip: '',
    // STEP 3: Educational Info
    elem_name: '', elem_year: '', elem_address: '',
    jhs_name: '', jhs_year: '', jhs_address: '',
    shs_name: '', shs_year: '', shs_address: '', shs_strand: '',
    // STEP 4: Work Details
    is_working: false, work_company: '', work_position: '', work_address: '',
    // STEP 5: Family Background
    father_first_name: '', father_middle_name: '', father_last_name: '', father_no_middle: false, father_occ: '', father_contact: '',
    mother_first_name: '', mother_middle_name: '', mother_last_name: '', mother_no_middle: false, mother_occ: '', mother_contact: '',
    guardian_type: 'Other', guardian_first_name: '', guardian_middle_name: '', guardian_last_name: '', guardian_no_middle: false, guardian_name: '', guardian_rel: '', guardian_contact: '', guardian_occ: '', guardian_address: '',
    // STEP 6: Academic Details
    enrollment_type: 'New', school_year: '2026-2027', grade_level: 'Grade 7', 
    program_id: '', // Dito ise-save yung ID nung napiling strand o course
    section: 'TBA',
    scholarship_type: 'None', payment_plan: 'Full Payment'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [profileImage, setProfileImage] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const fillDemoData = () => {
    setFormData({
      ...initialFormState,
      lrn: '123456789012',
      first_name: 'Juan',
      middle_name: 'Santos',
      last_name: 'Dela Cruz',
      suffix: 'Jr.',
      gender: 'Male',
      dob: '2006-08-15',
      place_of_birth: 'Manila City',
      nationality: 'Filipino',
      religion: 'Roman Catholic',
      email: `juan.${Math.floor(Math.random()*1000)}@example.com`,
      mobile_no: '+639171234567',
      address_house: '#123 Rizal Street, Subd. Phase 1',
      address_brgy: 'Brgy. Poblacion',
      address_province: 'Bulacan',
      address_city: 'Malolos',
      address_zip: '3000',
      elem_name: 'Malolos Central Elementary School',
      elem_year: '2018',
      elem_address: 'Malolos, Bulacan',
      jhs_name: 'Bulacan National High School',
      jhs_year: '2022',
      jhs_address: 'Malolos, Bulacan',
      shs_name: 'St. Jude Senior High Academy',
      shs_year: '2024',
      shs_address: 'Valenzuela City',
      shs_strand: 'STEM',
      is_working: false,
      father_first_name: 'Roberto',
      father_middle_name: 'Santos',
      father_last_name: 'Dela Cruz',
      father_occ: 'Civil Engineer',
      father_contact: '+639179876543',
      mother_first_name: 'Corazon',
      mother_middle_name: 'Reyes',
      mother_last_name: 'Garcia',
      mother_occ: 'Registered Nurse',
      mother_contact: '+639189876543',
      guardian_type: 'Father',
      enrollment_type: 'New',
      grade_level: 'Grade 11',
      payment_plan: 'Full Payment'
    });
  };

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
      // Educational background: Require Elementary name
      return !!formData.elem_name;
    }
    if (currentStep === 4) {
      // Work details: if working student, require company and position
      if (formData.is_working) {
        return !!(formData.work_company && formData.work_position);
      }
      return true;
    }
    if (currentStep === 5) {
      // Parents contact must be valid format if provided
      const fContactValid = !formData.father_contact || formData.father_contact === '+639' || formData.father_contact.length === 13;
      const mContactValid = !formData.mother_contact || formData.mother_contact === '+639' || formData.mother_contact.length === 13;
      const gContactValid = !formData.guardian_contact || formData.guardian_contact === '+639' || formData.guardian_contact.length === 13;
      return fContactValid && mContactValid && gContactValid;
    }
    if (currentStep === 6) {
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
      const data = new FormData();
      
      // Dynamically combine parent full names
      const mName = `${formData.mother_first_name || ''} ${formData.mother_no_middle ? '' : (formData.mother_middle_name || '')} ${formData.mother_last_name || ''}`.replace(/\s+/g, ' ').trim();
      const fName = `${formData.father_first_name || ''} ${formData.father_no_middle ? '' : (formData.father_middle_name || '')} ${formData.father_last_name || ''}`.replace(/\s+/g, ' ').trim();
      
      const gName = formData.guardian_type === 'Mother' ? mName : formData.guardian_type === 'Father' ? fName : formData.guardian_name;
      const gRel = formData.guardian_type === 'Mother' ? 'Mother' : formData.guardian_type === 'Father' ? 'Father' : formData.guardian_rel;
      const gContact = formData.guardian_type === 'Mother' ? formData.mother_contact : formData.guardian_type === 'Father' ? formData.father_contact : formData.guardian_contact;
      const gOcc = formData.guardian_type === 'Mother' ? formData.mother_occ : formData.guardian_type === 'Father' ? formData.father_occ : formData.guardian_occ;
      const gAddress = (formData.guardian_type === 'Mother' || formData.guardian_type === 'Father')
        ? `${formData.address_house || ''}, ${formData.address_brgy || ''}, ${formData.address_city || ''}, ${formData.address_province || ''}`.replace(/^,\s*|,\s*$/g, '').trim()
        : formData.guardian_address;

      const gFirstName = formData.guardian_type === 'Mother' ? formData.mother_first_name : formData.guardian_type === 'Father' ? formData.father_first_name : formData.guardian_first_name;
      const gMiddleName = formData.guardian_type === 'Mother' ? formData.mother_middle_name : formData.guardian_type === 'Father' ? formData.father_middle_name : formData.guardian_middle_name;
      const gLastName = formData.guardian_type === 'Mother' ? formData.mother_last_name : formData.guardian_type === 'Father' ? formData.father_last_name : formData.guardian_last_name;

      const finalPayload = {
        ...formData,
        mother_name: mName,
        father_name: fName,
        guardian_first_name: gFirstName,
        guardian_middle_name: gMiddleName,
        guardian_last_name: gLastName,
        guardian_name: gName,
        guardian_rel: gRel,
        guardian_contact: gContact,
        guardian_occ: gOcc,
        guardian_address: gAddress
      };

      // Append everything to FormData
      Object.keys(finalPayload).forEach(key => {
        data.append(key, finalPayload[key] === null || finalPayload[key] === undefined ? '' : finalPayload[key]);
      });

      if (profileImage) {
        data.append('profile_image', profileImage);
      }

      const response = await axios.post(`${API_BASE_URL}/registrar/register-student`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setShowModal(false);
        setFormData(initialFormState);
        setProfileImage(null);
        setCurrentStep(1);
        fetchData();
        const studentId = response.data.student_id;
        const password = response.data.password;
        const fullName = response.data.full_name;
        setSuccessData({ student_id: studentId, password, full_name: fullName });
      } else { 
        alert(response.data.message); 
      }
    } catch (err) { 
      alert(err.response?.data?.message || "Server Error"); 
    } finally { 
      setSaveLoading(false); 
    }
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchLower) || (student.student_id && student.student_id.toLowerCase().includes(searchLower));
    const matchesGrade = gradeFilter === 'All' || student.grade_level === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const getGuardianValue = (field) => {
    if (formData.guardian_type === 'Mother') {
      if (field === 'guardian_first_name') return formData.mother_first_name || '';
      if (field === 'guardian_middle_name') return formData.mother_middle_name || '';
      if (field === 'guardian_last_name') return formData.mother_last_name || '';
      if (field === 'guardian_no_middle') return formData.mother_no_middle || false;
      if (field === 'guardian_name') {
        return `${formData.mother_first_name || ''} ${formData.mother_no_middle ? '' : (formData.mother_middle_name || '')} ${formData.mother_last_name || ''}`.replace(/\s+/g, ' ').trim();
      }
      if (field === 'guardian_rel') return 'Mother';
      if (field === 'guardian_contact') return formData.mother_contact || '';
      if (field === 'guardian_occ') return formData.mother_occ || '';
      if (field === 'guardian_address') {
        return `${formData.address_house || ''}, ${formData.address_brgy || ''}, ${formData.address_city || ''}, ${formData.address_province || ''}`.replace(/^,\s*|,\s*$/g, '').trim();
      }
    }
    if (formData.guardian_type === 'Father') {
      if (field === 'guardian_first_name') return formData.father_first_name || '';
      if (field === 'guardian_middle_name') return formData.father_middle_name || '';
      if (field === 'guardian_last_name') return formData.father_last_name || '';
      if (field === 'guardian_no_middle') return formData.father_no_middle || false;
      if (field === 'guardian_name') {
        return `${formData.father_first_name || ''} ${formData.father_no_middle ? '' : (formData.father_middle_name || '')} ${formData.father_last_name || ''}`.replace(/\s+/g, ' ').trim();
      }
      if (field === 'guardian_rel') return 'Father';
      if (field === 'guardian_contact') return formData.father_contact || '';
      if (field === 'guardian_occ') return formData.father_occ || '';
      if (field === 'guardian_address') {
        return `${formData.address_house || ''}, ${formData.address_brgy || ''}, ${formData.address_city || ''}, ${formData.address_province || ''}`.replace(/^,\s*|,\s*$/g, '').trim();
      }
    }
    if (field === 'guardian_no_middle') return formData.guardian_no_middle || false;
    return formData[field] || '';
  };

  const handleGuardianTypeChange = (type) => {
    setFormData(prev => {
      let updates = { guardian_type: type };
      if (type === 'Mother') {
        updates.guardian_first_name = prev.mother_first_name;
        updates.guardian_middle_name = prev.mother_middle_name;
        updates.guardian_last_name = prev.mother_last_name;
        updates.guardian_no_middle = prev.mother_no_middle;
        updates.guardian_name = `${prev.mother_first_name || ''} ${prev.mother_no_middle ? '' : (prev.mother_middle_name || '')} ${prev.mother_last_name || ''}`.replace(/\s+/g, ' ').trim();
        updates.guardian_rel = 'Mother';
        updates.guardian_contact = prev.mother_contact;
        updates.guardian_occ = prev.mother_occ;
        updates.guardian_address = `${prev.address_house || ''}, ${prev.address_brgy || ''}, ${prev.address_city || ''}, ${prev.address_province || ''}`.replace(/^,\s*|,\s*$/g, '').trim();
      } else if (type === 'Father') {
        updates.guardian_first_name = prev.father_first_name;
        updates.guardian_middle_name = prev.father_middle_name;
        updates.guardian_last_name = prev.father_last_name;
        updates.guardian_no_middle = prev.father_no_middle;
        updates.guardian_name = `${prev.father_first_name || ''} ${prev.father_no_middle ? '' : (prev.father_middle_name || '')} ${prev.father_last_name || ''}`.replace(/\s+/g, ' ').trim();
        updates.guardian_rel = 'Father';
        updates.guardian_contact = prev.father_contact;
        updates.guardian_occ = prev.father_occ;
        updates.guardian_address = `${prev.address_house || ''}, ${prev.address_brgy || ''}, ${prev.address_city || ''}, ${prev.address_province || ''}`.replace(/^,\s*|,\s*$/g, '').trim();
      } else {
        updates.guardian_first_name = '';
        updates.guardian_middle_name = '';
        updates.guardian_last_name = '';
        updates.guardian_no_middle = false;
        updates.guardian_name = '';
        updates.guardian_rel = '';
        updates.guardian_contact = '';
        updates.guardian_occ = '';
        updates.guardian_address = '';
      }
      return { ...prev, ...updates };
    });
  };

  const getFatherName = (s) => {
    if (!s) return '---';
    if (s.father_first_name) {
      return `${s.father_first_name} ${s.father_middle_name || ''} ${s.father_last_name}`.replace(/\s+/g, ' ').trim();
    }
    return s.father_name || '---';
  };

  const getMotherName = (s) => {
    if (!s) return '---';
    if (s.mother_first_name) {
      return `${s.mother_first_name} ${s.mother_middle_name || ''} ${s.mother_last_name}`.replace(/\s+/g, ' ').trim();
    }
    return s.mother_name || '---';
  };

  const getGuardianName = (s) => {
    if (!s) return '---';
    if (s.guardian_first_name) {
      return `${s.guardian_first_name} ${s.guardian_middle_name || ''} ${s.guardian_last_name}`.replace(/\s+/g, ' ').trim();
    }
    return s.guardian_name || '---';
  };

  // HELPER PARA SA DROPDOWNS NG SHS / COLLEGE
  const getProgramOptions = () => {
    if (formData.grade_level === 'Grade 11' || formData.grade_level === 'Grade 12') {
      return programs
        .filter(p => p.department === 'SHS')
        .map(p => ({ value: p.id, label: `${p.program_code} - ${p.program_description} (Curriculum: ${p.curriculum_year || '2024-2025'})` }));
    } else if (formData.grade_level === 'College') {
      return programs
        .filter(p => p.department === 'College')
        .map(p => ({ 
          value: p.id, 
          label: p.major 
            ? `${p.program_code} Major in ${p.major} (Curriculum: ${p.curriculum_year || '2024-2025'})` 
            : `${p.program_code} - ${p.program_description} (Curriculum: ${p.curriculum_year || '2024-2025'})` 
        }));
    }
    return [];
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-4">
      {[1, 2, 3, 4, 5, 6].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${currentStep >= step ? 'text-white' : 'bg-slate-100 text-slate-400'}`}
               style={currentStep >= step ? {backgroundColor: branding.theme_color || '#2563eb'} : {}}>
            {currentStep > step ? <Check size={14} /> : step}
          </div>
          {step < 6 && <div className={`w-12 h-1 mx-2 rounded ${currentStep > step ? 'bg-blue-500' : 'bg-slate-100'}`} style={currentStep > step ? {backgroundColor: branding.theme_color || '#2563eb'} : {}} />}
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
          <button 
            onClick={() => setShowHelpModal(true)} 
            className="p-4 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-2xl text-xs font-black flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Page Overview & Tutorial"
          >
            <Sparkles size={18} className="text-amber-500" />
            <span className="hidden sm:inline">Tips & Guide</span>
          </button>
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
                        <img 
                          src={getProfileImageUrl(s.profile_image)} 
                          alt={s.first_name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentElement.innerText = s.first_name ? s.first_name.charAt(0).toUpperCase() : 'S';
                          }}
                        />
                      ) : (
                        s.first_name ? s.first_name.charAt(0).toUpperCase() : 'S'
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                        {s.first_name} {s.middle_name ? `${s.middle_name.charAt(0)}.` : ''} {s.last_name} {s.suffix || ''}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: {s.student_id} | LRN: {s.lrn || 'N/A'}</p>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200/60 inline-block">
                    {s.grade_level || 'N/A'}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 truncate max-w-[200px]" title={s.program_desc || s.program_code}>
                    {s.program_code ? `${s.program_code} - ${s.program_desc || ''}` : 'Basic Education'}
                  </p>
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
                  {currentStep === 3 && "Step 3: Educational Info"}
                  {currentStep === 4 && "Step 4: Work Details"}
                  {currentStep === 5 && "Step 5: Family Background"}
                  {currentStep === 6 && "Step 6: Academic Details"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={fillDemoData}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="Auto-fill form with sample student data for quick testing"
                >
                  <Sparkles size={16} className="text-amber-500 animate-bounce" />
                  <span>✨ Demo Mode (Auto-Fill)</span>
                </button>
                <button onClick={() => setShowModal(false)} className="bg-white shadow-sm p-3 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <StepIndicator />

              {/* STEP 1: PERSONAL INFO */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-3 flex flex-col items-center gap-2 bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Image (Optional)</label>
                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center border-2 border-white shadow-md">
                      {profileImage ? (
                        <img src={URL.createObjectURL(profileImage)} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <Camera className="text-slate-400" size={32} />
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setProfileImage(e.target.files[0] || null)}
                      className="text-xs font-bold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Input label="LRN (12 Digits)" value={formData.lrn} onChange={v => handleNumberOnly(v, 'lrn', 12)} placeholder="Ex. 123456789012" maxLength="12"/>
                  </div>
                  <div className="md:col-span-2"></div>
                  <Input label="First Name" value={formData.first_name} onChange={v=>setFormData({...formData, first_name:v})} placeholder="Ex. Juan / Maria" required/>
                  <Input label="Middle Name" value={formData.middle_name} onChange={v=>setFormData({...formData, middle_name:v})} placeholder="Ex. Santos (Optional)"/>
                  <Input label="Last Name" value={formData.last_name} onChange={v=>setFormData({...formData, last_name:v})} placeholder="Ex. Dela Cruz" required/>
                  <Input label="Suffix" value={formData.suffix} onChange={v=>setFormData({...formData, suffix:v})} placeholder="Ex. Jr, Sr, III (Optional)"/>
                  <Select label="Gender" value={formData.gender} onChange={v=>setFormData({...formData, gender:v})} options={['Male', 'Female', 'Other']}/>
                  
                  {/* EASY & BEAUTIFUL DATE OF BIRTH PICKER */}
                  <DatePicker label="Date of Birth" value={formData.dob} onChange={v=>setFormData({...formData, dob:v})} required/>
                  
                  <Input label="Place of Birth" value={formData.place_of_birth} onChange={v=>setFormData({...formData, place_of_birth:v})} placeholder="Ex. Manila City, Metro Manila"/>
                  <Input label="Nationality" value={formData.nationality} onChange={v=>setFormData({...formData, nationality:v})} placeholder="Ex. Filipino"/>
                  <Input label="Religion" value={formData.religion} onChange={v=>setFormData({...formData, religion:v})} placeholder="Ex. Roman Catholic / Christian / Islam"/>
                </div>
              )}

              {/* STEP 2: CONTACT & ADDRESS */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                  <Input label="Email Address" type="email" value={formData.email} onChange={v=>setFormData({...formData, email:v})} placeholder="Ex. juan.delacruz@email.com" required/>
                  <Input label="Mobile Number" value={formData.mobile_no} onChange={v => handlePhoneInput(v, 'mobile_no')} placeholder="Ex. 09123456789 or +639123456789" required/>
                  <div className="md:col-span-2"><Input label="House No. / Street" value={formData.address_house} onChange={v=>setFormData({...formData, address_house:v})} placeholder="Ex. #123 Rizal Street, Subd. Phase 1" required/></div>
                  <Input label="Barangay" value={formData.address_brgy} onChange={v=>setFormData({...formData, address_brgy:v})} placeholder="Ex. Brgy. Poblacion / Brgy. Central" required/>
                  
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

                  <Input label="Zip Code" value={formData.address_zip} onChange={v => handleNumberOnly(v, 'address_zip', 5)} placeholder="Ex. 3017 or 1000" required maxLength="5"/>
                </div>
              )}

              {/* STEP 3: EDUCATIONAL INFO */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  {/* GRADE SCHOOL (ELEMENTARY) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="md:col-span-3 text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                      <GraduationCap size={14}/> Elementary School (Graduated) *
                    </h4>
                    <div className="md:col-span-2">
                      <Input label="Name of School *" value={formData.elem_name} onChange={v=>setFormData({...formData, elem_name:v})} placeholder="Ex. Malolos Elementary School" required/>
                    </div>
                    <Input label="Year Graduated" value={formData.elem_year} onChange={v=>handleNumberOnly(v, 'elem_year', 4)} placeholder="Ex. 2020" maxLength="4"/>
                    <div className="md:col-span-3">
                      <Input label="School Address" value={formData.elem_address} onChange={v=>setFormData({...formData, elem_address:v})} placeholder="Ex. Malolos, Bulacan"/>
                    </div>
                  </div>

                  {/* JUNIOR HIGH SCHOOL */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="md:col-span-3 text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                      <GraduationCap size={14}/> Junior High School (JHS)
                    </h4>
                    <div className="md:col-span-2">
                      <Input label="Name of School" value={formData.jhs_name} onChange={v=>setFormData({...formData, jhs_name:v})} placeholder="Ex. Bulacan National High School"/>
                    </div>
                    <Input label="Year Completed" value={formData.jhs_year} onChange={v=>handleNumberOnly(v, 'jhs_year', 4)} placeholder="Ex. 2024" maxLength="4"/>
                    <div className="md:col-span-3">
                      <Input label="School Address" value={formData.jhs_address} onChange={v=>setFormData({...formData, jhs_address:v})} placeholder="Ex. Malolos, Bulacan"/>
                    </div>
                  </div>

                  {/* SENIOR HIGH SCHOOL */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="md:col-span-3 text-xs font-black text-pink-500 uppercase tracking-widest flex items-center gap-2">
                      <GraduationCap size={14}/> Senior High School (SHS)
                    </h4>
                    <div className="md:col-span-2">
                      <Input label="Name of School" value={formData.shs_name} onChange={v=>setFormData({...formData, shs_name:v})} placeholder="Ex. St. Jude Senior High Academy"/>
                    </div>
                    <Input label="Year Completed" value={formData.shs_year} onChange={v=>handleNumberOnly(v, 'shs_year', 4)} placeholder="Ex. 2026" maxLength="4"/>
                    <div className="md:col-span-2">
                      <Input label="School Address" value={formData.shs_address} onChange={v=>setFormData({...formData, shs_address:v})} placeholder="Ex. Valenzuela City"/>
                    </div>
                    <Input label="Strand / Track" value={formData.shs_strand} onChange={v=>setFormData({...formData, shs_strand:v})} placeholder="Ex. STEM, ABM, HUMSS, TVL"/>
                  </div>
                </div>
              )}

              {/* STEP 4: WORK DETAILS */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-800 tracking-tight">Employed / Working Student</h4>
                      <p className="text-xs text-slate-400 font-bold">Turn this option on if the student currently has a job.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={formData.is_working} 
                        onChange={e => {
                          setFormData({
                            ...formData,
                            is_working: e.target.checked,
                            work_company: e.target.checked ? formData.work_company : '',
                            work_position: e.target.checked ? formData.work_position : '',
                            work_address: e.target.checked ? formData.work_address : ''
                          })
                        }} 
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {formData.is_working ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 animate-in fade-in duration-300">
                      <h4 className="md:col-span-2 text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <Briefcase size={14}/> Employment & Work Information *
                      </h4>
                      <Input label="Company Name *" value={formData.work_company} onChange={v=>setFormData({...formData, work_company:v})} placeholder="Ex. Accenture Philippines / BPO Inc." required/>
                      <Input label="Position / Designation *" value={formData.work_position} onChange={v=>setFormData({...formData, work_position:v})} placeholder="Ex. Customer Service Representative" required/>
                      <div className="md:col-span-2">
                        <Input label="Company Address" value={formData.work_address} onChange={v=>setFormData({...formData, work_address:v})} placeholder="Ex. BGC, Taguig City"/>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50/50 border border-blue-100 p-8 rounded-3xl text-center space-y-2 py-12 animate-in fade-in duration-300">
                      <Briefcase className="text-blue-500 mx-auto opacity-60" size={32} />
                      <h5 className="font-bold text-slate-700 text-sm">Not Currently Employed</h5>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">This student is marked as a full-time student. No work details are required to proceed.</p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: FAMILY BACKGROUND */}
              {currentStep === 5 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  {/* FATHER'S INFORMATION */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="md:col-span-3 text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                      <Users size={14}/> Father's Information
                    </h4>
                    <Input label="First Name" value={formData.father_first_name} onChange={v=>setFormData({...formData, father_first_name:v})} placeholder="Ex. Roberto"/>
                    <div className="space-y-1.5">
                      <Input label="Middle Name" value={formData.father_middle_name} onChange={v=>setFormData({...formData, father_middle_name:v})} disabled={formData.father_no_middle} placeholder="Ex. Santos"/>
                      <label className="flex items-center gap-1.5 text-xs text-slate-500 font-bold select-none cursor-pointer mt-1 ml-1">
                        <input type="checkbox" checked={formData.father_no_middle} onChange={e=>{
                          setFormData({
                            ...formData,
                            father_no_middle: e.target.checked,
                            father_middle_name: e.target.checked ? '' : formData.father_middle_name
                          })
                        }} className="rounded text-blue-500 focus:ring-blue-500" />
                        <span>No Middle Name</span>
                      </label>
                    </div>
                    <Input label="Last Name" value={formData.father_last_name} onChange={v=>setFormData({...formData, father_last_name:v})} placeholder="Ex. Dela Cruz"/>
                    <Input label="Occupation" value={formData.father_occ} onChange={v=>setFormData({...formData, father_occ:v})} placeholder="Ex. Civil Engineer / Businessman"/>
                    <Input label="Contact No." value={formData.father_contact} onChange={v => handlePhoneInput(v, 'father_contact')} placeholder="Ex. 09171234567"/>
                  </div>

                  {/* MOTHER'S INFORMATION */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="md:col-span-3 text-xs font-black text-pink-500 uppercase tracking-widest flex items-center gap-2">
                      <Users size={14}/> Mother's Information (Maiden Name)
                    </h4>
                    <Input label="First Name" value={formData.mother_first_name} onChange={v=>setFormData({...formData, mother_first_name:v})} placeholder="Ex. Corazon"/>
                    <div className="space-y-1.5">
                      <Input label="Middle Name" value={formData.mother_middle_name} onChange={v=>setFormData({...formData, mother_middle_name:v})} disabled={formData.mother_no_middle} placeholder="Ex. Reyes"/>
                      <label className="flex items-center gap-1.5 text-xs text-slate-500 font-bold select-none cursor-pointer mt-1 ml-1">
                        <input type="checkbox" checked={formData.mother_no_middle} onChange={e=>{
                          setFormData({
                            ...formData,
                            mother_no_middle: e.target.checked,
                            mother_middle_name: e.target.checked ? '' : formData.mother_middle_name
                          })
                        }} className="rounded text-pink-500 focus:ring-pink-500" />
                        <span>No Middle Name</span>
                      </label>
                    </div>
                    <Input label="Maiden Last Name" value={formData.mother_last_name} onChange={v=>setFormData({...formData, mother_last_name:v})} placeholder="Ex. Garcia"/>
                    <Input label="Occupation" value={formData.mother_occ} onChange={v=>setFormData({...formData, mother_occ:v})} placeholder="Ex. Registered Nurse / Teacher"/>
                    <Input label="Contact No." value={formData.mother_contact} onChange={v => handlePhoneInput(v, 'mother_contact')} placeholder="Ex. 09181234567"/>
                  </div>

                  {/* GUARDIAN'S INFORMATION */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="md:col-span-3 text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                      <Users size={14}/> Guardian's Information
                    </h4>
                    
                    <div className="md:col-span-3 flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Guardian:</span>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                        <input type="radio" name="guardian_type" value="Mother" checked={formData.guardian_type === 'Mother'} onChange={() => handleGuardianTypeChange('Mother')} className="text-emerald-500 focus:ring-emerald-500" />
                        <span>Same as Mother</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                        <input type="radio" name="guardian_type" value="Father" checked={formData.guardian_type === 'Father'} onChange={() => handleGuardianTypeChange('Father')} className="text-emerald-500 focus:ring-emerald-500" />
                        <span>Same as Father</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                        <input type="radio" name="guardian_type" value="Other" checked={formData.guardian_type === 'Other'} onChange={() => handleGuardianTypeChange('Other')} className="text-emerald-500 focus:ring-emerald-500" />
                        <span>Other / Specify</span>
                      </label>
                    </div>

                    <Input label="First Name" value={getGuardianValue('guardian_first_name')} onChange={v => setFormData({...formData, guardian_first_name: v})} disabled={formData.guardian_type !== 'Other'} required={formData.guardian_type === 'Other'} placeholder="Ex. Maria"/>
                    <div className="space-y-1.5">
                      <Input label="Middle Name" value={getGuardianValue('guardian_middle_name')} onChange={v => setFormData({...formData, guardian_middle_name: v})} disabled={formData.guardian_type !== 'Other' || getGuardianValue('guardian_no_middle')} placeholder="Ex. Santos"/>
                      <label className="flex items-center gap-1.5 text-xs text-slate-500 font-bold select-none cursor-pointer mt-1 ml-1">
                        <input type="checkbox" checked={getGuardianValue('guardian_no_middle')} disabled={formData.guardian_type !== 'Other'} onChange={e=>{
                          setFormData({
                            ...formData,
                            guardian_no_middle: e.target.checked,
                            guardian_middle_name: e.target.checked ? '' : formData.guardian_middle_name
                          })
                        }} className="rounded text-emerald-500 focus:ring-emerald-500" />
                        <span>No Middle Name</span>
                      </label>
                    </div>
                    <Input label="Last Name" value={getGuardianValue('guardian_last_name')} onChange={v => setFormData({...formData, guardian_last_name: v})} disabled={formData.guardian_type !== 'Other'} required={formData.guardian_type === 'Other'} placeholder="Ex. Dela Cruz"/>
                    
                    <Input label="Relationship" value={getGuardianValue('guardian_rel')} onChange={v => setFormData({...formData, guardian_rel: v})} disabled={formData.guardian_type !== 'Other'} required={formData.guardian_type === 'Other'} placeholder={formData.guardian_type === 'Mother' ? 'Mother' : formData.guardian_type === 'Father' ? 'Father' : 'Ex. Aunt / Uncle / Sibling'}/>
                    <Input label="Contact No." value={getGuardianValue('guardian_contact')} onChange={v => handlePhoneInput(v, 'guardian_contact')} disabled={formData.guardian_type !== 'Other'} required={formData.guardian_type === 'Other'} placeholder="Ex. 09191234567"/>
                    <Input label="Occupation" value={getGuardianValue('guardian_occ')} onChange={v => setFormData({...formData, guardian_occ: v})} disabled={formData.guardian_type !== 'Other'} placeholder="Ex. Accountant / Manager"/>
                    
                    <div className="md:col-span-3">
                      <Input label="Home Address" value={getGuardianValue('guardian_address')} onChange={v => setFormData({...formData, guardian_address: v})} disabled={formData.guardian_type !== 'Other'} placeholder="Ex. #123 Rizal Street, Malolos, Bulacan"/>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: ACADEMIC DETAILS */}
              {currentStep === 6 && (
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
              
              {currentStep < 6 ? (
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

{/* ENROLLMENT SUCCESS MODAL */}
{successData && (
  <div className="fixed inset-0 bg-slate-900/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 text-center relative animate-in zoom-in-95 duration-200">
      <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
        <Check size={32} />
      </div>
      <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Enrollment Success</h3>
      <p className="text-slate-500 text-xs mb-6">Student profile created successfully! The credentials have been sent to their email.</p>
      
      <div className="bg-slate-50 rounded-3xl p-6 mb-6 text-left border border-slate-100 space-y-4">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student Name</p>
          <p className="text-sm font-bold text-slate-800">{successData.full_name}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student ID / Username</p>
          <p className="text-sm font-mono font-bold text-blue-600 select-all">{successData.student_id}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Generated Password</p>
          <p className="text-sm font-mono font-bold text-emerald-600 select-all">{successData.password}</p>
        </div>
      </div>
      
      <button 
        onClick={() => setSuccessData(null)} 
        className="w-full py-4 text-white font-bold rounded-2xl transition-all hover:scale-102 active:scale-98 shadow-md"
        style={{backgroundColor: branding.theme_color || '#2563eb'}}
      >
        Close & Continue
      </button>
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

      <div className="p-8 overflow-y-auto flex-1 print:overflow-visible font-sans relative">
         {/* Background Watermark School Logo */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] print:opacity-[0.05] z-0 select-none">
            <img 
               src={getLogoUrl(branding.school_logo)} 
               className="w-[450px] h-[450px] object-contain" 
               alt="Watermark Logo" 
            />
         </div>

         <div className="relative z-10 space-y-6">
            {/* COMPACT LETTERHEAD (ONLY ON PRINT) */}
            <div className="hidden print:flex items-center justify-center gap-4 mb-6 border-b-2 border-slate-800 pb-4">
              <img src={getLogoUrl(branding.school_logo)} className="w-16 h-16 object-cover" alt="School Logo" />
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
                         {selectedStudent.profile_image ? (
                            <img 
                               src={getProfileImageUrl(selectedStudent.profile_image)} 
                               className="w-full h-full object-cover"
                               alt="Profile"
                               onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                         ) : (
                           <div className="flex items-center justify-center w-full h-full text-slate-400 font-black text-4xl uppercase">
                              {selectedStudent.first_name?.charAt(0)}
                           </div>
                         )}
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
                  <img src={getLogoUrl(branding.school_logo)} className="w-12 h-12 rounded-lg object-cover mb-1 ml-auto" alt="Logo" />
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{branding.school_name}</p>
               </div>
            </div>

            <div className="space-y-6">
              {/* I. PERSONAL INFORMATION TABLE */}
              <div className="border border-blue-200 rounded-2xl overflow-hidden shadow-sm bg-white/95">
                 <div className="bg-blue-50 text-blue-900 border-b border-blue-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
                    I. Personal Information & Contact
                 </div>
                 <table className="w-full text-left border-collapse">
                    <tbody>
                       <tr className="border-b border-blue-100">
                          <td className="w-1/4 bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-blue-100">First Name</td>
                          <td className="w-1/4 p-3 text-sm font-bold text-slate-800 border-r border-blue-100">{selectedStudent.first_name || '---'}</td>
                          <td className="w-1/4 bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-blue-100">Middle Name</td>
                          <td className="w-1/4 p-3 text-sm text-slate-700">{selectedStudent.middle_name || '---'}</td>
                       </tr>
                       <tr className="border-b border-blue-100">
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-blue-100">Last Name</td>
                          <td className="p-3 text-sm font-bold text-slate-800 border-r border-blue-100">{selectedStudent.last_name || '---'}</td>
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-blue-100">Suffix</td>
                          <td className="p-3 text-sm text-slate-700">{selectedStudent.suffix || '---'}</td>
                       </tr>
                       <tr className="border-b border-blue-100">
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-blue-100">LRN</td>
                          <td className="p-3 text-sm text-slate-700 border-r border-blue-100">{selectedStudent.lrn || '---'}</td>
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-blue-100">Gender</td>
                          <td className="p-3 text-sm text-slate-700">{selectedStudent.gender || '---'}</td>
                       </tr>
                       <tr className="border-b border-blue-100">
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-blue-100">Date of Birth</td>
                          <td className="p-3 text-sm text-slate-700 border-r border-blue-100">{selectedStudent.dob || '---'}</td>
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-blue-100">Email Address</td>
                          <td className="p-3 text-sm font-bold text-slate-800 break-all">{selectedStudent.email || '---'}</td>
                       </tr>
                       <tr>
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-blue-100">Mobile Number</td>
                          <td className="p-3 text-sm font-bold text-slate-800 border-r border-blue-100">{selectedStudent.mobile_no || '---'}</td>
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-blue-100">Home Address</td>
                          <td className="p-3 text-sm text-slate-700">{selectedStudent.address_house || '---'}</td>
                       </tr>
                    </tbody>
                 </table>
              </div>

              {/* II. PARENT / GUARDIAN DETAILS TABLE */}
              <div className="border border-emerald-200 rounded-2xl overflow-hidden shadow-sm bg-white/95">
                 <div className="bg-emerald-50 text-emerald-900 border-b border-emerald-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
                    II. Parent / Guardian Details
                 </div>
                 <table className="w-full text-left border-collapse">
                    <tbody>
                       <tr className="border-b border-emerald-100">
                          <td className="w-1/4 bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-emerald-100">Father's Name</td>
                          <td className="w-1/4 p-3 text-sm text-slate-700 border-r border-emerald-100">{getFatherName(selectedStudent)}</td>
                          <td className="w-1/4 bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-emerald-100">Father Contact</td>
                          <td className="w-1/4 p-3 text-sm text-slate-700">{selectedStudent.father_contact || '---'}</td>
                       </tr>
                       <tr className="border-b border-emerald-100">
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-emerald-100">Mother's Name</td>
                          <td className="p-3 text-sm text-slate-700 border-r border-emerald-100">{getMotherName(selectedStudent)}</td>
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-emerald-100">Mother Contact</td>
                          <td className="p-3 text-sm text-slate-700">{selectedStudent.mother_contact || '---'}</td>
                       </tr>
                       <tr>
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-emerald-100">Guardian Name</td>
                          <td className="p-3 text-sm text-slate-700 border-r border-emerald-100">{getGuardianName(selectedStudent)}</td>
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-emerald-100">Guardian Contact</td>
                          <td className="p-3 text-sm text-slate-700">{selectedStudent.guardian_contact || '---'}</td>
                       </tr>
                    </tbody>
                 </table>
              </div>

              {/* III. EDUCATIONAL HISTORY TABLE */}
              <div className="border border-indigo-200 rounded-2xl overflow-hidden shadow-sm bg-white/95">
                 <div className="bg-indigo-50 text-indigo-900 border-b border-indigo-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
                    III. Educational History
                 </div>
                 <table className="w-full text-left border-collapse">
                    <tbody>
                       <tr className="border-b border-indigo-100">
                          <td className="w-1/4 bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-indigo-100">Elementary School</td>
                          <td className="w-1/4 p-3 text-sm text-slate-700 border-r border-indigo-100">
                             <div>{selectedStudent.elem_name || '---'}</div>
                             {selectedStudent.elem_year && <div className="text-[10px] text-slate-400 font-bold">Graduated: {selectedStudent.elem_year}</div>}
                          </td>
                          <td className="w-1/4 bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-indigo-100">Elementary Address</td>
                          <td className="w-1/4 p-3 text-sm text-slate-700">{selectedStudent.elem_address || '---'}</td>
                       </tr>
                       <tr className="border-b border-indigo-100">
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-indigo-100">Junior High School</td>
                          <td className="p-3 text-sm text-slate-700 border-r border-indigo-100">
                             <div>{selectedStudent.jhs_name || '---'}</div>
                             {selectedStudent.jhs_year && <div className="text-[10px] text-slate-400 font-bold">Completed: {selectedStudent.jhs_year}</div>}
                          </td>
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-indigo-100">JHS Address</td>
                          <td className="p-3 text-sm text-slate-700">{selectedStudent.jhs_address || '---'}</td>
                       </tr>
                       <tr>
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-indigo-100">Senior High School</td>
                          <td className="p-3 text-sm text-slate-700 border-r border-indigo-100">
                             <div>{selectedStudent.shs_name || '---'}</div>
                             {selectedStudent.shs_year && <div className="text-[10px] text-slate-400 font-bold">Completed: {selectedStudent.shs_year}</div>}
                             {selectedStudent.shs_strand && <div className="text-[10px] text-blue-500 font-bold">Strand: {selectedStudent.shs_strand}</div>}
                          </td>
                          <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-indigo-100">SHS Address</td>
                          <td className="p-3 text-sm text-slate-700">{selectedStudent.shs_address || '---'}</td>
                       </tr>
                    </tbody>
                 </table>
              </div>

              {/* IV. EMPLOYMENT & WORK DETAILS TABLE */}
              <div className="border border-purple-200 rounded-2xl overflow-hidden shadow-sm bg-white/95">
                 <div className="bg-purple-50 text-purple-900 border-b border-purple-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
                    IV. Employment & Work Details
                 </div>
                 <table className="w-full text-left border-collapse">
                    <tbody>
                       {selectedStudent.is_working ? (
                          <>
                             <tr className="border-b border-purple-100">
                                <td className="w-1/4 bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-purple-100">Employment Status</td>
                                <td className="w-1/4 p-3 text-sm font-bold text-slate-800 border-r border-purple-100">Working Student</td>
                                <td className="w-1/4 bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-purple-100">Company Name</td>
                                <td className="w-1/4 p-3 text-sm text-slate-700">{selectedStudent.work_company || '---'}</td>
                             </tr>
                             <tr>
                                <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-purple-100">Job Designation</td>
                                <td className="p-3 text-sm text-slate-700 border-r border-purple-100">{selectedStudent.work_position || '---'}</td>
                                <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-purple-100">Work Address</td>
                                <td className="p-3 text-sm text-slate-700">{selectedStudent.work_address || '---'}</td>
                             </tr>
                          </>
                       ) : (
                          <tr>
                             <td className="w-1/4 bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-purple-100">Employment Status</td>
                             <td colSpan="3" className="p-3 text-sm font-medium text-slate-500 italic">Full-time Student (Not Employed)</td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>

              {/* V. ACADEMIC RECORD TABLE */}
              <div className="border border-amber-200 rounded-2xl overflow-hidden shadow-sm bg-white/95">
                 <div className="bg-amber-50 text-amber-900 border-b border-amber-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
                    V. Academic Record
                 </div>
                 <table className="w-full text-left border-collapse">
                    <tbody>
                       <tr className="border-b border-amber-100">
                          <td className="w-1/4 bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-amber-100">School Year</td>
                          <td className="w-1/4 p-3 text-sm font-bold text-slate-800 border-r border-amber-100">{selectedStudent.school_year || '---'}</td>
                          <td className="w-1/4 bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-amber-100">Grade Level</td>
                          <td className="w-1/4 p-3 text-sm font-bold text-slate-800">{selectedStudent.grade_level || '---'}</td>
                       </tr>
                       <tr>
                          {['Grade 11', 'Grade 12', 'College'].includes(selectedStudent.grade_level) ? (
                             <>
                                <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-amber-100">
                                   {selectedStudent.grade_level === 'College' ? 'Course & Major' : 'SHS Strand'}
                                </td>
                                <td className="p-3 text-sm font-bold text-slate-800 border-r border-amber-100">
                                   {selectedStudent.program_desc || selectedStudent.program_code || '---'}
                                </td>
                                <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-amber-100">Enrollment Type</td>
                                <td className="p-3 text-sm text-slate-700">{selectedStudent.enrollment_type || '---'}</td>
                             </>
                          ) : (
                             <>
                                <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-amber-100">Enrollment Type</td>
                                <td className="p-3 text-sm text-slate-700 border-r border-amber-100">{selectedStudent.enrollment_type || '---'}</td>
                                <td className="bg-slate-50/80 p-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-blue-100"></td>
                                <td className="p-3 text-sm text-slate-700"></td>
                             </>
                          )}
                       </tr>
                    </tbody>
                 </table>
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
  </div>
)}

      {/* SYSTEM HELP & TUTORIAL MODAL */}
      <HelpTutorialModal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)} 
        onTriggerDemo={() => { 
          setShowModal(true); 
          fillDemoData(); 
        }} 
      />
    </div>
  );
};

export default StudentManagement;