import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Award, Sliders, CheckCircle2, XCircle, Search, Printer, 
  Plus, Edit, Trash2, Save, RefreshCw, Layers, ShieldCheck, UserCheck, 
  HelpCircle, Sparkles, FileCheck, Check, X, AlertCircle, BookOpen, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RegistrarSetup = () => {
  const { API_BASE_URL, branding, token } = useAuth();

  const [activeTab, setActiveTab] = useState('tor'); // 'tor', 'templates', 'releasing', 'certificates'
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------------------
  // TAB 1: STUDENT RECORDS & TOR STATES
  // -------------------------------------------------------------
  const [studentSearch, setStudentSearch] = useState('');
  const [torData, setTorData] = useState(null);
  const [searchingTor, setSearchingTor] = useState(false);

  // -------------------------------------------------------------
  // TAB 2: GRADE TEMPLATES STATES
  // -------------------------------------------------------------
  const [gradeTemplates, setGradeTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    department: 'K-10',
    template_name: '',
    written_weight: 30,
    performance_weight: 50,
    exam_weight: 20,
    status: 'Active'
  });

  // -------------------------------------------------------------
  // TAB 3: GRADE RELEASING STATES
  // -------------------------------------------------------------
  const [releaseSettings, setReleaseSettings] = useState([]);
  const [individualReleases, setIndividualReleases] = useState([]);
  const [releaseForm, setReleaseForm] = useState({
    mode: 'bulk', // 'bulk' or 'individual'
    department: 'K-10',
    school_year: '2025-2026',
    quarter: '1',
    is_released: true,
    student_id: ''
  });

  // -------------------------------------------------------------
  // TAB 4: CERTIFICATE TEMPLATE BUILDER STATES
  // -------------------------------------------------------------
  const [certTemplates, setCertTemplates] = useState([]);
  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [certForm, setCertForm] = useState({
    template_name: '',
    certificate_type: 'Enrollment',
    header_title: 'OFFICE OF THE REGISTRAR',
    body_content: 'This is to certify that {student_name} (Student ID: {student_id}) is officially enrolled in {program} for Grade Level / Year Level {grade_level} during the Academic Year {school_year}.\n\nThis certification is issued upon the request of the interested party for whatever legal purpose it may serve.',
    signatory_1_name: 'Jane Doe, LPT',
    signatory_1_title: 'University Registrar',
    signatory_2_name: 'Dr. John Smith',
    signatory_2_title: 'School President',
    is_active: true
  });

  // Live Certificate Preview Modal State
  const [certPreviewModal, setCertPreviewModal] = useState({ show: false, cert: null, testStudentId: '' });
  const [generatedCert, setGeneratedCert] = useState(null);

  // Global Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ show: false, type: '', id: null, title: '' });

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  useEffect(() => {
    fetchGradeTemplates();
    fetchReleaseSettings();
    fetchCertificateTemplates();
  }, []);

  // -------------------------------------------------------------
  // 1. FETCH TOR DATA
  // -------------------------------------------------------------
  const handleFetchTOR = async (e) => {
    if (e) e.preventDefault();
    if (!studentSearch) return;

    setSearchingTor(true);
    setTorData(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/tor?student_id=${studentSearch.trim()}`);
      if (res.data?.status === 'success') {
        setTorData(res.data.data);
      } else {
        showToast(res.data?.message || "Student TOR not found.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error fetching student Transcript of Records.", "error");
    } finally {
      setSearchingTor(false);
    }
  };

  const handlePrintTOR = () => {
    window.print();
  };

  // -------------------------------------------------------------
  // 2. GRADE TEMPLATES CRUD
  // -------------------------------------------------------------
  const fetchGradeTemplates = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/grade-templates`);
      if (res.data?.data) {
        setGradeTemplates(res.data.data);
      }
    } catch (err) {
      console.error("fetchGradeTemplates error:", err);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    const w = parseInt(templateForm.written_weight, 10) || 0;
    const p = parseInt(templateForm.performance_weight, 10) || 0;
    const ex = parseInt(templateForm.exam_weight, 10) || 0;

    if (w + p + ex !== 100) {
      showToast(`Weights must sum to 100% (Current sum: ${w + p + ex}%).`, "error");
      return;
    }

    setLoading(true);
    try {
      const payload = editingTemplate ? { ...templateForm, id: editingTemplate.id } : templateForm;
      const res = await axios.post(`${API_BASE_URL}/registrar/grade-templates`, payload);
      if (res.data?.status === 'success') {
        showToast(editingTemplate ? "Grade template updated!" : "Grade template created!", "success");
        fetchGradeTemplates();
        setShowTemplateModal(false);
        setEditingTemplate(null);
      } else {
        showToast(res.data?.message || "Failed to save grade template.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving grade template.", "error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. GRADE SETTINGS & RELEASING
  // -------------------------------------------------------------
  const fetchReleaseSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/grade-release-settings`);
      if (res.data?.data) {
        setReleaseSettings(res.data.data.settings || []);
        setIndividualReleases(res.data.data.individual_releases || []);
      }
    } catch (err) {
      console.error("fetchReleaseSettings error:", err);
    }
  };

  const handleToggleRelease = async (payload) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/toggle-grade-release`, payload);
      if (res.data?.status === 'success') {
        showToast(res.data.message, "success");
        fetchReleaseSettings();
      } else {
        showToast(res.data?.message || "Failed to toggle release status.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating grade release status.", "error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 4. CERTIFICATE TEMPLATES CRUD & PREVIEW
  // -------------------------------------------------------------
  const fetchCertificateTemplates = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/certificate-templates`);
      if (res.data?.data) {
        setCertTemplates(res.data.data);
      }
    } catch (err) {
      console.error("fetchCertificateTemplates error:", err);
    }
  };

  const handleSaveCertTemplate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = editingCert ? { ...certForm, id: editingCert.id } : certForm;
      const res = await axios.post(`${API_BASE_URL}/registrar/certificate-templates`, payload);
      if (res.data?.status === 'success') {
        showToast(editingCert ? "Certificate template updated!" : "Certificate template created!", "success");
        fetchCertificateTemplates();
        setShowCertModal(false);
        setEditingCert(null);
      } else {
        showToast(res.data?.message || "Failed to save certificate template.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving certificate template.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!certPreviewModal.testStudentId || !certPreviewModal.cert) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/generate-certificate`, {
        template_id: certPreviewModal.cert.id,
        student_id: certPreviewModal.testStudentId.trim()
      });
      if (res.data?.status === 'success') {
        setGeneratedCert(res.data.certificate);
      } else {
        showToast(res.data?.message || "Failed to generate certificate preview.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error generating certificate.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete Handler
  const handleDeleteItem = async () => {
    if (!deleteModal.id) return;
    setLoading(true);
    try {
      let endpoint = '';
      if (deleteModal.type === 'template') endpoint = `${API_BASE_URL}/registrar/grade-templates/${deleteModal.id}`;
      else if (deleteModal.type === 'certificate') endpoint = `${API_BASE_URL}/registrar/certificate-templates/${deleteModal.id}`;

      const res = await axios.delete(endpoint);
      if (res.data?.status === 'success') {
        showToast("Item deleted successfully!", "success");
        if (deleteModal.type === 'template') fetchGradeTemplates();
        if (deleteModal.type === 'certificate') fetchCertificateTemplates();
        setDeleteModal({ show: false, type: '', id: null, title: '' });
      } else {
        showToast(res.data?.message || "Deletion failed.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting item.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-500">
      
      {/* PRINT MEDIA QUERY STYLES */}
      <style type="text/css" media="print">
        {`
          @page { size: portrait; margin: 15mm; }
          header, nav, aside, .sidebar, .no-print { display: none !important; }
          body { background: white !important; font-family: sans-serif; }
          .print-area { display: block !important; width: 100% !important; border: none !important; box-shadow: none !important; }
        `}
      </style>

      {/* TOAST NOTIFICATION */}
      {notification.show && (
        <div className={`no-print fixed top-6 right-6 z-[100] flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-2xl border text-xs font-bold animate-in slide-in-from-top-3 duration-300 ${
          notification.type === 'error' ? 'bg-red-500 text-white border-red-600' : 'bg-slate-900 text-white border-slate-800'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} className="text-emerald-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="no-print bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Sliders size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Registrar Setup & Academic Governance</h1>
              <p className="text-slate-500 text-xs font-medium mt-0.5">
                Manage Student Records, Official TOR, Grade Templates, Releasing Controls & Certificate Templates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MULTI-TAB NAVIGATION */}
      <div className="no-print flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tor')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'tor'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'
          }`}
        >
          <FileText size={16} />
          <span>Student Records & TOR</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'templates'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'
          }`}
        >
          <Layers size={16} />
          <span>Grade Templates</span>
        </button>

        <button
          onClick={() => setActiveTab('releasing')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'releasing'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'
          }`}
        >
          <ShieldCheck size={16} />
          <span>Grade Settings & Releasing</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'certificates'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'
          }`}
        >
          <Award size={16} />
          <span>Certificate Template Builder</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STUDENT RECORDS & OFFICIAL TRANSCRIPT OF RECORDS (TOR) */}
      {/* ========================================================================= */}
      {activeTab === 'tor' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Search Toolbar */}
          <div className="no-print bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Search Student Permanent Academic Record</h3>
            <form onSubmit={handleFetchTOR} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-96">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Enter Student ID or Database ID (e.g. 2026-0001)..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-xs font-bold text-slate-800"
                />
              </div>
              <button
                type="submit"
                disabled={searchingTor || !studentSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-md flex items-center space-x-2 active:scale-95 transition-all w-full sm:w-auto justify-center"
              >
                {searchingTor ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                <span>Fetch Official TOR</span>
              </button>
            </form>
          </div>

          {/* TOR Document Render */}
          {torData ? (
            <div className="print-area bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-lg space-y-8">
              
              {/* TOR Official Header */}
              <div className="border-b-2 border-slate-800 pb-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                <div className="flex items-center space-x-4">
                  {branding.school_logo && (
                    <img src={branding.school_logo} alt="Logo" className="w-20 h-20 object-contain" />
                  )}
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{branding.school_name || 'Aaron John School'}</h2>
                    <p className="text-xs text-slate-600 font-medium">OFFICE OF THE REGISTRAR</p>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">Official Transcript of Academic Record (TOR)</p>
                  </div>
                </div>

                <div className="no-print">
                  <button
                    onClick={handlePrintTOR}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 shadow-lg active:scale-95 transition-all"
                  >
                    <Printer size={16} />
                    <span>Print / Export TOR</span>
                  </button>
                </div>
              </div>

              {/* Student Summary Info Box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Student Name</p>
                  <p className="font-extrabold text-slate-800 text-sm mt-0.5">
                    {torData.student.last_name}, {torData.student.first_name} {torData.student.middle_name || ''}
                  </p>
                  <p className="text-slate-500 font-medium mt-1">Student ID: <strong className="text-slate-700">{torData.student.student_id}</strong></p>
                  <p className="text-slate-500 font-medium">LRN: <strong className="text-slate-700">{torData.student.lrn || 'N/A'}</strong></p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Academic Program & Level</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{torData.student.program_name}</p>
                  <p className="text-slate-500 font-medium mt-1">Grade / Year Level: <strong className="text-slate-700">{torData.student.grade_level || 'N/A'}</strong></p>
                  <p className="text-slate-500 font-medium">Department: <strong className="text-blue-600 font-bold">{torData.student.department}</strong></p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Academic Performance Summary</p>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-2xl font-black text-slate-900">{torData.summary.gwa}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">General Weighted Average (GWA)</span>
                  </div>
                  <p className="text-slate-500 font-medium mt-1">Total Units Earned: <strong className="text-slate-800">{torData.summary.total_units_earned} Units</strong></p>
                </div>
              </div>

              {/* TOR Course Grades Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-2">Academic Course History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-600 uppercase text-[10px]">
                        <th className="p-3">School Year / Sem</th>
                        <th className="p-3">Course Code</th>
                        <th className="p-3">Descriptive Title</th>
                        <th className="p-3 text-center">Units</th>
                        <th className="p-3 text-center">Final Grade</th>
                        <th className="p-3 text-right">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {torData.grades.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-6 text-center text-slate-400 italic">
                            No academic course grades encoded for this student yet.
                          </td>
                        </tr>
                      ) : (
                        torData.grades.map((g, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-600">{g.school_year} ({g.semester})</td>
                            <td className="p-3 font-bold text-blue-600">{g.subject_code}</td>
                            <td className="p-3">{g.subject_description}</td>
                            <td className="p-3 text-center font-bold">{g.units}</td>
                            <td className="p-3 text-center font-black text-slate-900">{g.final_grade || 'N/A'}</td>
                            <td className="p-3 text-right">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                g.remarks === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {g.remarks}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOR Official Signatures */}
              <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-800 uppercase">Jane Doe, LPT</p>
                  <p className="text-[10px] text-slate-500 font-medium">University Registrar</p>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-800 uppercase">School Seal & Certification</p>
                  <p className="text-[10px] text-slate-500 font-medium">Official Document Verified</p>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-3">
              <BookOpen size={40} className="mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">No Student Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Enter a Student ID or Database ID in the search bar above to generate and inspect their complete Transcript of Records (TOR).
              </p>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GRADE TEMPLATES & FORMULAS */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-800">Department Grade Calculation Templates</h3>
              <p className="text-slate-500 text-xs">Configure Written Works %, Performance Tasks %, and Quarterly Exams % per department.</p>
            </div>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({ department: 'K-10', template_name: '', written_weight: 30, performance_weight: 50, exam_weight: 20, status: 'Active' });
                setShowTemplateModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md flex items-center space-x-2 active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Add Grade Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {gradeTemplates.map((t) => (
              <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative group">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700">
                    {t.department}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingTemplate(t);
                        setTemplateForm({
                          department: t.department,
                          template_name: t.template_name,
                          written_weight: t.written_weight,
                          performance_weight: t.performance_weight,
                          exam_weight: t.exam_weight,
                          status: t.status || 'Active'
                        });
                        setShowTemplateModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ show: true, type: 'template', id: t.id, title: t.template_name })}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{t.template_name}</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Sum Weight: 100%</p>
                </div>

                <div className="space-y-2 pt-2 text-xs font-bold text-slate-600">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span>Written Works</span>
                    <span className="text-blue-600 font-extrabold">{t.written_weight}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span>Performance Tasks</span>
                    <span className="text-emerald-600 font-extrabold">{t.performance_weight}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span>Quarterly / Term Exam</span>
                    <span className="text-purple-600 font-extrabold">{t.exam_weight}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GRADE SETTINGS & RELEASING (BULK & INDIVIDUAL) */}
      {/* ========================================================================= */}
      {activeTab === 'releasing' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Mode Switcher */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">Grade Releasing Governance</h3>
              <p className="text-slate-500 text-xs">Control grade visibility on student portals via Bulk Release or Individual Student Overrides.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* BULK RELEASE PANEL */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center space-x-2 text-blue-600">
                  <Layers size={20} />
                  <h4 className="font-bold text-sm text-slate-800">Bulk Grade Release (By Department)</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
                    <select
                      value={releaseForm.department}
                      onChange={(e) => setReleaseForm({ ...releaseForm, department: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    >
                      <option value="K-10">K-10 Basic Education</option>
                      <option value="SHS">Senior High School (SHS)</option>
                      <option value="College">Higher Education / College</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">School Year</label>
                      <input
                        type="text"
                        value={releaseForm.school_year}
                        onChange={(e) => setReleaseForm({ ...releaseForm, school_year: e.target.value })}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quarter / Term</label>
                      <input
                        type="text"
                        value={releaseForm.quarter}
                        onChange={(e) => setReleaseForm({ ...releaseForm, quarter: e.target.value })}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                        placeholder="1, 2, 3, or 4"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => handleToggleRelease({ ...releaseForm, mode: 'bulk', is_released: true })}
                      disabled={loading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 size={16} />
                      <span>Release All Grades (Bulk)</span>
                    </button>

                    <button
                      onClick={() => handleToggleRelease({ ...releaseForm, mode: 'bulk', is_released: false })}
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-2"
                    >
                      <XCircle size={16} />
                      <span>Withhold All (Bulk)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* INDIVIDUAL RELEASE PANEL */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center space-x-2 text-indigo-600">
                  <UserCheck size={20} />
                  <h4 className="font-bold text-sm text-slate-800">Individual Student Release Override</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Student ID</label>
                    <input
                      type="text"
                      value={releaseForm.student_id}
                      onChange={(e) => setReleaseForm({ ...releaseForm, student_id: e.target.value })}
                      placeholder="Ex. 2026-0001"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="flex space-x-3 pt-6">
                    <button
                      onClick={() => handleToggleRelease({ ...releaseForm, mode: 'individual', is_released: true })}
                      disabled={loading || !releaseForm.student_id}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      <span>Release Student Grade</span>
                    </button>

                    <button
                      onClick={() => handleToggleRelease({ ...releaseForm, mode: 'individual', is_released: false })}
                      disabled={loading || !releaseForm.student_id}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      <span>Hold Student Grade</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Release Settings Status Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Active Bulk Release Status Table</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="p-3">Department</th>
                    <th className="p-3">School Year</th>
                    <th className="p-3">Quarter / Term</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Last Updated By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {releaseSettings.length === 0 ? (
                    <tr><td colSpan="5" className="p-4 text-center text-slate-400">No release settings configured.</td></tr>
                  ) : (
                    releaseSettings.map((s) => (
                      <tr key={s.id}>
                        <td className="p-3 font-bold text-slate-800">{s.department}</td>
                        <td className="p-3">{s.school_year}</td>
                        <td className="p-3">Quarter {s.quarter}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            s.is_released ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {s.is_released ? 'Released to Students' : 'Withheld / Hidden'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{s.released_by || 'Registrar'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CERTIFICATE TEMPLATE BUILDER */}
      {/* ========================================================================= */}
      {activeTab === 'certificates' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-800">Dynamic Certificate Template Builder</h3>
              <p className="text-slate-500 text-xs">Create custom certificate templates (Enrollment, Graduation, Good Moral, etc.) with dynamic placeholders.</p>
            </div>
            <button
              onClick={() => {
                setEditingCert(null);
                setCertForm({
                  template_name: '',
                  certificate_type: 'Enrollment',
                  header_title: 'OFFICE OF THE REGISTRAR',
                  body_content: 'This is to certify that {student_name} (Student ID: {student_id}) is officially enrolled in {program} for Grade Level / Year Level {grade_level} during the Academic Year {school_year}.\n\nThis certification is issued upon the request of the interested party for whatever legal purpose it may serve.',
                  signatory_1_name: 'Jane Doe, LPT',
                  signatory_1_title: 'University Registrar',
                  signatory_2_name: 'Dr. John Smith',
                  signatory_2_title: 'School President',
                  is_active: true
                });
                setShowCertModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md flex items-center space-x-2 active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Create Certificate Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certTemplates.map((c) => (
              <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-700">
                    {c.certificate_type}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setCertPreviewModal({ show: true, cert: c, testStudentId: '2026-0001' });
                        setGeneratedCert(null);
                      }}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl"
                      title="Preview & Print Test"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingCert(c);
                        setCertForm({
                          template_name: c.template_name,
                          certificate_type: c.certificate_type,
                          header_title: c.header_title,
                          body_content: c.body_content,
                          signatory_1_name: c.signatory_1_name,
                          signatory_1_title: c.signatory_1_title,
                          signatory_2_name: c.signatory_2_name,
                          signatory_2_title: c.signatory_2_title,
                          is_active: !!c.is_active
                        });
                        setShowCertModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ show: true, type: 'certificate', id: c.id, title: c.template_name })}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{c.template_name}</h4>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">{c.header_title}</p>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 line-clamp-3 font-mono">
                  {c.body_content}
                </p>

                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pt-1">
                  <span>Signatory: {c.signatory_1_name}</span>
                  <span className="text-emerald-600 font-black">Active</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT GRADE TEMPLATE */}
      {/* ========================================================================= */}
      {showTemplateModal && (
        <div className="no-print fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">{editingTemplate ? 'Edit Grade Template' : 'Add Grade Template'}</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department *</label>
                <select
                  value={templateForm.department}
                  onChange={(e) => setTemplateForm({ ...templateForm, department: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-2xl outline-none text-xs font-bold"
                >
                  <option value="K-10">K-10 Basic Education</option>
                  <option value="SHS">Senior High School (SHS)</option>
                  <option value="College">College / Higher Ed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  value={templateForm.template_name}
                  onChange={(e) => setTemplateForm({ ...templateForm, template_name: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-2xl outline-none text-xs font-bold"
                  placeholder="Ex. DepEd Standard K-10 Template"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Written %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={templateForm.written_weight}
                    onChange={(e) => setTemplateForm({ ...templateForm, written_weight: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-2xl outline-none text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Performance %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={templateForm.performance_weight}
                    onChange={(e) => setTemplateForm({ ...templateForm, performance_weight: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-2xl outline-none text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Exam %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={templateForm.exam_weight}
                    onChange={(e) => setTemplateForm({ ...templateForm, exam_weight: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-2xl outline-none text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowTemplateModal(false)} className="px-5 py-3 rounded-2xl font-bold text-slate-500 text-xs">Cancel</button>
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-md">
                  {loading ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT CERTIFICATE TEMPLATE */}
      {/* ========================================================================= */}
      {showCertModal && (
        <div className="no-print fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">{editingCert ? 'Edit Certificate Template' : 'Create Certificate Template'}</h3>
              <button onClick={() => setShowCertModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveCertTemplate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    value={certForm.template_name}
                    onChange={(e) => setCertForm({ ...certForm, template_name: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-2xl outline-none text-xs font-bold"
                    placeholder="Ex. Certificate of Enrollment"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Certificate Type *</label>
                  <select
                    value={certForm.certificate_type}
                    onChange={(e) => setCertForm({ ...certForm, certificate_type: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-2xl outline-none text-xs font-bold"
                  >
                    <option value="Enrollment">Enrollment</option>
                    <option value="Graduation">Graduation</option>
                    <option value="Good Moral">Good Moral Character</option>
                    <option value="Honorable Dismissal">Honorable Dismissal</option>
                    <option value="Custom">Custom Certificate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Header Title</label>
                <input
                  type="text"
                  value={certForm.header_title}
                  onChange={(e) => setCertForm({ ...certForm, header_title: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-2xl outline-none text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Body Text Template *</label>
                <p className="text-[10px] text-blue-600 font-bold mb-1">
                  Placeholders: {'{student_name}'}, {'{student_id}'}, {'{program}'}, {'{grade_level}'}, {'{school_year}'}, {'{date_issued}'}
                </p>
                <textarea
                  rows="5"
                  required
                  value={certForm.body_content}
                  onChange={(e) => setCertForm({ ...certForm, body_content: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-2xl outline-none text-xs font-mono font-medium"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Signatory 1 Name</label>
                  <input
                    type="text"
                    value={certForm.signatory_1_name}
                    onChange={(e) => setCertForm({ ...certForm, signatory_1_name: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-2xl outline-none text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Signatory 1 Title</label>
                  <input
                    type="text"
                    value={certForm.signatory_1_title}
                    onChange={(e) => setCertForm({ ...certForm, signatory_1_title: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-2xl outline-none text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowCertModal(false)} className="px-5 py-3 rounded-2xl font-bold text-slate-500 text-xs">Cancel</button>
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-md">
                  {loading ? 'Saving...' : 'Save Certificate Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LIVE CERTIFICATE PREVIEW & TEST PRINT */}
      {/* ========================================================================= */}
      {certPreviewModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="no-print flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Live Certificate Preview & Test</h3>
              <button onClick={() => setCertPreviewModal({ show: false, cert: null, testStudentId: '' })} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="no-print flex items-center space-x-3">
              <input
                type="text"
                value={certPreviewModal.testStudentId}
                onChange={(e) => setCertPreviewModal({ ...certPreviewModal, testStudentId: e.target.value })}
                placeholder="Enter Student ID for Preview (e.g. 2026-0001)..."
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none"
              />
              <button
                onClick={handleGeneratePreview}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md"
              >
                Generate Preview
              </button>
            </div>

            {generatedCert ? (
              <div className="print-area p-8 border-4 border-double border-slate-800 rounded-2xl space-y-8 text-center bg-amber-50/20">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">{branding.school_name || 'Aaron John School'}</h2>
                  <p className="text-xs font-bold text-slate-600 mt-1">{generatedCert.header_title}</p>
                </div>

                <div className="text-xs font-serif leading-relaxed text-slate-800 whitespace-pre-line text-justify px-6">
                  {generatedCert.body_content}
                </div>

                <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800 uppercase">{generatedCert.signatory_1_name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{generatedCert.signatory_1_title}</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800 uppercase">{generatedCert.signatory_2_name || 'School President'}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{generatedCert.signatory_2_title || 'School Administration'}</p>
                  </div>
                </div>

                <div className="no-print pt-4">
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold text-xs inline-flex items-center space-x-2"
                  >
                    <Printer size={16} />
                    <span>Print Test Certificate</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-slate-100">
                Enter a Student ID and click "Generate Preview" to render the dynamic certificate template.
              </div>
            )}

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal.show && (
        <div className="no-print fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-700">{deleteModal.title}</strong>?
              </p>
            </div>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteModal({ show: false, type: '', id: null, title: '' })}
                className="px-5 py-2.5 rounded-2xl font-bold text-slate-500 text-xs bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                disabled={loading}
                className="px-5 py-2.5 rounded-2xl font-bold text-white text-xs bg-red-600 hover:bg-red-700 shadow-md"
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RegistrarSetup;
