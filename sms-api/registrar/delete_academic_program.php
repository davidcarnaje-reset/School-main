<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// ARCHITECT UPDATE: PDO Connection
require '../config.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        $id = intval($data->id);

        // 1. ARCHITECT UPDATE: PDO Syntax
        $sql = "DELETE FROM academic_programs WHERE id = :id";
        $stmt = $pdo->prepare($sql);

        // 2. I-execute na natin
        if ($stmt->execute(['id' => $id])) {
            echo json_encode(["success" => true, "message" => "Program deleted successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete program."]);
        }
    } catch (PDOException $e) {
        // 3. INTEGRITY CHECK: 
        // Kapag ang program ay may naka-enroll nang students, bawal itong i-delete (Foreign Key Protection).
        http_response_code(400); // Bad Request
        echo json_encode([
            "success" => false,
            "message" => "Cannot delete: This program is currently linked to students or courses."
        ]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Program ID is missing."]);
}
?>