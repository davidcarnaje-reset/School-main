import express from 'express';
import multer from 'multer';

// Existing controllers
import getStudentsList from '../controllers/registrar/getStudentsList.js';
import getSubjects from '../controllers/registrar/getSubjects.js';
import registerStudent from '../controllers/registrar/registerStudent.js';
import encodeSubjects from '../controllers/registrar/encodeSubjects.js';
import getRegistrarDashboard from '../controllers/registrar/getRegistrarDashboard.js';

// Newly migrated controllers
import { getAcademicPrograms, addAcademicProgram, deleteAcademicProgram } from '../controllers/registrar/academicPrograms.js';
import { getSubjectDetails, addSubject, deleteSubject } from '../controllers/registrar/subjectManagement.js';
import { getClassAssignData, addClassAssign, updateClassAssign, deleteClassAssign, bulkAddClassAssign, deleteAssignment } from '../controllers/registrar/classAssignments.js';
import { getSections, createSection, getSectionDetails, getSectionsForEnrollment } from '../controllers/registrar/sectionsManagement.js';
import { getRegistrarRequests, getFeesCatalog, searchStudents, addRequest, cancelRequest } from '../controllers/registrar/studentRequests.js';
import { getStudentRecords, getStudentDocuments, unlockGrades } from '../controllers/registrar/studentRecords.js';
import { getScholarshipApplications, evaluateScholarship, readImage } from '../controllers/registrar/scholarshipManagement.js';
import { getStudentsByStatus, getAvailableClasses } from '../controllers/registrar/enrollmentHelper.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Clean RESTful endpoints
router.get('/students', getStudentsList);
router.get('/students-list', getStudentsList);
router.get('/subjects', getSubjects);
router.get('/dashboard-stats', getRegistrarDashboard);
router.post('/register-student', upload.single('profile_image'), registerStudent);
router.post('/encode-subjects', encodeSubjects);

// New clean endpoints
router.get('/academic-programs', getAcademicPrograms);
router.post('/academic-programs', addAcademicProgram);
router.delete('/academic-programs', deleteAcademicProgram);

router.post('/subjects', addSubject);
router.delete('/subjects', deleteSubject);
router.get('/subjects/details', getSubjectDetails);

router.get('/class-assignments', getClassAssignData);
router.post('/class-assignments', addClassAssign);
router.put('/class-assignments', updateClassAssign);
router.delete('/class-assignments', deleteClassAssign);
router.post('/class-assignments/bulk', bulkAddClassAssign);
router.post('/class-assignments/deactivate', deleteAssignment);

router.get('/sections', getSections);
router.post('/sections', createSection);
router.get('/sections/details', getSectionDetails);
router.get('/sections/enrollment', getSectionsForEnrollment);

router.get('/requests', getRegistrarRequests);
router.get('/fees-catalog', getFeesCatalog);
router.get('/search-students', searchStudents);
router.post('/requests', addRequest);
router.post('/requests/cancel', cancelRequest);

router.get('/student-records', getStudentRecords);
router.get('/student-documents', getStudentDocuments);
router.post('/unlock-grades', unlockGrades);

router.get('/scholarship-applications', getScholarshipApplications);
router.post('/scholarship-applications/evaluate', evaluateScholarship);
router.get('/read-image', readImage);

router.get('/students-by-status', getStudentsByStatus);
router.get('/available-classes', getAvailableClasses);


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

// Newly added legacy paths
router.get('/get_academic_programs.php', getAcademicPrograms);
router.post('/add_academic_program.php', addAcademicProgram);
router.post('/delete_academic_program.php', deleteAcademicProgram);

router.post('/add_subject.php', addSubject);
router.post('/delete_subject.php', deleteSubject);
router.get('/get_subject_details.php', getSubjectDetails);

router.get('/class_assign_data.php', getClassAssignData);
router.post('/add_class_assign.php', addClassAssign);
router.post('/update_class_assign.php', updateClassAssign);
router.post('/delete_class_assign.php', deleteClassAssign);
router.post('/bulk_add_class_assign.php', bulkAddClassAssign);
router.post('/delete_assignment.php', deleteAssignment);

router.get('/manage_sections.php', getSections);
router.post('/manage_sections.php', createSection);
router.get('/get_section_details.php', getSectionDetails);
router.get('/get_sections_for_enrollment.php', getSectionsForEnrollment);

router.get('/get_registrar_requests.php', getRegistrarRequests);
router.get('/get_fees_catalog.php', getFeesCatalog);
router.get('/search_students.php', searchStudents);
router.post('/add_request.php', addRequest);
router.post('/cancel_request.php', cancelRequest);

router.get('/get_student_records.php', getStudentRecords);
router.get('/get_student_documents.php', getStudentDocuments);
router.post('/unlock_grades.php', unlockGrades);

router.get('/get_scholarship_applications.php', getScholarshipApplications);
router.post('/evaluate_scholarship.php', evaluateScholarship);
router.get('/read_image.php', readImage);

router.get('/get_students_by_status.php', getStudentsByStatus);
router.get('/get_available_classes.php', getAvailableClasses);

export default router;
