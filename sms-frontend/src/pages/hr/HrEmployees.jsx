import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Search, UserPlus, Shield, Mail, Edit, Phone, Download,
  Award, X, FileText, CheckCircle, AlertCircle, Upload, Building2, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { download201FormPDF } from '../../utils/employee201FormGenerator';

const HrEmployees = () => {
  const { API_BASE_URL, branding } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active', 'Inactive'
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [showAdvancedAssignment, setShowAdvancedAssignment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field error states for validation
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Division Configuration Catalog for Dynamic Dual-Load Architecture
  const DIVISION_CONFIG = {
    'College': {
      label: 'College / Higher Ed',
      icon: '🎓',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      positions: [
        'College Instructor',
        'Assistant Professor',
        'Associate Professor',
        'Full Professor',
        'Program Head / Chair',
        'College Dean'
      ],
      defaultDept: 'Faculty - College of Computer Studies'
    },
    'Senior High School': {
      label: 'Senior High School (SHS)',
      icon: '🏫',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      positions: [
        'SHS Faculty Teacher',
        'Strand Track Lead',
        'SHS Principal / Coordinator'
      ],
      defaultDept: 'Senior High School - STEM Track'
    },
    'Basic Education': {
      label: 'Basic Education (K-12)',
      icon: '🎒',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      positions: [
        'Subject Teacher / Class Adviser',
        'Grade Level Coordinator',
        'Basic Ed Principal'
      ],
      defaultDept: 'Basic Education - Elementary Dept'
    },
    'Administrative & Operations': {
      label: 'Administrative & Operations',
      icon: '⚙️',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      positions: [
        'Administrative Officer',
        'IT Support Staff',
        'Finance Cashier',
        'Registrar Officer',
        'Clinic Nurse',
        'Facilities Custodian'
      ],
      defaultDept: 'Administration'
    }
  };
  
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
    academic_category: 'College',
    position: 'College Instructor',
    department: 'Faculty - College of Computer Studies',
    employee_type: 'Teaching',
    assignments: [
      {
        id: 1,
        division: 'College',
        role: 'College Instructor',
        load_type: 'Primary Load'
      }
    ],
    assigned_levels: ['College'],
    assigned_roles: ['Academic Faculty'],
    basic_salary: 25000,
    status: 'Active',
    phone_number: '',
    employment_history: 'Hired Active',
    employment_status: 'Probationary',
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

    if (name === 'tin_number') {
      setFormData(prev => ({ ...prev, tin_number: formatTIN(value) }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper to synchronize assignments into levels, roles, employee_type, and primary position
  const updateAssignmentsSync = (newAssignments) => {
    // 1. Determine assigned_levels
    const divisions = newAssignments.map(a => a.division);
    const academicLevels = divisions.filter(d => d !== 'Administrative & Operations');
    const assigned_levels = academicLevels.length > 0 ? Array.from(new Set(academicLevels)) : ['Non-Teaching Operations'];

    // 2. Determine assigned_roles
    const rolesSet = new Set();
    newAssignments.forEach(a => {
      const posLow = (a.role || '').toLowerCase();
      if (posLow.includes('dean') || posLow.includes('principal') || posLow.includes('head') || posLow.includes('chair') || posLow.includes('lead') || posLow.includes('coordinator')) {
        rolesSet.add('Academic Management (Dean/Head)');
      }
      if (a.division !== 'Administrative & Operations') {
        rolesSet.add('Academic Faculty');
      }
      if (posLow.includes('it support') || posLow.includes('it staff')) {
        rolesSet.add('IT Support');
      }
      if (a.division === 'Administrative & Operations' || posLow.includes('admin') || posLow.includes('cashier') || posLow.includes('registrar') || posLow.includes('nurse') || posLow.includes('custodian') || posLow.includes('officer') || posLow.includes('staff')) {
        rolesSet.add('Administrative / Operations');
      }
    });
    const assigned_roles = Array.from(rolesSet);

    // 3. Determine employee_type
    const hasTeaching = newAssignments.some(a => a.division !== 'Administrative & Operations');
    const hasAdmin = newAssignments.some(a => a.division === 'Administrative & Operations');
    const employee_type = (hasTeaching && hasAdmin) ? 'Dual-Role' : hasAdmin ? 'Non-Teaching' : 'Teaching';

    // 4. Primary position
    const primary = newAssignments.find(a => a.load_type === 'Primary Load') || newAssignments[0] || {};
    const position = primary.role || 'College Instructor';

    setFormData(prev => ({
      ...prev,
      assignments: newAssignments,
      assigned_levels,
      assigned_roles,
      employee_type,
      position
    }));
  };

  const handleAddAssignment = () => {
    const nextId = Date.now();
    const newAssignment = {
      id: nextId,
      division: 'Senior High School',
      role: 'SHS Faculty Teacher',
      load_type: formData.assignments.length === 0 ? 'Primary Load' : 'Secondary / Concurrent'
    };
    const updated = [...(formData.assignments || []), newAssignment];
    updateAssignmentsSync(updated);
  };

  const handleRemoveAssignment = (index) => {
    if ((formData.assignments || []).length <= 1) {
      alert("At least one role assignment is required.");
      return;
    }
    const updated = formData.assignments.filter((_, i) => i !== index);
    if (!updated.some(a => a.load_type === 'Primary Load') && updated.length > 0) {
      updated[0].load_type = 'Primary Load';
    }
    updateAssignmentsSync(updated);
  };

  const handleAssignmentChange = (index, field, val) => {
    const updated = (formData.assignments || []).map((item, i) => {
      if (i !== index) return item;
      const copy = { ...item, [field]: val };
      if (field === 'division') {
        const defaultPositions = DIVISION_CONFIG[val]?.positions || [];
        copy.role = defaultPositions[0] || '';
      }
      return copy;
    });
    updateAssignmentsSync(updated);
  };

  const handleHireSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // 1. Email Validation Checker
    if (!formData.email || !isValidEmail(formData.email)) {
      setEmailError('Please enter a valid email address (e.g. name@domain.com)');
      alert('Invalid Email: Please provide a valid email address.');
      return;
    }

    // 2. PH Phone Number 11 Digits Validation
    if (formData.phone_number) {
      const clean = formData.phone_number.replace(/\D/g, '');
      if (clean.length !== 11) {
        setPhoneError('Phone contact must be exactly 11 digits (PH standard: 09XXXXXXXXX)');
        alert('Invalid Phone Contact: Philippine standard phone numbers must be exactly 11 digits (e.g. 09171234567).');
        return;
      }
      if (!clean.startsWith('09') && !clean.startsWith('0')) {
        setPhoneError('Phone contact must start with 09 (e.g. 09171234567)');
        alert('Invalid PH Phone Number: Mobile contact must start with 09 (e.g. 09171234567).');
        return;
      }
    }

    const payload = {
      ...formData,
      assignments_json: JSON.stringify(formData.assignments || []),
      ...(editingEmp ? { id: editingEmp.id, employee_id: editingEmp.employee_id } : {})
    };

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/employee-portal/hire`, payload);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowAdvancedAssignment(false);
    setEmailError('');
    setPhoneError('');
    setFormData({
      first_name: '',
      middle_name: '',
      last_name: '',
      suffix: '',
      academic_category: 'College',
      position: 'College Instructor',
      department: 'Faculty - College of Computer Studies',
      employee_type: 'Teaching',
      assignments: [
        {
          id: 1,
          division: 'College',
          role: 'College Instructor',
          load_type: 'Primary Load'
        }
      ],
      assigned_levels: ['College'],
      assigned_roles: ['Academic Faculty'],
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
    setShowAdvancedAssignment(false);
    setEmailError('');
    setPhoneError('');
    
    // Parse assignments from assignments_json or legacy fields
    const parseAssignments = () => {
      if (emp.assignments_json) {
        try {
          const parsed = typeof emp.assignments_json === 'string' ? JSON.parse(emp.assignments_json) : emp.assignments_json;
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }

      const initial = [];
      const dept = emp.department || '';
      const pos = emp.position || 'College Instructor';
      
      let primaryDiv = 'College';
      if (dept.includes('Senior High') || dept.includes('SHS') || pos.includes('SHS')) primaryDiv = 'Senior High School';
      else if (dept.includes('Basic Education') || dept.includes('Elementary') || dept.includes('Junior High') || dept.includes('Kinder') || pos.includes('Subject Teacher') || pos.includes('Grade Level')) primaryDiv = 'Basic Education';
      else if (dept.includes('Administration') || dept.includes('IT') || dept.includes('Cashier') || dept.includes('Registrar') || dept.includes('Clinic') || dept.includes('Facilities') || pos.includes('OFFICER') || pos.includes('STAFF')) primaryDiv = 'Administrative & Operations';

      initial.push({
        id: 1,
        division: primaryDiv,
        role: pos,
        load_type: 'Primary Load'
      });

      const rawLevels = Array.isArray(emp.assigned_levels) 
        ? emp.assigned_levels 
        : typeof emp.assigned_levels === 'string' 
        ? emp.assigned_levels.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      rawLevels.forEach((lvl, idx) => {
        const divKey = lvl.includes('Senior') || lvl.includes('SHS') ? 'Senior High School' : lvl.includes('Basic') || lvl.includes('Elem') ? 'Basic Education' : lvl.includes('College') ? 'College' : null;
        if (divKey && divKey !== primaryDiv && !initial.some(a => a.division === divKey)) {
          const defaultPos = DIVISION_CONFIG[divKey]?.positions[0] || 'Faculty';
          initial.push({
            id: idx + 2,
            division: divKey,
            role: defaultPos,
            load_type: 'Secondary / Concurrent'
          });
        }
      });

      return initial;
    };

    const parsedAssignments = parseAssignments();
    const hasTeaching = parsedAssignments.some(a => a.division !== 'Administrative & Operations');
    const hasAdmin = parsedAssignments.some(a => a.division === 'Administrative & Operations');
    const computedEmpType = emp.employee_type || ((hasTeaching && hasAdmin) ? 'Dual-Role' : hasAdmin ? 'Non-Teaching' : 'Teaching');

    setFormData({
      first_name: emp.first_name || '',
      middle_name: emp.middle_name || '',
      last_name: emp.last_name || '',
      suffix: emp.suffix || '',
      email: emp.email || '',
      academic_category: emp.academic_category || 'College',
      position: emp.position || 'College Instructor',
      department: emp.department || 'Faculty - College of Computer Studies',
      employee_type: computedEmpType,
      assignments: parsedAssignments,
      assigned_levels: Array.isArray(emp.assigned_levels) ? emp.assigned_levels : typeof emp.assigned_levels === 'string' && emp.assigned_levels.trim() ? emp.assigned_levels.split(',').map(s => s.trim()) : ['College'],
      assigned_roles: Array.isArray(emp.assigned_roles) ? emp.assigned_roles : typeof emp.assigned_roles === 'string' && emp.assigned_roles.trim() ? emp.assigned_roles.split(',').map(s => s.trim()) : ['Academic Faculty'],
      basic_salary: emp.basic_salary || 25000,
      status: emp.status || 'Active',
      phone_number: emp.phone_number || '',
      employment_history: emp.employment_history || 'Hired Active',
      employment_status: emp.employment_status || 'Probationary',
      salary_type: emp.salary_type || 'Monthly',

      sss_number: formatSSS(emp.sss_number || ''),
      philhealth_number: formatPhilHealth(emp.philhealth_number || ''),
      pagibig_number: formatPagIBIG(emp.pagibig_number || ''),
      tin_number: formatTIN(emp.tin_number || ''),
      hmo_covered: emp.hmo_covered || 'No',
      hmo_details: emp.hmo_details || '',

      psa_status: emp.psa_status || 'Pending',
      psa_file: emp.psa_file || '',
      coe_status: emp.coe_status || 'Pending',
      coe_file: emp.coe_file || '',
      nbi_status: emp.nbi_status || 'Pending',
      nbi_file: emp.nbi_file || '',
      sss_doc_status: emp.sss_doc_status || 'Pending',
      sss_doc_file: emp.sss_doc_file || '',
      philhealth_doc_status: emp.philhealth_doc_status || 'Pending',
      philhealth_doc_file: emp.philhealth_doc_file || '',
      pagibig_doc_status: emp.pagibig_doc_status || 'Pending',
      pagibig_doc_file: emp.pagibig_doc_file || '',
      tin_doc_status: emp.tin_doc_status || 'Pending',
      tin_doc_file: emp.tin_doc_file || ''
    });
    setShowModal(true);
  };

  const filtered = employees.filter(e => {
    const matchesSearch = `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (e.position || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.department || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' ? true : (e.status || 'Active') === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

      {/* FILTER SEARCH BAR & STATUS TABS */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 px-3">
          <Search className="text-slate-400 shrink-0" size={20} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees by name, job position role, or department..."
            className="w-full text-sm bg-transparent focus:outline-none placeholder-slate-400 font-medium text-slate-700"
          />
        </div>

        {/* STATUS FILTER BUTTONS (ACTIVE & INACTIVE) */}
        <div className="flex items-center gap-1.5 shrink-0 bg-slate-100/80 p-1.5 rounded-2xl w-full md:w-auto justify-center">
          {[
            { id: 'All', label: 'All Employees', count: employees.length },
            { id: 'Active', label: 'Active', count: employees.filter(e => (e.status || 'Active') === 'Active').length },
            { id: 'Inactive', label: 'Inactive', count: employees.filter(e => e.status === 'Inactive').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-800 shadow-sm scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                tab.id === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                tab.id === 'Inactive' ? 'bg-rose-100 text-rose-700' :
                'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
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
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                            (emp.position || '').includes('Dean') || (emp.position || '').includes('Principal')
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : (emp.position || '').includes('Head') || (emp.position || '').includes('Lead') || (emp.position || '').includes('Chair')
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : (emp.position || '').includes('Professor') || (emp.position || '').includes('Instructor') || (emp.position || '').includes('Faculty') || (emp.position || '').includes('Teacher')
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {emp.position || 'Employee'}
                          </span>

                          {/* Employee Type Tag */}
                          {emp.employee_type === 'Dual-Role' ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 text-indigo-800 border border-indigo-200">
                              🔄 Dual-Role ({(() => {
                                try {
                                  const parsed = typeof emp.assignments_json === 'string' ? JSON.parse(emp.assignments_json) : (emp.assignments_json || []);
                                  return Array.isArray(parsed) ? `${parsed.length} Roles` : 'Dual';
                                } catch(e) { return 'Dual'; }
                              })()})
                            </span>
                          ) : emp.employee_type === 'Non-Teaching' ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              💼 Staff
                            </span>
                          ) : (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              🎓 Faculty
                            </span>
                          )}
                        </div>

                        {/* Multi-tag Level Badges */}
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(emp.assigned_levels) 
                            ? emp.assigned_levels 
                            : typeof emp.assigned_levels === 'string' && emp.assigned_levels.trim() 
                            ? emp.assigned_levels.split(',').map(s => s.trim()) 
                            : [emp.department?.includes('Senior High') ? 'SHS' : emp.department?.includes('Basic Education') ? 'Basic Ed' : 'College']
                          ).map((lvlStr, i) => {
                            const lvl = lvlStr.trim();
                            const isCollege = lvl.includes('College');
                            const isSHS = lvl.includes('Senior') || lvl.includes('SHS');
                            const isBasic = lvl.includes('Basic') || lvl.includes('Elem') || lvl.includes('JHS');
                            return (
                              <span 
                                key={i} 
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                                  isCollege 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                    : isSHS 
                                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                    : isBasic 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {isCollege ? '🎓 College' : isSHS ? '🏫 SHS' : isBasic ? '🎒 Basic Ed' : lvl}
                              </span>
                            );
                          })}

                          {/* Multi-tag Functional Roles */}
                          {(Array.isArray(emp.assigned_roles) 
                            ? emp.assigned_roles 
                            : typeof emp.assigned_roles === 'string' && emp.assigned_roles.trim() 
                            ? emp.assigned_roles.split(',').map(s => s.trim()) 
                            : []
                          ).map((roleStr, i) => {
                            const r = roleStr.trim();
                            if (r.includes('Management') || r.includes('Dean') || r.includes('Head')) {
                              return <span key={'r'+i} className="text-[9px] font-black px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">👑 Leadership</span>;
                            }
                            if (r.includes('Admin') || r.includes('Operations')) {
                              return <span key={'r'+i} className="text-[9px] font-black px-1.5 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">⚙️ Operations</span>;
                            }
                            if (r.includes('IT')) {
                              return <span key={'r'+i} className="text-[9px] font-black px-1.5 py-0.5 rounded border bg-cyan-50 text-cyan-700 border-cyan-200">💻 IT Staff</span>;
                            }
                            return null;
                          })}
                        </div>

                        <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                          <Building2 size={12} className="text-slate-400"/> {emp.department || 'General Faculty'}
                        </p>
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
                    <td className="py-4 text-center flex items-center justify-center gap-1">
                      <button onClick={() => download201FormPDF(emp, branding)} title="Download 201 Form A PDF" className="p-2 hover:bg-blue-50 rounded-xl text-slate-500 hover:text-blue-600 transition-all inline-block"><Download size={16} /></button>
                      <button onClick={() => handleEditClick(emp)} title="Edit Employee Profile" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-blue-600 transition-all inline-block"><Edit size={16} /></button>
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
              
              {/* GROUP 1: BASE EMPLOYMENT & DYNAMIC DUAL-LOAD ASSIGNMENTS */}
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                      <span>👤</span> 1. Primary Employment & Dynamic Role Loads
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Dual-load architecture supporting concurrent faculty & administrative duties</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border w-fit ${
                    formData.employee_type === 'Dual-Role' 
                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                      : formData.employee_type === 'Non-Teaching' 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {formData.employee_type === 'Dual-Role' ? '🔄 Dual-Role Profile' : formData.employee_type === 'Non-Teaching' ? '⚙️ Non-Teaching Staff' : '🧑‍🏫 Teaching Faculty'}
                  </span>
                </div>

                {/* 1A. Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">First Name *</label>
                    <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required placeholder="e.g. Jobel" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Middle Name</label>
                    <input type="text" name="middle_name" value={formData.middle_name || ''} onChange={handleInputChange} placeholder="e.g. Fernando" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Last Name *</label>
                    <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required placeholder="e.g. Jobert" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Suffix</label>
                    <input type="text" name="suffix" value={formData.suffix || ''} onChange={handleInputChange} placeholder="e.g. Jr., III" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                </div>

                {/* 1B. Contact & Home Department Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Email Address *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="e.g. jobel@school.edu" 
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none transition-all ${
                        emailError ? 'border-red-400 bg-red-50/50 text-red-900 focus:border-red-500' : 'border-slate-200 text-slate-700 focus:border-blue-500'
                      }`} 
                    />
                    {emailError && (
                      <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 animate-in fade-in">
                        <span>⚠️</span> {emailError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400">Phone Contact</label>
                      <span className={`text-[9px] font-bold ${formData.phone_number?.length === 11 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {formData.phone_number?.length || 0}/11
                      </span>
                    </div>
                    <input 
                      type="text" 
                      name="phone_number" 
                      value={formData.phone_number} 
                      onChange={handleInputChange} 
                      maxLength={11}
                      placeholder="e.g. 09171234567" 
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none transition-all ${
                        phoneError ? 'border-red-400 bg-red-50/50 text-red-900 focus:border-red-500' : 'border-slate-200 text-slate-700 focus:border-blue-500'
                      }`} 
                    />
                    {phoneError && (
                      <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 animate-in fade-in">
                        <span>⚠️</span> {phoneError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Primary Home Department *</label>
                    <select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                      <optgroup label="College / Higher Education">
                        <option value="Faculty - College of Computer Studies">College of Computer Studies</option>
                        <option value="Faculty - College of Business & Accountancy">College of Business & Accountancy</option>
                        <option value="Faculty - College of Education">College of Education</option>
                        <option value="Faculty - College of Engineering & Architecture">College of Engineering & Architecture</option>
                        <option value="Faculty - College of Arts & Sciences">College of Arts & Sciences</option>
                        <option value="Faculty - College of Nursing & Allied Health">College of Nursing & Allied Health</option>
                      </optgroup>
                      <optgroup label="Senior High School (SHS)">
                        <option value="Senior High School - STEM Track">SHS - STEM Track</option>
                        <option value="Senior High School - ABM Track">SHS - ABM Track</option>
                        <option value="Senior High School - HUMSS Track">SHS - HUMSS Track</option>
                        <option value="Senior High School - TVL Track">SHS - TVL Track</option>
                      </optgroup>
                      <optgroup label="Basic Education (Kinder / Elem / JHS)">
                        <option value="Basic Education - Elementary Dept">Elementary Department</option>
                        <option value="Basic Education - Junior High Dept">Junior High School (JHS)</option>
                        <option value="Basic Education - Kindergarten Dept">Kindergarten Department</option>
                      </optgroup>
                      <optgroup label="Operations & Administration">
                        <option value="Administration">Operations Administration</option>
                        <option value="IT System Office">IT System Office</option>
                        <option value="Finance Cashier">Cashier Finance Dept</option>
                        <option value="Registrar Academic Dept">Registrar Academic Dept</option>
                        <option value="Clinic & Health Office">Clinic & Health Office</option>
                        <option value="Facilities & Maintenance">Facilities & Maintenance</option>
                      </optgroup>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Employment Status</label>
                    <select name="employment_status" value={formData.employment_status} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                      <option value="Probationary">Probationary</option>
                      <option value="Regular">Regular / Permanent</option>
                      <option value="Contractual">Contractual</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                </div>

                {/* 1C. DYNAMIC DUAL-LOAD ASSIGNMENTS TABLE */}
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <span>📋</span> Role & Load Assignments ({formData.assignments.length})
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        Add single or concurrent teaching divisions and administrative duties
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddAssignment} 
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                      style={{ backgroundColor: themeColor }}
                    >
                      <UserPlus size={13} />
                      Add Role / Assignment
                    </button>
                  </div>

                  {/* Dynamic Assignment Rows */}
                  <div className="space-y-2.5">
                    {formData.assignments.map((assign, idx) => {
                      const divConfig = DIVISION_CONFIG[assign.division] || DIVISION_CONFIG['College'];
                      return (
                        <div 
                          key={assign.id || idx} 
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3 transition-all hover:border-blue-300"
                        >
                          {/* Row Indicator */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-[10px]">
                              {idx + 1}
                            </span>
                          </div>

                          {/* 1. Division / Category */}
                          <div className="flex-1 min-w-[170px]">
                            <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Division / Sector</label>
                            <select
                              value={assign.division}
                              onChange={(e) => handleAssignmentChange(idx, 'division', e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                            >
                              <option value="College">🎓 College / Higher Ed</option>
                              <option value="Senior High School">🏫 Senior High School (SHS)</option>
                              <option value="Basic Education">🎒 Basic Education (K-12)</option>
                              <option value="Administrative & Operations">⚙️ Administrative & Operations</option>
                            </select>
                          </div>

                          {/* 2. Position / Role Filtered strictly by chosen Division */}
                          <div className="flex-[1.5] min-w-[200px]">
                            <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Role / Position Title</label>
                            <select
                              value={assign.role}
                              onChange={(e) => handleAssignmentChange(idx, 'role', e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                            >
                              {divConfig.positions.map((posName) => (
                                <option key={posName} value={posName}>{posName}</option>
                              ))}
                            </select>
                          </div>

                          {/* 3. Load Type */}
                          <div className="flex-1 min-w-[150px]">
                            <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Role Load Type</label>
                            <select
                              value={assign.load_type}
                              onChange={(e) => handleAssignmentChange(idx, 'load_type', e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                            >
                              <option value="Primary Load">Primary Load</option>
                              <option value="Secondary / Concurrent">Secondary / Concurrent</option>
                              <option value="Special / Honorarium Duty">Honorarium Duty</option>
                            </select>
                          </div>

                          {/* 4. Remove Action */}
                          <div className="flex items-end justify-end pt-1 md:pt-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveAssignment(idx)}
                              disabled={formData.assignments.length <= 1}
                              title={formData.assignments.length <= 1 ? "At least 1 assignment required" : "Remove this assignment row"}
                              className={`p-2 rounded-lg transition-all ${
                                formData.assignments.length <= 1 
                                  ? 'text-slate-300 cursor-not-allowed' 
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                              }`}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Auto-inferred summary tags bar */}
                  <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-500 border-t border-slate-200/60 mt-2">
                    <span className="font-black uppercase tracking-wider text-slate-400 mr-1">Auto-detected:</span>
                    {(formData.assigned_levels || []).map((lvl, i) => (
                      <span key={'l'+i} className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                        🎓 {lvl}
                      </span>
                    ))}
                    {(formData.assigned_roles || []).map((role, i) => (
                      <span key={'r'+i} className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                        💼 {role}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 1D. Compensation, Releasing & Uptime Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Basic Monthly Pay (₱) *</label>
                    <input type="number" name="basic_salary" value={formData.basic_salary} onChange={handleInputChange} required className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Payment Releasing</label>
                    <select name="salary_type" value={formData.salary_type || 'Monthly'} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                      <option value="Monthly">Monthly Release</option>
                      <option value="Semi-Monthly">Semi-Monthly (15th/30th)</option>
                      <option value="Weekly">Weekly (Every Friday)</option>
                      <option value="Daily">Daily Wage</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Uptime Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                      <option value="Active">Active Duty</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Inactive">Terminated / Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Employment Log History</label>
                    <input type="text" name="employment_history" value={formData.employment_history} onChange={handleInputChange} placeholder="e.g. Regularized, Promoted" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500" />
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
                <button 
                  type="button" 
                  disabled={isSubmitting}
                  onClick={() => { setShowModal(false); setEditingEmp(null); }} 
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`px-6 py-3.5 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 min-w-[140px] ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-95 active:scale-95'
                  }`} 
                  style={{ backgroundColor: themeColor }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={15} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingEmp ? 'Update Profile' : 'Save Profile'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default HrEmployees;
