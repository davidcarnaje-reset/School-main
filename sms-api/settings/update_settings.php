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

$data = json_decode(file_get_contents("php://input"));

if (isset($data->user_id) && isset($data->setting_key) && isset($data->setting_value)) {
    $uid = $data->user_id;
    $urole = $data->user_role;
    $key = $data->setting_key;
    $value = $data->setting_value;

    $allowed_keys = ['dark_mode', 'theme_color', 'dashboard_type', 'email_notifications'];
    if (!in_array($key, $allowed_keys)) {
        echo json_encode(["status" => "error", "message" => "Invalid setting key"]);
        exit;
    }

    try {
        $query = "
            INSERT INTO user_settings (user_id, user_role, $key) 
            VALUES (:uid, :urole, :val)
            ON DUPLICATE KEY UPDATE $key = :val
        ";
        $stmt = $pdo->prepare($query);
        $stmt->execute(['uid' => $uid, 'urole' => $urole, 'val' => $value]);

        echo json_encode(["status" => "success", "message" => "Setting updated"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>