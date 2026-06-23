<?php
include_once '../config.php';
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$studentId = $_GET['student_id'] ?? '';

if (!$studentId) {
    echo json_encode(["status" => "error", "message" => "Missing student ID"]);
    exit;
}

try {
    // Kukunin natin sa ENROLLED_CLASSES para 100% accurate sa mismong estudyante!
    $schedQuery = "
        SELECT 
            ca.id as class_id,
            s.subject_code as code,
            s.subject_description as subject,
            ca.days,
            TIME_FORMAT(ca.start_time, '%h:%i %p') as startTime,
            TIME_FORMAT(ca.end_time, '%h:%i %p') as endTime,
            CONCAT(u.first_name, ' ', u.last_name) as teacher,
            r.room_name as room
        FROM enrolled_classes ec
        JOIN class_assignments ca ON ec.class_assignment_id = ca.id
        JOIN subjects s ON ca.subject_id = s.id
        LEFT JOIN users u ON ca.teacher_id = u.id
        LEFT JOIN rooms r ON ca.room_id = r.id
        WHERE ec.student_id = :student_id AND ec.status = 'Enrolled'
        ORDER BY ca.start_time ASC
    ";

    $stmt = $pdo->prepare($schedQuery);
    $stmt->execute(['student_id' => $studentId]);
    $schedule = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Dynamic colors for UI visual interest
    $bgColors = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'];
    foreach ($schedule as $index => &$class) {
        $class['color'] = $bgColors[$index % count($bgColors)];
    }

    echo json_encode([
        "status" => "success",
        "schedule" => $schedule
    ]);

} catch (PDOException $e) {
    error_log("Schedule API Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Database error"]);
}
?>