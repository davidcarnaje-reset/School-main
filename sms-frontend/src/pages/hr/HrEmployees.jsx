import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Search, UserPlus, Shield, Mail, Edit, Phone, 
  Award, X, FileText, CheckCircle, AlertCircle, Upload 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HrEmployees = () => {
  const { API_BASE_URL, branding } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);

  // Field error states for validation
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Helper to validate email format
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Formatters for PH Statutory IDs with Automatic Dashes & Digit Restrictions
  const formatSSS = (val) => {
    if (!val) return '';
    const digits = String(val).replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 2) return digits;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 9)}-${digits.slice(9)}`;
  };

  const formatPhilHealth = (val) => {
    if (!val) return '';
    const digits = String(val).replace(/\D/g, '').slice(0, 12);
    if (digits.length <= 2) return digits;
    if (digits.length <= 11) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 11)}-${digits.slice(11)}`;
  };

  const formatPagIBIG = (val) => {
    if (!val) return '';
    const digits = String(val).replace(/\D/g, '').slice(0, 12);
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  };

  const formatTIN = (val) => {
    if (!val) return '';
    const digits = String(val).replace(/\D/g, '').slice(0, 12);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  // State for complete employee profile + statutory details + documents checklist
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    email: '',
    position: 'TEACHER',
    department: 'Administration',
    basic_salary: 25000,
    status: 'Active',
    phone_number: '',
    employment_history: 'Hired Active',
    salary_type: 'Monthly',

    // Government Statutory IDs
    sss_number: '',
    philhealth_number: '',
    pagibig_number: '',
    tin_number: '',
    hmo_covered: 'No',
    hmo_details: '',

    // Documents Checklist Status
    psa_status: 'Pending',
    psa_file: '',
    coe_status: 'Pending',
    coe_file: '',
    nbi_status: 'Pending',
    nbi_file: '',
    sss_doc_status: 'Pending',
    sss_doc_file: '',
    philhealth_doc_status: 'Pending',
    philhealth_doc_file: '',
    pagibig_doc_status: 'Pending',
    pagibig_doc_file: '',
    tin_doc_status: 'Pending',
    tin_doc_file: ''
  });

  const themeColor = branding?.theme_color || '#2563eb';

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cashier/payroll/employees`);
      setEmployees(res.data || []);
    } catch (error) {
      console.error("Error fetching EIS employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone_number') {
      // Allow only numbers and limit to 11 digits (PH Standard)
      const cleanVal = value.replace(/\D/g, '').slice(0, 11);
      setFormData(prev => ({ ...prev, phone_number: cleanVal }));

      if (cleanVal.length > 0 && cleanVal.length < 11) {
        setPhoneError('Phone contact must be exactly 11 digits (PH standard, e.g. 09171234567)');
      } else if (cleanVal.length === 11 && !cleanVal.startsWith('09') && !cleanVal.startsWith('0')) {
        setPhoneError('Phone contact must be a valid PH number starting with 09');
      } else {
        setPhoneError('');
      }
      return;
    }

    if (name === 'email') {
      setFormData(prev => ({ ...prev, email: value }));
      if (value && !isValidEmail(value)) {
        setEmailError('Please enter a valid email address (e.g. name@domain.com)');
      } else {
        setEmailError('');
      }
      return;
    }

    if (name === 'sss_number') {
      setFormData(prev => ({ ...prev, sss_number: formatSSS(value) }));
      return;
    }

    if (name === 'philhealth_number') {
      setFormData(prev => ({ ...prev, philhealth_number: formatPhilHealth(value) }));
      return;
    }

    if (name === 'pagibig_number') {
      setFormData(prev => ({ ...prev, pagibig_number: formatPagIBIG(value) }));
      return;
    }

    if (name === 'tin_number') {
      setFormData(prev => ({ ...prev, tin_number: formatTIN(value) }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHireSubmit = async (e) => {
    e.preventDefault();

    // 1. Email Validation Checker
    if (!formData.email || !isValidEmail(formData.email)) {
      setEmailError('Please enter a valid email address (e.g. name@domain.com)');
      alert('Invalid Email: Please provide a valid email address.');
      return;
    }

    // 2. PH Phone Number 11 Digits Validation
    if (formData.phone_number) {
      if (formData.phone_number.length !== 11) {
        setPhoneError('Phone contact must be exactly 11 digits (PH standard: 09XXXXXXXXX)');
        alert('Invalid Phone Contact: Philippine standard phone numbers must be exactly 11 digits (e.g. 09171234567).');
        return;
      }
      if (!formData.phone_number.startsWith('09') && !formData.phone_number.startsWith('0')) {
        setPhoneError('Phone contact must start with 09 (e.g. 09171234567)');
        alert('Invalid PH Phone Number: Mobile contact must start with 09 (e.g. 09171234567).');
        return;
      }
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/employee-portal/hire`, formData);
      if (res.data?.success) {
        alert(res.data.message || `EIS Action completed: Hired/Modified ${formData.first_name} ${formData.last_name}.`);
        fetchEmployees();
        setShowModal(false);
        setEditingEmp(null);
        resetForm();
      } else {
        alert(res.data?.message || "Error registering employee.");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error submitting EIS form.");
    }
  };

  const resetForm = () => {
    setEmailError('');
    setPhoneError('');
    setFormData({
      first_name: '',
      middle_name: '',
      last_name: '',
      suffix: '',
      email: '',
      position: 'TEACHER',
      department: 'Faculty',
      basic_salary: 25000,
      status: 'Active',
      phone_number: '',
      employment_history: 'Hired Active',
      employment_status: 'Probationary',
      salary_type: 'Monthly',

      sss_number: '',
      philhealth_number: '',
      pagibig_number: '',
      tin_number: '',
      hmo_covered: 'No',
      hmo_details: '',

      psa_status: 'Pending',
      psa_file: '',
      coe_status: 'Pending',
      coe_file: '',
      nbi_status: 'Pending',
      nbi_file: '',
      sss_doc_status: 'Pending',
      sss_doc_file: '',
      philhealth_doc_status: 'Pending',
      philhealth_doc_file: '',
      pagibig_doc_status: 'Pending',
      pagibig_doc_file: '',
      tin_doc_status: 'Pending',
      tin_doc_file: ''
    });
  };

  const handleEditClick = (emp) => {
    setEditingEmp(emp);
    setEmailError('');
    setPhoneError('');
    
    // Parse mock statutory data if none exists
    setFormData({
      first_name: emp.first_name || '',
      middle_name: emp.middle_name || '',
      last_name: emp.last_name || '',
      suffix: emp.suffix || '',
      email: emp.email || '',
      position: emp.position || 'TEACHER',
      department: emp.department || 'Faculty',
      basic_salary: emp.basic_salary || 25000,
      status: emp.status || 'Active',
      phone_number: emp.phone_number || '',
      employment_history: emp.employment_history || 'Promoted',
      employment_status: emp.employment_status || 'Probationary',
      salary_type: emp.salary_type || 'Monthly',

      sss_number: formatSSS(emp.sss_number || '03-9384729-1'),
      philhealth_number: formatPhilHealth(emp.philhealth_number || '12-094837264-9'),
      pagibig_number: formatPagIBIG(emp.pagibig_number || '1210-9483-9284'),
      tin_number: formatTIN(emp.tin_number || '321-094-837-000'),
      hmo_covered: emp.hmo_covered || 'Yes',
      hmo_details: emp.hmo_details || 'Maxicare Premium Plan',

      psa_status: emp.psa_status || 'Submitted',
      psa_file: emp.psa_file || 'psa_cert_copy.pdf',
      coe_status: emp.coe_status || 'Submitted',
      coe_file: emp.coe_file || 'coe_previous_company.pdf',
      nbi_status: emp.nbi_status || 'Pending',
      nbi_file: emp.nbi_file || '',
      sss_doc_status: emp.sss_doc_status || 'Submitted',
      sss_doc_file: emp.sss_doc_file || 'sss_static_card.jpg',
      philhealth_doc_status: emp.philhealth_doc_status || 'Submitted',
      philhealth_doc_file: emp.philhealth_doc_file || 'philhealth_mdrf.pdf',
      pagibig_doc_status: emp.pagibig_doc_status || 'Pending',
      pagibig_doc_file: emp.pagibig_doc_file || '',
      tin_doc_status: emp.tin_doc_status || 'Submitted',
      tin_doc_file: emp.tin_doc_file || 'tin_id_scan.png'
    });
    setShowModal(true);
  };

  const filtered = employees.filter(e => 
    `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (e.position || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="text-blue-600" size={32} style={{ color: themeColor }} />
            Employee Information System (EIS)
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Stores personal details, job titles, department assignments, contact info, and employment history logs.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setEditingEmp(null); setShowModal(true); }}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:scale-[1.02]"
          style={{ backgroundColor: themeColor }}
        >
          <UserPlus size={16} />
          Hire / Register Employee
        </button>
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-4 shadow-sm flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees by name, job position role, or department..."
          className="w-full text-sm bg-transparent focus:outline-none placeholder-slate-400 font-medium text-slate-700"
        />
      </div>

      {/* DIRECTORY TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm">
        {loading ? (
          <p className="text-xs text-slate-400 font-bold text-center py-10 animate-pulse">Loading Employee Information Records...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Employee ID</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Name Details</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Job Position & Dept</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Contact & Salary</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">History Log</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pr-4">
                      <span className="text-xs font-mono font-bold text-slate-400">{emp.employee_id}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-sm font-bold text-slate-700">
                        {emp.first_name} {emp.middle_name ? `${emp.middle_name.trim().charAt(0)}.` : ''} {emp.last_name} {emp.suffix || ''}
                      </p>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5"><Mail size={12}/> {emp.email}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="space-y-1">
                        <span className="inline-block text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">{emp.position}</span>
                        <p className="text-[10px] text-slate-400 font-semibold">{emp.department || 'Administration'}</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-xs font-mono font-bold text-slate-700">₱{emp.basic_salary?.toLocaleString()}</p>
                      <span className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-black mt-0.5 block w-fit">{emp.salary_type || 'Monthly'} Release</span>
                      {emp.phone_number && <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5"><Phone size={12}/> {emp.phone_number}</span>}
                    </td>
                    <td className="py-4 pr-4">
                      <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-black flex items-center gap-1 w-fit"><Award size={10}/> {emp.employment_history || 'Hired Active'}</span>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        emp.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <button onClick={() => handleEditClick(emp)} className="p-2 hover:bg-slate-55 rounded-xl text-slate-500 hover:text-blue-600 transition-all inline-block"><Edit size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POP-UP DETAILED HIRE / REGISTER EMPLOYEE MODAL (Matches User Request) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[99] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight text-base">
                  {editingEmp ? `Update Employee: ${editingEmp.first_name} ${editingEmp.last_name}` : "Hire / Register New Employee Profile"}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Employee Information System (EIS) & Document Auditing</p>
              </div>
              <button onClick={() => { setShowModal(false); setEditingEmp(null); }} className="p-2 text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>

            {/* Modal Body (Scrollable content with 3 columns/categories) */}
            <form onSubmit={handleHireSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 text-xs font-semibold text-slate-700">
              
              {/* GROUP 1: BASIC & JOB DETAILS */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-450 border-b border-slate-100 pb-2">1. Basic & Job Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">First Name *</label>
                    <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required placeholder="e.g. Jobel" className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">Middle Name</label>
                    <input type="text" name="middle_name" value={formData.middle_name || ''} onChange={handleInputChange} placeholder="e.g. Fernando" className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">Last Name *</label>
                    <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required placeholder="e.g. Jobert" className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">Suffix (if any)</label>
                    <input type="text" name="suffix" value={formData.suffix || ''} onChange={handleInputChange} placeholder="e.g. Jr., III" className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">Email Address *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="e.g. jobel@school.edu" 
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none transition-all ${
                        emailError ? 'border-red-400 bg-red-50/50 text-red-900 focus:border-red-500' : 'border-slate-150 text-slate-700 focus:border-blue-500'
                      }`} 
                    />
                    {emailError && (
                      <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 animate-in fade-in">
                        <span>⚠️</span> {emailError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400">Phone Contact</label>
                      <span className={`text-[9px] font-bold ${formData.phone_number?.length === 11 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {formData.phone_number?.length || 0}/11 digits
                      </span>
                    </div>
                    <input 
                      type="text" 
                      name="phone_number" 
                      value={formData.phone_number} 
                      onChange={handleInputChange} 
                      maxLength={11}
                      placeholder="e.g. 09171234567" 
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none transition-all ${
                        phoneError ? 'border-red-400 bg-red-50/50 text-red-900 focus:border-red-500' : 'border-slate-150 text-slate-700 focus:border-blue-500'
                      }`} 
                    />
                    {phoneError ? (
                      <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 animate-in fade-in">
                        <span>⚠️</span> {phoneError}
                      </p>
                    ) : (
                      <p className="text-[9px] text-slate-400 font-semibold">Standard PH 11-digit mobile (e.g. 09171234567)</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">Job Title / Position</label>
                    <select name="position" value={formData.position} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                      <option value="TEACHER">Academic Teacher</option>
                      <option value="IT STAFF">IT Support Staff</option>
                      <option value="REGISTRAR STAFF">Registrar Officer</option>
                      <option value="CASHIER STAFF">Finance Cashier</option>
                      <option value="CUSTODIAN STAFF">Facilities Custodian</option>
                      <option value="NURSE STAFF">Clinic Nurse</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">Department</label>
                    <select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                      <option value="Faculty">Faculty (Academic)</option>
                      <option value="Administration">Operations Administration</option>
                      <option value="IT Office">IT System Office</option>
                      <option value="Finance Cashier">Cashier Finance Dept</option>
                      <option value="Registrar Academics">Registrar Academic Dept</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">Employment Status</label>
                    <select name="employment_status" value={formData.employment_status} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                      <option value="Probationary">Probationary</option>
                      <option value="Regular">Regular / Permanent</option>
                      <option value="Contractual">Contractual</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">Basic Monthly Pay (₱) *</label>
                    <input type="number" name="basic_salary" value={formData.basic_salary} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">Payment Releasing Schedule</label>
                    <select name="salary_type" value={formData.salary_type || 'Monthly'} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                      <option value="Monthly">Monthly Release (Every 30th)</option>
                      <option value="Semi-Monthly">Semi-Monthly Release (15th & 30th)</option>
                      <option value="Weekly">Weekly Release (Every Friday)</option>
                      <option value="Daily">Daily Release (Daily Wage)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">Uptime Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                      <option value="Active">Active Duty</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Inactive">Terminated / Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">Employment Log History</label>
                    <input type="text" name="employment_history" value={formData.employment_history} onChange={handleInputChange} placeholder="e.g. Hired on probation, Promoted" className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>

              {/* GROUP 2: GOVERNMENT IDs & STATUTORY NUMBERS */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-450 border-b border-slate-100 pb-2">2. Statutory Identifications (SSS, Philhealth, Pag-IBIG, TIN, HMO)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* SSS */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400">SSS Number</label>
                      <span className="text-[9px] text-slate-400 font-bold">XX-XXXXXXX-X</span>
                    </div>
                    <input type="text" name="sss_number" value={formData.sss_number} onChange={handleInputChange} maxLength={12} placeholder="00-0000000-0" className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 font-mono tracking-wider" />
                  </div>

                  {/* Philhealth */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400">PhilHealth Number</label>
                      <span className="text-[9px] text-slate-400 font-bold">XX-XXXXXXXXX-X</span>
                    </div>
                    <input type="text" name="philhealth_number" value={formData.philhealth_number} onChange={handleInputChange} maxLength={14} placeholder="00-000000000-0" className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 font-mono tracking-wider" />
                  </div>

                  {/* Pag-IBIG */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400">Pag-IBIG HDMF Number</label>
                      <span className="text-[9px] text-slate-400 font-bold">XXXX-XXXX-XXXX</span>
                    </div>
                    <input type="text" name="pagibig_number" value={formData.pagibig_number} onChange={handleInputChange} maxLength={14} placeholder="0000-0000-0000" className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 font-mono tracking-wider" />
                  </div>

                  {/* TIN */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400">TIN Number</label>
                      <span className="text-[9px] text-slate-400 font-bold">XXX-XXX-XXX-XXX</span>
                    </div>
                    <input type="text" name="tin_number" value={formData.tin_number} onChange={handleInputChange} maxLength={15} placeholder="000-000-000-000" className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 font-mono tracking-wider" />
                  </div>

                  {/* HMO Cover */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">HMO Coverage Plan</label>
                    <select name="hmo_covered" value={formData.hmo_covered} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                      <option value="No">Not Covered</option>
                      <option value="Yes">Yes, Active HMO</option>
                    </select>
                  </div>

                  {/* HMO Provider info */}
                  {formData.hmo_covered === 'Yes' && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-black uppercase text-slate-400">HMO Plan / Card Number</label>
                      <input type="text" name="hmo_details" value={formData.hmo_details} onChange={handleInputChange} placeholder="e.g. Maxicare Platinum 120k" className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                    </div>
                  )}

                </div>
              </div>

              {/* GROUP 3: DOCUMENTS CHECKLIST */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-450 border-b border-slate-100 pb-2">3. Requirements Document Verification checklist</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* PSA */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">PSA Birth Certificate</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Accrued copy of PSA birth certification</p>
                      {formData.psa_file && <span className="inline-block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[9px]">📎 {formData.psa_file}</span>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <select name="psa_status" value={formData.psa_status} onChange={handleInputChange} className="p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none">
                        <option value="Submitted">Submitted</option>
                        <option value="Pending">Pending</option>
                      </select>
                      <input type="text" name="psa_file" value={formData.psa_file} onChange={handleInputChange} placeholder="Filename" className="w-24 p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none" />
                    </div>
                  </div>

                  {/* COE */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Certificate of Employment (COE)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Previous employment clearance verification</p>
                      {formData.coe_file && <span className="inline-block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[9px]">📎 {formData.coe_file}</span>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <select name="coe_status" value={formData.coe_status} onChange={handleInputChange} className="p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none">
                        <option value="Submitted">Submitted</option>
                        <option value="Pending">Pending</option>
                        <option value="N/A">N/A</option>
                      </select>
                      <input type="text" name="coe_file" value={formData.coe_file} onChange={handleInputChange} placeholder="Filename" className="w-24 p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none" />
                    </div>
                  </div>

                  {/* NBI */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">NBI Clearance copy</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Valid NBI clearance record</p>
                      {formData.nbi_file && <span className="inline-block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[9px]">📎 {formData.nbi_file}</span>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <select name="nbi_status" value={formData.nbi_status} onChange={handleInputChange} className="p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none">
                        <option value="Submitted">Submitted</option>
                        <option value="Pending">Pending</option>
                      </select>
                      <input type="text" name="nbi_file" value={formData.nbi_file} onChange={handleInputChange} placeholder="Filename" className="w-24 p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none" />
                    </div>
                  </div>

                  {/* SSS Doc */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">SSS card / Static copy</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Proof of SSS account parameters</p>
                      {formData.sss_doc_file && <span className="inline-block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[9px]">📎 {formData.sss_doc_file}</span>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <select name="sss_doc_status" value={formData.sss_doc_status} onChange={handleInputChange} className="p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none">
                        <option value="Submitted">Submitted</option>
                        <option value="Pending">Pending</option>
                      </select>
                      <input type="text" name="sss_doc_file" value={formData.sss_doc_file} onChange={handleInputChange} placeholder="Filename" className="w-24 p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none" />
                    </div>
                  </div>

                  {/* Philhealth Doc */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Philhealth MDRF copy</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Philhealth MDRF registration paper</p>
                      {formData.philhealth_doc_file && <span className="inline-block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[9px]">📎 {formData.philhealth_doc_file}</span>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <select name="philhealth_doc_status" value={formData.philhealth_doc_status} onChange={handleInputChange} className="p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none">
                        <option value="Submitted">Submitted</option>
                        <option value="Pending">Pending</option>
                      </select>
                      <input type="text" name="philhealth_doc_file" value={formData.philhealth_doc_file} onChange={handleInputChange} placeholder="Filename" className="w-24 p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none" />
                    </div>
                  </div>

                  {/* Pag-IBIG Doc */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Pag-IBIG MDF copy</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Pag-IBIG MDF printed summary document</p>
                      {formData.pagibig_doc_file && <span className="inline-block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[9px]">📎 {formData.pagibig_doc_file}</span>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <select name="pagibig_doc_status" value={formData.pagibig_doc_status} onChange={handleInputChange} className="p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none">
                        <option value="Submitted">Submitted</option>
                        <option value="Pending">Pending</option>
                      </select>
                      <input type="text" name="pagibig_doc_file" value={formData.pagibig_doc_file} onChange={handleInputChange} placeholder="Filename" className="w-24 p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none" />
                    </div>
                  </div>

                  {/* TIN Doc */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between md:col-span-2">
                    <div>
                      <p className="font-bold text-slate-800">TIN Card / Form 1902</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">TIN identification card copy or BIR 1902 Form</p>
                      {formData.tin_doc_file && <span className="inline-block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[9px]">📎 {formData.tin_doc_file}</span>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <select name="tin_doc_status" value={formData.tin_doc_status} onChange={handleInputChange} className="p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none">
                        <option value="Submitted">Submitted</option>
                        <option value="Pending">Pending</option>
                      </select>
                      <input type="text" name="tin_doc_file" value={formData.tin_doc_file} onChange={handleInputChange} placeholder="Filename" className="w-24 p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none" />
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => { setShowModal(false); setEditingEmp(null); }} className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all">Cancel</button>
                <button type="submit" className="px-6 py-3.5 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-xl transition-all" style={{ backgroundColor: themeColor }}>Save Profile</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default HrEmployees;
