import express from 'express';
import multer from 'multer';
import getStudentsList from '../controllers/registrar/getStudentsList.js';
import getSubjects from '../controllers/registrar/getSubjects.js';
import registerStudent from '../controllers/registrar/registerStudent.js';
import encodeSubjects from '../controllers/registrar/encodeSubjects.js';
import getRegistrarDashboard from '../controllers/registrar/getRegistrarDashboard.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Clean RESTful endpoints
router.get('/students', getStudentsList);
router.get('/students-list', getStudentsList);
router.get('/subjects', getSubjects);
router.get('/dashboard-stats', getRegistrarDashboard);
router.post('/register-student', upload.single('profile_image'), registerStudent);
router.post('/encode-subjects', encodeSubjects);

// Legacy compatibility endpoints
router.get('/get_students_list', getStudentsList);
router.get('/get_students_list.php', getStudentsList);
router.get('/get_subjects', getSubjects);
router.get('/get_subjects.php', getSubjects);
router.get('/get_registrar_dashboard.php', getRegistrarDashboard);
router.post('/add_student', upload.single('profile_image'), registerStudent);
router.post('/add_student.php', upload.single('profile_image'), registerStudent);
router.post('/process_enrollment', encodeSubjects);
router.post('/process_enrollment.php', encodeSubjects);

export default router;
