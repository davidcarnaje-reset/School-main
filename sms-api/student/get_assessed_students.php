<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'config.php';

// Kukunin natin yung mga students na ang status ay 'Assessed' (meaning ready to pay sa Cashier)
$sql = "SELECT 
            s.student_id, 
            s.first_name, 
            s.last_name, 
            e.grade_level, 
            p.program_code,
            DATE_FORMAT(e.created_at, '%b %d, %Y') as date_added
        FROM students s
        JOIN enrollments e ON s.student_id = e.student_id
        LEFT JOIN academic_programs p ON e.program_id = p.id
        WHERE e.status = 'Assessed'
        ORDER BY e.id DESC";

$result = $conn->query($sql);
$assessed_students = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $assessed_students[] = $row;
    }
    echo json_encode($assessed_students);
} else {
    echo json_encode(["success" => false, "message" => "Database Error: " . $errorInfo[2]]);
}

$conn->close();
?>