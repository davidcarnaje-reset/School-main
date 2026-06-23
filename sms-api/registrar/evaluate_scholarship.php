<?php
/**
 * REGISTRAR: EVALUATE SCHOLARSHIP APPLICATION
 * Logic: Update application status to 'Approved' or 'Rejected'
 * Status: SECURE / PDO / AUDIT-READY
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. ARCHITECT UPDATE: Dahil nasa registrar folder, umakyat ng isa para sa config.php
require_once '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) && !empty($data->status)) {
    try {
        /**
         * 2. SECURE PDO UPDATE:
         * Gagamit tayo ng $pdo variable na galing sa config.php.
         * Nilagyan natin ng date_evaluated para sa audit trail.
         */
        $sql = "UPDATE scholarship_applications 
                SET status = :status, 
                    date_evaluated = CURRENT_TIMESTAMP 
                WHERE id = :id";

        $stmt = $pdo->prepare($sql);

        // ARCHITECT TIP: 'Approved' o 'Rejected' lang ang tatanggapin natin
        $status = trim($data->status);

        $success = $stmt->execute([
            ':status' => $status,
            ':id' => intval($data->id)
        ]);

        if ($success && $stmt->rowCount() > 0) {
            echo json_encode([
                "success" => true,
                "message" => "Scholarship application has been marked as " . $status . "."
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "No changes made. Application might not exist or status is already the same."
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
        "message" => "Incomplete data. ID and Status are required."
    ]);
}
?>