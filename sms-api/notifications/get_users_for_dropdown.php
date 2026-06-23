<?php
// notifications/get_users_for_dropdown.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// FIX: Isang folder lang ang pagitan base sa image_ebfdc2.png
require '../config.php';

$role = $_GET['role'] ?? '';
$users = [];

if (empty($role)) {
    echo json_encode(["success" => false, "message" => "Role is required."]);
    exit();
}

try {
    // KUNG STUDENT: Doon tayo sa 'students' table kukuha
    if ($role === 'student') {
        $stmt = $pdo->query("SELECT student_id AS id, CONCAT(last_name, ', ', first_name) AS name 
                             FROM students 
                             ORDER BY last_name ASC");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    // KUNG STAFF: Sa 'users' table tayo kukuha
    else {
        $stmt = $pdo->prepare("SELECT id, full_name AS name 
                               FROM users 
                               WHERE role = :role 
                               ORDER BY full_name ASC");
        $stmt->execute(['role' => $role]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode(["success" => true, "data" => $users]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}