import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Calendar, CreditCard, Clipboard, CheckSquare, 
  Wallet, Award, Bell, ArrowLeft, Loader2, X
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

  const themeColor = branding?.theme_color || '#2563eb';
  const isManager = ['hr', 'admin', 'super_admin', 'cashier'].includes(user?.role?.toLowerCase());

  const fetchPortalData = async () => {
    setLoading(true);
    try {
      const email = user?.email;
      if (!email) return;

      // 1. Fetch Personal Details
      const personalRes = await axios.get(`${API_BASE_URL}/employee-portal/personal?email=${email}`);
      if (personalRes.data?.success) {
        setEmployeeInfo(personalRes.data.employee);
        
        // 2. Fetch completed payslips for this employee
        const myPayslipsRes = await axios.get(`${API_BASE_URL}/cashier/payroll/my-payslips?email=${email}`);
        if (myPayslipsRes.data?.success) {
          setPayslips(myPayslipsRes.data.payslips || []);
        }
      }

      // 3. Fetch Timesheet DTR Logs
      const timesheetRes = await axios.get(`${API_BASE_URL}/employee-portal/timesheet?email=${email}`);
      if (timesheetRes.data?.success) {
        setTimesheet(timesheetRes.data.logs || []);
      }

      // 4. Fetch requests
      const requestsRes = await axios.get(`${API_BASE_URL}/employee-portal/requests?email=${email}`);
      if (requestsRes.data?.success) {
        setRequests(requestsRes.data.requests || []);
      }

      // 5. Fetch approvals (if admin/manager)
      if (isManager) {
        const approvalsRes = await axios.get(`${API_BASE_URL}/employee-portal/approvals`);
        if (approvalsRes.data?.success) {
          setApprovalsQueue(approvalsRes.data.requests || []);
        }
      }

      // 6. Fetch Expenses
      const expensesRes = await axios.get(`${API_BASE_URL}/employee-portal/expenses?email=${email}`);
      if (expensesRes.data?.success) {
        setExpenses(expensesRes.data.expenses || []);
      }

      // 7. Fetch Purchases
      const purchasesRes = await axios.get(`${API_BASE_URL}/employee-portal/purchases?email=${email}`);
      if (purchasesRes.data?.success) {
        setPurchases(purchasesRes.data.purchases || []);
      }

      // 8. Fetch WFH accomplishments
      const accomplishmentsRes = await axios.get(`${API_BASE_URL}/employee-portal/accomplishments?email=${email}`);
      if (accomplishmentsRes.data?.success) {
        setAccomplishments(accomplishmentsRes.data.accomplishments || []);
      }

      // 9. Fetch Notifications
      const notifsRes = await axios.get(`${API_BASE_URL}/employee-portal/notifications?email=${email}`);
      if (notifsRes.data?.success) {
        setPortalNotifs(notifsRes.data.notifications || []);
        setUnreadNotifsCount(notifsRes.data.unread || 0);
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
      const email = user?.email;
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
        alert("Time adjustment request submitted! It will show up on your DTR once approved.");
        setTimeAdjForm({ log_date: new Date().toISOString().split('T')[0], time_in: '08:00', time_out: '17:00', ot_hours: 0, reason: '' });
        fetchPortalData();
      }
    } catch (e) { console.error(e); }
  };

  // Handle WFH Accomplishment log
  const handleWfhAccomplishment = async (e) => {
    e.preventDefault();
    try {
      const email = user?.email;
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
      const email = user?.email;
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
      const email = user?.email;
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
        approved_by_email: user?.email
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
                email: req.email || user?.email,
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
      
      {/* 1. PORTAL SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full overflow-hidden shadow-2xl shrink-0">
        <div className="h-20 px-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shrink-0 shadow-lg" style={{ backgroundColor: themeColor }}>
            EP
          </div>
          <div>
            <h3 className="text-sm font-black text-white leading-tight">Employee Portal</h3>
            <p className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Payroll & Service</p>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {[
            { id: 'Personal', label: 'My Personal Tab', icon: <User size={18} /> },
            { id: 'Timesheet', label: 'DTR & Timesheet', icon: <Calendar size={18} /> },
            { id: 'Payslips', label: 'Payslip History', icon: <CreditCard size={18} /> },
            { id: 'Filing', label: 'File A Request', icon: <Clipboard size={18} /> },
            { id: 'Approvals', label: isManager ? 'Approvals Queue' : 'My Approvals', icon: <CheckSquare size={18} /> },
            { id: 'Finance', label: 'Expenses & Purchases', icon: <Wallet size={18} /> },
            { id: 'WFH', label: 'Accomplishments', icon: <Award size={18} /> }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3 rounded-2xl transition-all font-bold text-sm ${
                activeTab === item.id 
                  ? 'text-white shadow-lg shadow-blue-500/10' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              style={activeTab === item.id ? { backgroundColor: themeColor } : {}}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button
            onClick={() => navigate(getExitPath())}
            className="flex items-center p-3 rounded-2xl hover:bg-slate-800 text-slate-450 hover:text-white w-full transition-all gap-3"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-bold">Return to Campus</span>
          </button>
        </div>
      </aside>

      {/* 2. PORTAL CONTENT WRAPPER */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto z-10 bg-slate-50">
        
        {/* HEADER BAR */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-30 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-slate-850 font-black text-xl capitalize">{activeTab} Workspaces</h2>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0">
              Employee Portal Active
            </span>
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
        <div className="p-10 max-w-7xl mx-auto w-full">
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
