<?php
/**
 * TEACHER MODULE: GET EXAM QUESTIONS WITH STUDENT ANSWERS
 * Location: sms-api/teacher/get_exam_questions.php
 * Purpose: Fetch exam structure + student's responses for grading modal
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(); }
require_once '../config.php';

$activityId = $_GET['activity_id'] ?? null;
$studentId = $_GET['student_id'] ?? null;

if (!$activityId || !$studentId) {
    echo json_encode(["status" => "error", "message" => "Activity ID and Student ID required."]);
    exit;
}

try {
    // 1. Get all exam questions for this activity
    $qStmt = $pdo->prepare("
        SELECT id, question_text, question_type, points as max_points, order_num
        FROM exam_questions
        WHERE activity_id = ?
        ORDER BY order_num ASC
    ");
    $qStmt->execute([$activityId]);
    $questions = $qStmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];

    foreach ($questions as $q) {
        $questionId = $q['id'];

        // 2. Get student's answer (using correct columns: selected_choice_id & essay_answer)
        $ansStmt = $pdo->prepare("
            SELECT selected_choice_id, essay_answer, points_earned
            FROM student_exam_answers
            WHERE activity_id = ? AND student_id = ? AND question_id = ?
            LIMIT 1
        ");
        $ansStmt->execute([$activityId, $studentId, $questionId]);
        $answer = $ansStmt->fetch(PDO::FETCH_ASSOC);

        $studentAnswerText = null;
        $isCorrect = false;
        $pointsEarned = (float)($answer['points_earned'] ?? 0);
        
        $choices = [];
        $correctChoiceId = null;

        // 3. Logic para sa Multiple Choice / True or False
        if ($q['question_type'] === 'multiple_choice' || $q['question_type'] === 'true_false') {
            $choiceStmt = $pdo->prepare("SELECT id, choice_text, is_correct FROM exam_choices WHERE question_id = ? ORDER BY id ASC");
            $choiceStmt->execute([$questionId]);
            $choices = $choiceStmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($choices as $c) {
                // Alamin ang tamang choice ID
                if ($c['is_correct'] == 1) {
                    $correctChoiceId = $c['id'];
                }
                
                // Kung ang choice na ito ang pinili ng student
                if ($answer && $c['id'] == $answer['selected_choice_id']) {
                    $studentAnswerText = $c['choice_text'];
                    if ($c['is_correct'] == 1) {
                        $isCorrect = true;
                        // Auto-compute point kung tama (just in case hindi na-save ng maayos ang score)
                        $pointsEarned = (float)$q['max_points'];
                    }
                }
            }
        } 
        // 4. Logic para sa Essay
        else {
            $studentAnswerText = $answer['essay_answer'] ?? null;
        }

        $result[] = [
            'id'              => $questionId,
            'question_text'   => $q['question_text'],
            'question_type'   => $q['question_type'],
            'max_points'      => (float)$q['max_points'],
            'order_num'       => $q['order_num'],
            'student_answer'  => $studentAnswerText,
            'points_earned'   => $pointsEarned,
            'is_correct'      => $isCorrect,
            'choices'         => $choices,
            'correct_choice_id' => $correctChoiceId,
            'essay_answer'    => $answer['essay_answer'] ?? null
        ];
    }

    echo json_encode(["status" => "success", "questions" => $result]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
}
?>