<?php
/**
 * MASTERLIST: GET OFFICIALLY ENROLLED STUDENTS
 * Location: sms-api/student/get_enrolled_students.php
 * Status: SECURE / PDO / PATH-ADJUSTED
 */

error_reporting(E_ALL);
ini_set('display_errors', 0); // I-off ang errors sa output para hindi masira ang JSON

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. PATH ADJUSTMENT: Aakyat ng isa (../) dahil nasa 'student' folder tayo
require_once '../config.php';

try {
    /**
     * SQL ARCHITECTURE:
     * 1. JOIN Enrollments - Para masiguradong 'Enrolled' ang status.
     * 2. LEFT JOIN Programs - Para makuha ang Strand/Course (Optional para sa K-10).
     * 3. DATE_FORMAT - Para "Mar 26, 2026" agad ang dating sa React.
     */
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
            WHERE e.status = 'Enrolled'
            ORDER BY e.id DESC";

    // 2. Gagamit ng $pdo (mula sa config.php)
    $stmt = $pdo->query($sql);
    $enrolled_students = $stmt->fetchAll();

    // Ibalik ang data (Empty array [] kung walang nahanap para hindi mag-crash ang React .map())
    echo json_encode($enrolled_students ?: []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database Error: " . $e->getMessage()
    ]);
}
?>