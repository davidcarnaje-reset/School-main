import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, Users, ShieldCheck, ArrowRight, ArrowLeft, Menu, X, ChevronLeft, ChevronRight, CheckCircle, Search, School, Compass, Loader2, Camera, User, Check, Mail, RefreshCw, Briefcase, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { branding, API_BASE_URL, getLogoUrl, fetchBranding } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ==========================================
  // 1. STATES
  // ==========================================
  const [promotions, setPromotions] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Multi-Tenant States
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState(localStorage.getItem('selected_school_id'));
  const [searchTerm, setSearchTerm] = useState('');

  // Admissions & Wizard States
  const [showAdmissionsModal, setShowAdmissionsModal] = useState(false);
  const [showRegisterWizard, setShowRegisterWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [programs, setPrograms] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const initialFormState = {
    lrn: '', first_name: '', middle_name: '', last_name: '', suffix: '', 
    nickname: '', gender: 'Male', dob: '', place_of_birth: '', 
    nationality: 'Filipino', religion: '', civil_status: 'Single',
    email: '', mobile_no: '', alt_mobile_no: '', 
    address_house: '', address_brgy: '', address_city: '', address_province: '', address_zip: '',
    elem_name: '', elem_year: '', elem_address: '',
    jhs_name: '', jhs_year: '', jhs_address: '',
    shs_name: '', shs_year: '', shs_address: '', shs_strand: '',
    is_working: false, work_company: '', work_position: '', work_address: '',
    father_first_name: '', father_middle_name: '', father_last_name: '', father_no_middle: false, father_occ: '', father_contact: '',
    mother_first_name: '', mother_middle_name: '', mother_last_name: '', mother_no_middle: false, mother_occ: '', mother_contact: '',
    guardian_type: 'Other', guardian_first_name: '', guardian_middle_name: '', guardian_last_name: '', guardian_no_middle: false, guardian_name: '', guardian_rel: '', guardian_contact: '', guardian_occ: '', guardian_address: '',
    enrollment_type: 'New', school_year: '2026-2027', grade_level: 'Grade 7', 
    program_id: '', section: 'TBA', scholarship_type: 'None', payment_plan: 'Full Payment'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [profileImage, setProfileImage] = useState(null);
  const [successData, setSuccessData] = useState(null);
  
  // Captcha states
  const [captchaChallenge, setCaptchaChallenge] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

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

  // Helper inputs formatters
  const handlePhoneInput = (val, field) => {
    if (val === '') {
      setFormData(prev => ({ ...prev, [field]: '+639' }));
      return;
    }
    const numbersOnly = val.replace(/\D/g, '');
    if (numbersOnly.startsWith('639')) {
      const formatted = '+' + numbersOnly.slice(0, 12);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else if (numbersOnly.startsWith('9')) {
      const formatted = '+639' + numbersOnly.slice(1, 10);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      const clean = numbersOnly.slice(0, 9);
      setFormData(prev => ({ ...prev, [field]: '+639' + clean }));
    }
  };

  const handleNumberOnly = (val, field, max) => {
    const cleaned = val.replace(/\D/g, '').slice(0, max);
    setFormData(prev => ({ ...prev, [field]: cleaned }));
  };

  // Guardian automatic copy/helpers
  const getGuardianValue = (field) => {
    if (formData.guardian_type === 'Mother') {
      if (field === 'guardian_first_name') return formData.mother_first_name;
      if (field === 'guardian_middle_name') return formData.mother_middle_name;
      if (field === 'guardian_last_name') return formData.mother_last_name;
      if (field === 'guardian_no_middle') return formData.mother_no_middle;
      if (field === 'guardian_rel') return 'Mother';
      if (field === 'guardian_contact') return formData.mother_contact;
      if (field === 'guardian_occ') return formData.mother_occ;
      if (field === 'guardian_address') return `${formData.address_house || ''}, ${formData.address_brgy || ''}, ${formData.address_city || ''}, ${formData.address_province || ''}`.replace(/^,\s*|,\s*$/g, '').trim();
    }
    if (formData.guardian_type === 'Father') {
      if (field === 'guardian_first_name') return formData.father_first_name;
      if (field === 'guardian_middle_name') return formData.father_middle_name;
      if (field === 'guardian_last_name') return formData.father_last_name;
      if (field === 'guardian_no_middle') return formData.father_no_middle;
      if (field === 'guardian_rel') return 'Father';
      if (field === 'guardian_contact') return formData.father_contact;
      if (field === 'guardian_occ') return formData.father_occ;
      if (field === 'guardian_address') return `${formData.address_house || ''}, ${formData.address_brgy || ''}, ${formData.address_city || ''}, ${formData.address_province || ''}`.replace(/^,\s*|,\s*$/g, '').trim();
    }
    return formData[field];
  };

  const handleGuardianTypeChange = (type) => {
    if (type === 'Mother') {
      const fullMName = `${formData.mother_first_name || ''} ${formData.mother_no_middle ? '' : (formData.mother_middle_name || '')} ${formData.mother_last_name || ''}`.replace(/\s+/g, ' ').trim();
      const mAddr = `${formData.address_house || ''}, ${formData.address_brgy || ''}, ${formData.address_city || ''}, ${formData.address_province || ''}`.replace(/^,\s*|,\s*$/g, '').trim();
      setFormData(prev => ({
        ...prev,
        guardian_type: type,
        guardian_first_name: prev.mother_first_name,
        guardian_middle_name: prev.mother_middle_name,
        guardian_last_name: prev.mother_last_name,
        guardian_no_middle: prev.mother_no_middle,
        guardian_name: fullMName,
        guardian_rel: 'Mother',
        guardian_contact: prev.mother_contact,
        guardian_occ: prev.mother_occ,
        guardian_address: mAddr
      }));
    } else if (type === 'Father') {
      const fullFName = `${formData.father_first_name || ''} ${formData.father_no_middle ? '' : (formData.father_middle_name || '')} ${formData.father_last_name || ''}`.replace(/\s+/g, ' ').trim();
      const fAddr = `${formData.address_house || ''}, ${formData.address_brgy || ''}, ${formData.address_city || ''}, ${formData.address_province || ''}`.replace(/^,\s*|,\s*$/g, '').trim();
      setFormData(prev => ({
        ...prev,
        guardian_type: type,
        guardian_first_name: prev.father_first_name,
        guardian_middle_name: prev.father_middle_name,
        guardian_last_name: prev.father_last_name,
        guardian_no_middle: prev.father_no_middle,
        guardian_name: fullFName,
        guardian_rel: 'Father',
        guardian_contact: prev.father_contact,
        guardian_occ: prev.father_occ,
        guardian_address: fAddr
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        guardian_type: type,
        guardian_first_name: '',
        guardian_middle_name: '',
        guardian_last_name: '',
        guardian_no_middle: false,
        guardian_name: '',
        guardian_rel: '',
        guardian_contact: '',
        guardian_occ: '',
        guardian_address: ''
      }));
    }
  };

  const getFatherName = (f) => `${f.father_first_name || ''} ${f.father_middle_name || ''} ${f.father_last_name || ''}`.replace(/\s+/g, ' ').trim() || '---';
  const getMotherName = (f) => `${f.mother_first_name || ''} ${f.mother_middle_name || ''} ${f.mother_last_name || ''}`.replace(/\s+/g, ' ').trim() || '---';
  const getGuardianName = (f) => `${f.guardian_first_name || ''} ${f.guardian_middle_name || ''} ${f.guardian_last_name || ''}`.replace(/\s+/g, ' ').trim() || '---';

  const getProgramOptions = () => {
    if (formData.grade_level === 'Grade 11' || formData.grade_level === 'Grade 12') {
      return programs
        .filter(p => p.department === 'SHS')
        .map(p => ({ 
          value: p.id, 
          label: `${p.program_code} - ${p.program_description} (Curriculum: ${p.curriculum_year || '2024-2025'})` 
        }));
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

  const isStepValid = () => {
    if (currentStep === 1) {
      const { first_name, last_name, dob, gender, lrn } = formData;
      const isLrnValid = !lrn || lrn.length === 12; 
      return first_name && last_name && dob && gender && isLrnValid;
    }
    if (currentStep === 2) {
      const { email, mobile_no, address_city, address_province, address_zip, address_house, address_brgy } = formData;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmailValid = emailRegex.test(email);
      const isPhoneValid = mobile_no && mobile_no.length === 13;
      return isEmailValid && isPhoneValid && address_city && address_province && address_zip && address_house && address_brgy;
    }
    if (currentStep === 3) {
      return !!formData.elem_name;
    }
    if (currentStep === 4) {
      if (formData.is_working) {
        return !!(formData.work_company && formData.work_position);
      }
      return true;
    }
    if (currentStep === 5) {
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
    if (isStepValid()) {
      setCurrentStep(prev => prev + 1);
      if (currentStep === 5) {
        generateCaptcha();
      }
    }
  };
  const prevStep = () => setCurrentStep(prev => prev - 1);

  // Captcha Generator Code
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let text = '';
    for (let i = 0; i < 5; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaChallenge(text);
    setCaptchaInput('');
    setCaptchaError(false);
    
    setTimeout(() => {
      const canvas = document.getElementById('captcha-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = `rgba(${Math.floor(Math.random()*100)}, ${Math.floor(Math.random()*100)}, ${Math.floor(Math.random()*255)}, 0.35)`;
        ctx.lineWidth = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      }
      
      ctx.font = 'bold 24px monospace';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        ctx.fillStyle = `rgb(${Math.floor(Math.random()*80)}, ${Math.floor(Math.random()*80)}, ${Math.floor(Math.random()*150)})`;
        ctx.save();
        const x = 16 + i * 22;
        const y = canvas.height / 2 + (Math.random() * 8 - 4);
        const angle = (Math.random() * 26 - 13) * Math.PI / 180;
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(char, 0, 0);
        ctx.restore();
      }
    }, 150);
  };

  const handleAdmissionSubmit = async (e) => {
    e.preventDefault();
    if (!isStepValid()) return;
    
    // CAPTCHA VALIDATION
    if (captchaInput.trim().toUpperCase() !== captchaChallenge) {
      setCaptchaError(true);
      generateCaptcha();
      return;
    }
    
    setSaveLoading(true);
    try {
      const data = new FormData();
      
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

      Object.keys(finalPayload).forEach(key => {
        data.append(key, finalPayload[key] === null || finalPayload[key] === undefined ? '' : finalPayload[key]);
      });

      if (profileImage) {
        data.append('profile_image', profileImage);
      }

      // Explicitly append the selected campus as the target school
      const schoolId = selectedSchoolId || 1;
      data.append('school_id', schoolId);

      const response = await axios.post(`${API_BASE_URL}/registrar/register-student`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setShowRegisterWizard(false);
        setFormData(initialFormState);
        setProfileImage(null);
        setCurrentStep(1);
        
        const studentId = response.data.student_id;
        const password = response.data.password;
        const fullName = response.data.full_name;
        setSuccessData({ student_id: studentId, password, full_name: fullName });
      } else {
        alert(response.data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Server error occurred during application.');
    } finally {
      setSaveLoading(false);
    }
  };

  const fetchActivePrograms = async (schoolId) => {
    try {
      const activeId = schoolId || selectedSchoolId || 1;
      const res = await axios.get(`${API_BASE_URL}/registrar/get_academic_programs.php?school_id=${activeId}`);
      if (Array.isArray(res.data)) {
        setPrograms(res.data.filter(p => p.status === 'Active'));
      }
    } catch (error) {
      console.error("Error fetching academic programs:", error);
    }
  };

  // ==========================================
  // 2. FETCH ACTIVE SCHOOLS
  // ==========================================
  const fetchActiveSchools = async () => {
    try {
      setLoadingSchools(true);
      const res = await axios.get(`${API_BASE_URL}/schools/public`);
      if (res.data.success) {
        setSchools(res.data.schools);
      }
    } catch (error) {
      console.error("Error fetching public schools:", error);
    } finally {
      setLoadingSchools(false);
    }
  };

  // ==========================================
  // 3. FETCH PROMOTIONS
  // ==========================================
  const fetchPromotions = async (schoolId) => {
    try {
      const activeId = schoolId || selectedSchoolId || 1;
      const res = await axios.get(`${API_BASE_URL}/public/promotions?school_id=${activeId}`);
      if (res.data.success) {
        const formattedPromos = res.data.promotions.map(promo => ({
          id: promo.id,
          image: promo.image_file && promo.image_file.startsWith('http') ? promo.image_file : `${API_BASE_URL}/uploads/promotions/${promo.image_file}`,
          title: promo.title,
          subtitle: promo.subtitle,
          buttonText: promo.button_text,
          buttonLink: promo.button_link || '/login'
        }));
        setPromotions(formattedPromos);
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
    }
  };

  useEffect(() => {
    if (!selectedSchoolId) {
      fetchActiveSchools();
    } else {
      fetchPromotions(selectedSchoolId);
      fetchActivePrograms(selectedSchoolId);
    }
  }, [selectedSchoolId]);

  // ==========================================
  // 4. CAROUSEL AUTO-PLAY
  // ==========================================
  useEffect(() => {
    if (promotions.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === promotions.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [promotions.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === promotions.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? promotions.length - 1 : prev - 1));

  // ==========================================
  // 5. CAMPUS SELECTION HANDLERS
  // ==========================================
  const handleSelectCampus = (school) => {
    localStorage.setItem('selected_school_id', school.id);
    setSelectedSchoolId(school.id);
    fetchBranding(school.id);
    fetchPromotions(school.id);
    fetchActivePrograms(school.id);
  };

  const handleChangeCampus = () => {
    localStorage.removeItem('selected_school_id');
    setSelectedSchoolId(null);
    fetchActiveSchools();
  };

  // Filter schools based on search
  const filteredSchools = schools.filter(school => 
    school.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==========================================
  // RENDER CAMPUS SELECTOR (No Campus Selected)
  // ==========================================
  if (!selectedSchoolId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 font-sans">
        <div className="max-w-2xl w-full text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 text-blue-600 rounded-3xl mb-4">
            <School size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-none">
            Select Your Campus
          </h1>
          <p className="text-slate-500 font-medium mt-3 text-base">
            Maging bahagi ng aming lumalaking pamilya. Piliin ang iyong campus upang magpatuloy sa portal.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-md mx-auto relative group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <Search size={18} />
            </span>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Maghanap ng School Campus..."
              className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 shadow-xl shadow-slate-100/50 outline-none transition-all text-sm font-bold"
            />
          </div>
        </div>

        {loadingSchools ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="animate-spin mb-3" size={32} />
            <p className="text-xs font-bold uppercase tracking-widest">Hinahanap ang mga campus...</p>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-xl max-w-md w-full">
            <Compass className="mx-auto text-slate-300 mb-4 animate-pulse" size={50} />
            <h3 className="text-lg font-bold text-slate-800">Walang Campus na Nahanap</h3>
            <p className="text-slate-500 text-sm mt-2">Pakisuri ang iyong search term o subukan ulit mamaya.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl w-full">
            {filteredSchools.map((school) => (
              <div 
                key={school.id}
                onClick={() => handleSelectCampus(school)}
                className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-xl shadow-slate-100/50 cursor-pointer hover:shadow-2xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100 shadow-inner group-hover:scale-105 transition-transform">
                  {school.logo ? (
                    <img src={getLogoUrl(school.logo)} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-black text-xl" style={{ backgroundColor: school.theme_color || '#2563eb' }}>
                      {school.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400" style={{ color: school.theme_color }}>Official Campus</p>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight mt-0.5 line-clamp-2">{school.name}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowRight size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-12 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} SMS Portal Network. Secure Platform.
        </p>
      </div>
    );
  }

  // ==========================================
  // RENDER LANDING PAGE (Campus Selected)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-[100] shadow-sm animate-in fade-in duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {branding.school_logo && (
              <img 
                src={getLogoUrl(branding.school_logo)} 
                className="h-9 w-9 object-contain" 
                alt="Logo" 
              />
            )}
            <div className="flex flex-col gap-1.5">
              <span className="font-black text-base md:text-xl text-slate-800 tracking-tighter uppercase leading-none">
                {branding.school_name}
              </span>
              <button 
                onClick={handleChangeCampus}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 border border-slate-200 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-wider transition-all outline-none cursor-pointer self-start shadow-sm"
              >
                <ArrowLeft size={10} strokeWidth={3} />
                <span>Change Campus</span>
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">Home</a>
            <button onClick={() => setShowAdmissionsModal(true)} className="hover:text-blue-600 transition-colors uppercase font-bold text-[10px] tracking-widest outline-none bg-transparent border-0 cursor-pointer">Admissions</button>
            <a href="#" className="hover:text-blue-600 transition-colors">About Us</a>
          </div>

          <button 
            className="md:hidden p-2 text-slate-600" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 space-y-4 md:hidden animate-in slide-in-from-top-2 duration-200">
            <a href="#" className="block text-sm font-bold text-slate-600 py-2">Home</a>
            <button onClick={() => { setShowAdmissionsModal(true); setIsMenuOpen(false); }} className="block w-full text-left text-sm font-bold text-slate-600 py-2 outline-none bg-transparent border-0 cursor-pointer">Admissions</button>
            <a href="#" className="block text-sm font-bold text-slate-600 py-2">About Us</a>
            <button 
              onClick={handleChangeCampus}
              className="block w-full text-left text-sm font-black text-blue-600 py-2 border-t pt-4 mt-2"
            >
              Change Campus
            </button>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <main className="flex-grow flex items-center justify-center p-6 md:p-12 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          {/* LEFT SIDE: DYNAMIC CONDITIONAL RENDERING */}
          <div className="w-full flex flex-col justify-center min-h-[400px] lg:min-h-[500px]">
            
            {promotions.length > 0 ? (
              // Carousel
              <div className="relative w-full h-[400px] lg:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl group border border-slate-100 bg-slate-900">
                
                {promotions.map((promo, index) => (
                  <div 
                    key={promo.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent flex flex-col justify-end p-10">
                      <h2 className="text-3xl lg:text-4xl font-black text-white mb-2 leading-tight">{promo.title}</h2>
                      <p className="text-slate-200 font-medium mb-6 max-w-sm">{promo.subtitle}</p>
                      {promo.buttonText && (
                        <button 
                          onClick={() => navigate(promo.buttonLink)} 
                          className="w-max px-6 py-3 bg-white font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg text-sm"
                          style={{ color: branding.theme_color || '#2563eb' }}
                        >
                          {promo.buttonText}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Arrows and Dots */}
                {promotions.length > 1 && (
                  <>
                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                      {promotions.map((_, index) => (
                        <button 
                          key={index} 
                          onClick={() => setCurrentSlide(index)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentSlide ? 'bg-white w-6 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Default Text
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Official Campus Portal</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter text-slate-800">
                  Your Future <br/>Starts <span style={{ color: branding.theme_color || '#2563eb' }}>Here.</span>
                </h2>
                <p className="text-slate-500 text-lg max-w-md leading-relaxed">
                  Experience a modern way of learning. Access your student records and school resources anywhere, anytime.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: PORTAL SELECTION CARD */}
          <div className="flex justify-center lg:justify-end w-full">
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100 w-full max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Access Your Portal</h3>
                <p className="text-slate-400 text-sm font-medium">Select your account type to continue.</p>
              </div>

              <div className="space-y-4">
                <button onClick={() => navigate('/login')} className="group w-full p-6 bg-blue-50 hover:bg-blue-600 border border-blue-100 rounded-[2rem] flex items-center justify-between transition-all duration-300 active:scale-[0.98]">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform"><GraduationCap size={24} /></div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 group-hover:text-blue-100">Portal Access</p>
                      <p className="text-lg font-black text-slate-800 group-hover:text-white leading-none">Student Portal</p>
                    </div>
                  </div>
                  <ArrowRight className="text-blue-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                <button onClick={() => navigate('/staff/login')} className="group w-full p-6 bg-slate-50 hover:bg-slate-800 border border-slate-200 rounded-[2rem] flex items-center justify-between transition-all duration-300 active:scale-[0.98]">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-600 shadow-sm group-hover:scale-110 transition-transform"><Users size={24} /></div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-300">Staff Access</p>
                      <p className="text-lg font-black text-slate-800 group-hover:text-white leading-none">Staff Portal</p>
                    </div>
                  </div>
                  <ArrowRight className="text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ADMISSIONS INFO & REQUIREMENTS MODAL */}
      {showAdmissionsModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm overflow-hidden animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Campus Admission Guide</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{branding.school_name}</p>
              </div>
              <button onClick={() => setShowAdmissionsModal(false)} className="bg-white shadow-sm p-3 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
            </div>

            <div className="p-8 overflow-y-auto flex-grow space-y-6">
              <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-2">
                <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest">General Admission Guidelines</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Welcome to our online application portal! Please read the requirements below before starting your registration. Make sure you have clear scanned copies or photos of your academic credentials and personal identification.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Required Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={16}/>
                    <div>
                      <h5 className="text-xs font-bold text-slate-700 font-black">For Basic Ed (Kinder to Grade 10)</h5>
                      <p className="text-[10px] text-slate-500 mt-1 font-bold">• Birth Certificate (PSA)<br/>• Report Card (Form 138)<br/>• 2x2 ID Photo</p>
                    </div>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={16}/>
                    <div>
                      <h5 className="text-xs font-bold text-slate-700 font-black">For Senior High (Grade 11-12)</h5>
                      <p className="text-[10px] text-slate-500 mt-1 font-bold">• Form 138 / Completion Certificate<br/>• PSA Birth Certificate<br/>• Good Moral Certificate</p>
                    </div>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={16}/>
                    <div>
                      <h5 className="text-xs font-bold text-slate-700 font-black">For College Freshmen</h5>
                      <p className="text-[10px] text-slate-500 mt-1 font-bold">• Form 138 / Transcript of Records<br/>• PSA Birth Certificate<br/>• Honorable Dismissal (Transferees)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-3">
                <AlertCircle className="text-amber-500 shrink-0" size={20}/>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  <strong>Important Note:</strong> An official, auto-generated Student ID and Password will be provided at the end of the registration wizard upon successful submission. A welcome invitation link will also be sent to your registered email address.
                </p>
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50/20 flex gap-4">
              <button onClick={() => setShowAdmissionsModal(false)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all">Cancel</button>
              <button 
                onClick={() => {
                  setShowAdmissionsModal(false);
                  fetchActivePrograms(selectedSchoolId);
                  setShowRegisterWizard(true);
                  setCurrentStep(1);
                }} 
                className="flex-grow py-4 text-white font-black rounded-2xl transition-all hover:scale-102 active:scale-98 shadow-lg flex items-center justify-center gap-2"
                style={{backgroundColor: branding.theme_color || '#2563eb'}}
              >
                Apply Now <ArrowRight size={18}/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WIZARD MODAL */}
      {showRegisterWizard && (
        <div className="fixed inset-0 bg-slate-900/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm overflow-hidden animate-in fade-in duration-300">
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
              <button onClick={() => setShowRegisterWizard(false)} className="bg-white shadow-sm p-3 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              {/* STEP BUBBLES */}
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
                    <Input label="LRN (12 Digits)" value={formData.lrn} onChange={v => handleNumberOnly(v, 'lrn', 12)} placeholder="12-digit LRN" maxLength="12"/>
                  </div>
                  <div className="md:col-span-2"></div>
                  <Input label="First Name" value={formData.first_name} onChange={v=>setFormData({...formData, first_name:v})} required/>
                  <Input label="Middle Name" value={formData.middle_name} onChange={v=>setFormData({...formData, middle_name:v})}/>
                  <Input label="Last Name" value={formData.last_name} onChange={v=>setFormData({...formData, last_name:v})} required/>
                  <Input label="Suffix" value={formData.suffix} onChange={v=>setFormData({...formData, suffix:v})} placeholder="Jr, Sr, III"/>
                  <Select label="Gender" value={formData.gender} onChange={v=>setFormData({...formData, gender:v})} options={['Male', 'Female', 'Other']}/>
                  
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

              {/* STEP 3: EDUCATIONAL INFO */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  {/* ELEMENTARY */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="md:col-span-3 text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                      <GraduationCap size={14}/> Elementary School (Graduated) *
                    </h4>
                    <div className="md:col-span-2">
                      <Input label="Name of School *" value={formData.elem_name} onChange={v=>setFormData({...formData, elem_name:v})} required/>
                    </div>
                    <Input label="Year Graduated" value={formData.elem_year} onChange={v=>handleNumberOnly(v, 'elem_year', 4)} placeholder="e.g. 2020" maxLength="4"/>
                    <div className="md:col-span-3">
                      <Input label="School Address" value={formData.elem_address} onChange={v=>setFormData({...formData, elem_address:v})}/>
                    </div>
                  </div>

                  {/* JHS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="md:col-span-3 text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                      <GraduationCap size={14}/> Junior High School (JHS)
                    </h4>
                    <div className="md:col-span-2">
                      <Input label="Name of School" value={formData.jhs_name} onChange={v=>setFormData({...formData, jhs_name:v})}/>
                    </div>
                    <Input label="Year Completed" value={formData.jhs_year} onChange={v=>handleNumberOnly(v, 'jhs_year', 4)} placeholder="e.g. 2024" maxLength="4"/>
                    <div className="md:col-span-3">
                      <Input label="School Address" value={formData.jhs_address} onChange={v=>setFormData({...formData, jhs_address:v})}/>
                    </div>
                  </div>

                  {/* SHS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="md:col-span-3 text-xs font-black text-pink-500 uppercase tracking-widest flex items-center gap-2">
                      <GraduationCap size={14}/> Senior High School (SHS)
                    </h4>
                    <div className="md:col-span-2">
                      <Input label="Name of School" value={formData.shs_name} onChange={v=>setFormData({...formData, shs_name:v})}/>
                    </div>
                    <Input label="Year Completed" value={formData.shs_year} onChange={v=>handleNumberOnly(v, 'shs_year', 4)} placeholder="e.g. 2026" maxLength="4"/>
                    <div className="md:col-span-2">
                      <Input label="School Address" value={formData.shs_address} onChange={v=>setFormData({...formData, shs_address:v})}/>
                    </div>
                    <Input label="Strand / Track" value={formData.shs_strand} onChange={v=>setFormData({...formData, shs_strand:v})} placeholder="e.g. STEM, ABM, HUMSS"/>
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
                      <Input label="Company Name *" value={formData.work_company} onChange={v=>setFormData({...formData, work_company:v})} required/>
                      <Input label="Position / Designation *" value={formData.work_position} onChange={v=>setFormData({...formData, work_position:v})} required/>
                      <div className="md:col-span-2">
                        <Input label="Company Address" value={formData.work_address} onChange={v=>setFormData({...formData, work_address:v})}/>
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
                  {/* FATHER'S INFO */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="md:col-span-3 text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                      <Users size={14}/> Father's Information
                    </h4>
                    <Input label="First Name" value={formData.father_first_name} onChange={v=>setFormData({...formData, father_first_name:v})}/>
                    <div className="space-y-1.5">
                      <Input label="Middle Name" value={formData.father_middle_name} onChange={v=>setFormData({...formData, father_middle_name:v})} disabled={formData.father_no_middle}/>
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
                    <Input label="Last Name" value={formData.father_last_name} onChange={v=>setFormData({...formData, father_last_name:v})}/>
                    <Input label="Occupation" value={formData.father_occ} onChange={v=>setFormData({...formData, father_occ:v})}/>
                    <Input label="Contact No." value={formData.father_contact} onChange={v => handlePhoneInput(v, 'father_contact')} placeholder="+639..."/>
                  </div>

                  {/* MOTHER'S INFO */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="md:col-span-3 text-xs font-black text-pink-500 uppercase tracking-widest flex items-center gap-2">
                      <Users size={14}/> Mother's Information (Maiden Name)
                    </h4>
                    <Input label="First Name" value={formData.mother_first_name} onChange={v=>setFormData({...formData, mother_first_name:v})}/>
                    <div className="space-y-1.5">
                      <Input label="Middle Name" value={formData.mother_middle_name} onChange={v=>setFormData({...formData, mother_middle_name:v})} disabled={formData.mother_no_middle}/>
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
                    <Input label="Maiden Last Name" value={formData.mother_last_name} onChange={v=>setFormData({...formData, mother_last_name:v})}/>
                    <Input label="Occupation" value={formData.mother_occ} onChange={v=>setFormData({...formData, mother_occ:v})}/>
                    <Input label="Contact No." value={formData.mother_contact} onChange={v => handlePhoneInput(v, 'mother_contact')} placeholder="+639..."/>
                  </div>

                  {/* GUARDIAN INFO */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="md:col-span-3 text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                      <Users size={14}/> Guardian's Information
                    </h4>
                    <div className="md:col-span-3 flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Guardian:</span>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                        <input type="radio" name="guardian_type_adm" value="Mother" checked={formData.guardian_type === 'Mother'} onChange={() => handleGuardianTypeChange('Mother')} className="text-emerald-500 focus:ring-emerald-500" />
                        <span>Same as Mother</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                        <input type="radio" name="guardian_type_adm" value="Father" checked={formData.guardian_type === 'Father'} onChange={() => handleGuardianTypeChange('Father')} className="text-emerald-500 focus:ring-emerald-500" />
                        <span>Same as Father</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                        <input type="radio" name="guardian_type_adm" value="Other" checked={formData.guardian_type === 'Other'} onChange={() => handleGuardianTypeChange('Other')} className="text-emerald-500 focus:ring-emerald-500" />
                        <span>Other / Specify</span>
                      </label>
                    </div>

                    <Input label="First Name" value={getGuardianValue('guardian_first_name')} onChange={v => setFormData({...formData, guardian_first_name: v})} disabled={formData.guardian_type !== 'Other'} required={formData.guardian_type === 'Other'}/>
                    <div className="space-y-1.5">
                      <Input label="Middle Name" value={getGuardianValue('guardian_middle_name')} onChange={v => setFormData({...formData, guardian_middle_name: v})} disabled={formData.guardian_type !== 'Other' || getGuardianValue('guardian_no_middle')}/>
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
                    <Input label="Last Name" value={getGuardianValue('guardian_last_name')} onChange={v => setFormData({...formData, guardian_last_name: v})} disabled={formData.guardian_type !== 'Other'} required={formData.guardian_type === 'Other'}/>
                    
                    <Input label="Relationship" value={getGuardianValue('guardian_rel')} onChange={v => setFormData({...formData, guardian_rel: v})} disabled={formData.guardian_type !== 'Other'} required={formData.guardian_type === 'Other'}/>
                    <Input label="Contact No." value={getGuardianValue('guardian_contact')} onChange={v => handlePhoneInput(v, 'guardian_contact')} disabled={formData.guardian_type !== 'Other'} required={formData.guardian_type === 'Other'} placeholder="+639..."/>
                    <Input label="Occupation" value={getGuardianValue('guardian_occ')} onChange={v => setFormData({...formData, guardian_occ: v})} disabled={formData.guardian_type !== 'Other'}/>
                    
                    <div className="md:col-span-3">
                      <Input label="Home Address" value={getGuardianValue('guardian_address')} onChange={v => setFormData({...formData, guardian_address: v})} disabled={formData.guardian_type !== 'Other'}/>
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
                       setFormData({...formData, grade_level:v, program_id: ''})
                    }} 
                    options={gradeLevels}
                  />
                  
                  {/* STRAND OR COURSE */}
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

                  {/* CAPTCHA CHALLENGE PANEL */}
                  <div className="md:col-span-2 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4 mt-2">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                          Security Verification *
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">Please solve the challenge below to prove you are human.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <canvas id="captcha-canvas" width="130" height="50" className="rounded-xl shadow-sm border border-slate-200 bg-white" />
                        <button 
                          type="button" 
                          onClick={generateCaptcha} 
                          className="bg-white shadow-sm p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-600 transition-all hover:rotate-180 duration-500 animate-in spin-in-12"
                        >
                          <RefreshCw size={16}/>
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                      <Input 
                        label="Type the Captcha Code *" 
                        value={captchaInput} 
                        onChange={v => {
                          setCaptchaInput(v);
                          setCaptchaError(false);
                        }} 
                        placeholder="Enter 5-character code"
                        maxLength="5"
                        required
                      />
                      {captchaError && (
                        <div className="text-xs text-red-500 font-bold mb-3 flex items-center gap-1.5 animate-bounce">
                          <AlertCircle size={14}/>
                          Incorrect captcha! New code generated.
                        </div>
                      )}
                    </div>
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
                  onClick={handleAdmissionSubmit} 
                  disabled={saveLoading || !isStepValid() || !captchaInput} 
                  className={`flex items-center gap-2 px-10 py-3 rounded-xl font-black text-white shadow-xl transition-all ${isStepValid() && captchaInput ? 'active:scale-95' : 'opacity-50 grayscale cursor-not-allowed'}`} 
                  style={{backgroundColor: branding.theme_color || '#2563eb'}}
                >
                  {saveLoading ? <RefreshCw className="animate-spin" /> : <><Check size={20}/> Submit Application</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ENROLLMENT SUCCESS MODAL */}
      {successData && (
        <div className="fixed inset-0 bg-slate-900/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 text-center relative animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <Check size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Application Success</h3>
            <p className="text-slate-500 text-xs mb-6">Your admission profile was submitted successfully! Credentials have been sent to your email.</p>
            
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
              className="w-full py-4 text-white font-bold rounded-2xl transition-all hover:scale-102 active:scale-98 shadow-md cursor-pointer border-0"
              style={{backgroundColor: branding.theme_color || '#2563eb'}}
            >
              Close & Continue
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="p-8 text-center border-t border-slate-100 bg-white">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          &copy; {new Date().getFullYear()} {branding.school_name}. Powered by SMS Technology.
        </p>
      </footer>
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

export default LandingPage;