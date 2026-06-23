<?php
// auth/check_email.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

// Lumabas ng isang folder para kunin ang database vault natin
require '../config.php';

// Support para sa GET (hal. ?email=test@gmail.com)
$email = isset($_GET['email']) ? trim($_GET['email']) : '';

// Support para sa POST (Axios JSON body)
if (empty($email)) {
    $data = json_decode(file_get_contents("php://input"));
    if (isset($data->email)) {
        $email = trim($data->email);
    }
}

if (!empty($email)) {
    try {
        // 1. Tumingin sa USERS table
        $stmt_users = $pdo->prepare("SELECT id FROM users WHERE email = :email");
        $stmt_users->execute(['email' => $email]);

        // 2. Tumingin sa STUDENTS table
        $stmt_students = $pdo->prepare("SELECT student_id FROM students WHERE email = :email");
        $stmt_students->execute(['email' => $email]);

        // Kung may nakita kahit sa isa sa kanila, ibig sabihin TAKEN na ang email
        if ($stmt_users->rowCount() > 0 || $stmt_students->rowCount() > 0) {
            echo json_encode([
                "exists" => true,
                "message" => "Email is already registered in the system."
            ]);
        } else {
            echo json_encode([
                "exists" => false,
                "message" => "Email is available."
            ]);
        }
    } catch (PDOException $e) {
        // Safe error fallback
        echo json_encode(["exists" => false, "error" => "Database error."]);
    }
} else {
    echo json_encode(["exists" => false, "error" => "No email provided."]);
}
?>