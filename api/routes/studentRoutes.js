import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Existing controllers
import getStudentDashboardData from '../controllers/student/getStudentDashboardData.js';
import getGrades from '../controllers/student/getGrades.js';
import submitScholarshipApplication from '../controllers/student/submitScholarshipApplication.js';

// Newly converted controllers
import { fetchScholarships, getStudentApplications } from '../controllers/student/scholarshipController.js';
import { getAcademicPrograms } from '../controllers/student/programController.js';
import { getStudentName, updateStudent } from '../controllers/student/profileController.js';
import { getStudentAnnouncements } from '../controllers/student/announcementsController.js';
import { getStudentBilling, processPayment } from '../controllers/student/billingController.js';
import { getStudents, getAssessedStudents, getEnrolledStudents, getPendingStudents } from '../controllers/student/studentListController.js';
import { getLmsContent } from '../controllers/student/lmsContentController.js';

const router = express.Router();
const uploadMem = multer({ storage: multer.memoryStorage() });

// Config disk storage for profile image uploads
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/profiles';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const studentId = req.body.student_id || 'temp';
    const ext = path.extname(file.originalname);
    cb(null, `${studentId}_${Date.now()}${ext}`);
  }
});
const uploadProfile = multer({ storage: profileStorage });

// Clean RESTful endpoints
router.get('/dashboard-data', getStudentDashboardData);
router.get('/grades', getGrades);
router.post('/submit-application', uploadMem.array('requirements'), submitScholarshipApplication);
router.get('/scholarships', fetchScholarships);
router.get('/academic-programs', getAcademicPrograms);
router.get('/student-name', getStudentName);
router.get('/announcements', getStudentAnnouncements);
router.get('/applications', getStudentApplications);
router.get('/billing', getStudentBilling);
router.get('/list', getStudents);
router.get('/assessed', getAssessedStudents);
router.get('/enrolled', getEnrolledStudents);
router.get('/pending', getPendingStudents);
router.get('/lms-content', getLmsContent);
router.post('/process-payment', processPayment);
router.post('/update-profile', uploadProfile.single('profile_image'), updateStudent);

// Legacy compatibility endpoints
router.get('/get_student_dashboard_data', getStudentDashboardData);
router.get('/get_student_dashboard_data.php', getStudentDashboardData);
router.get('/get_student_grades', getGrades);
router.get('/get_student_grades.php', getGrades);
router.post('/submit_application', uploadMem.array('requirements'), submitScholarshipApplication);
router.post('/submit_application.php', uploadMem.array('requirements'), submitScholarshipApplication);

router.get('/fetch_scholarships.php', fetchScholarships);
router.get('/fetch_scholarships', fetchScholarships);
router.get('/get_academic_programs.php', getAcademicPrograms);
router.get('/get_academic_programs', getAcademicPrograms);
router.get('/get_student_name.php', getStudentName);
router.get('/get_student_name', getStudentName);
router.get('/get_student_announcements.php', getStudentAnnouncements);
router.get('/get_student_announcements', getStudentAnnouncements);
router.get('/get_student_applications.php', getStudentApplications);
router.get('/get_student_applications', getStudentApplications);
router.get('/get_student_billing.php', getStudentBilling);
router.get('/get_student_billing', getStudentBilling);
router.get('/get_students.php', getStudents);
router.get('/get_students', getStudents);
router.get('/get_assessed_students.php', getAssessedStudents);
router.get('/get_assessed_students', getAssessedStudents);
router.get('/get_enrolled_students.php', getEnrolledStudents);
router.get('/get_enrolled_students', getEnrolledStudents);
router.get('/get_pending_students.php', getPendingStudents);
router.get('/get_pending_students', getPendingStudents);
router.get('/get_lms_content.php', getLmsContent);
router.get('/get_lms_content', getLmsContent);
router.post('/process_payment.php', processPayment);
router.post('/process_payment', processPayment);
router.post('/update_student.php', uploadProfile.single('profile_image'), updateStudent);
router.post('/update_student', uploadProfile.single('profile_image'), updateStudent);

export default router;
