<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once '../config.php';

$email = $_GET['email'] ?? '';
$sy = $_GET['sy'] ?? ''; // Pwede mag-pass ng specific school year mula sa dropdown

if (empty($email)) {
    echo json_encode(["status" => "error", "message" => "Email is required."]);
    exit;
}

try {
    // 1. Kunin ang student_id at ang latest school year kung walang pinasa na SY
    $stmt = $pdo->prepare("
        SELECT s.student_id, e.school_year 
        FROM students s
        LEFT JOIN enrollments e ON s.student_id = e.student_id
        WHERE s.email = :email
        ORDER BY e.id DESC LIMIT 1
    ");
    $stmt->execute(['email' => $email]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(["status" => "error", "message" => "Student not found."]);
        exit;
    }

    $student_id = $student['student_id'];
    $target_sy = !empty($sy) ? $sy : $student['school_year'];

    // 2. Kunin ang grades. 
    // TANDAAN: I-adjust ang 'student_grades' table at columns base sa exact DB structure mo.
    // Dito, ina-assume natin na naka-link ang grade sa student_id at class_assignment_id.
    $gradeQuery = "
        SELECT 
            s.subject_code AS code,
            s.subject_description AS `desc`,
            g.first_quarter AS q1,
            g.second_quarter AS q2,
            g.third_quarter AS q3,
            g.fourth_quarter AS q4,
            g.final_grade AS final,
            g.remarks
        FROM enrolled_classes ec
        JOIN class_assignments ca ON ec.class_assignment_id = ca.id
        JOIN subjects s ON ca.subject_id = s.id
        LEFT JOIN student_grades g ON g.student_id = ec.student_id AND g.class_id = ca.id
        WHERE ec.student_id = :sid 
        AND ca.school_year = :sy
        AND ec.status = 'Enrolled'
    ";

    $gradeStmt = $pdo->prepare($gradeQuery);
    $gradeStmt->execute([
        'sid' => $student_id,
        'sy' => $target_sy
    ]);

    $grades = $gradeStmt->fetchAll(PDO::FETCH_ASSOC);

    // I-format ang null values para hindi mag-error sa React
    $formattedGrades = array_map(function ($grade) {
        return [
            'code' => $grade['code'],
            'desc' => $grade['desc'],
            'q1' => $grade['q1'] ?? '',
            'q2' => $grade['q2'] ?? '',
            'q3' => $grade['q3'] ?? '',
            'q4' => $grade['q4'] ?? '',
            'final' => $grade['final'] ?? '',
            'remarks' => $grade['remarks'] ?? 'Pending'
        ];
    }, $grades);

    echo json_encode([
        "status" => "success",
        "school_year" => $target_sy,
        "data" => $formattedGrades
    ]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
}
?>