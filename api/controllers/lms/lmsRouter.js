import express from 'express';
import getDashboard from './getDashboard.js';
import getClassroomFeed from './getClassroomFeed.js';

const router = express.Router();

// Route for getting LMS Dashboard data
router.get('/get_dashboard', getDashboard);

// Route for getting classroom feed
router.get('/get_classroom_feed', getClassroomFeed);

export default router;
