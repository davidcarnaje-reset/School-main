import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getBranding, updateBranding } from '../controllers/admin/brandingController.js';

import { getUsers, createUser, updateUser, deleteUser } from '../controllers/admin/user.js';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../controllers/admin/room.js';
import { getAdminPromotions, createPromotion, deletePromotion } from '../controllers/admin/promotion.js';

const router = express.Router();

// Multer Memory Storage Configuration for branding logo uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Multer Memory Storage Configuration for promotions uploads
const uploadPromo = multer({ storage: multer.memoryStorage() });

// Branding Endpoints
router.get('/branding', getBranding);
router.post('/branding', upload.single('school_logo'), updateBranding);

// Legacy Branding routing alias
router.get('/branding.php', getBranding);
router.post('/branding.php', upload.single('school_logo'), updateBranding);


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
router.get('/rooms', getRooms);
router.post('/rooms', createRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);

// Legacy Room Management routing alias
router.get('/get_rooms.php', getRooms);
router.post('/create_room.php', createRoom);
router.post('/update_room.php', (req, res) => {
  req.params.id = req.body.id;
  updateRoom(req, res);
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

export default router;
