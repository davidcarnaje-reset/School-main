<?php
// registrar/delete_assignment.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. ARCHITECT UPDATE: Dahil nasa root na ang config.php, umakyat lang ng isang folder
require_once '../config.php';

// 2. Basahin ang JSON input
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        /**
         * 3. SECURE PDO UPDATE:
         * Gagamit tayo ng $pdo variable na galing sa config.php mo.
         * ARCHITECT CHOICE: Set is_active = 0 (Soft Delete) para sa Data Integrity.
         */
        $query = "UPDATE teacher_assignments SET is_active = 0 WHERE id = :id";

        $stmt = $pdo->prepare($query);

        // Gamit ang bindValue para sa cleaner integer handling
        $stmt->bindValue(':id', intval($data->id), PDO::PARAM_INT);

        if ($stmt->execute()) {
            echo json_encode([
                "success" => true,
                "message" => "Class assignment has been successfully deactivated."
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Failed to update record status."
            ]);
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Database Error: " . $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Assignment ID is missing."
    ]);
}
?>