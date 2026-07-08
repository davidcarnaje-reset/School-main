import express from 'express';
import multer from 'multer';
import getStudentDashboardData from '../controllers/student/getStudentDashboardData.js';
import getGrades from '../controllers/student/getGrades.js';
import submitScholarshipApplication from '../controllers/student/submitScholarshipApplication.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Clean RESTful endpoints
router.get('/dashboard-data', getStudentDashboardData);
router.get('/grades', getGrades);
router.post('/submit-application', upload.array('requirements'), submitScholarshipApplication);

// Legacy compatibility endpoints
router.get('/get_student_dashboard_data', getStudentDashboardData);
router.get('/get_student_dashboard_data.php', getStudentDashboardData);
router.get('/get_student_grades', getGrades);
router.get('/get_student_grades.php', getGrades);
router.post('/submit_application', upload.array('requirements'), submitScholarshipApplication);
router.post('/submit_application.php', upload.array('requirements'), submitScholarshipApplication);

export default router;
