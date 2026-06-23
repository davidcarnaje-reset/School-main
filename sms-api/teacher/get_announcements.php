<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once '../config.php';

$authHeader = '';

if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} elseif (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    }
}

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode([
        "status" => "error", 
        "message" => "Unauthorized: Token required."
    ]);
    exit();
}

$userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$role = isset($_GET['role']) ? $_GET['role'] : 'teacher';
$fetchType = isset($_GET['fetch_type']) ? $_GET['fetch_type'] : 'both'; 

if (!$userId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID is required."]);
    exit();
}

try {
    $params = [
        ':uid_read' => $userId,
        ':role_read' => $role,
        ':uid_react' => $userId,
        ':role_react' => $role
    ];
    
    if ($fetchType === 'general') {
    $whereClause = "(nr.recipient_role = :role_where OR nr.recipient_role = 'all') AND LOWER(nr.recipient_id) = 'all'";
    $params[':role_where'] = $role;
} else if ($fetchType === 'specific') {
    // FIX: Check both recipient_id AND recipient_role for specific notifications
    $whereClause = "nr.recipient_id = :uid_where AND nr.recipient_role = :role_where AND LOWER(nr.recipient_id) != 'all'";
    $params[':uid_where'] = $userId;
    $params[':role_where'] = $role;
} else {
    $whereClause = "(nr.recipient_id = :uid_where AND nr.recipient_role = :role_where AND LOWER(nr.recipient_id) != 'all') OR ((nr.recipient_role = :role_where2 OR nr.recipient_role = 'all') AND LOWER(nr.recipient_id) = 'all')";
    $params[':uid_where'] = $userId;
    $params[':role_where'] = $role;
    $params[':role_where2'] = $role;
}

    $query = "SELECT DISTINCT
                n.id, 
                n.title, 
                n.message, 
                n.type, 
                n.sender_role, 
                n.created_at,
                n.attachment,
                nr.recipient_id,
                u.full_name as sender_name,
                u.profile_image as sender_image,
                
                IF(n_read.id IS NOT NULL, 1, 0) as is_read,
                n_react.reaction
                
              FROM notifications n
              JOIN notification_recipients nr ON n.id = nr.notification_id
              LEFT JOIN users u ON n.sender_id = u.id
              
              LEFT JOIN notification_reads n_read 
                  ON n.id = n_read.notification_id 
                  AND n_read.user_id = :uid_read 
                  AND n_read.user_role = :role_read
                  
              LEFT JOIN notification_reactions n_react 
                  ON n.id = n_react.notification_id 
                  AND n_react.user_id = :uid_react 
                  AND n_react.user_role = :role_react
                  
              WHERE $whereClause
              ORDER BY n.created_at DESC 
              LIMIT 50";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data" => $announcements ?: []
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
}
?>