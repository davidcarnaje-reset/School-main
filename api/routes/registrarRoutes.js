import express from 'express';
import getStudentsList from '../controllers/registrar/getStudentsList.js';
import getSubjects from '../controllers/registrar/getSubjects.js';

const router = express.Router();

// Clean RESTful endpoints
router.get('/students', getStudentsList);
router.get('/subjects', getSubjects);

// Legacy compatibility endpoints
router.get('/get_students_list', getStudentsList);
router.get('/get_students_list.php', getStudentsList);
router.get('/get_subjects', getSubjects);
router.get('/get_subjects.php', getSubjects);

export default router;
