<?php
include_once '../config.php';
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->student_id) || !isset($data->activity_id) || !isset($data->answers)) {
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
    exit;
}

try {
    $pdo->beginTransaction();
    $totalScore = 0;
    $maxScore = 0;

    foreach ($data->answers as $questionId => $answer) {
        $qStmt = $pdo->prepare("SELECT question_type, points FROM exam_questions WHERE id = ?");
        $qStmt->execute([$questionId]);
        $q = $qStmt->fetch(PDO::FETCH_ASSOC);
        $points = (float) $q['points'];
        $maxScore += $points;

        $pointsEarned = 0;
        $selectedChoiceId = null;
        $essayAnswer = null;

        if ($q['question_type'] === 'multiple_choice' || $q['question_type'] === 'true_false') {
            $selectedChoiceId = $answer;
            $checkStmt = $pdo->prepare("SELECT is_correct FROM exam_choices WHERE id = ?");
            $checkStmt->execute([$selectedChoiceId]);
            if ($checkStmt->fetchColumn()) {
                $pointsEarned = $points;
                $totalScore += $points;
            }
        } else {
            $essayAnswer = $answer;
        }

        // Gamitin natin ang REPLACE (o delete muna bago insert kung retake)
        $delStmt = $pdo->prepare("DELETE FROM student_exam_answers WHERE student_id = ? AND activity_id = ? AND question_id = ?");
        $delStmt->execute([$data->student_id, $data->activity_id, $questionId]);

        $insStmt = $pdo->prepare("INSERT INTO student_exam_answers (student_id, activity_id, question_id, selected_choice_id, essay_answer, points_earned) VALUES (?, ?, ?, ?, ?, ?)");
        $insStmt->execute([$data->student_id, $data->activity_id, $questionId, $selectedChoiceId, $essayAnswer, $pointsEarned]);
    }

    // Upsert into student_activity_scores (IDINAGDAG NATIN ANG attempts = attempts + 1)
    $scoreStmt = $pdo->prepare("
        INSERT INTO student_activity_scores (activity_id, student_id, score, status, date_graded, attempts) 
        VALUES (?, ?, ?, 'Graded', NOW(), 1)
        ON DUPLICATE KEY UPDATE score = ?, status = 'Graded', date_graded = NOW(), attempts = attempts + 1
    ");
    $scoreStmt->execute([$data->activity_id, $data->student_id, $totalScore, $totalScore]);

    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "score_details" => [
            "score" => $totalScore,
            "total" => $maxScore
        ]
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>