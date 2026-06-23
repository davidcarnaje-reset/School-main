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
$data = json_decode(file_get_contents("php://input"));

try {
    $query = "DELETE FROM landing_promotions WHERE id = :id";

    // 👇 ARCHITECT FIX: Gamit na natin ang $pdo
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $data->id);

    if ($stmt->execute()) {
        // BONUS: I-log sa Audit Trail!
        if (function_exists('logAuditTrail')) {
            logAuditTrail($pdo, "DELETE_PROMOTION", "Deleted a landing page banner with ID: " . $data->id);
        }
        echo json_encode(["success" => true, "message" => "Promotion deleted!"]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>