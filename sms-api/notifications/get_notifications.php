<?php
// notifications/get_notifications.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../config.php';

// Kunin ang ID at Role ng naka-login mula sa GET request (ipapasa ng React)
$user_id = $_GET['user_id'] ?? '';
$role = $_GET['role'] ?? '';

if (empty($user_id) || empty($role)) {
    echo json_encode(["success" => false, "message" => "User context missing."]);
    exit();
}

try {
    // 1. QUERY PARA SA LISTAHAN NG NOTIFICATIONS
    // Gagamit tayo ng JOIN para makuha ang detalye mula sa 'notifications' table
    // base sa record sa 'notification_recipients'
    $query = "SELECT 
                n.id, 
                n.type, 
                n.title, 
                n.message, 
                n.attachment, 
                n.sender_role,
                n.created_at,
                nr.is_read,
                nr.reaction,
                -- Kunin natin ang pangalan ng sender (Join sa users table)
                u.full_name as sender_name,
                u.profile_image as sender_image
              FROM notification_recipients nr
              JOIN notifications n ON nr.notification_id = n.id
              LEFT JOIN users u ON n.sender_id = u.id
              WHERE nr.recipient_id = :user_id 
              AND nr.recipient_role = :role
              ORDER BY n.created_at DESC 
              LIMIT 20";

    $stmt = $pdo->prepare($query);
    $stmt->execute(['user_id' => $user_id, 'role' => $role]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. BILANGIN ANG UNREAD PARA SA RED BADGE
    $count_query = "SELECT COUNT(*) FROM notification_recipients 
                    WHERE recipient_id = :user_id 
                    AND recipient_role = :role 
                    AND is_read = 0";
    $count_stmt = $pdo->prepare($count_query);
    $count_stmt->execute(['user_id' => $user_id, 'role' => $role]);
    $unread_count = $count_stmt->fetchColumn();

    echo json_encode([
        "success" => true,
        "notifications" => $notifications,
        "unread_count" => (int) $unread_count
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}