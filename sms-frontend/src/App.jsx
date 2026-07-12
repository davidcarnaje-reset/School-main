import React from 'react';
// React Required Libraries
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Account Auth
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/routing/ProtectedRoute';
import PublicRoute from './components/routing/PublicRoute';
import SetupPassword from './pages/auth/SetupPassword'; 
import ForgotPassword from './pages/auth/ForgotPassword'; 
import ResetPassword from './pages/auth/ResetPassword';

// ==========================================
// REGISTRAR PAGES
// ==========================================
import RegistrarDashboard from './pages/registrar/RegistrarDashboard';
import StudentManagement from './pages/registrar/StudentManagement';
import EnrollmentModule from './pages/registrar/EnrollmentModule';   
import TeacherAssignments from './pages/registrar/ClassAssignments';
import StudentRequests from './pages/registrar/StudentRequests';
import AcademicPrograms from './pages/registrar/AcademicPrograms';
import ScholarshipApplications from './pages/registrar/ScholarshipApplications';
import RegistrarSubjects from './pages/registrar/RegistrarSubjects';
import SectionManagement from './pages/registrar/SectionManagement';
import StudentGradesView from './pages/registrar/StudentGradesView';

// ==========================================
// STUDENT PAGES
// ==========================================
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAccounting from './pages/student/StudentAccounting';
import StudentLms from './pages/student/StudentLms';
import StudentScholarship from './pages/student/StudentScholarship';

// ==========================================
// LMS PAGES (BAGO)
// ==========================================
import LmsDashboard from './pages/lms/LmsDashboard';
import StudentGrades from './pages/student/StudentGrades';
import LmsSchedule from './pages/lms/LmsSchedule';
import LmsCourses from './pages/lms/LmsCourses';
import LmsSingleSubject from './pages/lms/LmsSingleSubject';
import LmsProfile from './pages/lms/LmsProfile';
import LmsTakeExam from './pages/lms/LmsTakeExam';
import ProfileOverview from './components/lms/ProfileOverview';
import ProfileMessages from './components/lms/ProfileMessages';
import ProfilePerformance from './components/lms/ProfilePerformance';
import ProfileSettings from './components/lms/ProfileSettings';
// ==========================================
// CASHIER PAGES
// ==========================================
import PaymentDashboard from './pages/cashier/PaymentDashboard';
import CashierDashboard from './pages/cashier/CashierDashboard';
import StudentBilling from './pages/cashier/StudentBilling';
import FeeCatalog from './pages/cashier/FeeCatalog';
import Scholarships from './pages/cashier/Scholarships';
import CollectionReports from './pages/cashier/CollectionReports';
import ScholarshipCatalog from './pages/cashier/ScholarshipCatalog';
import Payroll from './pages/cashier/Payroll';

// ==========================================
// TEACHER PAGES
// ==========================================
import TeacherDashboard from './pages/teacher/teacherdashboard';
import TeacherNotify from './pages/teacher/TeacherNotify'; 
import TeacherProfile from './pages/teacher/TeacherProfile';
import TeacherClasses from './pages/teacher/TeacherClasses';
import GradeManagement from './pages/teacher/GradeManagement';
import TeacherDTR from './pages/teacher/TeacherDTR';
import TeacherActivities from './pages/teacher/TeacherActivities';
import TeacherActivityGrading from './pages/teacher/TeacherActivityGrading';
import CreateExam from './components/shared/CreateExam';

// ==========================================
// LAYOUTS (Pansinin: Idinagdag ko rito ang LmsLayout)
// ==========================================
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';
import TeacherLayout from './layouts/TeacherLayout';
import LmsLayout from './layouts/LmsLayout'; // <--- ETO ANG NAWAWALA KANINA

// Pages
import LandingPage from './pages/landingpage'; 
import Login from './pages/auth/Login';

// Admin Pages
import UserManagement from './pages/admin/UserManagement';
import BrandingSettings from './pages/admin/BrandingSettings';
import RoomManagement from './pages/admin/RoomManagement';
import CashierLayout from './layouts/CashierLayout';
import LandingPromotions from './pages/admin/LandingPromotions';
import SchoolManagement from './pages/admin/SchoolManagement';


