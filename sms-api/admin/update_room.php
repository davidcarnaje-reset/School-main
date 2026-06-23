<?php
require_once '../config.php';
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) && !empty($data->room_name) && !empty($data->capacity)) {
    $id = htmlspecialchars(strip_tags($data->id));
    $room_name = htmlspecialchars(strip_tags($data->room_name));
    $room_type = htmlspecialchars(strip_tags($data->room_type));
    $capacity = htmlspecialchars(strip_tags($data->capacity));
    $status = htmlspecialchars(strip_tags($data->status));

    try {
        $check_query = "SELECT id FROM rooms WHERE room_name = :room_name AND id != :id LIMIT 1";
        $check_stmt = $pdo->prepare($check_query);
        $check_stmt->bindParam(':room_name', $room_name);
        $check_stmt->bindParam(':id', $id);
        $check_stmt->execute();

        if ($check_stmt->rowCount() > 0) {
            echo json_encode(["status" => "error", "message" => "Room name already exists."]);
            exit();
        }

        $query = "UPDATE rooms SET room_name = :room_name, room_type = :room_type, capacity = :capacity, status = :status WHERE id = :id";
        $stmt = $pdo->prepare($query);

        $stmt->bindParam(':room_name', $room_name);
        $stmt->bindParam(':room_type', $room_type);
        $stmt->bindParam(':capacity', $capacity);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $id);

        // ==========================================
        // DITO PUMASOK ANG BAGONG INTEGRATION NATIN
        // ==========================================
        if ($stmt->execute()) {

            // 📝 AUDIT TRAIL SNIPPET (Automatic User Detection via config.php)
            $action_type = 'UPDATE_ROOM';
            $log_desc = "Updated room details for: " . $room_name;
            logAuditTrail($pdo, $action_type, $log_desc);

            // Isang beses lang dapat nag-e-echo ng success
            echo json_encode(["status" => "success", "message" => "Room updated successfully."]);

        } else {
            echo json_encode(["status" => "error", "message" => "Unable to update room."]);
        }
        // ==========================================

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Incomplete data."]);
}
?>