import express from 'express';
import {
  getCounselorDashboardStats,
  getCases,
  createCase,
  updateCaseStatus,
  getCaseSessions,
  addSessionNote,
  getAppointments,
  updateAppointmentStatus,
  getStudentAppointments,
  bookAppointment,
  submitTestResults,
  getStudentTestResults,
  getAllTestResults,
  getIncidents,
  createIncident,
  updateIncidentStatus
} from '../controllers/guidance/guidanceController.js';

const router = express.Router();

// Counselor Dashboard Stats
router.get('/dashboard-stats', getCounselorDashboardStats);

// Case Tracking Records
router.get('/cases', getCases);
router.post('/cases', createCase);
router.put('/cases/:id', updateCaseStatus);
router.get('/cases/:caseId/sessions', getCaseSessions);
router.post('/cases/:caseId/sessions', addSessionNote);

// appointments scheduling
router.get('/appointments', getAppointments);
router.put('/appointments/:id', updateAppointmentStatus);
router.get('/student-appointments', getStudentAppointments);
router.post('/appointments', bookAppointment);

// Psych personality test assessments
router.post('/submit-test', submitTestResults);
router.get('/student-tests', getStudentTestResults);
router.get('/all-tests', getAllTestResults);

// Bullying incident log entries
router.get('/incidents', getIncidents);
router.post('/incidents', createIncident);
router.put('/incidents/:id', updateIncidentStatus);

export default router;
