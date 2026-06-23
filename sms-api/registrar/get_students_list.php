<?php
// registrar/get_students_list.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// ARCHITECT UPDATE: Dahil nasa 'registrar' folder, aakyat tayo ng isa para sa config.php
require '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    /**
     * ARCHITECT SQL:
     * Siniguro nating makuha ang Academic Program details (Strand/Course) 
     * at Enrollment status sa iisang query lang para mabilis ang loading.
     */
    $sql = "SELECT 
                s.*, 
                e.grade_level, 
                e.status as enrollment_status, 
                e.enrollment_type, 
                e.school_year, 
                e.prev_school, 
                p.program_code, 
                p.program_description, 
                p.major 
            FROM students s 
            LEFT JOIN enrollments e ON s.student_id = e.student_id 
            LEFT JOIN academic_programs p ON e.program_id = p.id 
            ORDER BY s.last_name ASC";

    $stmt = $pdo->query($sql);
    $results = $stmt->fetchAll();

    $students = [];

    foreach ($results as $row) {
        // SECURITY: Siguradong burado ang password bago i-send sa Frontend
        unset($row['password']);

        // DATA CLEANING: Logic mo ito, Team Leader! Very effective.
        if (empty($row['grade_level'])) {
            $row['grade_level'] = 'Unassigned';
            $row['enrollment_status'] = 'New Profile';
        }

        $students[] = $row;
    }

    // Ibalik ang clean array. Empty array [] kung walang nahanap.
    echo json_encode($students ?: []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database Error: " . $e->getMessage()
    ]);
}
?>