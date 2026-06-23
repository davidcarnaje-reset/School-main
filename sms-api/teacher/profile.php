<?php
/**
 * TEACHER PORTAL: PROFILE & TEACHING LOAD FETCH
 * Location: sms-api/teacher/profile.php
 * Status: SECURE / PDO / FIXED SCHEMA
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

// 1. TOKEN VALIDATION
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
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit();
}

$userId = isset($_GET['id']) ? intval($_GET['id']) : null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid User ID."]);
    exit();
}

try {
    /**
     * 2. FETCH PROFILE
     */
    $userQuery = "SELECT 
                    id, 
                    full_name, 
                    email, 
                    phone_number as phone, 
                    role, 
                    department, 
                    address,
                    profile_image, 
                    DATE(created_at) as dateHired, 
                    is_verified 
                  FROM users 
                  WHERE id = :id AND role = 'teacher' LIMIT 1";

    $stmt = $pdo->prepare($userQuery);
    $stmt->execute(['id' => $userId]);

    if ($stmt->rowCount() > 0) {
        $user_arr = $stmt->fetch(PDO::FETCH_ASSOC);

        // Split full_name for the React Component
        $nameParts = explode(' ', $user_arr['full_name']);
        $user_arr['firstName'] = $nameParts[0];
        $user_arr['lastName'] = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : '';

        // Status logic based on verification
        $user_arr['status'] = ($user_arr['is_verified'] == 1) ? 'Active' : 'Pending';

        /**
         * 3. FETCH TEACHING LOAD (FIXED SCHEMA)
         * Added LEFT JOIN rooms to safely get r.room_name
         */
        $subjectsQuery = "SELECT 
                            s.id, 
                            s.subject_code as code, 
                            s.subject_description as name, 
                            COALESCE(sec.section_name, 'TBA') as section, 
                            ca.schedule, 
                            COALESCE(r.room_name, 'TBA') as room 
                          FROM subjects s
                          JOIN class_assignments ca ON s.id = ca.subject_id
                          LEFT JOIN sections sec ON ca.section_id = sec.id
                          LEFT JOIN rooms r ON ca.room_id = r.id
                          WHERE ca.teacher_id = :teacher_id AND ca.is_active = 1";

        $subStmt = $pdo->prepare($subjectsQuery);
        $subStmt->execute(['teacher_id' => $userId]);
        $subjects = $subStmt->fetchAll(PDO::FETCH_ASSOC);

        $user_arr['subjects'] = $subjects ?: [];

        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "data" => $user_arr
        ]);

    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Teacher profile not found."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database Error: " . $e->getMessage()
    ]);
}
?>