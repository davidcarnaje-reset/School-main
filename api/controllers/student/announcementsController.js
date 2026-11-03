import getStudentAnnouncementsHandler from '../notifications/getStudentAnnouncements.js';

// GET STUDENT PORTAL ANNOUNCEMENTS (delegates to unified student & class announcements handler)
export const getStudentAnnouncements = async (req, res) => {
  return getStudentAnnouncementsHandler(req, res);
};

export default { getStudentAnnouncements };
