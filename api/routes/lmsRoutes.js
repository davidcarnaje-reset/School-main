import express from 'express';
import getDashboard from '../controllers/lms/getDashboard.js';
import getClassroomFeed from '../controllers/lms/getClassroomFeed.js';
import getAllCourses from '../controllers/lms/getAllCourses.js';
import getStudentSchedule from '../controllers/lms/getStudentSchedule.js';
import updateLastAccessed from '../controllers/lms/updateLastAccessed.js';
import trackActivity from '../controllers/lms/trackActivity.js';
import getStudentPerformance from '../controllers/lms/getStudentPerformance.js';
import getProfileOverview from '../controllers/lms/getProfileOverview.js';
import { getCalendarNotes, saveCalendarNote, deleteCalendarNote } from '../controllers/lms/calendarNotes.js';
import { getExamDetails, submitExam } from '../controllers/lms/examController.js';

const router = express.Router();

// Clean RESTful endpoints
router.get('/dashboard', getDashboard);
router.get('/classroom-feed', getClassroomFeed);
router.get('/courses', getAllCourses);
router.get('/schedule', getStudentSchedule);
router.post('/update-last-accessed', updateLastAccessed);
router.post('/track-activity', trackActivity);
router.get('/performance', getStudentPerformance);
router.get('/profile-overview', getProfileOverview);
router.get('/calendar-notes', getCalendarNotes);
router.post('/calendar-notes', saveCalendarNote);
router.delete('/calendar-notes', deleteCalendarNote);
router.get('/exam-details', getExamDetails);
router.post('/submit-exam', submitExam);

// Legacy PHP compatibility endpoints (direct mapping from frontend)
router.get('/get_dashboard', getDashboard);
router.get('/get_dashboard.php', getDashboard);
router.get('/get_classroom_feed', getClassroomFeed);
router.get('/get_classroom_feed.php', getClassroomFeed);
router.get('/get_all_courses', getAllCourses);
router.get('/get_all_courses.php', getAllCourses);
router.get('/get_student_schedule', getStudentSchedule);
router.get('/get_student_schedule.php', getStudentSchedule);
router.post('/update_last_accessed', updateLastAccessed);
router.post('/update_last_accessed.php', updateLastAccessed);
router.post('/track_activity', trackActivity);
router.post('/track_activity.php', trackActivity);
router.get('/get_student_performance', getStudentPerformance);
router.get('/get_student_performance.php', getStudentPerformance);
router.get('/get_profile_overview', getProfileOverview);
router.get('/get_profile_overview.php', getProfileOverview);
router.get('/get_calendar_notes', getCalendarNotes);
router.get('/get_calendar_notes.php', getCalendarNotes);
router.post('/save_calendar_note', saveCalendarNote);
router.post('/save_calendar_note.php', saveCalendarNote);
router.post('/delete_calendar_note', deleteCalendarNote);
router.post('/delete_calendar_note.php', deleteCalendarNote);
router.get('/get_exam_details', getExamDetails);
router.get('/get_exam_details.php', getExamDetails);
router.post('/submit_exam', submitExam);
router.post('/submit_exam.php', submitExam);

export default router;
