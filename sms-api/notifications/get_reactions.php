<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../config.php';

$notification_id = $_GET['notification_id'] ?? '';

if (empty($notification_id)) {
    echo json_encode(["success" => false, "message" => "Notification ID is required."]);
    exit();
}

try {
    $query = "
        SELECT 
            nr.reaction,
            nr.reacted_at,
            nr.user_role as recipient_role,
            CASE 
                WHEN nr.user_role = 'student' THEN CONCAT(s.first_name, ' ', s.last_name)
                ELSE u.full_name 
            END as reactor_name,
            CASE 
                WHEN nr.user_role = 'student' THEN s.profile_image
                ELSE u.profile_image 
            END as profile_image
        FROM notification_reactions nr
        LEFT JOIN students s ON nr.user_id = s.student_id AND nr.user_role = 'student'
        LEFT JOIN users u ON nr.user_id = u.id AND nr.user_role != 'student'
        WHERE nr.notification_id = :notif_id 
        AND nr.reaction IS NOT NULL
        ORDER BY nr.reacted_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute(['notif_id' => $notification_id]);
    $reactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $summary = ['like' => 0, 'heart' => 0, 'noted' => 0, 'total' => count($reactions)];
    foreach ($reactions as $r) {
        if (isset($summary[$r['reaction']])) $summary[$r['reaction']]++;
    }

    echo json_encode(["success" => true, "summary" => $summary, "reactors" => $reactions]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>