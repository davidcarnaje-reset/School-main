<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';

$student_id = $_GET['student_id'] ?? '';

if (!$student_id) {
    echo json_encode(["success" => false, "message" => "Student ID is required."]);
    exit;
}

try {
    // =================================================================================
    // 1. Kunin ang Student Details + Department (Para sa Form 138 vs Transcript logic)
    // =================================================================================
    $stmt = $pdo->prepare("
        SELECT s.student_id, CONCAT(s.first_name, ' ', COALESCE(s.middle_name,''), ' ', s.last_name) AS name,
               e.grade_level, e.semester, COALESCE(ap.program_code, 'K-12 Basic Ed') AS program,
               CASE
                  WHEN e.grade_level LIKE '%College%' THEN 'College'
                  WHEN e.grade_level LIKE '%11%' OR e.grade_level LIKE '%12%' THEN 'SHS'
                  ELSE 'K-10'
               END AS department
        FROM students s
        LEFT JOIN enrollments e ON s.student_id = e.student_id
        LEFT JOIN academic_programs ap ON e.program_id = ap.id
        WHERE s.student_id = :sid ORDER BY e.created_at DESC LIMIT 1
    ");
    $stmt->execute(['sid' => $student_id]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(["success" => false, "message" => "Student not found in the database."]);
        exit;
    }

    // =================================================================================
    // 2. Kunin ang Grades at Lock Status (With Anti-Duplicate / MAX() Group By Fix)
    // =================================================================================
    $stmt2 = $pdo->prepare("
        SELECT 
            sg.class_id, 
            sg.quarter, 
            sg.final_grade, 
            sg.remarks,
            sub.subject_code AS code, 
            sub.subject_description AS description, 
            sub.units,
            COALESCE(MAX(cgl.is_locked), 0) AS is_locked
        FROM student_grades sg
        JOIN class_assignments ca ON sg.class_id = ca.id
        JOIN subjects sub ON ca.subject_id = sub.id
        LEFT JOIN class_grade_locks cgl 
            ON sg.class_id = cgl.class_id 
            AND (sg.quarter = cgl.quarter OR (sg.quarter IS NULL AND cgl.quarter IS NULL))
        WHERE sg.student_id = :sid
        GROUP BY sg.class_id, sg.quarter, sg.final_grade, sg.remarks, sub.subject_code, sub.subject_description, sub.units
    ");
    $stmt2->execute(['sid' => $student_id]);
    $grades = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "student" => $student,
        "grades" => $grades
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>