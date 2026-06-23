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


// Placeholder Components
const AdminDashboard = () => (
  <div className="p-10">
    <h1 className="text-3xl font-bold text-blue-600 tracking-tight">Admin Dashboard</h1>
    <p className="mt-2 text-slate-600 font-medium">Welcome to the Command Center.</p>
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
          <Route path="/" element={<LandingPage />} />
          
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
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="branding" element={<BrandingSettings />} />
            <Route path="rooms" element={<RoomManagement />} />
            <Route path="promotions" element={<LandingPromotions />} />
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