// Placeholder Components
const AdminDashboard = () => (
  <div className="p-10">
    <h1 className="text-3xl font-bold text-blue-600 tracking-tight">Admin Dashboard</h1>
    <p className="mt-2 text-slate-600 font-medium">Welcome to the Command Center.</p>
  </div>
);

const HrDashboard = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-100/50">
      <h1 className="text-3xl font-black tracking-tight leading-none">HR Command Center</h1>
      <p className="mt-2 text-blue-100 font-medium text-sm">Pamahalaan ang mga empleyado, payroll structures, at daily time records (DTR).</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-40">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Employees</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">42</h3>
        </div>
        <p className="text-xs text-emerald-500 font-bold">● 38 Active today</p>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-40">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending DTR Leaves</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">3</h3>
        </div>
        <p className="text-xs text-blue-500 font-bold">Requires your approval</p>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-40">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Payroll Batch</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">July 15</h3>
        </div>
        <p className="text-xs text-slate-500 font-bold">Status: Processing</p>
      </div>
    </div>
  </div>
);

const HrEmployees = () => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Employee Directory</h2>
      <p className="text-slate-400 text-sm font-medium">Listahan at pamamahala ng mga faculty at non-teaching staff.</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <th className="py-4">Name</th>
            <th className="py-4">Department</th>
            <th className="py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-700">
          <tr>
            <td className="py-4">Jackie Mendoza</td>
            <td className="py-4">Registrar's Office</td>
            <td className="py-4"><span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">Active</span></td>
          </tr>
          <tr>
            <td className="py-4">Julliana Santos</td>
            <td className="py-4">Academic Faculty</td>
            <td className="py-4"><span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">Active</span></td>
          </tr>
          <tr>
            <td className="py-4">Myoui Mina</td>
            <td className="py-4">Finance / Cashier</td>
            <td className="py-4"><span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">Active</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const HrPayroll = () => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Payroll Management</h2>
      <p className="text-slate-400 text-sm font-medium">Pamamahala ng sahod, tax deductions, at payslips.</p>
    </div>
    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-200 text-center">
      <p className="text-slate-500 font-medium">Ang payroll system ay aktibo. Maaari ka nang mag-generate ng payslips para sa darating na kinsenas.</p>
      <button className="mt-4 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:scale-105 transition-all text-xs uppercase tracking-wider">Generate Payslips</button>
    </div>
  </div>
);

const HrAttendance = () => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Attendance & DTR</h2>
      <p className="text-slate-400 text-sm font-medium">Daily Time Record tracking at mga kahilingan sa leave.</p>
    </div>
    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-200 text-center">
      <p className="text-slate-500 font-medium">Walang pending na time correction requests sa ngayon.</p>
    </div>
  </div>
);

// IT Portal Placeholder Components
const ItDashboard = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="bg-gradient-to-r from-slate-800 to-slate-950 rounded-[2rem] p-8 text-white shadow-xl">
      <h1 className="text-3xl font-black tracking-tight leading-none">IT Admin Command Center</h1>
      <p className="mt-2 text-slate-300 font-medium text-sm">Monitor network infrastructure, configure security protocols, and review tech tickets.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-40">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Server Health</p>
          <h3 className="text-2xl font-black text-emerald-500 mt-1">99.98%</h3>
        </div>
        <p className="text-xs text-slate-500 font-bold">All nodes operational</p>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-40">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Alerts</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">0</h3>
        </div>
        <p className="text-xs text-emerald-500 font-bold">No breaches detected</p>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-40">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open Tickets</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">2</h3>
        </div>
        <p className="text-xs text-blue-500 font-bold">Assign to technician</p>
      </div>
    </div>
  </div>
);

