import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import { 
  Award, RefreshCw, X, CheckCircle, XCircle, FileText, 
  ExternalLink, Clock, Image as ImageIcon, Bot, ScanSearch, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ScholarshipApplications = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Review Modal States
  const [selectedApp, setSelectedApp] = useState(null);
  const [documents, setDocuments] = useState([]);
  
  // AI States
  const [aiStatus, setAiStatus] = useState('idle'); 
  const [scanProgress, setScanProgress] = useState(0);
  
  // Confirmation Modal States
  const [confirmModal, setConfirmModal] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(''); 
  const [evalLoading, setEvalLoading] = useState(false);

  const UPLOADS_URL = `${API_BASE_URL}/uploads/requirements`;

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/get_scholarship_applications.php`);
      if (Array.isArray(res.data)) setApplications(res.data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  // ==========================================
  // UPDATED: AUTO-SCAN PAGKABUKAS NG MODAL
  // ==========================================
  const openReviewModal = (app) => {
    setSelectedApp(app);
    setScanProgress(0);

    if (app.requirements_file) {
      const fileArray = app.requirements_file.split(',').map(f => f.trim()).filter(f => f !== '');
      setDocuments(fileArray);

      // Kung Pending pa ang application, paandarin agad ang AI!
      if (app.status === 'Pending') {
        runAICheck(fileArray); // Ipapasa natin agad yung files para basahin niya
      } else {
        setAiStatus('idle'); // Pag na-approve/reject na, wag na mag-scan
      }
    } else {
      setDocuments([]);
      setAiStatus('idle');
    }
  };

  // ==========================================
  // TOTOONG TESSERACT OCR FUNCTION
  // ==========================================
  const runAICheck = async (docsToScan = documents) => {
    setAiStatus('scanning');
    setScanProgress(0);

    const imageDocs = docsToScan.filter(f => f.match(/\.(jpeg|jpg|png)$/i));
    const hasPdf = docsToScan.some(f => f.match(/\.(pdf)$/i));

    if (imageDocs.length === 0 && hasPdf) {
      setAiStatus('pdf_detected');
      return;
    }

    // Kung walang kahit anong image
    if (imageDocs.length === 0) {
      setAiStatus('idle');
      return;
    }

    try {
      let combinedText = "";

      for (let i = 0; i < imageDocs.length; i++) {
        // DUMADAAN SA PHP PROXY PARA WALANG CORS ERROR
        const fileUrl = `${API_BASE_URL}/registrar/read_image.php?file=${imageDocs[i]}`;
        
        const { data: { text } } = await Tesseract.recognize(
          fileUrl,
          'eng',
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                 setScanProgress(Math.round(m.progress * 100));
              }
            }
          }
        );
        combinedText += text.toLowerCase() + " ";
      }

      // Ang mga malalawak na keywords natin!
      const validKeywords = [
        'republic of the philippines', 'certif', 'completion', 'indigency', 
        'report card', 'form 138', 'gwa', 'grade', 'esc', 'voucher', 
        'academic', 'scholarship', 'barangay', 'average', 'certificate', 'enrollment', 'status', 'good moral', 'residence', 'income'
      ];

      const isMatch = validKeywords.some(kw => combinedText.includes(kw));

      if (isMatch) {
        setAiStatus('verified'); 
      } else {
        setAiStatus('manual'); 
      }

    } catch (error) {
      console.error("OCR Error: ", error);
      setAiStatus('manual'); 
    }
  };

  const handleEvaluateClick = (status) => {
    setActionToConfirm(status);
    setConfirmModal(true);
  };

  const confirmEvaluation = async () => {
    if (!selectedApp || !actionToConfirm) return;

    setEvalLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/evaluate_scholarship.php`, {
        id: selectedApp.id,
        status: actionToConfirm
      });

      if (res.data.success) {
        setConfirmModal(false);
        setSelectedApp(null);
        fetchApplications();
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (error) {
      alert("Server error evaluating application.");
    } finally {
      setEvalLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Approved') return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">Approved</span>;
    if (status === 'Rejected') return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100">Rejected</span>;
    return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">Pending</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Award className="text-blue-500" size={32} /> Scholarship Applications
          </h1>
          <p className="text-slate-500 font-medium">Verify documents and approve student grants.</p>
        </div>
        <button onClick={fetchApplications} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-blue-500 transition-all">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-8">Student</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scholarship Applied</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Applied</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="5" className="p-10 text-center font-bold text-slate-400">Loading applications...</td></tr>
            ) : applications.length === 0 ? (
              <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold">No applications found.</td></tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-5 pl-8">
                    <p className="font-bold text-slate-800">{app.first_name} {app.last_name}</p>
                    <p className="text-[10px] font-mono text-slate-400 uppercase">ID: {app.student_id}</p>
                  </td>
                  <td className="p-5 font-bold text-slate-600">{app.scholarship_name}</td>
                  <td className="p-5 text-xs font-bold text-slate-500">{new Date(app.date_applied).toLocaleDateString()}</td>
                  <td className="p-5 text-center">{getStatusBadge(app.status)}</td>
                  <td className="p-5 text-center">
                    <button 
                      onClick={() => openReviewModal(app)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                    >
                      {app.status === 'Pending' ? 'Review Files' : 'View Details'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* REVIEW MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl flex flex-col animate-in zoom-in duration-200 max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight">Application Review</h3>
                <p className="text-sm font-bold text-blue-600">{selectedApp.scholarship_name}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Applicant Details</p>
                <p className="text-lg font-black text-slate-800">{selectedApp.first_name} {selectedApp.last_name}</p>
                <p className="text-sm font-mono text-slate-500">{selectedApp.student_id}</p>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-blue-500"/> Submitted Documents
                </h4>
                
                {documents.length === 0 ? (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3 text-amber-600">
                    <Clock size={20} className="shrink-0"/>
                    <p className="text-sm font-bold">This student has not uploaded any documents yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {documents.map((fileName, index) => {
                      const fileUrl = `${UPLOADS_URL}/${fileName}`;
                      const isImage = fileName.match(/\.(jpeg|jpg|gif|png)$/i) != null;
                      const isPdf = fileName.match(/\.(pdf)$/i) != null;

                      return (
                        <div key={index} className="relative group rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
                          {isImage ? (
                            <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                              <img src={fileUrl} alt="Document Preview" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-xl flex items-center gap-2">
                                   <ExternalLink size={14}/> Full Image
                                </span>
                              </a>
                            </div>
                          ) : isPdf ? (
                            <div className="aspect-[4/3] w-full bg-slate-50 flex flex-col items-center justify-center p-6 border-b border-slate-100">
                              <FileText size={48} className="text-red-500 mb-3"/>
                              <span className="text-xs font-bold text-slate-600 truncate w-full text-center px-4">{fileName}</span>
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition-colors shadow-sm">
                                 <ExternalLink size={14}/> Open PDF
                              </a>
                            </div>
                          ) : (
                            <div className="p-6 flex items-center justify-between bg-slate-50 border-b border-slate-100">
                               <span className="text-xs font-bold text-slate-700 truncate pr-4">{fileName}</span>
                               <a href={fileUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} className="text-blue-500 hover:text-blue-700"/></a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ========================================== */}
              {/* TOTOONG AI PRE-CHECK MODULE WITH TESSERACT */}
              {/* ========================================== */}
              {selectedApp.status === 'Pending' && documents.length > 0 && (
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-inner relative overflow-hidden">
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                        <Bot size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          AI Document OCR Check
                          <span className="bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded-full uppercase tracking-widest">Tesseract Engine</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Automated document verification system.</p>
                      </div>
                    </div>

                    {/* AI STATUS LOGIC */}
                    {aiStatus === 'idle' && (
                      <div className="text-blue-400 w-full sm:w-auto">
                        <span className="text-xs font-bold uppercase tracking-widest">Ready</span>
                      </div>
                    )}

                    {aiStatus === 'scanning' && (
                      <div className="flex flex-col items-center gap-1 text-blue-400 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                          <RefreshCw size={16} className="animate-spin" />
                          <span className="text-xs font-bold uppercase tracking-widest">Reading Text... {scanProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
                          <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                        </div>
                      </div>
                    )}

                    {aiStatus === 'verified' && (
                      <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-lg w-full sm:w-auto justify-center border border-emerald-400/20">
                        <CheckCircle size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Valid Document Found</span>
                      </div>
                    )}

                    {aiStatus === 'manual' && (
                      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-4 py-2 rounded-lg justify-center border border-amber-400/20">
                          <AlertTriangle size={16} />
                          <span className="text-xs font-black uppercase tracking-widest">Check Manually.</span>
                        </div>
                        {/* RE-SCAN BUTTON */}
                        <button onClick={() => runAICheck(documents)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 text-[10px] font-bold uppercase">
                          Re-Scan
                        </button>
                      </div>
                    )}

                    {aiStatus === 'pdf_detected' && (
                      <div className="flex items-center gap-2 text-slate-300 bg-slate-800 px-4 py-2 rounded-lg w-full sm:w-auto justify-center border border-slate-700">
                        <FileText size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">PDF Detected. Manual Review.</span>
                      </div>
                    )}
                  </div>
                  
                  {aiStatus === 'scanning' && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                  )}
                </div>
              )}
            </div>

            {selectedApp.status === 'Pending' ? (
              <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[2.5rem] flex gap-3">
                <button 
                  onClick={() => handleEvaluateClick('Rejected')} 
                  className="flex-1 py-3 font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100 flex justify-center items-center gap-2"
                >
                  <XCircle size={18}/> Reject
                </button>
                <button 
                  onClick={() => handleEvaluateClick('Approved')} 
                  className="flex-1 py-3 font-black text-white rounded-xl shadow-lg bg-emerald-500 hover:bg-emerald-600 transition-all flex justify-center items-center gap-2"
                >
                  <CheckCircle size={18}/> Approve Grant
                </button>
              </div>
            ) : (
              <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[2.5rem] flex justify-center">
                <p className="text-sm font-bold text-slate-500">
                  This application was already <span className={selectedApp.status === 'Approved' ? 'text-emerald-600' : 'text-red-500'}>{selectedApp.status}</span>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl flex flex-col animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 text-center pt-8">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                actionToConfirm === 'Approved' ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-500'
              }`}>
                {actionToConfirm === 'Approved' ? <CheckCircle size={32} /> : <XCircle size={32} />}
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                {actionToConfirm === 'Approved' ? 'Approve' : 'Reject'} Application?
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Are you sure you want to <span className={`font-bold ${actionToConfirm === 'Approved' ? 'text-emerald-600' : 'text-red-500'}`}>{actionToConfirm.toLowerCase()}</span> the application of <span className="font-bold text-slate-700">{selectedApp.first_name}</span>?
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setConfirmModal(false)} 
                className="flex-1 py-3 font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmEvaluation}
                disabled={evalLoading}
                className={`flex-1 py-3 font-black text-white shadow-md rounded-xl transition-all flex items-center justify-center gap-2 ${
                  actionToConfirm === 'Approved' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {evalLoading ? <RefreshCw size={18} className="animate-spin" /> : actionToConfirm === 'Approved' ? 'Yes, Approve' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipApplications;