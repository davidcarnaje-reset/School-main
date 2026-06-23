<?php
// notifications/mark_as_read.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->notification_id) && !empty($data->user_id)) {
    try {
        $query = "UPDATE notification_recipients 
                  SET is_read = 1, read_at = NOW() 
                  WHERE notification_id = :n_id 
                  AND recipient_id = :u_id";

        $stmt = $pdo->prepare($query);
        $stmt->execute([
            'n_id' => $data->notification_id,
            'u_id' => $data->user_id
        ]);

        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}