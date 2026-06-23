<?php
/**
 * TEACHER MODULE: GET QUARTERLY GRADE SUMMARY
 * Location: sms-api/teacher/get_quarterly_summary.php
 * NEW FILE — Returns Q1, Q2, Q3, Q4 grades + Final Average for K-12/SHS classes.
 * Final Grade = (Q1 + Q2 + Q3 + Q4) / 4
 * This is used by the "Final Grade" tab in GradeManagement.
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

// --- ROBUST TOKEN GATEKEEPER ---
$authHeader = '';
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} else {
    $headers = apache_request_headers();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
}

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access. Token missing."]);
    exit();
}

$classId = isset($_GET['class_id']) ? intval($_GET['class_id']) : null;

if (!$classId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Class ID is required."]);
    exit();
}

try {
    // Get all enrolled students with their Q1-Q4 final_grade values
    // Uses conditional aggregation to pivot quarters into columns
    $query = "
        SELECT 
            s.student_id,
            s.student_id                                                    AS student_number,
            CONCAT(s.last_name, ', ', s.first_name)                         AS name,
            MAX(CASE WHEN g.quarter = 1 THEN g.final_grade ELSE NULL END)   AS q1,
            MAX(CASE WHEN g.quarter = 2 THEN g.final_grade ELSE NULL END)   AS q2,
            MAX(CASE WHEN g.quarter = 3 THEN g.final_grade ELSE NULL END)   AS q3,
            MAX(CASE WHEN g.quarter = 4 THEN g.final_grade ELSE NULL END)   AS q4
        FROM class_assignments ca
        JOIN enrolled_classes ec 
            ON ca.id = ec.class_assignment_id AND ec.status = 'Enrolled'
        JOIN students s 
            ON ec.student_id = s.student_id
        LEFT JOIN student_grades g 
            ON s.student_id = g.student_id AND g.class_id = ca.id AND g.quarter IS NOT NULL
        WHERE ca.id = :class_id
        GROUP BY s.student_id, s.last_name, s.first_name
        ORDER BY s.last_name ASC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([':class_id' => $classId]);

    $result = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $q1 = $row['q1'] !== null ? (float)$row['q1'] : null;
        $q2 = $row['q2'] !== null ? (float)$row['q2'] : null;
        $q3 = $row['q3'] !== null ? (float)$row['q3'] : null;
        $q4 = $row['q4'] !== null ? (float)$row['q4'] : null;

        // Compute final average only from quarters that have been graded
        $graded  = array_filter([$q1, $q2, $q3, $q4], fn($v) => $v !== null);
        $average = count($graded) > 0
            ? round(array_sum($graded) / count($graded), 2)
            : null;

        // Final grade = average of all 4 quarters (DepEd standard)
        // Full average only shows when all 4 quarters are complete
        $allComplete    = ($q1 !== null && $q2 !== null && $q3 !== null && $q4 !== null);
        $finalGrade     = $allComplete ? $average : null;
        $remarks        = $finalGrade !== null
            ? ($finalGrade >= 75 ? 'Passed' : 'Failed')
            : 'Incomplete';

        $result[] = [
            'student_id'     => $row['student_id'],
            'student_number' => $row['student_number'],
            'name'           => $row['name'],
            'q1'             => $q1,
            'q2'             => $q2,
            'q3'             => $q3,
            'q4'             => $q4,
            'final_grade'    => $finalGrade,
            'remarks'        => $remarks,
        ];
    }

    echo json_encode([
        "status" => "success",
        "data"   => $result
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Database Error: " . $e->getMessage()
    ]);
}
?>