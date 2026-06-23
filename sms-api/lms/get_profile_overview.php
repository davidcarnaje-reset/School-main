<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// 1. SALUHIN ANG AXIOS PREFLIGHT REQUEST
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Gamitin ang tamang config file na may naka-set up nang $pdo
include_once '../config.php';

if (isset($_GET['student_id'])) {
    $studentId = $_GET['student_id'];

    try {
        // 3. KUNIN ANG PERSONAL AT ENROLLMENT INFO
        $stmtProfile = $pdo->prepare("
            SELECT 
                s.student_id, s.first_name, s.last_name, s.email, s.mobile_no, s.address_city, s.address_province,
                e.grade_level, e.school_year, ap.program_code
            FROM students s
            LEFT JOIN enrollments e ON s.student_id = e.student_id AND e.status IN ('Enrolled', 'Assessed')
            LEFT JOIN academic_programs ap ON e.program_id = ap.id
            WHERE s.student_id = :student_id
            ORDER BY e.created_at DESC LIMIT 1
        ");
        $stmtProfile->execute(['student_id' => $studentId]);
        $profileData = $stmtProfile->fetch(PDO::FETCH_ASSOC);

        if (!$profileData) {
            echo json_encode(["error" => "Student not found"]);
            exit;
        }

        // 4. KUNIN ANG MGA ENROLLED SUBJECTS AT KUNG SINO ANG TEACHERS
        $stmtSubjects = $pdo->prepare("
            SELECT 
                sub.subject_code, 
                sub.subject_description, 
                t.full_name AS teacher_name, 
                t.profile_image
            FROM enrolled_classes ec
            JOIN class_assignments ca ON ec.class_assignment_id = ca.id
            JOIN subjects sub ON ca.subject_id = sub.id
            JOIN users t ON ca.teacher_id = t.id
            WHERE ec.student_id = :student_id AND ec.status = 'Enrolled'
        ");
        $stmtSubjects->execute(['student_id' => $studentId]);
        $subjectsData = $stmtSubjects->fetchAll(PDO::FETCH_ASSOC);

        // Filter para hindi umulit ang mga teachers sa "Teachers Card"
        $teachersMap = [];
        foreach ($subjectsData as $row) {
            if (!isset($teachersMap[$row['teacher_name']])) {
                $teachersMap[$row['teacher_name']] = [
                    'name' => $row['teacher_name'],
                    'image' => $row['profile_image']
                ];
            }
        }
        $teachersData = array_values($teachersMap);

        // 5. I-RETURN ANG BUONG DATA SA REACT
        echo json_encode([
            "profile" => $profileData,
            "subjects" => $subjectsData,
            "teachers" => $teachersData
        ]);

    } catch (PDOException $e) {
        echo json_encode(["error" => "Database Error: " . $e->getMessage()]);
    }

} else {
    echo json_encode(["error" => "Missing student_id parameter"]);
}
?>