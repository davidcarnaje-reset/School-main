import express from 'express';
import {
  getNnurseDashboardStats,
  getHealthProfiles,
  saveHealthProfile,
  getHealthChecks,
  createHealthCheck,
  getClinicVisits,
  createClinicVisit,
  getInventory,
  createInventoryItem,
  updateInventoryStock,
  getStudentHealthProfile
} from '../controllers/health/healthController.js';

const router = express.Router();

// Nurse Dashboard Stats
router.get('/dashboard-stats', getNnurseDashboardStats);

// Student Medical Profiles
router.get('/profiles', getHealthProfiles);
router.post('/profiles', saveHealthProfile);

// Physical Checks & BMI
router.get('/checks/:studentId', getHealthChecks);
router.post('/checks', createHealthCheck);

// Clinic visits / Sick Bay consultation records
router.get('/visits', getClinicVisits);
router.post('/visits', createClinicVisit);

// Clinic medicine stocks inventory
router.get('/inventory', getInventory);
router.post('/inventory', createInventoryItem);
router.put('/inventory/:id', updateInventoryStock);

// Student health details history
router.get('/student-profile', getStudentHealthProfile);

export default router;
