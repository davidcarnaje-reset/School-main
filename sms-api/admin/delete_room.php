<?php
require_once '../config.php';
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    $id = htmlspecialchars(strip_tags($data->id));

    try {
        $query = "DELETE FROM rooms WHERE id = :id";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {

            // ARCHITECT UPDATE: I-check muna natin kung may totoong nabura sa database
            if ($stmt->rowCount() > 0) {

                // ==========================================
                // 📝 AUDIT TRAIL SNIPPET
                // ==========================================
                $action_type = 'DELETE_ROOM';
                $log_desc = "Deleted a room with ID: " . $id;
                logAuditTrail($pdo, $action_type, $log_desc);
                // ==========================================

                echo json_encode(["status" => "success", "message" => "Room deleted successfully."]);
            } else {
                // Kung nag-execute pero walang nabura (halimbawa, na-delete na pala kanina)
                echo json_encode(["status" => "error", "message" => "Room not found or already deleted."]);
            }

        } else {
            echo json_encode(["status" => "error", "message" => "Unable to delete room."]);
        }
    } catch (PDOException $e) {
        // Saluhin kung may Foreign Key constraint error (ex: May mga klase na naka-assign sa room na ito)
        echo json_encode(["status" => "error", "message" => "Database error: Cannot delete room. It might be in use."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No ID provided."]);
}
?>