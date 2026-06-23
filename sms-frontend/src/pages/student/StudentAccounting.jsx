import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, CheckCircle2, Megaphone, Wallet, 
  Receipt, Calendar, Lock, Loader2, Info, Eye, X, Printer, 
  ArrowRight, Download, History, Filter, Landmark, FileText, CheckCircle,
  ChevronLeft, ChevronRight, CalendarDays, BookOpen, User, LogOut, Menu,
  AlertCircle, Activity, Bell, BellOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentAccounting = () => {
  const { user, branding, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [allBillingItems, setAllBillingItems] = useState([]); 
  
  // UI States
  const [activeTab, setActiveTab] = useState('statement'); // 'statement' | 'history'
  const [filter, setFilter] = useState('All'); // 'All' | 'Unpaid' | 'Paid'
  const [viewModal, setViewModal] = useState({ open: false, type: '' });

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/student/get_students.php`);
      const allStudents = res.data.students || []; 
      const allItems = res.data.billing_items || [];
      const myData = allStudents.find(s => s.email === user.email);
      
      if (myData) {
        // Kunin lahat ng items (kahit paid na) para sa detailed breakdown
        const rawItems = allItems.filter(item => parseInt(item.billing_id) === parseInt(myData.billing_id));

        const processedItems = rawItems.map(item => {
          const originalAmount = parseFloat(item.amount || 0);
          const paid = parseFloat(item.paid_amount || 0);
          const balance = originalAmount - paid;
          return { 
             ...item, 
             originalAmount, 
             paidAmount: paid, 
             balance: balance > 0 ? balance : 0,
             status: balance <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid')
          };
        });

        // Compute overall real balances
        const totalAssessment = processedItems.reduce((acc, item) => acc + item.originalAmount, 0);
        const totalPaid = processedItems.reduce((acc, item) => acc + item.paidAmount, 0);
        const totalBalance = processedItems.reduce((acc, item) => acc + item.balance, 0);

        myData.totalAssessment = totalAssessment;
        myData.totalPaid = totalPaid;
        myData.computedBalance = totalBalance;
        myData.paymentProgress = totalAssessment > 0 ? Math.round((totalPaid / totalAssessment) * 100) : 0;

        setStudentData(myData);
        setAllBillingItems(processedItems);
      }
    } catch (err) {
      console.error("Error fetching accounting data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) fetchData();
  }, [user.email]);

  const handlePrint = () => window.print();

  // Filter Logic for Statement Table
  const filteredItems = allBillingItems.filter(item => {
     if (filter === 'All') return true;
     if (filter === 'Paid') return item.status === 'Paid';
     if (filter === 'Unpaid') return item.status !== 'Paid';
     return true;
  });

  // Derived Statuses
  const isPaid = studentData?.computedBalance <= 0 && studentData?.totalAssessment > 0;
  const isPartial = studentData?.totalPaid > 0 && studentData?.computedBalance > 0;
  const isUnpaid = studentData?.totalPaid <= 0;
  const safeThemeColor = branding?.theme_color?.startsWith('#') ? branding.theme_color : '#6366f1';

  // MOCK PAYMENT HISTORY (Since backend doesn't have a dedicated array yet, we generate a mock one based on paid amount to show the UI)
  const mockHistory = studentData?.totalPaid > 0 ? [
     { id: "OR-10293", date: studentData?.last_payment_date || "Recent", amount: studentData?.totalPaid, method: "Cash / Over-the-counter", status: "Verified" }
  ] : [];

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center font-black animate-pulse text-slate-400 uppercase tracking-widest gap-4 bg-slate-50/50">
      <Loader2 className="animate-spin text-indigo-500" size={40} />
      Loading Finance Records...
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
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Finance Portal</span>
            <span className="bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">S.Y. {studentData?.school_year}</span>
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${isUnpaid ? 'bg-red-500 text-white' : isPartial ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
              {isPaid ? 'Fully Settled' : isPartial ? 'Partially Paid' : 'Pending Payment'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <Wallet className="text-indigo-600" size={32}/> Accounting & Billing
          </h1>
        </div>
        <button onClick={() => setViewModal({ open: true, type: 'SOA' })} className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 transition-all text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg active:scale-95">
          <Download size={16} /> Download SOA
        </button>
      </div>

      {/* ========================================================
          2. KPI CARDS ROW (Fintech Style)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        
        {/* TOTAL BALANCE CARD (Accent Color) */}
        <div style={{ backgroundColor: safeThemeColor }} className="p-8 rounded-[2.5rem] text-white shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
             <Wallet size={150} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
             <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2 flex items-center gap-2"><AlertCircle size={14}/> Outstanding Balance</p>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-sm">
                   ₱{studentData?.computedBalance?.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </h2>
             </div>
             
             <div className="mt-8">
                <div className="flex justify-between items-end mb-2">
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Payment Progress</p>
                   <p className="text-sm font-black">{studentData?.paymentProgress}%</p>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                   <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${studentData?.paymentProgress}%` }}></div>
                </div>
             </div>
          </div>
        </div>

        {/* TOTAL ASSESSED CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
           <div>
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-[1.2rem] flex items-center justify-center mb-4">
                 <Receipt size={24} />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Assessment</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight mt-1">
                 ₱{studentData?.totalAssessment?.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </h3>
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6 border-t border-slate-50 pt-4">Total fees for the current school year.</p>
        </div>

        {/* LAST PAYMENT CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
           <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-[1.2rem] flex items-center justify-center mb-4">
                 <Landmark size={24} />
              </div>
              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${isUnpaid ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-700'}`}>
                 {isUnpaid ? 'No Records' : 'Verified'}
              </span>
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Amount Paid</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight mt-1">
                 ₱{studentData?.totalPaid?.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </h3>
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6 border-t border-slate-50 pt-4 flex items-center gap-1">
             <Calendar size={12}/> Last active: {studentData?.last_payment_date || 'N/A'}
           </p>
        </div>
      </div>

      {/* ========================================================
          3. MAIN TABS & DATA CONTENT
          ======================================================== */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden print:hidden">
        
        {/* TAB NAVIGATION */}
        <div className="flex border-b border-slate-100 px-6 pt-6 gap-6 overflow-x-auto no-scrollbar">
           <button 
             onClick={() => setActiveTab('statement')}
             className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors whitespace-nowrap border-b-4 ${activeTab === 'statement' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
           >
             <div className="flex items-center gap-2"><FileText size={16}/> Statement of Account</div>
           </button>
           <button 
             onClick={() => setActiveTab('history')}
             className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors whitespace-nowrap border-b-4 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
           >
             <div className="flex items-center gap-2"><History size={16}/> Payment History</div>
           </button>
        </div>

        <div className="p-6 md:p-10">
           
           {/* CONTENT: STATEMENT OF ACCOUNT */}
           {activeTab === 'statement' && (
             <div className="animate-in fade-in duration-300">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                 <h3 className="font-black text-slate-800 text-lg">Fee Breakdown</h3>
                 <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <Filter size={14} className="text-slate-400 ml-2" />
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer pr-2">
                       <option value="All">All Fees</option>
                       <option value="Unpaid">Unpaid / Balances</option>
                       <option value="Paid">Fully Paid</option>
                    </select>
                 </div>
               </div>

               <div className="overflow-x-auto rounded-3xl border border-slate-100">
                 <table className="w-full text-left border-collapse min-w-[600px]">
                   <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <tr>
                       <th className="p-5 pl-6 border-b border-slate-100">Particulars / Fee Name</th>
                       <th className="p-5 text-right border-b border-slate-100">Assessed Amt</th>
                       <th className="p-5 text-right border-b border-slate-100">Paid</th>
                       <th className="p-5 text-right border-b border-slate-100">Balance</th>
                       <th className="p-5 text-center border-b border-slate-100">Status</th>
                     </tr>
                   </thead>
                   <tbody className="text-sm font-bold text-slate-700 divide-y divide-slate-50">
                     {filteredItems.length > 0 ? (
                       filteredItems.map((item, index) => (
                         <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                           <td className="p-5 pl-6 text-slate-800 uppercase">{item.item_name}</td>
                           <td className="p-5 text-right font-medium text-slate-500">₱{item.originalAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                           <td className="p-5 text-right font-medium text-emerald-600">₱{item.paidAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                           <td className="p-5 text-right font-black text-slate-900">₱{item.balance.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                           <td className="p-5 text-center">
                              <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                item.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                item.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-50 text-red-600 border border-red-100'
                              }`}>
                                {item.status}
                              </span>
                           </td>
                         </tr>
                       ))
                     ) : (
                       <tr>
                         <td colSpan="5" className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                            No records found for this filter.
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
           )}

           {/* CONTENT: PAYMENT HISTORY */}
           {activeTab === 'history' && (
             <div className="animate-in fade-in duration-300">
               <h3 className="font-black text-slate-800 text-lg mb-6">Recent Transactions</h3>
               
               <div className="space-y-4">
                 {mockHistory.length > 0 ? (
                   mockHistory.map((hist, idx) => (
                     <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border border-slate-100 rounded-3xl bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all gap-4">
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                              <CheckCircle size={20}/>
                           </div>
                           <div>
                              <h4 className="font-black text-slate-800 tracking-tight">{hist.id}</h4>
                              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{hist.date} • {hist.method}</p>
                           </div>
                        </div>
                        <div className="text-right w-full sm:w-auto">
                           <p className="text-xl font-black text-emerald-600">₱{hist.amount.toLocaleString(undefined, {minimumFractionDigits:2})}</p>
                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{hist.status}</span>
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-[2rem]">
                      <History size={40} className="mx-auto text-slate-300 mb-4"/>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No payment history available yet.</p>
                   </div>
                 )}
               </div>
               
               <div className="mt-6 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-4">
                  <Info size={20} className="text-indigo-600 shrink-0 mt-0.5"/>
                  <p className="text-xs font-medium text-indigo-800 leading-relaxed">
                    <strong>Note:</strong> Payments made through bank transfers or over-the-counter channels may take 1 to 2 business days to reflect in your portal. Please keep your deposit slips for verification.
                  </p>
               </div>
             </div>
           )}

        </div>
      </div>

      {/* ========================================================
          SOA PRINT MODAL (Polished Print View)
          ======================================================== */}
      {viewModal.open && studentData && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-start justify-center p-4 pt-10 backdrop-blur-sm print:p-0 print:bg-white">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden print:shadow-none print:max-h-full print:rounded-none animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Receipt size={24}/></div>
                <h3 className="font-black text-slate-800 tracking-tight">Statement of Account</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-all shadow-lg active:scale-95">
                   <Printer size={18} /> Print Document
                </button>
                <button onClick={() => setViewModal({ open: false, type: '' })} className="p-2.5 bg-slate-100 text-slate-400 hover:text-red-500 rounded-xl transition-colors"><X size={20}/></button>
              </div>
            </div>

            <div className="p-8 md:p-12 overflow-y-auto flex-1 print:overflow-visible font-sans">
              <div className="flex items-start justify-between mb-10 border-b-4 border-slate-900 pb-8">
                <div className="flex items-center gap-6">
                  {branding.school_logo && (
                    <img 
                      src={`${API_BASE_URL}/uploads/branding/${branding?.school_logo}`} 
                      className="w-24 h-24 object-contain" 
                      alt="Logo" 
                    />
                  )}
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase leading-tight">{branding.school_name}</h1>
                    <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-4">Office of Finance & Accounting</p>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-2">{studentData.first_name} {studentData.last_name}</h2>
                    <p className="font-mono text-sm font-bold text-slate-600">LRN/ID: {studentData.student_id} • S.Y. {studentData.school_year}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black uppercase text-slate-300 tracking-tighter mb-1">Statement</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-800">
                      <th className="py-4 text-xs font-black uppercase text-slate-800 tracking-widest">Description</th>
                      <th className="py-4 text-right text-xs font-black uppercase text-slate-800 tracking-widest">Assessment</th>
                      <th className="py-4 text-right text-xs font-black uppercase text-slate-800 tracking-widest">Paid</th>
                      <th className="py-4 text-right text-xs font-black uppercase text-slate-800 tracking-widest">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBillingItems.map((item, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-4 font-bold text-slate-700 uppercase text-xs">{item.item_name}</td>
                        <td className="py-4 text-right font-medium text-slate-500">₱ {item.originalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="py-4 text-right font-medium text-emerald-600">₱ {item.paidAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="py-4 text-right font-black text-slate-900">₱ {item.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end pt-6">
                   <div className="w-full max-w-sm space-y-4">
                      <div className="flex justify-between text-sm font-bold text-slate-500">
                         <span>Total Assessment:</span>
                         <span>₱ {studentData.totalAssessment?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-emerald-600">
                         <span>Less: Payments Made:</span>
                         <span>- ₱ {studentData.totalPaid?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between text-xl font-black text-slate-900 pt-4 border-t-2 border-slate-900">
                         <span className="uppercase tracking-widest text-sm self-end">Total Due</span>
                         <span>₱ {studentData.computedBalance?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                   </div>
                </div>
                
                <div className="mt-16 pt-8 border-t border-slate-200 text-center print:block">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">This is a system-generated document. Not valid for claiming tax exemptions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAccounting;