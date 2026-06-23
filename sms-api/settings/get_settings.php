<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
include_once '../config.php';

if (isset($_GET['user_id']) && isset($_GET['user_role'])) {
    try {
        $stmt = $pdo->prepare("SELECT dark_mode, theme_color, dashboard_type, email_notifications FROM user_settings WHERE user_id = :uid AND user_role = :urole");
        $stmt->execute(['uid' => $_GET['user_id'], 'urole' => $_GET['user_role']]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($settings) {
            echo json_encode(["status" => "success", "settings" => $settings]);
        } else {
            // Default settings
            echo json_encode([
                "status" => "success",
                "settings" => [
                    "dark_mode" => 0,
                    "theme_color" => "#2563eb",
                    "dashboard_type" => "standard",
                    "email_notifications" => 1
                ]
            ]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Missing parameters"]);
}
?>