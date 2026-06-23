<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';

$status = isset($_GET['status']) ? ucfirst($_GET['status']) : 'Pending';

try {
    $sql = "SELECT 
                e.id as enrollment_id,
                e.student_id,
                e.grade_level,
                e.program_id,           -- 🛑 ARCHITECT FIX: Ito ang nawawalang piraso!
                ap.program_code,        -- 🛑 Idinagdag para may display text sa UI                
                e.status as enrollment_status,
                s.first_name,
                s.last_name,
                s.profile_image, -- Ito ang column sa DB mo
                ap.program_description
            FROM enrollments e
            JOIN students s ON e.student_id = s.student_id
            LEFT JOIN academic_programs ap ON e.program_id = ap.id
            WHERE e.status = :status
            ORDER BY e.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['status' => $status]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ARCHITECT FIX: Idagdag ang full path ng image
    foreach ($data as &$student) {
        if (!empty($student['profile_image'])) {
            // Siguraduhing tama ang folder path kung saan nakasave ang photos
            $student['profile_image'] = "http://localhost/sms-api/uploads/profiles/" . $student['profile_image'];
        } else {
            // Fallback kung walang picture (para may icon pa rin sa React)
            $student['profile_image'] = null;
        }
    }

    echo json_encode($data ?: []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>