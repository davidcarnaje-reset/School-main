<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// I-connect sa config mo
include_once '../config.php';

$target_dir = "../uploads/promotions/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

try {
    $title = $_POST['title'] ?? '';
    $subtitle = $_POST['subtitle'] ?? '';
    $button_text = $_POST['button_text'] ?? '';
    $button_link = $_POST['button_link'] ?? '';

    if (isset($_FILES["image_file"])) {
        $filename = time() . '_' . basename($_FILES["image_file"]["name"]);
        $target_file = $target_dir . $filename;

        if (move_uploaded_file($_FILES["image_file"]["tmp_name"], $target_file)) {
            $query = "INSERT INTO landing_promotions (image_file, title, subtitle, button_text, button_link, is_active) 
                      VALUES (:image, :title, :subtitle, :btext, :blink, 1)";

            // 👇 ARCHITECT FIX: Gamit na natin ang $pdo mula sa config.php
            $stmt = $pdo->prepare($query);

            $stmt->bindParam(':image', $filename);
            $stmt->bindParam(':title', $title);
            $stmt->bindParam(':subtitle', $subtitle);
            $stmt->bindParam(':btext', $button_text);
            $stmt->bindParam(':blink', $button_link);

            if ($stmt->execute()) {
                // BONUS: I-log sa Audit Trail!
                if (function_exists('logAuditTrail')) {
                    logAuditTrail($pdo, "ADD_PROMOTION", "Added new landing page banner: " . $title);
                }
                echo json_encode(["success" => true, "message" => "Promotion banner added!"]);
            } else {
                echo json_encode(["success" => false, "message" => "Database error."]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Failed to upload image."]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Image file is required."]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>