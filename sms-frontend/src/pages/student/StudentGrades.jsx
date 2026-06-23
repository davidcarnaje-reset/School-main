import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  GraduationCap, Printer, Download, Lock, CheckCircle2, 
  AlertCircle, FileText, Loader2, Award, BookOpen, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentGrades = () => {
  const { user, branding, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [grades, setGrades] = useState([]);
  const [selectedSy, setSelectedSy] = useState('2023-2024'); // Default SY

  const safeThemeColor = branding?.theme_color?.startsWith('#') ? branding.theme_color : '#6366f1';

  // --- MOCK GRADES DATA (Papalitan natin ng PHP API sa susunod) ---
  const mockGrades = [
    { code: "CORE-MATH", desc: "General Mathematics", q1: "88", q2: "90", q3: "92", q4: "91", final: "90", remarks: "Passed" },
    { code: "CORE-SCI", desc: "Earth and Life Science", q1: "85", q2: "87", q3: "89", q4: "88", final: "87", remarks: "Passed" },
    { code: "APPLIED-ECON", desc: "Applied Economics", q1: "90", q2: "92", q3: "94", q4: "95", final: "93", remarks: "Passed" },
    { code: "CORE-PE", desc: "Physical Education and Health", q1: "95", q2: "96", q3: "98", q4: "99", final: "97", remarks: "Passed" },
    { code: "ELEC-PROG", desc: "Computer Programming 1", q1: "80", q2: "82", q3: "85", q4: "84", final: "83", remarks: "Passed" }
  ];

const fetchData = async () => {
    try {
      // 1. Fetch Student & Balance Info
      const res = await axios.get(`${API_BASE_URL}/student/get_students.php`);
      const allStudents = res.data.students || [];
      const myData = allStudents.find(s => s.email === user.email);
      
      if (myData) {
        const totalAmount = parseFloat(myData.total_amount || 0);
        const totalPaid = parseFloat(myData.paid_amount || 0);
        myData.hasBalance = (totalAmount - totalPaid) > 0;
        myData.balanceAmount = totalAmount - totalPaid;
        
        setStudentData(myData);
        const currentSy = myData.school_year || '2023-2024';
        setSelectedSy(currentSy);

        // 2. FETCH REAL GRADES FROM DB!
        const gradeRes = await axios.get(`${API_BASE_URL}/student/get_student_grades.php?email=${user.email}&sy=${currentSy}`);
        if (gradeRes.data.status === 'success') {
           setGrades(gradeRes.data.data);
        } else {
           setGrades([]);
        }
      }
    } catch (err) {
      console.error("Error fetching student data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) fetchData();
  }, [user.email]);

  const handlePrint = () => window.print();

  // Compute GWA
  const computeGWA = () => {
    if (grades.length === 0) return 0;
    const total = grades.reduce((acc, curr) => acc + parseFloat(curr.final || 0), 0);
    return (total / grades.length).toFixed(2);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center font-black animate-pulse text-slate-400 uppercase tracking-widest gap-4 bg-slate-50/50">
      <Loader2 className="animate-spin text-indigo-500" size={40} />
      Fetching Academic Records...
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 w-full space-y-6 animate-in fade-in duration-500 font-sans bg-slate-50/50 min-h-screen print:p-0 print:m-0 print:bg-white">
      
      {/* ========================================================
          1. HEADER SECTION
          ======================================================== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden mb-2">
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Academic Portal</span>
            <span className="bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
               LRN: {studentData?.lrn || 'N/A'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <GraduationCap className="text-indigo-600" size={32}/> Grade Report
          </h1>
        </div>
        
        {/* FINANCIAL HOLD CHECKER PARA SA DOWNLOAD BUTTON */}
        <div className="flex gap-2">
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
            <button onClick={handlePrint} className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 transition-all text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg active:scale-95">
              <Download size={16} /> Download Form 138
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          2. KPI CARDS (GWA & Status)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        
        {/* GWA CARD */}
        <div style={{ backgroundColor: safeThemeColor }} className="p-8 rounded-[2.5rem] text-white shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
             <Award size={150} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
             <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">General Weighted Average</p>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter drop-shadow-sm">
                   {computeGWA()}
                </h2>
             </div>
             <div className="mt-8 pt-4 border-t border-white/20">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                   <CheckCircle2 size={12}/> Academic Standing: Excellent
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
                 <option value={studentData?.school_year}>{studentData?.school_year} (Current)</option>
                 <option value="2022-2023">2022-2023</option>
              </select>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Program / Track</p>
                 <p className="text-sm font-bold text-slate-800 mt-1">{studentData?.program_code || 'Basic Ed'}</p>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade Level</p>
                 <p className="text-sm font-bold text-slate-800 mt-1">{studentData?.grade_level || 'N/A'}</p>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section</p>
                 <p className="text-sm font-bold text-slate-800 mt-1">{studentData?.section || 'TBA'}</p>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                 <p className="text-sm font-bold text-emerald-600 mt-1">{studentData?.enrollment_status || 'Official'}</p>
              </div>
           </div>
        </div>

      </div>

      {/* ========================================================
          3. MAIN GRADES TABLE
          ======================================================== */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden print:shadow-none print:border-none print:rounded-none">
        
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center print:hidden">
           <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <FileText size={18} className="text-indigo-500"/> Report of Ratings
           </h3>
        </div>

        {/* PRINT HEADER (Makikita lang kapag nag-Ctrl+P) */}
        <div className="hidden print:block p-8 border-b-4 border-slate-900 mb-8">
           <div className="flex items-center gap-6">
              {branding.school_logo && (
                 <img src={`${API_BASE_URL}/uploads/branding/${branding?.school_logo}`} className="w-24 h-24 object-contain" alt="Logo" />
              )}
              <div>
                 <h1 className="text-2xl font-black text-slate-900 uppercase leading-tight">{branding.school_name}</h1>
                 <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-4">Official Report of Grades</p>
                 <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-2">{studentData?.first_name} {studentData?.last_name}</h2>
                 <p className="font-mono text-sm font-bold text-slate-600">LRN: {studentData?.lrn} • S.Y. {selectedSy}</p>
              </div>
           </div>
        </div>

        <div className="overflow-x-auto p-6 md:p-8 print:p-0">
           <table className="w-full text-left border-collapse min-w-[800px]">
             <thead className="bg-slate-50 print:bg-transparent text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <tr>
                 <th className="p-4 pl-6 border-b border-slate-100 w-1/3">Subject</th>
                 <th className="p-4 text-center border-b border-slate-100">1st</th>
                 <th className="p-4 text-center border-b border-slate-100">2nd</th>
                 <th className="p-4 text-center border-b border-slate-100">3rd</th>
                 <th className="p-4 text-center border-b border-slate-100">4th</th>
                 <th className="p-4 text-center border-b border-slate-100 text-slate-700">Final</th>
                 <th className="p-4 text-center border-b border-slate-100">Remarks</th>
               </tr>
             </thead>
             <tbody className="text-sm font-bold text-slate-700 divide-y divide-slate-50">
               {grades.length > 0 ? (
                 grades.map((item, index) => (
                   <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                     <td className="p-4 pl-6">
                        <p className="text-slate-900">{item.desc}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{item.code}</p>
                     </td>
                     <td className="p-4 text-center text-slate-500">{item.q1 || '-'}</td>
                     <td className="p-4 text-center text-slate-500">{item.q2 || '-'}</td>
                     <td className="p-4 text-center text-slate-500">{item.q3 || '-'}</td>
                     <td className="p-4 text-center text-slate-500">{item.q4 || '-'}</td>
                     <td className="p-4 text-center font-black text-lg text-slate-900">{item.final || '-'}</td>
                     <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          item.remarks === 'Passed' ? 'bg-emerald-100 text-emerald-700 print:bg-transparent print:text-slate-900' :
                          item.remarks === 'Failed' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {item.remarks || 'Pending'}
                        </span>
                     </td>
                   </tr>
                 ))
               ) : (
                 <tr>
                   <td colSpan="7" className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                      No grades encoded for this semester yet.
                   </td>
                 </tr>
               )}
             </tbody>
             <tfoot className="bg-slate-50/50 print:bg-transparent border-t-2 border-slate-100">
                <tr>
                   <td colSpan="5" className="p-4 pl-6 text-right font-black text-[10px] uppercase tracking-widest text-slate-500">General Weighted Average (GWA)</td>
                   <td className="p-4 text-center font-black text-xl text-indigo-600 print:text-slate-900">{computeGWA()}</td>
                   <td className="p-4 text-center"></td>
                </tr>
             </tfoot>
           </table>
        </div>

        {/* FINANCIAL HOLD WARNING BANNER (Shows at the bottom if has balance) */}
        {studentData?.hasBalance && (
           <div className="bg-red-50 border-t border-red-100 p-6 md:p-8 flex items-start gap-4 print:hidden">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div>
                 <h4 className="text-sm font-black text-red-800 uppercase tracking-tight mb-1">Financial Hold Active</h4>
                 <p className="text-xs font-medium text-red-600/80 leading-relaxed max-w-3xl">
                    You have an outstanding balance of <strong>₱{studentData.balanceAmount.toLocaleString()}</strong>. 
                    While you can view your grades here, downloading or requesting official printed copies of your Form 138 / Transcript of Records is restricted. Please proceed to the Accounting Office or settle your balance via the Finance Portal.
                 </p>
                 <button onClick={() => navigate('/student/accounting')} className="mt-4 px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors">
                    Go to Finance Portal
                 </button>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default StudentGrades;