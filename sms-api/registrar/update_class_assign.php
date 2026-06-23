<?php
/**
 * REGISTRAR: UPDATE EXISTING CLASS ASSIGNMENT (UPGRADED VERSION)
 * Location: sms-api/registrar/update_class_assign.php
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../config.php';

$data = json_decode(file_get_contents("php://input"));

// 1. VALIDATION
if (empty($data->id) || empty($data->teacher_id) || empty($data->subject_id) || empty($data->section_id) || empty($data->room_id)) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit;
}

try {
    /**
     * 🛑 ARCHITECT UPDATE:
     * Pinalitan na natin ang 'room' (text) ng 'room_id' (Foreign Key)
     * Idinagdag na rin natin ang days, start_time, at end_time para sa schedule format
     */
    $sql = "UPDATE class_assignments SET 
                teacher_id = :tid, 
                subject_id = :subid, 
                section_id = :secid, 
                room_id = :rid, 
                schedule = :sched, 
                days = :days, 
                start_time = :st, 
                end_time = :et 
            WHERE id = :id";

    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([
        ':tid' => $data->teacher_id,
        ':subid' => $data->subject_id,
        ':secid' => $data->section_id,
        ':rid' => $data->room_id,
        ':sched' => $data->schedule,
        ':days' => $data->days,
        ':st' => $data->start_time,
        ':et' => $data->end_time,
        ':id' => $data->id
    ]);

    echo json_encode([
        "success" => $success,
        "message" => "Class assignment updated successfully."
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Update Error: " . $e->getMessage()
    ]);
}
?>