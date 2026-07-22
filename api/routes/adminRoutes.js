import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getBranding, updateBranding, getSchoolSettings, saveSchoolSettings } from '../controllers/admin/brandingController.js';

import { getUsers, createUser, updateUser, deleteUser, updateUserProfile } from '../controllers/admin/user.js';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../controllers/admin/room.js';
import { getAdminPromotions, createPromotion, deletePromotion } from '../controllers/admin/promotion.js';
import { getAuditLogs } from '../controllers/admin/auditLogsController.js';
import {
  getSchoolProfile,
  updateSchoolProfile,
  getSchoolYears,
  createSchoolYear,
  updateSchoolYear,
  deleteSchoolYear,
  getBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  getRoomsExtended,
  createRoomExtended,
  updateRoomExtended
} from '../controllers/admin/schoolSetupController.js';

const router = express.Router();

// Multer Memory Storage Configuration for branding logo uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Multer Memory Storage Configuration for promotions uploads
const uploadPromo = multer({ storage: multer.memoryStorage() });

// Config disk storage for profile updates
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/profiles';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const id = req.body.id || 'admin_temp';
    const role = req.body.role || 'user';
    const ext = path.extname(file.originalname);
    cb(null, `${role}_${id}_${Date.now()}${ext}`);
  }
});
const uploadProfile = multer({ storage: profileStorage });

// Branding & School Profile Endpoints
router.get('/branding', getBranding);
router.post('/branding', upload.single('school_logo'), updateBranding);
router.get('/school-profile', getSchoolProfile);
router.post('/school-profile', upload.single('school_logo'), updateSchoolProfile);

// Legacy Branding routing alias
router.get('/branding.php', getBranding);
router.post('/branding.php', upload.single('school_logo'), updateBranding);

// School Year Endpoints
router.get('/school-years', getSchoolYears);
router.post('/school-years', createSchoolYear);
router.put('/school-years/:id', updateSchoolYear);
router.delete('/school-years/:id', deleteSchoolYear);

// Building Endpoints
router.get('/buildings', getBuildings);
router.post('/buildings', createBuilding);
router.put('/buildings/:id', updateBuilding);
router.delete('/buildings/:id', deleteBuilding);

// User Management RESTful Endpoints
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Legacy User Management routing alias
router.get('/get_users.php', getUsers);
router.post('/add_user.php', createUser);
router.post('/update_user.php', (req, res) => {
  req.params.id = req.body.id;
  updateUser(req, res);
});
router.post('/delete_user.php', (req, res) => {
  req.params.id = req.body.id;
  deleteUser(req, res);
});

// Room Management RESTful Endpoints
router.get('/rooms', getRoomsExtended);
router.post('/rooms', createRoomExtended);
router.put('/rooms/:id', updateRoomExtended);
router.delete('/rooms/:id', deleteRoom);

// Legacy Room Management routing alias
router.get('/get_rooms.php', getRoomsExtended);
router.post('/create_room.php', createRoomExtended);
router.post('/update_room.php', (req, res) => {
  req.params.id = req.body.id;
  updateRoomExtended(req, res);
});
router.post('/delete_room.php', (req, res) => {
  req.params.id = req.body.id;
  deleteRoom(req, res);
});

// Promotions RESTful Endpoints
router.get('/promotions', getAdminPromotions);
router.post('/promotions', uploadPromo.single('image_file'), createPromotion);
router.delete('/promotions/:id', deletePromotion);

// Legacy Promotions routing alias
router.post('/add_promotion.php', uploadPromo.single('image_file'), createPromotion);
router.post('/delete_promotion.php', (req, res) => {
  req.params.id = req.body.id;
  deletePromotion(req, res);
});

// User Profile Updates
router.post('/update-profile', uploadProfile.single('profile_image'), updateUserProfile);
router.post('/update_user_profile.php', uploadProfile.single('profile_image'), updateUserProfile);

// School College settings
router.get('/school-settings', getSchoolSettings);
router.get('/get_school_settings.php', getSchoolSettings);
router.post('/school-settings', saveSchoolSettings);
router.post('/save_school_settings.php', saveSchoolSettings);

// System Audit Logs
router.get('/audit-logs', getAuditLogs);
router.get('/get_audit_logs.php', getAuditLogs);

export default router;
