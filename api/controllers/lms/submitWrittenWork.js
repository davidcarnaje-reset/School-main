import pool from '../../config/db.js';
import { ensureExamSchema, getNextId } from '../teacher/activityController.js';

export const submitWrittenWork = async (req, res) => {
  const {
    activity_id: activityId,
    student_id: rawStudentId,
    submission_content: content = '',
    submission_url: url = '',
    submission_type: rawType = 'text'
  } = req.body;

  const studentIdentifier = rawStudentId || req.user?.student_id || req.user?.id || req.user?.username;

  if (!activityId || !studentIdentifier) {
    return res.status(400).json({ status: "error", message: "Missing activity ID or student ID." });
  }

  const finalContent = String(content || '').trim();
  const finalUrl = String(url || '').trim();
  const uploadedFileName = req.file ? req.file.filename : (req.body.file_url ? String(req.body.file_url).trim() : null);

  if (!finalContent && !finalUrl && !uploadedFileName) {
    return res.status(400).json({
      status: "error",
      message: "Please provide either an uploaded photo/file of your work, a video or Google Docs link, or written text."
    });
  }

  let finalType = rawType;
  if (uploadedFileName && (finalUrl || finalContent)) finalType = 'mixed';
  else if (uploadedFileName) finalType = 'file';
  else if (finalUrl && finalContent) finalType = 'both';
  else if (finalUrl) finalType = 'link';
  else finalType = 'text';

  await ensureExamSchema(pool);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Check activity deadline
    const [actRows] = await connection.query(
      "SELECT id, title, due_date FROM activities WHERE id = ? LIMIT 1",
      [activityId]
    );

    if (actRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ status: "error", message: "Activity not found." });
    }

    const activity = actRows[0];
    if (activity.due_date && Date.now() > new Date(activity.due_date).getTime() + 120000) {
      await connection.rollback();
      return res.status(403).json({
        status: "error",
        message: "This activity is already closed. Submissions are no longer accepted."
      });
    }

    // 2. Resolve both string student_id and numeric id
    const [stuRows] = await connection.query(
      "SELECT id, student_id FROM students WHERE student_id = ? OR id = ? LIMIT 1",
      [studentIdentifier, studentIdentifier]
    );
    const canonicalStudentId = String(stuRows[0]?.student_id || studentIdentifier);
    const idCandidates = Array.from(new Set([
      String(studentIdentifier),
      canonicalStudentId,
      ...(stuRows[0]?.id ? [String(stuRows[0].id)] : [])
    ]));

    // 3. Save / Update into student_submissions
    const [existingSub] = await connection.query(
      "SELECT id, file_url FROM student_submissions WHERE activity_id = ? AND student_id IN (?) LIMIT 1",
      [activityId, idCandidates]
    );

    const finalFileUrl = uploadedFileName || (existingSub[0]?.file_url || null);

    if (existingSub.length > 0) {
      await connection.query(
        `UPDATE student_submissions 
         SET submission_type = ?, submission_content = ?, submission_url = ?, file_url = ?, submitted_at = NOW() 
         WHERE id = ?`,
        [finalType, finalContent, finalUrl, finalFileUrl, existingSub[0].id]
      );
    } else {
      const nextSubId = await getNextId(connection, 'student_submissions');
      await connection.query(
        `INSERT INTO student_submissions (id, student_id, activity_id, submission_type, submission_content, submission_url, file_url, submitted_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [nextSubId, canonicalStudentId, activityId, finalType, finalContent, finalUrl, finalFileUrl]
      );
    }

    // 4. Update / Insert into student_activity_scores (Status = 'Submitted', Pending Teacher Grade)
    const [existingScore] = await connection.query(
      "SELECT id, score, status FROM student_activity_scores WHERE activity_id = ? AND student_id IN (?) LIMIT 1",
      [activityId, idCandidates]
    );

    if (existingScore.length > 0) {
      const isAlreadyGraded = existingScore[0].status === 'Graded';
      await connection.query(
        `UPDATE student_activity_scores 
         SET status = ?, attempts = COALESCE(attempts, 0) + 1 
         WHERE id = ?`,
        [isAlreadyGraded ? 'Graded' : 'Submitted', existingScore[0].id]
      );
    } else {
      const nextSasId = await getNextId(connection, 'student_activity_scores');
      await connection.query(
        `INSERT INTO student_activity_scores (id, activity_id, student_id, score, status, attempts) 
         VALUES (?, ?, ?, NULL, 'Submitted', 1)`,
        [nextSasId, activityId, canonicalStudentId]
      );
    }

    await connection.commit();

    return res.json({
      status: "success",
      message: "Work submitted successfully! Waiting for your teacher's grading.",
      data: {
        activity_id: activityId,
        submission_type: finalType,
        submission_url: finalUrl,
        file_url: finalFileUrl,
        submission_content: finalContent
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error("Submit written work error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

export default submitWrittenWork;
