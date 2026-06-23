<?php
/**
 * Location: sms-api/notifications/get_student_announcements.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require_once '../config.php';

// 1. Kunin ang student_id mula sa URL
$student_id = $_GET['student_id'] ?? '';

if (empty($student_id)) {
    echo json_encode([
        "success" => false,
        "message" => "Student ID is required."
    ]);
    exit();
}

try {
    /**
     * 2. SQL LOGIC:
     * Gagamit tayo ng JOIN sa 'notification_recipients' table.
     * Ito ay para makuha lang ang notifications na naka-tag para sa ID ng student na ito.
     */
    $sql = "SELECT 
                n.title, 
                n.message, 
                n.type, 
                DATE_FORMAT(n.created_at, '%M %d, %Y') as date_posted 
            FROM notifications n
            INNER JOIN notification_recipients nr ON n.id = nr.notification_id
            WHERE nr.recipient_id = :student_id 
              AND nr.recipient_role = 'student'
            ORDER BY n.created_at DESC 
            LIMIT 5";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['student_id' => $student_id]);
    $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => $announcements
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false, 
        "message" => "Database Error: " . $e->getMessage()
    ]);
}
?>