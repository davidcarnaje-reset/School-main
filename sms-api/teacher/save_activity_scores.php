<?php
/**
 * TEACHER PORTAL: CONSOLIDATED ACTIVITY SCORING
 * Location: sms-api/teacher/save_activity_scores.php
 * Handles: Standard Activities, Exams, and Essay Grading
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(); }
require_once '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->activity_id) || !isset($data->student_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid request. Activity ID and Student ID are required."]);
    exit();
}

$activityId = intval($data->activity_id);
$studentId = $data->student_id;

// Kukunin ang score mula sa frontend payload
$score = isset($data->score) ? floatval($data->score) : 0;
$essayScores = isset($data->essay_scores) ? $data->essay_scores : [];

try {
    $pdo->beginTransaction();

    // 1. GET ACTIVITY DETAILS
    $actStmt = $pdo->prepare("SELECT class_id, quarter, category, max_score FROM activities WHERE id = ?");
    $actStmt->execute([$activityId]);
    $activity = $actStmt->fetch(PDO::FETCH_ASSOC);
    if (!$activity) throw new Exception("Activity not found.");

    // 2. IF EXAM: UPDATE ESSAY ANSWERS AND RECOMPUTE TOTAL SCORE
    if (!empty($essayScores)) {
        $updateAns = $pdo->prepare("UPDATE student_exam_answers SET points_earned = ? WHERE student_id = ? AND activity_id = ? AND question_id = ?");
        foreach ($essayScores as $essay) {
            $updateAns->execute([floatval($essay->score), $studentId, $activityId, intval($essay->question_id)]);
        }
    }

    // Titingnan natin kung ang activity na ito ay may record sa student_exam_answers
    // Kung meron, i-o-override natin ang $score gamit ang totoong total ng MC + Essays
    $checkExamTotal = $pdo->prepare("SELECT SUM(points_earned) as total FROM student_exam_answers WHERE student_id = ? AND activity_id = ?");
    $checkExamTotal->execute([$studentId, $activityId]);
    $dbTotal = $checkExamTotal->fetchColumn();

    if ($dbTotal !== null) {
        $score = floatval($dbTotal);
    }

    // 3. SAVE TO STUDENT_ACTIVITY_SCORES
    $checkStmt = $pdo->prepare("SELECT id FROM student_activity_scores WHERE activity_id = ? AND student_id = ?");
    $checkStmt->execute([$activityId, $studentId]);
    $exists = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if ($exists) {
        $updateStmt = $pdo->prepare("UPDATE student_activity_scores SET score = ?, status = 'Graded', date_graded = NOW() WHERE id = ?");
        $updateStmt->execute([$score, $exists['id']]);
    } else {
        $insertStmt = $pdo->prepare("INSERT INTO student_activity_scores (activity_id, student_id, score, status, date_graded) VALUES (?, ?, ?, 'Graded', NOW())");
        $insertStmt->execute([$activityId, $studentId, $score]);
    }

    // 4. MAP CATEGORY TO GRADE COLUMN AND UPDATE STUDENT_GRADES
    $category = strtolower($activity['category']);
    $maxScore = floatval($activity['max_score'] ?? 100);
    $quarter = $activity['quarter'];
    $classId = $activity['class_id'];

    $gradeColumn = null;
    $k12Map = ['written' => 'written', 'quiz' => 'written', 'assignment' => 'written', 'task' => 'written', 'performance' => 'performance', 'exam' => 'exam', 'quarterly_exam' => 'exam'];
    $collegeMap = ['prelim' => 'prelim', 'midterm' => 'midterm', 'finals' => 'finals'];

    if (array_key_exists($category, $k12Map)) $gradeColumn = $k12Map[$category];
    elseif (array_key_exists($category, $collegeMap)) $gradeColumn = $collegeMap[$category];
    else $gradeColumn = 'written'; // fallback

    if ($gradeColumn) {
        $gradePercentage = ($maxScore > 0) ? min(100, ($score / $maxScore) * 100) : 0;
        
        $checkGrade = $pdo->prepare("SELECT id FROM student_grades WHERE class_id = ? AND student_id = ? AND (quarter " . ($quarter ? "= ?" : "IS NULL") . ")");
        $params = [$classId, $studentId];
        if ($quarter) $params[] = $quarter;
        $checkGrade->execute($params);
        $gradeId = $checkGrade->fetchColumn();

        if ($gradeId) {
            $pdo->prepare("UPDATE student_grades SET $gradeColumn = ? WHERE id = ?")->execute([$gradePercentage, $gradeId]);
        } else {
            $sql = "INSERT INTO student_grades (class_id, student_id, quarter, $gradeColumn) VALUES (?, ?, " . ($quarter ? "?" : "NULL") . ", ?)";
            $insertParams = [$classId, $studentId];
            if ($quarter) $insertParams[] = $quarter;
            $insertParams[] = $gradePercentage;
            $pdo->prepare($sql)->execute($insertParams);
        }
    }

    $pdo->commit();
    echo json_encode([
        "status" => "success", 
        "message" => "Score saved and gradebook updated!", 
        "final_score" => $score // Binabalik ang computed score para madaling ma-verify sa network tab
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>