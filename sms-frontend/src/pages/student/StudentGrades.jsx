import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  GraduationCap, Printer, Download, Lock, CheckCircle2, 
  AlertCircle, FileText, Loader2, Award, BookOpen, FileSpreadsheet, Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import OfficialSF9Card from '../../components/shared/OfficialSF9Card';
import { exportStudentSF9Excel } from '../../utils/depedExcelGenerator';

const LETTER_TO_NUM = { A: 97, B: 91, C: 86, D: 80, E: 72 };
const NUM_TO_LETTER = (n) => {
  if (n >= 95) return 'A';
  if (n >= 89) return 'B';
  if (n >= 83) return 'C';
  if (n >= 75) return 'D';
  return 'E';
};

const StudentGrades = () => {
  const { user, branding, API_BASE_URL, getLogoUrl } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [sf9StudentRecord, setSf9StudentRecord] = useState(null);
  const [grades, setGrades] = useState([]);
  const [rawGrades, setRawGrades] = useState([]);
  const [selectedSy, setSelectedSy] = useState('2026-2027');
  const [viewTab, setViewTab] = useState('summary'); // 'summary' | 'sf9'

  const safeThemeColor = branding?.theme_color?.startsWith('#') ? branding.theme_color : '#6366f1';

  const fetchData = async () => {
    try {
      // 1. Fetch Student & Balance Info
      const res = await axios.get(`${API_BASE_URL}/student/get_students.php`);
      const allStudents = res.data.students || [];
      const myId = user?.student_id || user?.username || user?.id;
      const myData = allStudents.find(s => 
        (myId && String(s.student_id).toLowerCase() === String(myId).toLowerCase()) || 
        (user?.email && String(s.email).toLowerCase() === String(user.email).toLowerCase())
      ) || (allStudents.length > 0 ? allStudents[0] : null);
      
      if (myData) {
        const totalAmount = parseFloat(myData.total_amount || 0);
        const totalPaid = parseFloat(myData.paid_amount || 0);
        myData.hasBalance = (totalAmount - totalPaid) > 0;
        myData.balanceAmount = Math.max(0, totalAmount - totalPaid);
        
        setStudentData(myData);
        const currentSy = myData.school_year || '2026-2027';
        setSelectedSy(currentSy);

        // 2. FETCH REAL GRADES FROM DB (including DepEd DO 015, s. 2026 SF9 data)
        const gradeRes = await axios.get(`${API_BASE_URL}/student/get_student_grades.php?student_id=${myData.student_id}&sy=${currentSy}`);
        if (gradeRes.data.status === 'success') {
          setGrades(gradeRes.data.data || []);
          setRawGrades(gradeRes.data.raw_grades || []);
          if (gradeRes.data.student) {
            setSf9StudentRecord(gradeRes.data.student);
          }
        } else {
          setGrades([]);
          setRawGrades([]);
        }
      }
    } catch (err) {
      console.error("Error fetching student data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Compute GWA only from subjects with encoded grades (numeric or letter A-E)
  const computeGWA = () => {
    const validNumeric = [];
    const validLetters = [];

    for (const curr of grades) {
      const val = String(curr.final || '').trim();
      if (!val || val === '-') continue;
      if (!isNaN(Number(val)) && Number(val) > 0) {
        validNumeric.push(Number(val));
      } else if (LETTER_TO_NUM[val.toUpperCase()]) {
        validLetters.push(LETTER_TO_NUM[val.toUpperCase()]);
      }
    }

    if (validNumeric.length > 0) {
      const avg = validNumeric.reduce((a, b) => a + b, 0) / validNumeric.length;
      return avg.toFixed(2);
    }
    if (validLetters.length > 0) {
      const avg = validLetters.reduce((a, b) => a + b, 0) / validLetters.length;
      return `${NUM_TO_LETTER(Math.round(avg))} (${avg.toFixed(1)})`;
    }
    return 'N/A';
  };

  const getStandingLabel = () => {
    const gwa = computeGWA();
    if (gwa === 'N/A') return 'Awaiting Quarterly Encoding';
    const num = parseFloat(gwa);
    if (!isNaN(num)) {
      if (num >= 90) return 'Outstanding (Passed)';
      if (num >= 85) return 'Very Satisfactory (Passed)';
      if (num >= 80) return 'Satisfactory (Passed)';
      if (num >= 75) return 'Fairly Satisfactory (Passed)';
      return 'Needs Intervention';
    }
    return `Proficiency Level: ${gwa}`;
  };

  const handleDownloadSF9Excel = async () => {
    if (studentData?.hasBalance) return;
    try {
      const sf9Subjects = grades.map(g => ({
        code: g.code,
        description: g.desc || g.title,
        q1: g.q1 !== '-' ? g.q1 : '',
        q2: g.q2 !== '-' ? g.q2 : '',
        q3: g.q3 !== '-' ? g.q3 : '',
        q4: g.q4 !== '-' ? g.q4 : '',
        final_grade: g.final !== '-' ? g.final : ''
      }));
      exportStudentSF9Excel({
        student: sf9StudentRecord || studentData,
        subjects: sf9Subjects,
        branding
      });
    } catch (err) {
      console.error("Failed to export SF9 Excel:", err);
      alert("Failed to generate SF9 Excel file.");
    }
  };

  const handlePrint = () => {
    if (viewTab === 'sf9') {
      window.print();
      return;
    }
    const printWindow = window.open("", "_blank", "width=850,height=950");
    const gradeRows = grades.map(g => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-weight: 800; color: #1e293b;">${g.code || ''}</td>
        <td style="padding: 10px; font-weight: 700; color: #334155;">${g.desc || g.title || ''}</td>
        <td style="padding: 10px; font-weight: 700; text-align: center;">${g.q1 || '-'}</td>
        <td style="padding: 10px; font-weight: 700; text-align: center;">${g.q2 || '-'}</td>
        <td style="padding: 10px; font-weight: 700; text-align: center;">${g.q3 || '-'}</td>
        <td style="padding: 10px; font-weight: 700; text-align: center;">${g.q4 || '-'}</td>
        <td style="padding: 10px; font-weight: 900; text-align: center; color: #2563eb;">${g.final || '---'}</td>
        <td style="padding: 10px; font-weight: 800; text-align: center; color: ${g.remarks === 'Passed' ? '#16a34a' : '#dc2626'};">${g.remarks || 'Pending'}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Report Card (SF9) - ${studentData?.first_name || ''} ${studentData?.last_name || ''}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; }
            .header { text-align: center; border-bottom: 3px double #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 0; }
            .subtitle { font-size: 11px; font-weight: 800; color: #2563eb; letter-spacing: 1.5px; margin-top: 4px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 14px 18px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #e2e8f0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th { background: #f1f5f9; padding: 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
            .gwa-card { background: #eff6ff; border: 2px solid #bfdbfe; padding: 14px 18px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${branding?.school_name || 'SCHOOL MANAGEMENT SYSTEM'}</h1>
            <div class="subtitle">DEPED ORDER NO. 015, S. 2026 • LEARNER'S PROGRESS REPORT CARD (SF9)</div>
          </div>
          <div class="info-grid">
            <div><strong>Learner Name:</strong> ${studentData?.first_name || ''} ${studentData?.last_name || ''}</div>
            <div><strong>Student ID / LRN:</strong> ${studentData?.student_id || '---'} (LRN: ${studentData?.lrn || 'N/A'})</div>
            <div><strong>Grade & Section:</strong> ${studentData?.grade_level || 'N/A'} — ${sf9StudentRecord?.section_name || studentData?.section || 'TBA'}</div>
            <div><strong>School Year:</strong> ${selectedSy}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Code</th>
                <th style="text-align: left;">Learning Area</th>
                <th style="text-align: center;">Q1</th>
                <th style="text-align: center;">Q2</th>
                <th style="text-align: center;">Q3</th>
                <th style="text-align: center;">Q4</th>
                <th style="text-align: center;">Final</th>
                <th style="text-align: center;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${gradeRows || `<tr><td colspan="8" style="padding:20px; text-align:center; color:#94a3b8;">No grade entries found.</td></tr>`}
            </tbody>
          </table>
          <div class="gwa-card">
            <span style="font-weight:900; text-transform:uppercase; color:#1e40af; font-size:12px;">General Average</span>
            <span style="font-weight:900; color:#1d4ed8; font-size:20px;">${computeGWA()}</span>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center font-black animate-pulse text-slate-400 uppercase tracking-widest gap-4 bg-slate-50/50">
      <Loader2 className="animate-spin text-indigo-500" size={40} />
      Fetching Academic Records...
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 w-full space-y-6 animate-in fade-in duration-500 font-sans bg-slate-50/50 min-h-screen print:p-0 print:m-0 print:bg-white">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden mb-2">
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
              DepEd Order No. 015, s. 2026
            </span>
            <span className="bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
              LRN: {studentData?.lrn || 'N/A'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <GraduationCap className="text-indigo-600" size={32}/> Learner's Progress Report
          </h1>
        </div>
        
        {/* VIEW SWITCHER & DOWNLOAD ACTIONS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center shadow-sm">
            <button
              onClick={() => setViewTab('summary')}
              className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                viewTab === 'summary' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText size={14} /> Summary Table
            </button>
            <button
              onClick={() => setViewTab('sf9')}
              className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                viewTab === 'sf9' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Eye size={14} /> Official SF9 Card
            </button>
          </div>

          {studentData?.hasBalance ? (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 p-2 pr-4 rounded-xl shadow-sm">
               <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                  <Lock size={14} />
               </div>
               <div>
                  <p className="text-[9px] font-black text-red-800 uppercase tracking-widest">Financial Hold</p>
                  <p className="text-[10px] font-bold text-red-600">Official DL Locked</p>
               </div>
            </div>
          ) : (
            <>
              <button
                onClick={handleDownloadSF9Excel}
                className="px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-xs font-bold rounded-xl flex items-center gap-2 shadow-md active:scale-95"
              >
                <FileSpreadsheet size={16} /> SF9 Excel (.xlsx)
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 transition-all text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg active:scale-95"
              >
                <Printer size={16} /> Print Form 138 (SF9)
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. KPI CARDS (GWA & Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        
        {/* GWA CARD */}
        <div style={{ backgroundColor: safeThemeColor }} className="p-8 rounded-[2.5rem] text-white shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
             <Award size={150} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
             <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">General Average / Standing</p>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter drop-shadow-sm">
                   {computeGWA()}
                </h2>
             </div>
             <div className="mt-8 pt-4 border-t border-white/20">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                   <CheckCircle2 size={12}/> {getStandingLabel()}
                </span>
             </div>
          </div>
        </div>

        {/* STUDENT INFO CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between lg:col-span-2">
           <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-[1.2rem] flex items-center justify-center">
                 <BookOpen size={24} />
              </div>
              <select 
                value={selectedSy}
                onChange={(e) => setSelectedSy(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                 <option value={studentData?.school_year || '2026-2027'}>{studentData?.school_year || '2026-2027'} (Current)</option>
              </select>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Program / Track</p>
                 <p className="text-sm font-bold text-slate-800 mt-1">{sf9StudentRecord?.program || studentData?.program_code || 'Basic Ed'}</p>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade Level</p>
                 <p className="text-sm font-bold text-slate-800 mt-1">{sf9StudentRecord?.grade_level || studentData?.grade_level || 'N/A'}</p>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section</p>
                 <p className="text-sm font-bold text-slate-800 mt-1">{sf9StudentRecord?.section_name || studentData?.section || 'TBA'}</p>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                 <p className="text-sm font-bold text-emerald-600 mt-1">{studentData?.enrollment_status || 'Official'}</p>
              </div>
           </div>
        </div>

      </div>

      {/* 3. OFFICIAL SF9 CARD OR SUMMARY GRADES TABLE */}
      {viewTab === 'sf9' ? (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-4 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <OfficialSF9Card
            student={sf9StudentRecord || studentData}
            grades={rawGrades}
            branding={branding}
          />
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden print:shadow-none print:border-none print:rounded-none">
          
          <div className="p-6 md:p-8 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 print:hidden">
             <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <FileText size={18} className="text-indigo-500"/> Report of Ratings (DepEd DO 015, s. 2026)
             </h3>
             <span className="text-xs font-bold text-slate-400">
                Supports Numerical (75–100) & KS1 Descriptive (A–E) Ratings
             </span>
          </div>

          <div className="overflow-x-auto p-6 md:p-8 print:p-0">
             <table className="w-full text-left border-collapse min-w-[800px]">
               <thead className="bg-slate-50 print:bg-transparent text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <tr>
                   <th className="p-4 pl-6 border-b border-slate-100 w-1/3">Learning Area / Subject</th>
                   <th className="p-4 text-center border-b border-slate-100">Q1</th>
                   <th className="p-4 text-center border-b border-slate-100">Q2</th>
                   <th className="p-4 text-center border-b border-slate-100">Q3</th>
                   <th className="p-4 text-center border-b border-slate-100">Q4</th>
                   <th className="p-4 text-center border-b border-slate-100 text-slate-700">Final Rating</th>
                   <th className="p-4 text-center border-b border-slate-100">Descriptor / Remarks</th>
                 </tr>
               </thead>
               <tbody className="text-sm font-bold text-slate-700 divide-y divide-slate-50">
                 {grades.length > 0 ? (
                   grades.map((item, index) => (
                     <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                       <td className="p-4 pl-6">
                          <p className="text-slate-900">{item.desc}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                            {item.code} {item.teacher_name && item.teacher_name !== 'TBA' ? `• ${item.teacher_name}` : ''}
                          </p>
                       </td>
                       <td className="p-4 text-center text-slate-600">{item.q1 || '-'}</td>
                       <td className="p-4 text-center text-slate-600">{item.q2 || '-'}</td>
                       <td className="p-4 text-center text-slate-600">{item.q3 || '-'}</td>
                       <td className="p-4 text-center text-slate-600">{item.q4 || '-'}</td>
                       <td className="p-4 text-center font-black text-lg text-slate-900">
                          {item.final || '-'}
                          {item.descriptive_final && item.descriptive_final !== item.final && (
                            <span className="ml-1.5 text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                              {item.descriptive_final}
                            </span>
                          )}
                       </td>
                       <td className="p-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            item.remarks === 'Passed' || item.remarks === 'Completed' ? 'bg-emerald-100 text-emerald-700 print:bg-transparent print:text-slate-900' :
                            item.remarks === 'Failed' || item.remarks === 'Needs Support' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {item.descriptor ? `${item.descriptor} (${item.remarks})` : (item.remarks || 'Pending')}
                          </span>
                       </td>
                     </tr>
                   ))
                 ) : (
                   <tr>
                     <td colSpan="7" className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                        No subjects or grades encoded for this school year yet.
                     </td>
                   </tr>
                 )}
               </tbody>
               <tfoot className="bg-slate-50/50 print:bg-transparent border-t-2 border-slate-100">
                  <tr>
                     <td colSpan="5" className="p-4 pl-6 text-right font-black text-[10px] uppercase tracking-widest text-slate-500">General Average</td>
                     <td className="p-4 text-center font-black text-xl text-indigo-600 print:text-slate-900">{computeGWA()}</td>
                     <td className="p-4 text-center text-[10px] font-black uppercase text-emerald-600">{getStandingLabel()}</td>
                  </tr>
               </tfoot>
             </table>
          </div>

          {/* FINANCIAL HOLD WARNING BANNER */}
          {studentData?.hasBalance && (
             <div className="bg-red-50 border-t border-red-100 p-6 md:p-8 flex items-start gap-4 print:hidden">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                <div>
                   <h4 className="text-sm font-black text-red-800 uppercase tracking-tight mb-1">Financial Hold Active</h4>
                   <p className="text-xs font-medium text-red-600/80 leading-relaxed max-w-3xl">
                      You have an outstanding balance of <strong>₱{studentData.balanceAmount.toLocaleString()}</strong>. 
                      While you can view your grades here, downloading or requesting official printed copies of your Form 138 (SF9) / Transcript of Records is restricted. Please proceed to the Accounting Office or settle your balance via the Finance Portal.
                   </p>
                   <button onClick={() => navigate('/student/accounting')} className="mt-4 px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors">
                      Go to Finance Portal
                   </button>
                </div>
             </div>
          )}

        </div>
      )}
    </div>
  );
};

export default StudentGrades;
