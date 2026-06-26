import express from 'express';
import getStudentsList from '../controllers/registrar/getStudentsList.js';
import getSubjects from '../controllers/registrar/getSubjects.js';
import registerStudent from '../controllers/registrar/registerStudent.js';
import encodeSubjects from '../controllers/registrar/encodeSubjects.js';

const router = express.Router();

// Clean RESTful endpoints
router.get('/students', getStudentsList);
router.get('/subjects', getSubjects);
router.post('/register-student', registerStudent);
router.post('/encode-subjects', encodeSubjects);

// Legacy compatibility endpoints
router.get('/get_students_list', getStudentsList);
router.get('/get_students_list.php', getStudentsList);
router.get('/get_subjects', getSubjects);
router.get('/get_subjects.php', getSubjects);
router.post('/add_student', registerStudent);
router.post('/add_student.php', registerStudent);
router.post('/process_enrollment', encodeSubjects);
router.post('/process_enrollment.php', encodeSubjects);

export default router;
