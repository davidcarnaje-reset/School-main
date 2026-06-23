<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Payagan ang React na kumonekta sa PHP natin (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'config.php';

// I-JOIN natin ang students at enrollments table
// Kukunin lang natin ang mga 'Pending' ang status
$sql = "SELECT 
            s.student_id, 
            s.first_name, 
            s.last_name, 
            e.grade_level, 
            e.enrollment_type,
            DATE_FORMAT(e.created_at, '%b %d, %Y') as date_added
        FROM students s
        JOIN enrollments e ON s.student_id = e.student_id
        WHERE e.status = 'Pending'
        ORDER BY e.id DESC";

$result = $conn->query($sql);
$pending_students = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $pending_students[] = $row;
    }
    // Ibalik ang data papuntang React bilang JSON format
    echo json_encode($pending_students);
} else {
    // Kung may error sa database query
    echo json_encode(["success" => false, "message" => "Database Error: " . $errorInfo[2]]);
}

$conn->close();
?>