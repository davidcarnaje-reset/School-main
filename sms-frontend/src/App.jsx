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
import SchoolSetup from './pages/admin/SchoolSetup';
import CashierLayout from './layouts/CashierLayout';
import LandingPromotions from './pages/admin/LandingPromotions';
import SchoolManagement from './pages/admin/SchoolManagement';
import SchoolPermissions from './pages/admin/SchoolPermissions';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

// IT Pages
import ItDashboard from './pages/it/ItDashboard';
import ItHelpDesk from './pages/it/ItHelpDesk';
import ItInventory from './pages/it/ItInventory';
import ItBorrowing from './pages/it/ItBorrowing';
import ItMaintenance from './pages/it/ItMaintenance';
import ItSoftware from './pages/it/ItSoftware';
import ItNetwork from './pages/it/ItNetwork';
import ItUserSupport from './pages/it/ItUserSupport';
import ItAnnouncements from './pages/it/ItAnnouncements';
import ItReports from './pages/it/ItReports';
import ItAuditLogs from './pages/it/ItAuditLogs';

// HR Pages
import HrDashboard from './pages/hr/HrDashboard';
import HrEmployees from './pages/hr/HrEmployees';
import HrOnboarding from './pages/hr/HrOnboarding';
import HrAttendance from './pages/hr/HrAttendance';
import HrLeave from './pages/hr/HrLeave';
import HrPayrollSupport from './pages/hr/HrPayrollSupport';
import HrPerformance from './pages/hr/HrPerformance';
import HrTraining from './pages/hr/HrTraining';
import HrDocuments from './pages/hr/HrDocuments';
import HrDisciplinary from './pages/hr/HrDisciplinary';
import HrClearance from './pages/hr/HrClearance';
import HrBenefits from './pages/hr/HrBenefits';
import HrReports from './pages/hr/HrReports';

// Custodian Pages
import CustodianDashboard from './pages/custodian/CustodianDashboard';
import CustodianInventory from './pages/custodian/CustodianInventory';
import CustodianBorrowing from './pages/custodian/CustodianBorrowing';
import CustodianReservations from './pages/custodian/CustodianReservations';
import CustodianMaintenance from './pages/custodian/CustodianMaintenance';
import CustodianPreventive from './pages/custodian/CustodianPreventive';
import CustodianInspection from './pages/custodian/CustodianInspection';
import CustodianLostFound from './pages/custodian/CustodianLostFound';
import CustodianSupplies from './pages/custodian/CustodianSupplies';
import CustodianDisposal from './pages/custodian/CustodianDisposal';
import CustodianReports from './pages/custodian/CustodianReports';


// Placeholder Components
const AdminDashboard = () => (
  <div className="p-10">
    <h1 className="text-3xl font-bold text-blue-600 tracking-tight">Admin Dashboard</h1>
    <p className="mt-2 text-slate-600 font-medium">Welcome to the Command Center.</p>
  </div>
);

// HR Portal Placeholder Components is removed as they are fully built standalone pages now

// IT Portal Placeholder Components is removed as they are fully built standalone pages now

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

// Custodian Portal Placeholder Components is removed as they are fully built standalone pages now

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
            <Route path="school-setup" element={<SchoolSetup />} />
            <Route path="branding" element={<Navigate to="../school-setup" replace />} />
            <Route path="rooms" element={<Navigate to="../school-setup" replace />} />
            <Route path="promotions" element={<LandingPromotions />} />
            <Route path="schools" element={<SchoolManagement />} />
            <Route path="permissions" element={<SchoolPermissions />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
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
            <Route path="onboarding" element={<HrOnboarding />} />
            <Route path="attendance" element={<HrAttendance />} />
            <Route path="leave" element={<HrLeave />} />
            <Route path="payroll-support" element={<HrPayrollSupport />} />
            <Route path="performance" element={<HrPerformance />} />
            <Route path="training" element={<HrTraining />} />
            <Route path="documents" element={<HrDocuments />} />
            <Route path="disciplinary" element={<HrDisciplinary />} />
            <Route path="clearance" element={<HrClearance />} />
            <Route path="benefits" element={<HrBenefits />} />
            <Route path="reports" element={<HrReports />} />
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
            <Route path="helpdesk" element={<ItHelpDesk />} />
            <Route path="inventory" element={<ItInventory />} />
            <Route path="borrowing" element={<ItBorrowing />} />
            <Route path="maintenance" element={<ItMaintenance />} />
            <Route path="software" element={<ItSoftware />} />
            <Route path="network" element={<ItNetwork />} />
            <Route path="support" element={<ItUserSupport />} />
            <Route path="announcements" element={<ItAnnouncements />} />
            <Route path="reports" element={<ItReports />} />
            <Route path="audits" element={<ItAuditLogs />} />
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
            <Route path="borrowing" element={<CustodianBorrowing />} />
            <Route path="reservations" element={<CustodianReservations />} />
            <Route path="maintenance" element={<CustodianMaintenance />} />
            <Route path="preventive" element={<CustodianPreventive />} />
            <Route path="inspection" element={<CustodianInspection />} />
            <Route path="lost-found" element={<CustodianLostFound />} />
            <Route path="supplies" element={<CustodianSupplies />} />
            <Route path="disposal" element={<CustodianDisposal />} />
            <Route path="reports" element={<CustodianReports />} />
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