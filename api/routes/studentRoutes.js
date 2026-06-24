import express from 'express';
import getStudentDashboardData from '../controllers/student/getStudentDashboardData.js';
import getStudentGrades from '../controllers/student/getStudentGrades.js';

const router = express.Router();

// Clean RESTful endpoints
router.get('/dashboard-data', getStudentDashboardData);
router.get('/grades', getStudentGrades);

// Legacy compatibility endpoints
router.get('/get_student_dashboard_data', getStudentDashboardData);
router.get('/get_student_dashboard_data.php', getStudentDashboardData);
router.get('/get_student_grades', getStudentGrades);
router.get('/get_student_grades.php', getStudentGrades);

export default router;
