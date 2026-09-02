import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Calendar, CreditCard, Clipboard, CheckSquare, 
  Wallet, Award, Bell, ArrowLeft, Loader2, X, Menu,
  CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Banknote, BadgeDollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Import subcomponents
import PersonalTab from '../../components/employee/PersonalTab';
import TimesheetTab from '../../components/employee/TimesheetTab';
import PayslipsTab from '../../components/employee/PayslipsTab';
import FilingTab from '../../components/employee/FilingTab';
import ApprovalsTab from '../../components/employee/ApprovalsTab';
import FinanceTab from '../../components/employee/FinanceTab';
import WfhTab from '../../components/employee/WfhTab';

const EmployeePortal = () => {
  const { user, branding, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Personal');
  const [loading, setLoading] = useState(true);
  const [employeeShift, setEmployeeShift] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('portalSidebarCollapsed')) ?? false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('portalSidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Core employee state
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [timesheet, setTimesheet] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [requests, setRequests] = useState([]);
  const [approvalsQueue, setApprovalsQueue] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [accomplishments, setAccomplishments] = useState([]);
  const [portalNotifs, setPortalNotifs] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Forms states
  const [expenseForm, setExpenseForm] = useState({ type: 'Reimbursement', amount: '', description: '', receipt: '' });
  const [purchaseForm, setPurchaseForm] = useState({ item_name: '', quantity: 1, estimated_cost: '', purpose: '', department: 'IT' });
  const [wfhForm, setWfhForm] = useState({ log_date: new Date().toISOString().split('T')[0], description: '', attachment: '' });
  const [timeAdjForm, setTimeAdjForm] = useState({ log_date: new Date().toISOString().split('T')[0], time_in: '08:00', time_out: '17:00', ot_hours: 0, reason: '' });

  // Interactive Payslip modal
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const themeColor = branding?.theme_color || '#2563eb';
  const isManager = ['admin', 'super_admin', 'cashier'].includes(user?.role?.toLowerCase());

  const fetchPortalData = async () => {
    setLoading(true);
    try {
      const email = user?.email || user?.username || user?.id || user?.employee_id;
      if (!email) return;

      // 1. Fetch Personal Details
      try {
        const personalRes = await axios.get(`${API_BASE_URL}/employee-portal/personal?email=${email}`);
        if (personalRes.data?.success) {
          setEmployeeInfo(personalRes.data.employee);
        }
      } catch (err) {
        console.error("Error loading personal info:", err);
      }

      // 2. Fetch completed payslips
      try {
        const myPayslipsRes = await axios.get(`${API_BASE_URL}/cashier/payroll/my-payslips?email=${email}`);
        if (myPayslipsRes.data?.success) {
          setPayslips(myPayslipsRes.data.payslips || []);
        }
      } catch (err) {
        console.error("Error loading payslips:", err);
      }

      // 3. Fetch Timesheet DTR Logs
      try {
        const timesheetRes = await axios.get(`${API_BASE_URL}/employee-portal/timesheet?email=${email}&_t=${Date.now()}`);
        if (timesheetRes.data?.success) {
          setTimesheet(timesheetRes.data.logs || []);
        }
      } catch (err) {
        console.error("Error loading timesheet:", err);
      }

      // 4. Fetch Shift Assignment
      try {
        const shiftRes = await axios.get(`${API_BASE_URL}/employee-portal/my-shift?email=${email}`);
        if (shiftRes.data?.success) {
          setEmployeeShift(shiftRes.data.shift);
        }
      } catch (err) {
        console.error("Error loading my shift:", err);
      }

      // 5. Fetch Requests
      try {
        const requestsRes = await axios.get(`${API_BASE_URL}/employee-portal/requests?email=${email}`);
        if (requestsRes.data?.success) {
          setRequests(requestsRes.data.requests || []);
        }
      } catch (err) {
        console.error("Error loading requests:", err);
      }

      // 6. Fetch Approvals (if manager)
      if (isManager) {
        try {
          const approvalsRes = await axios.get(`${API_BASE_URL}/employee-portal/approvals`);
          if (approvalsRes.data?.success) {
            setApprovalsQueue(approvalsRes.data.requests || []);
          }
        } catch (err) {
          console.error("Error loading approvals:", err);
        }
      }

      // 7. Fetch Expenses
      try {
        const expensesRes = await axios.get(`${API_BASE_URL}/employee-portal/expenses?email=${email}`);
        if (expensesRes.data?.success) {
          setExpenses(expensesRes.data.expenses || []);
        }
      } catch (err) {
        console.error("Error loading expenses:", err);
      }

      // 8. Fetch Purchases
      try {
        const purchasesRes = await axios.get(`${API_BASE_URL}/employee-portal/purchases?email=${email}`);
        if (purchasesRes.data?.success) {
          setPurchases(purchasesRes.data.purchases || []);
        }
      } catch (err) {
        console.error("Error loading purchases:", err);
      }

      // 9. Fetch WFH Accomplishments
      try {
        const accomplishmentsRes = await axios.get(`${API_BASE_URL}/employee-portal/accomplishments?email=${email}`);
        if (accomplishmentsRes.data?.success) {
          setAccomplishments(accomplishmentsRes.data.accomplishments || []);
        }
      } catch (err) {
        console.error("Error loading accomplishments:", err);
      }

      // 10. Fetch Notifications
      try {
        const notifsRes = await axios.get(`${API_BASE_URL}/employee-portal/notifications?email=${email}`);
        if (notifsRes.data?.success) {
          setPortalNotifs(notifsRes.data.notifications || []);
          setUnreadNotifsCount(notifsRes.data.unread || 0);
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
      }

    } catch (error) {
      console.error("Error loading employee portal:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [user]);

  // Handle DTR Time Adjustment filing
  const handleTimeAdjustment = async (e) => {
    e.preventDefault();
    try {
      const email = user?.email || user?.username;
      const details = {
        date: timeAdjForm.log_date,
        time_in: timeAdjForm.time_in,
        time_out: timeAdjForm.time_out,
        reason: timeAdjForm.reason
      };

      const requestRes = await axios.post(`${API_BASE_URL}/employee-portal/requests`, {
        email,
        request_type: 'Time Adjustment',
        details: {
          request_date: new Date().toISOString().split('T')[0],
          notes: timeAdjForm.reason,
          entries: [{
            type: 'Time Adjustment',
            dateFrom: timeAdjForm.log_date,
            dateTo: timeAdjForm.log_date,
            timeFrom: timeAdjForm.time_in,
            timeTo: timeAdjForm.time_out,
            nextDay: false,
            reason: timeAdjForm.reason,
            charging: employeeInfo?.department || 'Admin'
          }]
        }
      });

      if (requestRes.data?.success) {
        showToast("Time adjustment request submitted! It will show up on your DTR once approved.", "success");
        setTimeAdjForm({ log_date: new Date().toISOString().split('T')[0], time_in: '08:00', time_out: '17:00', ot_hours: 0, reason: '' });
        fetchPortalData();
      } else {
        showToast(requestRes.data?.message || "Failed to submit time adjustment.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error submitting time adjustment request.", "error");
    }
  };

  // Handle WFH Accomplishment log
  const handleWfhAccomplishment = async (e) => {
    e.preventDefault();
    try {
      const email = user?.email || user?.username;
      const res = await axios.post(`${API_BASE_URL}/employee-portal/accomplishments`, {
        email,
        log_date: wfhForm.log_date,
        description: wfhForm.description,
        attachment: wfhForm.attachment
      });
      if (res.data?.success) {
        alert("Daily accomplishments logged successfully!");
        setWfhForm({ log_date: new Date().toISOString().split('T')[0], description: '', attachment: '' });
        fetchPortalData();
      }
    } catch (e) { console.error(e); }
  };

  // Handle expense filing
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const email = user?.email || user?.username;
      const res = await axios.post(`${API_BASE_URL}/employee-portal/expenses`, {
        email,
        expense_type: expenseForm.type,
        amount: expenseForm.amount,
        description: expenseForm.description,
        receipt_attachment: expenseForm.receipt
      });
      if (res.data?.success) {
        alert("Expense reimbursement filed!");
        setExpenseForm({ type: 'Reimbursement', amount: '', description: '', receipt: '' });
        fetchPortalData();
      }
    } catch (e) { console.error(e); }
  };

  // Handle purchase filing
  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    try {
      const email = user?.email || user?.username;
      const res = await axios.post(`${API_BASE_URL}/employee-portal/purchases`, {
        email,
        item_name: purchaseForm.item_name,
        quantity: purchaseForm.quantity,
        estimated_cost: purchaseForm.estimated_cost,
        purpose: purchaseForm.purpose,
        department: purchaseForm.department
      });
      if (res.data?.success) {
        alert("Purchase request created!");
        setPurchaseForm({ item_name: '', quantity: 1, estimated_cost: '', purpose: '', department: 'IT' });
        fetchPortalData();
      }
    } catch (e) { console.error(e); }
  };

  // Handle approval action (HR/Admin)
  const handleApprovalAction = async (requestId, status) => {
    try {
      const remarks = approvalRemarks[requestId] || '';
      const res = await axios.post(`${API_BASE_URL}/employee-portal/approvals/status`, {
        id: requestId,
        status,
        remarks,
        approved_by_email: user?.email || user?.username
      });
      if (res.data?.success) {
        alert(`Request ${status.toLowerCase()} successfully.`);
        // If approved and it has DTR values, we sync the employee DTR log
        if (status === 'Approved') {
          const req = approvalsQueue.find(r => r.id === requestId);
          if (req) {
            let parsedDetails = {};
            try {
              parsedDetails = typeof req.details === 'string' ? JSON.parse(req.details) : req.details;
            } catch(e) {}

            const firstEntry = parsedDetails.entries?.[0];
            if (firstEntry && (req.request_type === 'Time Adjustment' || req.request_type === 'Overtime')) {
              await axios.post(`${API_BASE_URL}/employee-portal/timelog`, {
                email: req.email || user?.email || user?.username,
                log_date: firstEntry.dateFrom || new Date().toISOString().split('T')[0],
                time_in: firstEntry.timeFrom || '08:00',
                time_out: firstEntry.timeTo || '17:00',
                ot_hours: req.request_type === 'Overtime' ? parseFloat(firstEntry.total_hours || 0) : 0,
                status: 'On Time'
              });
            }
          }
        }
        fetchPortalData();
      }
    } catch (e) { console.error(e); }
  };

  // Mark notification read
  const handleMarkNotifRead = async (id) => {
    try {
      await axios.post(`${API_BASE_URL}/employee-portal/notifications/read`, { notification_id: id });
      fetchPortalData();
    } catch (e) { console.error(e); }
  };

  const getExitPath = () => {
    if (user?.role === 'teacher') return '/teacher/dashboard';
    if (user?.role === 'cashier') return '/cashier/dashboard';
    return `/${user?.role}/dashboard`;
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center font-black animate-pulse text-slate-400 uppercase tracking-widest gap-4 bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" style={{ color: themeColor }} size={40} />
        Entering Personal Employee Portal...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 relative font-sans overflow-hidden">
      
      {/* FIXED TOP FLOATING TOAST BANNER */}
      {toast.show && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3 text-sm font-black tracking-tight animate-in slide-in-from-top-6 duration-300 backdrop-blur-md ${
          toast.type === 'success' ? 'bg-slate-900/95 text-emerald-400 border-emerald-500/30 shadow-slate-900/20' : 'bg-slate-900/95 text-rose-400 border-rose-500/30 shadow-slate-900/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={20} className="text-emerald-400" /> : <AlertCircle size={20} className="text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
        />
      )}

      {/* 1. PORTAL SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 lg:relative ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 bg-slate-900 text-slate-300 flex flex-col h-full shadow-2xl shrink-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-all duration-300 ease-in-out`}>
        {/* FLOATING SIDEBAR TOGGLE BUTTON */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3.5 top-6 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-50 hover:scale-110 hover:border-blue-300 transition-all z-50 cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* HEADER */}
        <div className={`h-20 border-b border-slate-800 flex items-center shrink-0 ${isCollapsed ? 'justify-center px-2' : 'px-5'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-900/40 border border-blue-400/20" style={{ backgroundColor: themeColor }}>
              <Banknote size={22} className="text-white" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <h3 className="text-sm font-black text-white leading-tight tracking-wide">Employee Portal</h3>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Payroll & Service</p>
              </div>
            )}
          </div>
        </div>

        {/* NAVIGATION ITEMS */}
        <nav className="flex-1 py-6 px-2.5 space-y-2 overflow-y-auto">
          {[
            { id: 'Personal', label: 'My Personal Tab', icon: <User size={20} /> },
            { id: 'Timesheet', label: 'DTR & Timesheet', icon: <Calendar size={20} /> },
            { id: 'Payslips', label: 'Payslip History', icon: <CreditCard size={20} /> },
            { id: 'Filing', label: 'File A Request', icon: <Clipboard size={20} /> },
            { id: 'Approvals', label: isManager ? 'Approvals Queue' : 'My Approvals', icon: <CheckSquare size={20} /> },
            { id: 'Finance', label: 'Expenses & Purchases', icon: <Wallet size={20} /> },
            { id: 'WFH', label: 'Accomplishments', icon: <Award size={20} /> }
          ].map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                title={item.label}
                className={`transition-all duration-200 font-bold text-sm flex items-center ${
                  isCollapsed 
                    ? 'w-12 h-12 rounded-2xl mx-auto justify-center' 
                    : 'w-full p-3 gap-3 rounded-2xl justify-start'
                } ${
                  isActive 
                    ? 'text-white shadow-lg shadow-blue-500/20 scale-[1.02]' 
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white hover:scale-[1.02]'
                }`}
                style={isActive ? { backgroundColor: themeColor } : {}}
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <button
            onClick={() => navigate(getExitPath())}
            title="Return to Campus"
            className={`transition-all duration-200 font-bold text-sm flex items-center ${
              isCollapsed 
                ? 'w-12 h-12 rounded-2xl mx-auto justify-center text-slate-450 hover:bg-slate-800 hover:text-white' 
                : 'w-full p-3 gap-3 rounded-2xl justify-start text-slate-450 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ArrowLeft size={20} className="shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">Return to Campus</span>}
          </button>
        </div>
      </aside>

      {/* 2. PORTAL CONTENT WRAPPER */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto z-10 bg-slate-50">
        
        {/* HEADER BAR */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-10 sticky top-0 z-30 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-550 hover:text-slate-850 lg:hidden rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Menu size={22} />
            </button>
            <h2 className="text-slate-850 font-black text-lg sm:text-xl capitalize shrink-0">{activeTab} Workspaces</h2>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 hidden xs:inline-block">
              Employee Portal Active
            </span>
            {employeeShift && (
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 hidden md:inline-block">
                Shift: {employeeShift.time_in} - {employeeShift.time_out}
              </span>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* PORTAL NOTIFICATIONS BRIEF */}
            <div className="relative">
              <span className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all shrink-0 cursor-pointer block relative">
                <Bell size={20} />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                    {unreadNotifsCount}
                  </span>
                )}
              </span>
            </div>

            {/* PROFILE BRIEF */}
            <div className="flex items-center space-x-3 cursor-pointer shrink-0">
              <div className="text-right">
                <p className="text-sm font-black text-slate-800 leading-tight">{user?.full_name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-450">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-2xl overflow-hidden shadow-sm border-2 border-white ring-1 ring-slate-100 shrink-0 flex items-center justify-center font-black text-slate-450">
                {user?.profile_image ? (
                  <img src={`${API_BASE_URL}/uploads/profiles/${user.profile_image}`} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  user?.full_name?.charAt(0)
                )}
              </div>
            </div>
          </div>
        </header>

        {/* COMPONENT BODY RENDER */}
        <div className="p-4 sm:p-10 max-w-7xl mx-auto w-full">
          {activeTab === 'Personal' && (
            <PersonalTab 
              employeeInfo={employeeInfo}
              portalNotifs={portalNotifs}
              unreadNotifsCount={unreadNotifsCount}
              handleMarkNotifRead={handleMarkNotifRead}
              themeColor={themeColor}
              API_BASE_URL={API_BASE_URL}
            />
          )}

          {activeTab === 'Timesheet' && (
            <TimesheetTab 
              timesheet={timesheet}
              timeAdjForm={timeAdjForm}
              setTimeAdjForm={setTimeAdjForm}
              handleTimeAdjustment={handleTimeAdjustment}
              themeColor={themeColor}
              employeeShift={employeeShift}
              onRefresh={fetchPortalData}
            />
          )}

          {activeTab === 'Payslips' && (
            <PayslipsTab 
              payslips={payslips}
              selectedPayslip={selectedPayslip}
              setSelectedPayslip={setSelectedPayslip}
              employeeInfo={employeeInfo}
              branding={branding}
              themeColor={themeColor}
            />
          )}

          {activeTab === 'Filing' && (
            <FilingTab 
              requests={requests}
              fetchPortalData={fetchPortalData}
              themeColor={themeColor}
              API_BASE_URL={API_BASE_URL}
              user={user}
            />
          )}

          {activeTab === 'Approvals' && (
            <ApprovalsTab 
              isManager={isManager}
              approvalsQueue={approvalsQueue}
              requests={requests}
              approvalRemarks={approvalRemarks}
              setApprovalRemarks={setApprovalRemarks}
              handleApprovalAction={handleApprovalAction}
            />
          )}

          {activeTab === 'Finance' && (
            <FinanceTab 
              expenseForm={expenseForm}
              setExpenseForm={setExpenseForm}
              handleExpenseSubmit={handleExpenseSubmit}
              expenses={expenses}
              purchaseForm={purchaseForm}
              setPurchaseForm={setPurchaseForm}
              handlePurchaseSubmit={handlePurchaseSubmit}
              purchases={purchases}
              themeColor={themeColor}
            />
          )}

          {activeTab === 'WFH' && (
            <WfhTab 
              wfhForm={wfhForm}
              setWfhForm={setWfhForm}
              handleWfhAccomplishment={handleWfhAccomplishment}
              accomplishments={accomplishments}
              themeColor={themeColor}
            />
          )}
        </div>

      </main>

    </div>
  );
};

export default EmployeePortal;
