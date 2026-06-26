import express from 'express';
import getStudentDashboardData from '../controllers/student/getStudentDashboardData.js';
import getGrades from '../controllers/student/getGrades.js';

const router = express.Router();

// Clean RESTful endpoints
router.get('/dashboard-data', getStudentDashboardData);
router.get('/grades', getGrades);

// Legacy compatibility endpoints
router.get('/get_student_dashboard_data', getStudentDashboardData);
router.get('/get_student_dashboard_data.php', getStudentDashboardData);
router.get('/get_student_grades', getGrades);
router.get('/get_student_grades.php', getGrades);

export default router;
