<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require '../config.php'; // Siguraduhing tama ang path papunta sa bagong config.php

$data = json_decode(file_get_contents("php://input"));

function generateToken($userId, $role)
{
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode([
        'user_id' => $userId,
        'role' => $role,
        'exp' => time() + (86400)
    ]));
    $secret = "Sms_S3cr3t_K3y_2026_Obando!";
    $signature = base64_encode(hash_hmac('sha256', "$header.$payload", $secret, true));
    return "$header.$payload.$signature";
}

if (isset($data->username) && isset($data->password) && isset($data->portal)) {

    $username = $data->username;
    $password = $data->password;
    $portal = $data->portal;

    try {
        // ==========================================
        // PINTO NG ESTUDYANTE
        // ==========================================
        if ($portal === 'student') {
            // NAKA-PDO PREPARED STATEMENT NA ITO: Pansinin ang :username (Named Parameter)
            $stmt = $pdo->prepare("SELECT * FROM students WHERE student_id = :username AND is_verified = 1");
            $stmt->execute(['username' => $username]);
            $user = $stmt->fetch(); // Kukunin niya yung result

            if ($user && password_verify($password, $user['password'])) {
                echo json_encode([
                    "success" => true,
                    "token" => generateToken($user['student_id'], 'student'),
                    "user" => [
                        "id" => $user['student_id'],
                        "username" => $user['student_id'],
                        "role" => "student",
                        "full_name" => trim($user['first_name'] . " " . $user['last_name']),
                        "email" => $user['email'],
                        "profile_image" => $user['profile_image'] ?? null
                    ]
                ]);
            } else {
                echo json_encode(["success" => false, "message" => "Invalid credentials or account not active."]);
            }
        }

        // ==========================================
        // PINTO NG ADMIN & STAFF
        // ==========================================
        else {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
            $stmt->execute(['username' => $username]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password'])) {
                $isAllowed = ($portal === 'admin' && $user['role'] === 'admin') ||
                    ($portal === 'staff' && in_array($user['role'], ['registrar', 'cashier', 'teacher']));

                if ($isAllowed) {
                    echo json_encode([
                        "success" => true,
                        "token" => generateToken($user['id'], $user['role']),
                        "user" => [
                            "id" => $user['id'],
                            "username" => $user['username'],
                            "role" => $user['role'],
                            "full_name" => $user['full_name'],
                            "email" => $user['email'],
                            "profile_image" => $user['profile_image'] ?? null
                        ]
                    ]);
                } else {
                    echo json_encode(["success" => false, "message" => "Unauthorized portal access."]);
                }
            } else {
                echo json_encode(["success" => false, "message" => "Invalid credentials."]);
            }
        }
    } catch (PDOException $e) {
        // Safe error handling para hindi makita ng hacker ang internal database errors niyo
        echo json_encode(["success" => false, "message" => "System error occurred."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Incomplete login data."]);
}
?>