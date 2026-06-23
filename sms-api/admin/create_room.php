<?php
require_once '../config.php';
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->room_name) && !empty($data->capacity)) {

    $room_name = htmlspecialchars(strip_tags($data->room_name));
    $room_type = htmlspecialchars(strip_tags($data->room_type));
    $capacity = htmlspecialchars(strip_tags($data->capacity));

    try {
        // ARCHITECT UPDATE: Pinalitan ang 'room_id' ng 'id' para sa duplicate checker
        $check_query = "SELECT id FROM rooms WHERE room_name = :room_name LIMIT 1";
        $check_stmt = $pdo->prepare($check_query);
        $check_stmt->bindParam(':room_name', $room_name);
        $check_stmt->execute();

        if ($check_stmt->rowCount() > 0) {
            echo json_encode(array("status" => "error", "message" => "Room name already exists."));
            exit();
        }

        $query = "INSERT INTO rooms (room_name, room_type, capacity, status) VALUES (:room_name, :room_type, :capacity, 'Active')";
        $stmt = $pdo->prepare($query);

        $stmt->bindParam(':room_name', $room_name);
        $stmt->bindParam(':room_type', $room_type);
        $stmt->bindParam(':capacity', $capacity);

        if ($stmt->execute()) {

            // ==========================================
            // 📝 AUDIT TRAIL SNIPPET
            // ==========================================
            $action_type = 'CREATE_ROOM';
            $log_desc = "Added a new room: " . $room_name . " (" . $room_type . ")";
            logAuditTrail($pdo, $action_type, $log_desc);
            // ==========================================

            echo json_encode(array("status" => "success", "message" => "Room created successfully."));

        } else {
            echo json_encode(array("status" => "error", "message" => "Unable to create room."));
        }

    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => "Database error: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("status" => "error", "message" => "Incomplete data. Room name and capacity are required."));
}
?>