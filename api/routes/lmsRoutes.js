import express from 'express';
import getDashboard from '../controllers/lms/getDashboard.js';
import getClassroomFeed from '../controllers/lms/getClassroomFeed.js';

const router = express.Router();

// Clean RESTful endpoints
router.get('/dashboard', getDashboard);
router.get('/classroom-feed', getClassroomFeed);

// Legacy compat endpoints (for direct frontend mapping)
router.get('/get_dashboard', getDashboard);
router.get('/get_dashboard.php', getDashboard);
router.get('/get_classroom_feed', getClassroomFeed);
router.get('/get_classroom_feed.php', getClassroomFeed);

export default router;
