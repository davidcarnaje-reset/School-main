<?php
/**
 * REGISTRAR: CANCEL/VOID REQUEST ENGINE
 * Logic: Update status to 'Cancelled' (Audit Trail preserved)
 * Status: SECURE / PDO / STATUS-GUARDED
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require '../config.php'; // Gagamit ng $pdo variable

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        /**
         * ARCHITECT STATUS GUARD:
         * Siniguro natin na 'Pending Payment' lang ang pwedeng i-cancel.
         * Kapag 'Paid' na o 'Released' na ang document, hindi na ito dapat ma-cancel 
         * nang basta-basta sa Registrar side (kailangan na ng Finance intervention).
         */
        $sql = "UPDATE service_requests 
                SET status = 'Cancelled' 
                WHERE id = :id 
                AND status = 'Pending Payment'";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => intval($data->id)]);

        // I-check kung may nabagong row (rowCount)
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                "success" => true,
                "message" => "Request has been successfully cancelled and voided."
            ]);
        } else {
            /**
             * Kung 0 ang rowCount, dalawa lang ang ibig sabihin:
             * 1. Hindi nage-exist yung ID.
             * 2. Ang status ay hindi na 'Pending Payment' (binayaran na o released na).
             */
            echo json_encode([
                "success" => false,
                "message" => "Unable to cancel. Request might be paid already or does not exist."
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
        "message" => "Request ID is missing."
    ]);
}
?>