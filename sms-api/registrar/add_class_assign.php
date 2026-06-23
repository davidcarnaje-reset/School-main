<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS')
    exit();

$data = json_decode(file_get_contents("php://input"));

// ARCHITECT FIX: Pinalitan ang `room` ng `room_id` sa validation
if (empty($data->teacher_id) || empty($data->subject_id) || empty($data->section_id) || empty($data->start_time) || empty($data->days) || empty($data->room_id)) {
    echo json_encode(["success" => false, "message" => "Please complete all schedule details including the Room."]);
    exit();
}

try {
    $tid = $data->teacher_id;
    $sid = $data->section_id;
    $room_id = intval($data->room_id); // Siguraduhing integer ang ID

    $days = $data->days;
    $start = $data->start_time;
    $end = $data->end_time;
    $sy = $data->school_year;

    // ARCHITECT FIX: PHP Time Logic Validation
    if (strtotime($start) >= strtotime($end)) {
        echo json_encode(["success" => false, "message" => "Invalid Schedule: End time must be after start time."]);
        exit();
    }

    // Check if within school hours (Hal: 6 AM to 10 PM)
    if (strtotime($start) < strtotime("06:00") || strtotime($end) > strtotime("22:00")) {
        echo json_encode(["success" => false, "message" => "Invalid Schedule: Classes must be between 6:00 AM and 10:00 PM."]);
        exit();
    }

    // DYNAMIC DAY CHECKER (Kapareho nung huli nating inayos)
    $daysArray = explode(',', $days);
    $dayConditions = [];
    foreach ($daysArray as $d) {
        $safeD = preg_replace('/[^a-zA-Z]/', '', $d);
        if (!empty($safeD)) {
            $dayConditions[] = "FIND_IN_SET('$safeD', ca.days) > 0";
        }
    }
    $dayQueryPart = "(" . implode(" OR ", $dayConditions) . ")";

    // CONFLICT CHECK QUERY
    // ARCHITECT FIX: Idinagdag ang LEFT JOIN rooms para makuha ang pangalan ng kwarto sa error message
    // at pinalitan ang `ca.room = :room` ng `ca.room_id = :room_id`
    $check_sql = "SELECT ca.*, u.full_name as teacher, sub.subject_code, sec.section_name, r.room_name 
                  FROM class_assignments ca
                  JOIN users u ON ca.teacher_id = u.id
                  JOIN subjects sub ON ca.subject_id = sub.id
                  JOIN sections sec ON ca.section_id = sec.id
                  LEFT JOIN rooms r ON ca.room_id = r.id
                  WHERE ca.is_active = 1 
                  AND $dayQueryPart 
                  AND (:start < ca.end_time AND :end > ca.start_time)
                  AND (ca.teacher_id = :tid OR ca.room_id = :room_id OR ca.section_id = :sid)";

    $stmt_check = $pdo->prepare($check_sql);
    $stmt_check->execute([
        ':start' => $start,
        ':end' => $end,
        ':tid' => $tid,
        ':room_id' => $room_id,
        ':sid' => $sid
    ]);

    $conflict = $stmt_check->fetch(PDO::FETCH_ASSOC);

    if ($conflict) {
        $reason = "";
        if ($conflict['teacher_id'] == $tid)
            $reason = "Teacher " . $conflict['teacher'] . " is already busy.";
        else if ($conflict['room_id'] == $room_id)
            $reason = "Room " . ($conflict['room_name'] ?? 'Selected Room') . " is already occupied.";
        else if ($conflict['section_id'] == $sid)
            $reason = "Section " . $conflict['section_name'] . " already has a class.";

        echo json_encode([
            "success" => false,
            "message" => "CONFLICT: " . $reason . " (Time: " . $conflict['schedule'] . ")"
        ]);
        exit();
    }

    // KUNG WALANG CONFLICT, PROCEED SA INSERT
    // ARCHITECT FIX: `room_id` na ang ise-save natin
    $sql_insert = "INSERT INTO class_assignments 
                    (teacher_id, subject_id, section_id, room_id, schedule, days, start_time, end_time, school_year) 
                   VALUES 
                    (:tid, :subid, :sid, :room_id, :sched, :days, :start, :end, :sy)";

    $stmt_insert = $pdo->prepare($sql_insert);
    $stmt_insert->execute([
        ':tid' => $tid,
        ':subid' => $data->subject_id,
        ':sid' => $sid,
        ':room_id' => $room_id,
        ':sched' => $data->schedule,
        ':days' => $days,
        ':start' => $start,
        ':end' => $end,
        ':sy' => $sy
    ]);

    echo json_encode(["success" => true, "message" => "Class assignment saved successfully!"]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>