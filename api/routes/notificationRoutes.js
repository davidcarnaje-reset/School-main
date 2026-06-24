import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import createNotification from '../controllers/notifications/createNotification.js';
import getNotifications from '../controllers/notifications/getNotifications.js';
import getStudentAnnouncements from '../controllers/notifications/getStudentAnnouncements.js';
import markAsRead from '../controllers/notifications/markAsRead.js';
import markSingleRead from '../controllers/notifications/markSingleRead.js';
import reactToNotif from '../controllers/notifications/reactToNotif.js';
import getReactions from '../controllers/notifications/getReactions.js';
import getUsersForDropdown from '../controllers/notifications/getUsersForDropdown.js';

const router = express.Router();

// Multer Storage Configuration para sa image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/notifications';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = 'notif_' + Date.now() + '_' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Clean RESTful endpoints
router.post('/create', upload.single('image'), createNotification);
router.get('/', getNotifications);
router.get('/student-announcements', getStudentAnnouncements);
router.post('/mark-read', markAsRead);
router.post('/mark-single-read', markSingleRead);
router.post('/react', reactToNotif);
router.get('/reactions', getReactions);
router.get('/users-dropdown', getUsersForDropdown);

// Legacy compatibility endpoints
router.post('/create_notification.php', upload.single('image'), createNotification);
router.post('/create_notification', upload.single('image'), createNotification);
router.get('/get_notifications.php', getNotifications);
router.get('/get_notifications', getNotifications);
router.get('/get_student_announcements.php', getStudentAnnouncements);
router.get('/get_student_announcements', getStudentAnnouncements);
router.post('/mark_as_read.php', markAsRead);
router.post('/mark_as_read', markAsRead);
router.post('/mark_single_read.php', markSingleRead);
router.post('/mark_single_read', markSingleRead);
router.post('/react_to_notif.php', reactToNotif);
router.post('/react_to_notif', reactToNotif);
router.get('/get_reactions.php', getReactions);
router.get('/get_reactions', getReactions);
router.get('/get_users_for_dropdown.php', getUsersForDropdown);
router.get('/get_users_for_dropdown', getUsersForDropdown);

export default router;
