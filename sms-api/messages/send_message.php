<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config.php';

// Kunin ang POST data (assuming JSON payload from axios)
$data = json_decode(file_get_contents("php://input"));

if (isset($data->sender_id) && isset($data->receiver_id)) {
    $senderId = $data->sender_id;
    $senderRole = $data->sender_role;
    $receiverId = $data->receiver_id;
    $receiverRole = $data->receiver_role;
    $messageText = $data->message;
    $today = date('Y-m-d');

    try {
        // GATEKEEPER LOGIC: Check limits if Student is messaging Staff
        if ($senderRole === 'student' && in_array($receiverRole, ['teacher', 'registrar', 'cashier', 'admin'])) {

            // 1. Tumingin sa bagong `user_settings` table
            $stmtSettings = $pdo->prepare("SELECT msg_limit_active, msg_limit_per_day FROM user_settings WHERE user_id = :rid AND user_role = :rrole");
            $stmtSettings->execute(['rid' => $receiverId, 'rrole' => $receiverRole]);
            $staffSettings = $stmtSettings->fetch(PDO::FETCH_ASSOC);

            // Default fallback kung wala pa silang record sa settings table
            $isLimitActive = $staffSettings ? $staffSettings['msg_limit_active'] : 1;
            $limitPerDay = $staffSettings ? $staffSettings['msg_limit_per_day'] : 3;

            if ($isLimitActive == 1) {
                // 2. Bilangin kung nakailang message na ang student na ito sa staff TODAY
                $stmtCount = $pdo->prepare("SELECT message_count FROM message_limits WHERE student_id = :sid AND staff_id = :rid AND message_date = :today");
                $stmtCount->execute(['sid' => $senderId, 'rid' => $receiverId, 'today' => $today]);
                $currentLimit = $stmtCount->fetch(PDO::FETCH_ASSOC);

                $currentCount = $currentLimit ? $currentLimit['message_count'] : 0;

                // 3. I-block kung umabot na sa limit
                if ($currentCount >= $limitPerDay) {
                    echo json_encode([
                        "status" => "error",
                        "error_code" => "LIMIT_REACHED",
                        "message" => "You have reached the daily message limit ($limitPerDay) for this staff member. Please try again tomorrow."
                    ]);
                    exit;
                }

                // 4. Update or Insert tracker
                if ($currentLimit) {
                    $pdo->prepare("UPDATE message_limits SET message_count = message_count + 1 WHERE student_id = :sid AND staff_id = :rid AND message_date = :today")
                        ->execute(['sid' => $senderId, 'rid' => $receiverId, 'today' => $today]);
                } else {
                    $pdo->prepare("INSERT INTO message_limits (student_id, staff_id, message_date, message_count) VALUES (:sid, :rid, :today, 1)")
                        ->execute(['sid' => $senderId, 'rid' => $receiverId, 'today' => $today]);
                }
            }
        }

        // 5. I-SAVE ANG MESSAGE SA DATABASE
        $stmtInsertMsg = $pdo->prepare("INSERT INTO messages (sender_id, sender_role, receiver_id, receiver_role, message) VALUES (:sid, :srole, :rid, :rrole, :msg)");
        $stmtInsertMsg->execute([
            'sid' => $senderId,
            'srole' => $senderRole,
            'rid' => $receiverId,
            'rrole' => $receiverRole,
            'msg' => $messageText
        ]);

        echo json_encode(["status" => "success", "message" => "Message sent successfully"]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Incomplete payload"]);
}
?>