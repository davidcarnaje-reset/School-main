<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// 1. SALUHIN ANG AXIOS PREFLIGHT REQUEST
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (isset($data->student_id) && isset($data->type)) {
    $studentId = $data->student_id;
    $type = $data->type; // 'login' or 'ping'
    $today = date('Y-m-d');

    try {
        // 2. I-CHECK KUNG NAG-EEXIST ANG STUDENT
        $query = "SELECT lms_login_count, lms_total_minutes, last_active_date FROM students WHERE student_id = :sid";
        $stmt = $pdo->prepare($query);
        $stmt->execute(['sid' => $studentId]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($student) {

            if ($type === 'login') {
                // LOGIC PARA SA LOGIN: Count +1 kapag first login ngayong araw (Nanggaling sa lumang code)
                if ($student['last_active_date'] !== $today) {
                    $updateQ = "UPDATE students SET lms_login_count = lms_login_count + 1, last_active_date = :today WHERE student_id = :sid";
                    $uStmt = $pdo->prepare($updateQ);
                    $uStmt->execute(['today' => $today, 'sid' => $studentId]);
                }
                echo json_encode(["status" => "success", "message" => "Login recorded"]);

            } else if ($type === 'ping') {
                // LOGIC PARA SA PING: Mag-a-add ng 1 minute sa dalawang tables
                // Gumamit tayo ng Transactions para sabay papasok ang data at walang sablay
                $pdo->beginTransaction();

                // A. UPDATE OVERALL TOTAL (Sa students table)
                $updateTotal = "UPDATE students SET lms_total_minutes = lms_total_minutes + 1 WHERE student_id = :sid";
                $pdo->prepare($updateTotal)->execute(['sid' => $studentId]);

                // B. UPDATE DAILY USAGE (Para maging 100% accurate yung Weekly Line Chart natin)
                $updateDaily = "
                    INSERT INTO lms_daily_usage (student_id, usage_date, minutes_spent) 
                    VALUES (:sid, :today, 1)
                    ON DUPLICATE KEY UPDATE minutes_spent = minutes_spent + 1
                ";
                $pdo->prepare($updateDaily)->execute(['sid' => $studentId, 'today' => $today]);

                $pdo->commit();
                echo json_encode(["status" => "success", "message" => "1 minute added to overall and daily tracking"]);
            }

        } else {
            echo json_encode(["status" => "error", "message" => "Student not found"]);
        }
    } catch (PDOException $e) {
        // I-rollback kung nag-error para walang basag na data
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Missing parameters"]);
}
?>