<?php
require_once '../config.php';
header("Content-Type: application/json; charset=UTF-8");

try {
    // ARCHITECT UPDATE: Ginamit natin ang 'id AS room_id' para match sa database at React mo
    $query = "SELECT id AS room_id, room_name, room_type, capacity, status FROM rooms ORDER BY room_name ASC";
    $stmt = $pdo->prepare($query);
    $stmt->execute();

    $rooms_arr = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        array_push($rooms_arr, $row);
    }

    echo json_encode($rooms_arr);

} catch (PDOException $e) {
    echo json_encode(array("status" => "error", "message" => "Database error: " . $e->getMessage()));
}
?>