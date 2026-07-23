import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Printer, Search, Filter, RefreshCw, Award, 
  CheckCircle2, AlertCircle, ArrowUpRight, GraduationCap, Users, 
  Calendar, Check, ShieldCheck, Download, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DepEdReportsModule = () => {
  const { branding, API_BASE_URL, getLogoUrl } = useAuth();
  const [activeTab, setActiveTab] = useState('sf1');
  const [loading, setLoading] = useState(false);

  // Filter States
  const [gradeFilter, setGradeFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Report States
  const [sf1Data, setSf1Data] = useState(null);
  const [sf5Data, setSf5Data] = useState(null);
  const [honorData, setHonorData] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [form138Data, setForm138Data] = useState(null);
  const [coeData, setCoeData] = useState(null);

  // Batch Promotion States
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [targetGrade, setTargetGrade] = useState('Grade 8');
  const [targetSy, setTargetSy] = useState('2027-2028');
  const [promoteLoading, setPromoteLoading] = useState(false);

  const gradeLevels = [
    'Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'College'
  ];

  useEffect(() => {
    fetchActiveTabReport();
  }, [activeTab, gradeFilter, sectionFilter]);

  const fetchActiveTabReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sf1') {
        const res = await axios.get(`${API_BASE_URL}/registrar/get_sf1_report.php?grade_level=${gradeFilter}&section=${sectionFilter}`);
        if (res.data.success) setSf1Data(res.data);
      } else if (activeTab === 'sf5') {
        const res = await axios.get(`${API_BASE_URL}/registrar/get_sf5_report.php?grade_level=${gradeFilter}&section=${sectionFilter}`);
        if (res.data.success) setSf5Data(res.data);
      } else if (activeTab === 'honors') {
        const res = await axios.get(`${API_BASE_URL}/registrar/get_honor_students.php?grade_level=${gradeFilter}`);
        if (res.data.success) setHonorData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchForm138 = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/get_form138_card.php?student_id=${studentId}`);
      if (res.data.success) setForm138Data(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCOE = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/get_certificate_enrollment.php?student_id=${studentId}`);
      if (res.data.success) setCoeData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchPromote = async () => {
    if (selectedStudents.length === 0) return alert("Pumili ng kahit isang estudyante na i-po-promote.");
    if (!confirm(`Sigurado ka bang i-po-promote ang ${selectedStudents.length} estudyante papuntang ${targetGrade}?`)) return;

    setPromoteLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/promote_students_batch.php`, {
        student_ids: selectedStudents,
        target_grade_level: targetGrade,
        target_school_year: targetSy
      });

      if (res.data.success) {
        alert(res.data.message);
        setSelectedStudents([]);
        fetchActiveTabReport();
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("System error processing promotion.");
    } finally {
      setPromoteLoading(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="text-blue-600" size={32} /> DepEd & CHED Official Forms Generator
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Official Registrar Academic Reports & Student Promotion</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="px-6 py-3.5 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Printer size={18} /> Print Report
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 print:hidden">
        {[
          { id: 'sf1', label: '📄 SF1: School Register' },
          { id: 'sf5', label: '📊 SF5: Promotion Report' },
          { id: 'form138', label: '🎴 Form 138 (Report Card)' },
          { id: 'coe', label: '📜 Certificate of Enrollment (COE)' },
          { id: 'honors', label: '🏆 Honor Students & GWAs' },
          { id: 'promote', label: '🎓 Batch Student Promotion' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all ${
              activeTab === t.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* FILTERS BAR */}
      {['sf1', 'sf5', 'honors', 'promote'].includes(activeTab) && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 print:hidden shadow-sm">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-slate-400" />
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Filter Grade:</span>
            <select 
              value={gradeFilter} 
              onChange={e => setGradeFilter(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="All">All Grade Levels</option>
              {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <button 
            onClick={fetchActiveTabReport}
            className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      )}

      {/* PRINTABLE HEADER FOR FORM REPORTS */}
      <div className="hidden print:block text-center border-b border-slate-300 pb-4 mb-6">
        <h2 className="text-lg font-black uppercase text-slate-900">{branding.school_name || 'School Management System'}</h2>
        <p className="text-xs text-slate-600">{branding.school_address || 'Republic of the Philippines'}</p>
        <p className="text-xs font-bold text-blue-800 mt-1 uppercase tracking-widest">Office of the School Registrar</p>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SF1 SCHOOL REGISTER */}
      {/* ========================================================= */}
      {activeTab === 'sf1' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-800 text-lg">School Form 1 (SF1) - School Register</h3>
              <p className="text-xs text-slate-400 font-bold uppercase">Masterlist of Enrolled Learners</p>
            </div>
            {sf1Data && (
              <div className="flex gap-4 text-xs font-black">
                <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100">Total: {sf1Data.total_learners}</span>
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100">Male: {sf1Data.male_count}</span>
                <span className="bg-pink-50 text-pink-700 px-3 py-1.5 rounded-xl border border-pink-100">Female: {sf1Data.female_count}</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-3">LRN</th>
                  <th className="p-3">Learner's Full Name</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">Birthdate</th>
                  <th className="p-3">Age</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Father's Name</th>
                  <th className="p-3">Mother's Name</th>
                  <th className="p-3">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {loading ? (
                  <tr><td colSpan="9" className="p-10 text-center text-slate-400">Loading SF1 Data...</td></tr>
                ) : !sf1Data || sf1Data.data.length === 0 ? (
                  <tr><td colSpan="9" className="p-10 text-center text-slate-400">No student records found.</td></tr>
                ) : (
                  sf1Data.data.map((s, idx) => (
                    <tr key={s.student_id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono text-blue-600">{s.lrn || 'N/A'}</td>
                      <td className="p-3 font-black text-slate-800">{s.last_name}, {s.first_name} {s.middle_name || ''} {s.suffix || ''}</td>
                      <td className="p-3">{s.gender}</td>
                      <td className="p-3">{s.dob || 'N/A'}</td>
                      <td className="p-3">{s.age || 'N/A'}</td>
                      <td className="p-3 text-[11px] font-medium max-w-[180px] truncate" title={s.full_address}>{s.full_address || 'N/A'}</td>
                      <td className="p-3 text-[11px] font-medium">{s.father_name || 'N/A'}</td>
                      <td className="p-3 text-[11px] font-medium">{s.mother_name || 'N/A'}</td>
                      <td className="p-3">{s.mobile_no || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SF5 PROMOTION REPORT */}
      {/* ========================================================= */}
      {activeTab === 'sf5' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-800 text-lg">School Form 5 (SF5) - Report on Promotion & Proficiency</h3>
              <p className="text-xs text-slate-400 font-bold uppercase">Learner Promotion Status Summary</p>
            </div>
            {sf5Data && (
              <div className="flex gap-3 text-xs font-black">
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100">Promoted: {sf5Data.summary.promoted}</span>
                <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-100">Conditional: {sf5Data.summary.conditional}</span>
                <span className="bg-red-50 text-red-700 px-3 py-1.5 rounded-xl border border-red-100">Retained: {sf5Data.summary.retained}</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-3">LRN</th>
                  <th className="p-3">Learner Name</th>
                  <th className="p-3">Grade Level</th>
                  <th className="p-3">General Average (GWA)</th>
                  <th className="p-3">Level of Proficiency</th>
                  <th className="p-3">Action Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {loading ? (
                  <tr><td colSpan="6" className="p-10 text-center text-slate-400">Loading SF5 Data...</td></tr>
                ) : !sf5Data || sf5Data.data.length === 0 ? (
                  <tr><td colSpan="6" className="p-10 text-center text-slate-400">No records found.</td></tr>
                ) : (
                  sf5Data.data.map(s => (
                    <tr key={s.student_id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono text-blue-600">{s.lrn || 'N/A'}</td>
                      <td className="p-3 font-black text-slate-800">{s.student_name}</td>
                      <td className="p-3">{s.grade_level}</td>
                      <td className="p-3 font-black text-blue-700">{s.gwa}</td>
                      <td className="p-3 text-[11px]">{s.proficiency_level}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          s.status === 'Promoted' ? 'bg-emerald-100 text-emerald-800' :
                          s.status === 'Conditional' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: FORM 138 REPORT CARD */}
      {/* ========================================================= */}
      {activeTab === 'form138' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-4 print:hidden shadow-sm">
            <input 
              type="text" 
              placeholder="Enter Student ID to load Report Card..." 
              value={selectedStudentId} 
              onChange={e => setSelectedStudentId(e.target.value)}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold flex-1 outline-none focus:border-blue-500"
            />
            <button 
              onClick={() => fetchForm138(selectedStudentId)}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all"
            >
              Generate Form 138
            </button>
          </div>

          {form138Data && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-slate-800 text-xl">{form138Data.student.first_name} {form138Data.student.last_name}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase">LRN: {form138Data.student.lrn} | Grade: {form138Data.student.grade_level} ({form138Data.student.section})</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                    General Average: {form138Data.general_average}
                  </span>
                </div>
              </div>

              <table className="w-full text-left border-collapse border border-slate-200 rounded-2xl overflow-hidden">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 border">Subject Code & Description</th>
                    <th className="p-3 border text-center">Q1</th>
                    <th className="p-3 border text-center">Q2</th>
                    <th className="p-3 border text-center">Q3</th>
                    <th className="p-3 border text-center">Q4</th>
                    <th className="p-3 border text-center">Final Grade</th>
                    <th className="p-3 border text-center">Remarks</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-bold text-slate-700">
                  {form138Data.subjects.map(sub => (
                    <tr key={sub.code} className="border-b">
                      <td className="p-3 border font-black">{sub.code} - {sub.description}</td>
                      <td className="p-3 border text-center">{sub.q1 || '-'}</td>
                      <td className="p-3 border text-center">{sub.q2 || '-'}</td>
                      <td className="p-3 border text-center">{sub.q3 || '-'}</td>
                      <td className="p-3 border text-center">{sub.q4 || '-'}</td>
                      <td className="p-3 border text-center font-black text-blue-600">{sub.final_grade || '-'}</td>
                      <td className="p-3 border text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${sub.remarks === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {sub.remarks}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-black text-emerald-900 flex justify-between items-center">
                <span>Eligibility & Recommendation:</span>
                <span className="uppercase">{form138Data.promotion_status}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: CERTIFICATE OF ENROLLMENT (COE) */}
      {/* ========================================================= */}
      {activeTab === 'coe' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-4 print:hidden shadow-sm">
            <input 
              type="text" 
              placeholder="Enter Student ID for Certificate of Enrollment..." 
              value={selectedStudentId} 
              onChange={e => setSelectedStudentId(e.target.value)}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold flex-1 outline-none focus:border-blue-500"
            />
            <button 
              onClick={() => fetchCOE(selectedStudentId)}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all"
            >
              Generate Certificate
            </button>
          </div>

          {coeData && (
            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8 relative overflow-hidden">
              <div className="text-center space-y-2 border-b border-slate-200 pb-6">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">CERTIFICATE OF ENROLLMENT</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Official Registrar Academic Document</p>
              </div>

              <div className="text-sm font-medium leading-relaxed text-slate-700 space-y-4">
                <p>
                  This is to certify that <b>{coeData.student.first_name} {coeData.student.middle_name} {coeData.student.last_name} {coeData.student.suffix}</b> (LRN: <b>{coeData.student.lrn}</b>) 
                  is officially enrolled as a <b>{coeData.student.grade_level}</b> student for the <b>Academic Year {coeData.student.school_year}</b>.
                </p>
              </div>

              <table className="w-full text-left border-collapse border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <thead className="bg-slate-50 font-black text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 border">Subject Code & Description</th>
                    <th className="p-3 border text-center">Units</th>
                    <th className="p-3 border">Schedule</th>
                    <th className="p-3 border">Room</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-slate-700">
                  {coeData.enrolled_subjects.map(s => (
                    <tr key={s.subject_code} className="border-b">
                      <td className="p-3 border">{s.subject_code} - {s.subject_description}</td>
                      <td className="p-3 border text-center font-black">{s.units || '3'}</td>
                      <td className="p-3 border">{s.schedule}</td>
                      <td className="p-3 border">{s.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-end pt-10">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Date Issued:</p>
                  <p className="text-xs font-black text-slate-800">{coeData.date_issued}</p>
                </div>
                <div className="text-center w-64">
                  <div className="border-b border-slate-800 mb-1"></div>
                  <p className="text-xs font-black text-slate-800">School Registrar</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Official Signatory</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: HONOR STUDENTS & DEAN'S LIST */}
      {/* ========================================================= */}
      {activeTab === 'honors' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-800 text-lg">Honor Students & Academic Excellence List</h3>
              <p className="text-xs text-slate-400 font-bold uppercase">DepEd & CHED Compliant GWA Compute Engine</p>
            </div>
            {honorData && (
              <span className="bg-amber-100 text-amber-900 px-4 py-1.5 rounded-2xl text-xs font-black border border-amber-200">
                🏆 Total Honor Awardees: {honorData.count}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-3">Rank</th>
                  <th className="p-3">LRN</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Grade & Section</th>
                  <th className="p-3">General Weighted Average (GWA)</th>
                  <th className="p-3">Academic Award</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {loading ? (
                  <tr><td colSpan="6" className="p-10 text-center text-slate-400">Computing GWA & Honors...</td></tr>
                ) : !honorData || honorData.data.length === 0 ? (
                  <tr><td colSpan="6" className="p-10 text-center text-slate-400">No honor student records found.</td></tr>
                ) : (
                  honorData.data.map((s, idx) => (
                    <tr key={s.student_id} className="hover:bg-amber-50/30">
                      <td className="p-3 font-black text-amber-600">#{idx + 1}</td>
                      <td className="p-3 font-mono text-blue-600">{s.lrn || 'N/A'}</td>
                      <td className="p-3 font-black text-slate-800">{s.last_name}, {s.first_name} {s.middle_name || ''}</td>
                      <td className="p-3">{s.grade_level} ({s.section})</td>
                      <td className="p-3 font-black text-blue-700 text-sm">{s.gwa}</td>
                      <td className="p-3">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                          <Award size={12} /> {s.honor_title}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: BATCH STUDENT PROMOTION TOOL */}
      {/* ========================================================= */}
      {activeTab === 'promote' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-800 text-lg">End-of-Year Batch Student Promotion Tool</h3>
              <p className="text-xs text-slate-400 font-bold uppercase">Elevate Learner Grade Levels in Bulk</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Promote to:</span>
              <select 
                value={targetGrade} 
                onChange={e => setTargetGrade(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-blue-600 outline-none"
              >
                {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
              </select>

              <button 
                onClick={handleBatchPromote}
                disabled={promoteLoading || selectedStudents.length === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <ArrowUpRight size={16} /> Promote Selected ({selectedStudents.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-3">
                    <input 
                      type="checkbox" 
                      onChange={e => {
                        if (e.target.checked && sf1Data) {
                          setSelectedStudents(sf1Data.data.map(s => s.student_id));
                        } else {
                          setSelectedStudents([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-3">Learner Full Name</th>
                  <th className="p-3">Current Grade</th>
                  <th className="p-3">Target Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {!sf1Data || sf1Data.data.length === 0 ? (
                  <tr><td colSpan="4" className="p-10 text-center text-slate-400">No student records to promote. Select a Grade Level filter above.</td></tr>
                ) : (
                  sf1Data.data.map(s => (
                    <tr key={s.student_id} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <input 
                          type="checkbox" 
                          checked={selectedStudents.includes(s.student_id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedStudents([...selectedStudents, s.student_id]);
                            else setSelectedStudents(selectedStudents.filter(id => id !== s.student_id));
                          }}
                        />
                      </td>
                      <td className="p-3 font-black text-slate-800">{s.last_name}, {s.first_name}</td>
                      <td className="p-3">{s.grade_level}</td>
                      <td className="p-3 font-black text-emerald-600 flex items-center gap-1">
                        <ChevronRight size={14} /> {targetGrade}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepEdReportsModule;
