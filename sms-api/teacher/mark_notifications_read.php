<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

// Check for Authorization Token (optional but secure)
$headers = apache_request_headers();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized: Token required."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$userId = $data['user_id'] ?? null;
$role = $data['role'] ?? 'teacher';

if (!$userId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID is required."]);
    exit();
}

try {
    // 🟢 I-UPDATE ANG NOTIFICATIONS PARA SA SPECIFIC NA USER 
    $stmt1 = $pdo->prepare("UPDATE notification_recipients 
                            SET is_read = 1, read_at = CURRENT_TIMESTAMP 
                            WHERE recipient_id = ? AND is_read = 0");
    $stmt1->execute([$userId]);

    // 🟢 I-UPDATE ANG MGA 'GENERAL' NOTIFICATIONS (kung saan recipient_id ay 'all')
    $stmt2 = $pdo->prepare("UPDATE notification_recipients 
                            SET is_read = 1, read_at = CURRENT_TIMESTAMP 
                            WHERE recipient_id = 'all' AND (recipient_role = ? OR recipient_role = 'all') AND is_read = 0");
    $stmt2->execute([$role]);

    echo json_encode([
        "status" => "success", 
        "message" => "All notifications marked as read."
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
}
?>