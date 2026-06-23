<?php
// auth/setup_password.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// ARCHITECT UPDATE: Lumabas tayo ng isang folder dahil nasa loob na ito ng 'auth/'
require '../config.php';

// Kunin ang data mula sa React
$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['email']) && isset($data['token']) && isset($data['password'])) {

    $email = trim($data['email']);
    $token = trim($data['token']);

    // Hashing the password (Ito ay sobrang secure, very good!)
    $hashed_password = password_hash($data['password'], PASSWORD_DEFAULT);

    try {
        // ==============================================================
        // 1. UNA: I-check sa USERS table (Staff/Admin)
        // ==============================================================
        // ARCHITECT UPDATE: Naka-Prepared Statements na para iwas SQL Injection
        $check_users = $pdo->prepare("SELECT id FROM users WHERE email = :email AND verification_token = :token AND is_verified = 0");
        $check_users->execute(['email' => $email, 'token' => $token]);

        if ($check_users->rowCount() > 0) {
            // I-update ang password at i-activate ang account
            $update = $pdo->prepare("UPDATE users SET password = :password, is_verified = 1, verification_token = NULL WHERE email = :email");
            if ($update->execute(['password' => $hashed_password, 'email' => $email])) {
                echo json_encode(["success" => true, "message" => "Staff account verified successfully!", "portal" => "staff"]);
                exit();
            }
        }

        // ==============================================================
        // 2. PANGALAWA: Kung wala sa users, i-check sa STUDENTS table
        // ==============================================================
        $check_students = $pdo->prepare("SELECT student_id FROM students WHERE email = :email AND verification_token = :token AND is_verified = 0");
        $check_students->execute(['email' => $email, 'token' => $token]);

        if ($check_students->rowCount() > 0) {
            // I-update ang password at i-activate ang student account
            $update = $pdo->prepare("UPDATE students SET password = :password, is_verified = 1, verification_token = NULL WHERE email = :email");
            if ($update->execute(['password' => $hashed_password, 'email' => $email])) {
                echo json_encode(["success" => true, "message" => "Student account verified successfully!", "portal" => "student"]);
                exit();
            }
        }

        // ==============================================================
        // 3. KUNG WALA TALAGA SA KAHIT ALING TABLE
        // ==============================================================
        echo json_encode(["success" => false, "message" => "Invalid link, expired token, or account is already verified."]);

    } catch (PDOException $e) {
        // Error handling para hindi mag-crash ang React
        echo json_encode(["success" => false, "message" => "Database error occurred."]);
    }

} else {
    echo json_encode(["success" => false, "message" => "Incomplete data provided."]);
}
?>