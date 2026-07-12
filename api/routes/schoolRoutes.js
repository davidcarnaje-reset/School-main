import express from 'express';
import multer from 'multer';
import { getSchools, getPublicSchools, createSchool, updateSchool, deleteSchool } from '../controllers/schoolController.js';
import { getSchoolPermissions, updateSchoolPermissions } from '../controllers/admin/permissionController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public route to select campus
router.get('/public', getPublicSchools);

// Dynamic Permissions & Roles Endpoints
router.get('/:school_id/permissions', getSchoolPermissions);
router.post('/:school_id/permissions', updateSchoolPermissions);

// Admin routes
router.get('/', getSchools);
router.post('/', upload.single('logo'), createSchool);
router.put('/:id', upload.single('logo'), updateSchool);
router.delete('/:id', deleteSchool);

export default router;
