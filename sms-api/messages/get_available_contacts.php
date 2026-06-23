<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

include_once '../config.php';

if (isset($_GET['user_id']) && isset($_GET['user_role'])) {
    $userId = $_GET['user_id'];
    $userRole = $_GET['user_role'];

    try {
        $contacts = [];

        if ($userRole === 'student') {
            // 1. KUNIN ANG MGA TEACHERS NG STUDENT
            $stmtTeachers = $pdo->prepare("
                SELECT DISTINCT u.id as contact_id, u.full_name as contact_name, u.role as contact_role, u.profile_image
                FROM enrolled_classes ec
                JOIN class_assignments ca ON ec.class_assignment_id = ca.id
                JOIN users u ON ca.teacher_id = u.id
                WHERE ec.student_id = :sid AND ec.status = 'Enrolled'
            ");
            $stmtTeachers->execute(['sid' => $userId]);
            $teachers = $stmtTeachers->fetchAll(PDO::FETCH_ASSOC);

            // 2. KUNIN ANG MGA REGISTRAR AT CASHIER (General Staff)
            $stmtStaff = $pdo->query("SELECT id as contact_id, full_name as contact_name, role as contact_role, profile_image FROM users WHERE role IN ('registrar', 'cashier') AND status = 'Active'");
            $staff = $stmtStaff->fetchAll(PDO::FETCH_ASSOC);

            $contacts = array_merge($teachers, $staff);
        } else {
            // Kung Staff ang naka-login, ipakita lahat ng students (or adjust based on classes)
            $stmtStudents = $pdo->query("SELECT student_id as contact_id, CONCAT(first_name, ' ', last_name) as contact_name, 'student' as contact_role, profile_image FROM students");
            $contacts = $stmtStudents->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode(["status" => "success", "contacts" => $contacts]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>