const ItInfrastructure = () => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">System & Servers Configuration</h2>
      <p className="text-slate-400 text-sm font-medium">Manage deployment variables and database replication health.</p>
    </div>
    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-200">
      <p className="text-slate-600 font-medium text-sm">Database Uptime: <strong className="text-emerald-600">32 days</strong></p>
      <p className="text-slate-600 font-medium text-sm mt-2">Active Server Nodes: <strong>3 Nodes (Load Balanced)</strong></p>
    </div>
  </div>
);

const ItSecurity = () => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Security & Audit Logs</h2>
      <p className="text-slate-400 text-sm font-medium">Inspect authentication sheets and detect anomalies.</p>
    </div>
    <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-200">
      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">Recent Logs</p>
      <ul className="text-xs space-y-2 text-slate-600 font-semibold font-mono">
        <li>[00:15:32] USER "admin" logged in from 192.168.1.1</li>
        <li>[23:45:01] BACKUP task triggered successfully</li>
      </ul>
    </div>
  </div>
);

const ItSupport = () => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tech Support Tickets</h2>
      <p className="text-slate-400 text-sm font-medium">Resolve campus IT concerns and staff requests.</p>
    </div>
    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-200 text-center text-slate-500 font-medium text-sm">
      Walang pending na technical tickets sa kasalukuyan.
    </div>
  </div>
);

// School Admin Portal Placeholder Components
const SchoolAdminDashboard = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-[2rem] p-8 text-white shadow-xl shadow-teal-100/50">
      <h1 className="text-3xl font-black tracking-tight leading-none">School Operations Panel</h1>
      <p className="mt-2 text-teal-100 font-medium text-sm">Manage utility payments, service vendor contracts, and physical school facilities.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-40">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Electricity Bill (Current Month)</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">₱18,450.00</h3>
        </div>
        <p className="text-xs text-amber-500 font-bold">Due in 5 days</p>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-40">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Vendor Contracts</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">4 Vendors</h3>
        </div>
        <p className="text-xs text-slate-500 font-bold">All contracts active</p>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-40">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Facility Repair Logs</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">1 Pending</h3>
        </div>
        <p className="text-xs text-blue-500 font-bold">Assigned to Custodian</p>
      </div>
    </div>
  </div>
);

const SchoolAdminUtilities = () => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Utility Bills & Invoices</h2>
      <p className="text-slate-400 text-sm font-medium">Record electricity, water, internet, and maintenance invoices.</p>
    </div>
    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-200 text-center text-slate-500 font-medium text-sm">
      Wala pang natatanggap na bagong bill statement para sa linggong ito.
    </div>
  </div>
);

const SchoolAdminContracts = () => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Vendor & Third-Party Service Contracts</h2>
      <p className="text-slate-400 text-sm font-medium">Monitor partnerships with security providers, internet lines, and cleaning agencies.</p>
    </div>
    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-200 text-center text-slate-500 font-medium text-sm">
      Lahat ng kasunduan (Contracts) ay kasalukuyang sumusunod sa itinakdang schedule.
    </div>
  </div>
);

const SchoolAdminFacilities = () => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Physical Facilities Coordination</h2>
      <p className="text-slate-400 text-sm font-medium">Assign cleaning requests, building maintenance, and classroom upgrades.</p>
    </div>
    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-200 text-center text-slate-500 font-medium text-sm">
      Lahat ng pasilidad ng school ay ligtas at maayos.
    </div>
  </div>
);

// Custodian Portal Placeholder Components
const CustodianDashboard = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-[2rem] p-8 text-white shadow-xl shadow-amber-100/50">
      <h1 className="text-3xl font-black tracking-tight leading-none">Property Custodian Board</h1>
      <p className="mt-2 text-amber-100 font-medium text-sm">Track equipment inventory, supplies list, and handle room keys configurations.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-40">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Asset Value</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">2,450 Items</h3>
        </div>
        <p className="text-xs text-emerald-500 font-bold">100% Accounted for</p>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-40">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Low Stock Supplies</p>
          <h3 className="text-2xl font-black text-red-500 mt-1">4 Warnings</h3>
        </div>
        <p className="text-xs text-slate-500 font-bold">Whiteboard markers, paper sheets</p>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-40">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open Key Requests</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">0 Requests</h3>
        </div>
        <p className="text-xs text-slate-500 font-bold">All keys returned</p>
      </div>
    </div>
  </div>
);

