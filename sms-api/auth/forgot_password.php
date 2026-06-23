<?php
error_reporting(0);
ob_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// 1. HARANGAN ANG CORS PREFLIGHT
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ARCHITECT UPDATE 1: Lumabas ng folder dahil nasa loob tayo ng auth/
require '../libs/PHPMailer/Exception.php';
require '../libs/PHPMailer/PHPMailer.php';
require '../libs/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ARCHITECT UPDATE 2: Gamitin ang PDO config natin
require '../config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['email'])) {
    ob_clean();
    echo json_encode(["success" => false, "message" => "Please provide an email address."]);
    exit();
}

$email = trim($data['email']);

try {
    $userType = null;
    $firstName = "User";

    // ==========================================
    // ARCHITECT UPDATE 3: I-check sa parehong tables
    // ==========================================

    // Check sa USERS table muna
    $stmt_users = $pdo->prepare("SELECT id, full_name FROM users WHERE email = :email");
    $stmt_users->execute(['email' => $email]);

    if ($stmt_users->rowCount() > 0) {
        $user = $stmt_users->fetch();
        $firstName = $user['full_name'];
        $userType = 'users';
    } else {
        // Kung wala sa USERS, i-check sa STUDENTS table
        $stmt_students = $pdo->prepare("SELECT student_id, first_name, last_name FROM students WHERE email = :email");
        $stmt_students->execute(['email' => $email]);

        if ($stmt_students->rowCount() > 0) {
            $user = $stmt_students->fetch();
            $firstName = trim($user['first_name'] . ' ' . $user['last_name']);
            $userType = 'students';
        }
    }

    // Kung may nahanap na account
    if ($userType) {
        // Mag-generate ng secure Reset Token
        $reset_token = bin2hex(random_bytes(32));

        // I-save ang Reset Token sa tamang table
        if ($userType === 'users') {
            $update_sql = $pdo->prepare("UPDATE users SET reset_token = :token WHERE email = :email");
        } else {
            $update_sql = $pdo->prepare("UPDATE students SET reset_token = :token WHERE email = :email");
        }
        $update_sql->execute(['token' => $reset_token, 'email' => $email]);

        // Kunin ang Branding (Safe fallback kung wala pa kayong table)
        $school_name = "SMS Portal";
        $theme_color = "#2563eb";

        try {
            $branding_res = $pdo->query("SELECT school_name, primary_color FROM system_settings WHERE id=1");
            if ($branding_res->rowCount() > 0) {
                $branding = $branding_res->fetch();
                $school_name = $branding['school_name'] ?? $school_name;
                // Inaayos ko lang yung column name base sa ginawa nating database plan kanina
                $theme_color = $branding['primary_color'] ?? $theme_color;
            }
        } catch (Exception $e) {
        } // Ignore kung wala pa yung table

        // I-send ang Email gamit ang PHPMailer
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = 'primaschool1@gmail.com';
            $mail->Password = 'sbprymvvwtrgyatg';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;

            $mail->setFrom('primaschool1@gmail.com', "$school_name IT Support");
            $mail->addAddress($email, $firstName);
            $mail->isHTML(true);

            // ARCHITECT UPDATE 4: Idinagdag ko yung 'portal' sa link para magamit ng reset_password.php natin
            $portal_type = ($userType === 'users') ? 'staff' : 'student';
            $reset_link = "http://localhost:5173/reset-password?token=$reset_token&portal=$portal_type";

            $mail->Subject = "Password Reset Request - $school_name";
            $mail->Body = "
            <div style='background-color: #f4f7f6; padding: 30px; font-family: sans-serif;'>
                <div style='max-width: 600px; margin: 0 auto; background: #fff; border-radius: 20px; overflow: hidden;'>
                    <div style='background: $theme_color; padding: 40px; text-align: center; color: #fff;'>
                        <h1 style='margin:0;'>Password Reset</h1>
                    </div>
                    <div style='padding: 40px;'>
                        <p style='font-size: 16px; color: #1e293b;'>Hello <strong>$firstName</strong>,</p>
                        <p style='color: #64748b; line-height: 1.6;'>Nakapagtala kami ng request para i-reset ang password ng iyong account. Kung ikaw ang gumawa nito, i-click ang button sa ibaba upang makagawa ng bagong password.</p>
                        
                        <div style='text-align: center; margin: 40px 0;'>
                            <a href='$reset_link' style='background: $theme_color; color: #fff; padding: 18px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;'>Reset My Password</a>
                        </div>

                        <p style='color: #ef4444; font-size: 13px;'>Kung hindi ikaw ang nag-request nito, maaari mong i-ignore ang email na ito. Mananatiling ligtas ang iyong account.</p>
                    </div>
                    <div style='padding: 20px; text-align: center; color: #94a3b8; font-size: 11px; background: #f8fafc;'>
                        &copy; " . date('Y') . " $school_name IT Support.
                    </div>
                </div>
            </div>";

            $mail->send();
            ob_clean();
            echo json_encode(["success" => true, "message" => "A password reset link has been sent to your email."]);
        } catch (Exception $e) {
            ob_clean();
            echo json_encode(["success" => false, "message" => "Mailer Error: " . $mail->ErrorInfo]);
        }
    } else {
        ob_clean();
        echo json_encode(["success" => false, "message" => "We could not find an account registered with that email address."]);
    }
} catch (PDOException $e) {
    ob_clean();
    echo json_encode(["success" => false, "message" => "Database error occurred."]);
}
?>