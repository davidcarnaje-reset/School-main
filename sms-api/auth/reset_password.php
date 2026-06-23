<?php
// auth/reset_password.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Lumabas ng isang folder para kunin ang database vault natin
require '../config.php';

$data = json_decode(file_get_contents("php://input"));

// Kailangan natin ang token (mula sa URL), bagong password, at kung anong portal
if (isset($data->token) && isset($data->password) && isset($data->portal)) {

    $token = trim($data->token);
    $portal = trim($data->portal);

    // I-hash agad ang bagong password para secure
    $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);

    try {
        // ==========================================
        // PINTO NG ESTUDYANTE
        // ==========================================
        if ($portal === 'student') {
            // 1. I-check kung valid at nag-e-exist pa ang token sa students table
            $stmt = $pdo->prepare("SELECT student_id FROM students WHERE reset_token = :token");
            $stmt->execute(['token' => $token]);

            if ($stmt->rowCount() > 0) {
                // 2. I-update ang password at BURAHIN ang token para hindi na magamit ulit
                $update = $pdo->prepare("UPDATE students SET password = :password, reset_token = NULL WHERE reset_token = :token");
                $update->execute(['password' => $hashed_password, 'token' => $token]);

                echo json_encode(["success" => true, "message" => "Student password successfully updated!"]);
            } else {
                echo json_encode(["success" => false, "message" => "Invalid or expired reset link."]);
            }
        }
        // ==========================================
        // PINTO NG ADMIN & STAFF
        // ==========================================
        else {
            // 1. I-check kung valid ang token sa users table
            $stmt = $pdo->prepare("SELECT id FROM users WHERE reset_token = :token");
            $stmt->execute(['token' => $token]);

            if ($stmt->rowCount() > 0) {
                // 2. I-update ang password at BURAHIN ang token
                $update = $pdo->prepare("UPDATE users SET password = :password, reset_token = NULL WHERE reset_token = :token");
                $update->execute(['password' => $hashed_password, 'token' => $token]);

                echo json_encode(["success" => true, "message" => "Staff password successfully updated!"]);
            } else {
                echo json_encode(["success" => false, "message" => "Invalid or expired reset link."]);
            }
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error occurred."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Incomplete reset data."]);
}
?>