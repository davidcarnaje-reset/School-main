import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Upload, Send, CheckCircle2, Info, 
  FileText, Loader2, AlertCircle, X, Trash2,
  Clock, CheckCircle, XCircle, GraduationCap, ChevronDown, HelpCircle,
  FileBadge
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StudentScholarship = () => {
  const { user, branding, API_BASE_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scholarshipTypes, setScholarshipTypes] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  
  const [selectedType, setSelectedType] = useState('');
  const [files, setFiles] = useState([]); 
  const [message, setMessage] = useState({ text: '', type: '' });

  const safeThemeColor = branding?.theme_color?.startsWith('#') ? branding.theme_color : '#6366f1';

  useEffect(() => {
    fetchScholarships();
    fetchMyApplications();
  }, []);

  const fetchScholarships = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/student/fetch_scholarships.php`);
      if (Array.isArray(res.data)) {
        setScholarshipTypes(res.data);
      } else {
        setScholarshipTypes([]);
      }
    } catch (err) {
      setScholarshipTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/student/get_student_applications.php?email=${user.email}`);
      if (res.data.status === 'success') {
        setMyApplications(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching application status:", err);
    }
  };

  const handleFileChange = (e) => {
    const chosenFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...chosenFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedType || files.length === 0) {
      setMessage({ text: 'Please select a scholarship and upload at least one requirement.', type: 'error' });
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('email', user.email);
    formData.append('scholarship_id', selectedType);
    
    files.forEach(file => {
      formData.append('requirements[]', file); 
    });

    try {
      const res = await axios.post(`${API_BASE_URL}/student/submit_application.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        setMessage({ text: 'Application submitted successfully! Please wait for registrar verification.', type: 'success' });
        setFiles([]);
        setSelectedType('');
        fetchMyApplications();
      } else {
        setMessage({ text: res.data.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server error. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center font-black animate-pulse text-slate-400 uppercase tracking-widest gap-4 bg-slate-50/50">
      <Loader2 className="animate-spin text-indigo-500" size={40} />
      Loading Scholarships...
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 w-full space-y-6 animate-in fade-in duration-500 font-sans bg-slate-50/50 min-h-screen">
      
      {/* ========================================================
          1. HEADER SECTION
          ======================================================== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <FileBadge className="text-indigo-600" size={32}/> Financial Aid & Grants
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
             Centralized Scholarship Management
          </p>
        </div>
        <div className="flex gap-2">
           <span className="bg-white border border-slate-200 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
             <GraduationCap size={14}/> {myApplications.length} Application(s)
           </span>
        </div>
      </div>

      {/* ALERT MESSAGE */}
      {message.text && (
        <div className={`p-5 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-2 shadow-sm ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
          <p className="text-sm font-bold">{message.text}</p>
          <button onClick={() => setMessage({text:'', type:''})} className="ml-auto p-1 hover:bg-white/50 rounded-lg transition-colors"><X size={16}/></button>
        </div>
      )}

      {/* ========================================================
          2. MAIN GRID LAYOUT
          ======================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Submission Form & History (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* THE SUBMISSION FORM */}
          <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8">
            <div className="flex items-center justify-between mb-2">
               <h2 className="text-xl font-black text-slate-800">New Application</h2>
            </div>

            <section className="space-y-3">
              <label className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                <Info size={16} className="text-indigo-500"/> Select Scholarship Program
              </label>
              <div className="relative">
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:bg-white focus:border-indigo-400 outline-none transition-all font-bold text-sm text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="" disabled>Choose from available grants...</option>
                  {scholarshipTypes.length > 0 ? (
                    scholarshipTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} — {type.discount_value}% Discount
                      </option>
                    ))
                  ) : (
                    <option disabled>No active scholarships found</option>
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                   <ChevronDown size={18}/>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <label className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                <FileText size={16} className="text-indigo-500"/> Upload Documentary Requirements
              </label>
              <div className="relative group">
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  multiple 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <div className={`border-2 border-dashed rounded-[2rem] p-12 text-center transition-all duration-300 ${
                  files.length > 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50 group-hover:border-indigo-400 group-hover:bg-indigo-50/30'
                }`}>
                  <Upload className={`mx-auto mb-4 transition-colors ${files.length > 0 ? 'text-emerald-500' : 'text-slate-400 group-hover:text-indigo-500'}`} size={40} />
                  <p className="text-sm font-black text-slate-700">
                    {files.length > 0 ? `${files.length} file(s) selected` : "Drag & drop files here"}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                     or click to browse from your device
                  </p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {files.map((f, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0"><FileText size={14} /></div>
                        <span className="text-xs font-bold text-slate-700 truncate">{f.name}</span>
                      </div>
                      <button type="button" onClick={() => removeFile(index)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="pt-4 border-t border-slate-100">
               <button 
                 disabled={submitting}
                 type="submit" 
                 style={{ backgroundColor: safeThemeColor }}
                 className="w-full text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
               >
                 {submitting ? <Loader2 className="animate-spin" size={20}/> : <Send size={20} />}
                 {submitting ? "Processing..." : "Submit Application"}
               </button>
            </div>
          </form>

          {/* MY APPLICATIONS HISTORY */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-8">
               <h3 className="font-black text-slate-800 uppercase text-[12px] tracking-[0.2em] flex items-center gap-2">
                 <Clock size={18} className="text-indigo-500" /> Application History
               </h3>
            </div>
            
            <div className="space-y-4">
              {myApplications.length > 0 ? (
                myApplications.map((app, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm transition-all gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{app.scholarship_name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Submitted: {app.date_applied}</p>
                    </div>
                    
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border w-max ${
                      app.status === 'Approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                      app.status === 'Rejected' ? 'bg-red-50 border-red-100 text-red-600' :
                      'bg-amber-50 border-amber-100 text-amber-600'
                    }`}>
                      {app.status === 'Approved' ? <CheckCircle size={14}/> : 
                       app.status === 'Rejected' ? <XCircle size={14}/> : 
                       <Loader2 className="animate-spin" size={14}/>}
                      <span className="text-[10px] font-black uppercase tracking-widest">{app.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
                  <FileBadge size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No previous applications.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Guide & Help (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* THE SUBMISSION GUIDE (Dark Mode for contrast) */}
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-black text-white/50 mb-8 uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                 <Info size={16} /> Submission Guide
              </h3>
              <ul className="space-y-5">
                <GuideItem step="1" text="Ensure GWA or Indigency requirements are scanned clearly." />
                <GuideItem step="2" text="You can upload multiple documents (e.g., Report Card and Tax Exemption)." />
                <GuideItem step="3" text="The Registrar will verify your documents within 2-3 business days." />
                <GuideItem step="4" text="Once approved, the discount will be automatically applied to your billing statement." />
              </ul>
            </div>
            {/* Background Aesthetic Blur */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
          </div>

          {/* HELP CARD */}
          <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 mb-3">
               <HelpCircle size={18} className="text-indigo-500"/> Need Assistance?
            </h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6">
              For issues regarding scholarship eligibility or missing documents, please visit the Office of Student Affairs.
            </p>
            <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition-colors border border-slate-200">
               Contact Support
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const GuideItem = ({ step, text }) => (
  <li className="flex gap-4 items-start">
    <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-black text-[10px]">
       {step}
    </div>
    <p className="text-[11px] font-bold text-slate-300 leading-relaxed mt-0.5">{text}</p>
  </li>
);

export default StudentScholarship;