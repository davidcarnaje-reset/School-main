<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->notification_id) && !empty($data->user_id) && !empty($data->role)) {
    try {
        // Gagamitin natin ang bagong notification_reactions table
        $query = "INSERT INTO notification_reactions (notification_id, user_id, user_role, reaction, reacted_at) 
                  VALUES (:n_id, :u_id, :role, :reaction, NOW())
                  ON DUPLICATE KEY UPDATE 
                  reaction = VALUES(reaction), 
                  reacted_at = NOW()";

        $stmt = $pdo->prepare($query);
        $stmt->execute([
            'n_id' => $data->notification_id,
            'u_id' => $data->user_id,
            'role' => $data->role,
            'reaction' => $data->reaction ?? null
        ]);

        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing required data."]);
}
?>