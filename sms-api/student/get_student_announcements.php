<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php'; // I-adjust ang path kung kailangan

$student_id = $_GET['student_id'] ?? ''; // Pwede rin gamitin ang user ID ng bata mula sa 'users' table

if (!$student_id) {
    echo json_encode(["success" => false, "message" => "Student ID is required."]);
    exit;
}

try {
    // Kukunin natin ang mga announcements. 
    // Isasama natin yung mga naka-address directly sa student (via notification_recipients)
    // O kaya yung mga generic broadcast na 'student' ang role (depende kung paano nag-iinsert ang admin mo).

    // Para mas safe at makuha ang general announcements:
    $stmt = $pdo->prepare("
        SELECT 
            n.id,
            n.type,
            n.title,
            n.message,
            DATE_FORMAT(n.created_at, '%b %d, %Y') as date_posted
        FROM notifications n
        WHERE n.type IN ('Announcement', 'Urgent Alert', 'Task Reminder')
        ORDER BY n.created_at DESC
        LIMIT 5
    ");
    $stmt->execute();
    $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => $announcements
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>