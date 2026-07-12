import express from 'express';

import { getTeacherProfile } from '../controllers/teacher/profileController.js';
import { getMySchedule } from '../controllers/teacher/scheduleController.js';
import { getSections } from '../controllers/teacher/sectionsController.js';
import { createActivity, createExam, getActivities } from '../controllers/teacher/activityController.js';
import { getActivityScores, getExamQuestions, saveActivityScores } from '../controllers/teacher/gradingController.js';
import { 
  getClassGrades, 
  getQuarterlySummary, 
  saveGrades, 
  submitFinalGrades, 
  syncGrades, 
  requestGradeUnlock 
} from '../controllers/teacher/gradebookController.js';
import { getDtrToday, logDtr } from '../controllers/teacher/dtrController.js';
import { getAnnouncements, markNotificationsRead } from '../controllers/teacher/announcementsController.js';

const router = express.Router();

// --- Profile & Loads ---
router.get('/profile', getTeacherProfile);
router.get('/profile.php', getTeacherProfile);

router.get('/schedule', getMySchedule);
router.get('/get_my_schedule', getMySchedule);
router.get('/get_my_schedule.php', getMySchedule);

router.get('/sections', getSections);
router.get('/get_sections', getSections);
router.get('/get_sections.php', getSections);

// --- Activities & Exams Creation ---
router.post('/create-activity', createActivity);
router.post('/create_activity', createActivity);
router.post('/create_activity.php', createActivity);

router.post('/create-exam', createExam);
router.post('/create_exam', createExam);
router.post('/create_exam.php', createExam);

router.get('/activities', getActivities);
router.get('/get_activities', getActivities);
router.get('/get_activities.php', getActivities);

// --- Grading & Exam Submissions ---
router.get('/activity-scores', getActivityScores);
router.get('/get_activity_scores', getActivityScores);
router.get('/get_activity_scores.php', getActivityScores);

router.post('/save-activity-scores', saveActivityScores);
router.post('/save_activity_scores', saveActivityScores);
router.post('/save_activity_scores.php', saveActivityScores);

router.get('/exam-questions', getExamQuestions);
router.get('/get_exam_questions', getExamQuestions);
router.get('/get_exam_questions.php', getExamQuestions);

// --- Gradebook, Syncs, Locks ---
router.get('/class-grades', getClassGrades);
router.get('/get_class_grades', getClassGrades);
router.get('/get_class_grades.php', getClassGrades);

router.get('/quarterly-summary', getQuarterlySummary);
router.get('/get_quarterly_summary', getQuarterlySummary);
router.get('/get_quarterly_summary.php', getQuarterlySummary);

router.post('/save-grades', saveGrades);
router.post('/save_grades', saveGrades);
router.post('/save_grades.php', saveGrades);

router.post('/submit-final-grades', submitFinalGrades);
router.post('/submit_final_grades', submitFinalGrades);
router.post('/submit_final_grades.php', submitFinalGrades);

router.post('/sync-grades', syncGrades);
router.post('/sync_grades', syncGrades);
router.post('/sync_grades.php', syncGrades);

router.post('/request-grade-unlock', requestGradeUnlock);
router.post('/request_grade_unlock', requestGradeUnlock);
router.post('/request_grade_unlock.php', requestGradeUnlock);

// --- Daily Time Record (DTR) ---
router.get('/dtr-today', getDtrToday);
router.get('/get_dtr_today', getDtrToday);
router.get('/get_dtr_today.php', getDtrToday);

router.post('/log-dtr', logDtr);
router.post('/log_dtr', logDtr);
router.post('/log_dtr.php', logDtr);

// --- Announcements & Notifications ---
router.get('/announcements', getAnnouncements);
router.get('/get_announcements', getAnnouncements);
router.get('/get_announcements.php', getAnnouncements);

router.post('/mark-notifications-read', markNotificationsRead);
router.post('/mark_notifications_read', markNotificationsRead);
router.post('/mark_notifications_read.php', markNotificationsRead);

export default router;
