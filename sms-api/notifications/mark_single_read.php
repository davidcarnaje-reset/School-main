<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight requests mula sa Axios
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../config.php';

$data = json_decode(file_get_contents("php://input"));

// I-verify kung kumpleto ang pinasang data mula sa React
if (!empty($data->notification_id) && !empty($data->user_id) && !empty($data->role)) {
    try {
        // Gagamitin natin ang INSERT IGNORE.
        // Ibig sabihin, kung may record na ang user na ito (dahil sa UNIQUE KEY natin),
        // i-i-ignore na lang ng database ang query at hindi mag-e-error. Tipid sa server resources!
        $query = "INSERT IGNORE INTO notification_reads (notification_id, user_id, user_role) 
                  VALUES (:n_id, :u_id, :role)";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            'n_id' => $data->notification_id,
            'u_id' => $data->user_id,
            'role' => $data->role
        ]);

        echo json_encode(["success" => true, "message" => "Notification marked as read."]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
}
?>