const CustodianInventory = () => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Supplies & Equipment Inventory</h2>
      <p className="text-slate-400 text-sm font-medium">Record laboratory kits, computer setups, desks, and supplies logistics.</p>
    </div>
    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-200 text-center text-slate-500 font-medium text-sm">
      Wala pang bagong natatanggap na procurement materials ngayon.
    </div>
  </div>
);

const CustodianMaintenance = () => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Asset Damage & Maintenance Coordination</h2>
      <p className="text-slate-400 text-sm font-medium">Manage aircon repairs, structural fixes, and damage reports.</p>
    </div>
    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-200 text-center text-slate-500 font-medium text-sm">
      Lahat ng gamit sa campus ay kasalukuyang ligtas at operational.
    </div>
  </div>
);

const CustodianAssets = () => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Classroom Assets & Key Assignments</h2>
      <p className="text-slate-400 text-sm font-medium">Monitor room supplies distribution and building lock logs.</p>
    </div>
    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-200 text-center text-slate-500 font-medium text-sm">
      Lahat ng classroom assets ay accounted for.
    </div>
  </div>
);

const Unauthorized = () => (
  <div className="h-screen flex flex-col items-center justify-center p-10 text-center bg-slate-50">
    <h1 className="text-6xl font-black text-slate-200 mb-4">403</h1>
    <h2 className="text-2xl font-bold text-red-600 mb-2">Unauthorized Access</h2>
    <p className="text-slate-500 mb-6">Wala kang permiso na makita ang page na ito.</p>
    <a href="/" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-200">Balik sa Home</a>
  </div>
);


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 1. THE FRONT DOOR (Default Page) */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          
          {/* 2. AUTHENTICATION ROUTES */}
          <Route path="/login" element={<PublicRoute><Login portal="student" /></PublicRoute>} />
          <Route path="/staff/login" element={<PublicRoute><Login portal="staff" /></PublicRoute>} />
          <Route path="/portal/admin-access" element={<PublicRoute><Login portal="admin" /></PublicRoute>} />

          {/* ACCOUNT SETUP ROUTE (Public) */}
          <Route path="/setup-password" element={<PublicRoute><SetupPassword /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* 3. ADMIN ROUTES */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="branding" element={<BrandingSettings />} />
            <Route path="rooms" element={<RoomManagement />} />
            <Route path="promotions" element={<LandingPromotions />} />
            <Route path="schools" element={<SchoolManagement />} />
          </Route>

          {/* 4. CASHIER ROUTES */}
          <Route path="/cashier" element={
            <ProtectedRoute allowedRoles={['cashier']}>
              <CashierLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CashierDashboard />} />
            <Route path="billing" element={<StudentBilling />} />    
            <Route path="payments" element={<PaymentDashboard />} />
            <Route path="fees" element={<FeeCatalog />} />
            <Route path="scholarships" element={<Scholarships />} />  
            <Route path="scholarship-catalog" element={<ScholarshipCatalog />} />
            <Route path="reports" element={<CollectionReports />} />  
            <Route path="payroll" element={<Payroll />} />
          </Route>

          {/* 5. LMS / TEACHER ROUTES */}
          <Route path="/teacher" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="announcements" element={<TeacherNotify />} />
            <Route path="classes" element={<TeacherClasses />} />
            <Route path="dtr" element={<TeacherDTR />} />
            <Route path="profile" element={<TeacherProfile />} />
            <Route path="/teacher/sections/:classId" element={<GradeManagement />} />
            <Route path="/teacher/grades/:classId" element={<GradeManagement />} />
            <Route path="activities" element={<TeacherActivities />} />
            <Route path="activities/:classId" element={<TeacherActivities />} />
            <Route path="/teacher/activities/create-exam" element={<CreateExam />} />
          <Route path="activities/:activityId/grading" element={<TeacherActivityGrading />} />
          </Route>

          {/* =======================================================
              6. STUDENT PORTAL ROUTES (Lobby)
              ======================================================= */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout/>
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="lms" element={<StudentLms />} />
            <Route path="accounting" element={<StudentAccounting />} />
            <Route path="scholarship" element={<StudentScholarship />} />
            <Route path="grades" element={<StudentGrades />} /> 
          </Route>


          {/* =======================================================
              7. REGISTRAR ROUTES
              ======================================================= */}
          <Route path="/registrar" element={
            <ProtectedRoute allowedRoles={['registrar']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<RegistrarDashboard />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="requests" element={<StudentRequests />} />
            <Route path="enrollment" element={<EnrollmentModule />} />
            <Route path="programs" element={<AcademicPrograms />} />
            <Route path="assignments" element={<TeacherAssignments />} />
            <Route path="scholarships" element={<ScholarshipApplications />} />
            <Route path="subjects" element={<RegistrarSubjects />} />
            <Route path="sections" element={<SectionManagement />} />
            <Route path="grades" element={<StudentGradesView />} />
          </Route>

          {/* =======================================================
              7.5. HR ROUTES
              ======================================================= */}
          <Route path="/hr" element={
            <ProtectedRoute allowedRoles={['hr']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HrDashboard />} />
            <Route path="employees" element={<HrEmployees />} />
            <Route path="payroll" element={<HrPayroll />} />
            <Route path="attendance" element={<HrAttendance />} />
          </Route>

          {/* =======================================================
              7.6. IT PORTAL ROUTES
              ======================================================= */}
          <Route path="/it" element={
            <ProtectedRoute allowedRoles={['it']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ItDashboard />} />
            <Route path="infrastructure" element={<ItInfrastructure />} />
            <Route path="security" element={<ItSecurity />} />
            <Route path="support" element={<ItSupport />} />
          </Route>

          {/* =======================================================
              7.7. SCHOOL ADMIN OPERATIONS ROUTES
              ======================================================= */}
          <Route path="/school-admin" element={
            <ProtectedRoute allowedRoles={['school_admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SchoolAdminDashboard />} />
            <Route path="utilities" element={<SchoolAdminUtilities />} />
            <Route path="contracts" element={<SchoolAdminContracts />} />
            <Route path="facilities" element={<SchoolAdminFacilities />} />
          </Route>

          {/* =======================================================
              7.8. CUSTODIAN OPERATIONS ROUTES
              ======================================================= */}
          <Route path="/custodian" element={
            <ProtectedRoute allowedRoles={['custodian']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CustodianDashboard />} />
            <Route path="inventory" element={<CustodianInventory />} />
            <Route path="maintenance" element={<CustodianMaintenance />} />
            <Route path="assets" element={<CustodianAssets />} />
          </Route>

          {/* =======================================================
              8. DIGITAL CLASSROOM (LMS) ROUTES
          ======================================================= */}
          <Route path="/lms" element={
            <ProtectedRoute allowedRoles={['student']}>
              <LmsLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<LmsDashboard />} />
            <Route path="calendar" element={<LmsSchedule />} />
            <Route path="courses" element={<LmsCourses />} />
            <Route path="course/:id" element={<LmsSingleSubject />} />

            {/* ARCHITECT FIX: Isang 'profile' route lang dapat na may children inside */}
            <Route path="profile" element={<LmsProfile />}>
              <Route index element={<ProfileOverview />} /> 
              <Route path="overview" element={<ProfileOverview />} />
              <Route path="messages" element={<ProfileMessages />} />
              {/* Dito mo na rin pwedeng idagdag yung iba pang tabs sa susunod */}
              <Route path="performance" element={<ProfilePerformance />} />
              <Route path="settings" element={<ProfileSettings />} />
            </Route>
          </Route>

          {/* 9. LMS Exam Route */}
          <Route path="/lms/exam/:activityId" element={
            <ProtectedRoute allowedRoles={['student']}>
              <LmsTakeExam />
            </ProtectedRoute>
          } />

          {/* 10. FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;