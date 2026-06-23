<?php
error_reporting(0);
ob_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ARCHITECT UPDATE 1: Lumabas ng folder papunta sa libs/
require '../libs/PHPMailer/Exception.php';
require '../libs/PHPMailer/PHPMailer.php';
require '../libs/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ARCHITECT UPDATE 2: Gamitin ang ating secure PDO config
require '../config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['email']) || empty($data['username']) || empty($data['first_name'])) {
    ob_clean();
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit();
}

// Prepare Data
$first_name = trim($data['first_name']);
$middle_name = trim($data['middle_name'] ?? '');
$last_name = trim($data['last_name']);
$full_name = trim($first_name . " " . ($middle_name ? $middle_name . " " : "") . $last_name);
$email = trim($data['email']);
$username = trim($data['username']);
$role = trim($data['role']);
$phone = trim($data['phone_number'] ?? '');
$birthday = trim($data['birthday'] ?? '');
$token = bin2hex(random_bytes(32));

try {
    // 1. Branding Fetch (Ginamit ang PDO)
    $school_name = "SMS Portal";
    $theme_color = "#2563eb";

    $branding_stmt = $pdo->query("SELECT school_name, theme_color FROM school_settings LIMIT 1");
    if ($branding = $branding_stmt->fetch()) {
        $school_name = $branding['school_name'] ?? $school_name;
        $theme_color = $branding['theme_color'] ?? $theme_color;
    }

    // 2. Start Transaction (Para sigurado ang data integrity)
    $pdo->beginTransaction();

    // 3. INSERT TO USERS (PDO Prepared Statement)
    $sql = "INSERT INTO users (username, first_name, middle_name, last_name, full_name, email, role, phone_number, birthday, verification_token, is_verified, status) 
            VALUES (:username, :first_name, :middle_name, :last_name, :full_name, :email, :role, :phone, :birthday, :token, 0, 'Active')";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'username' => $username,
        'first_name' => $first_name,
        'middle_name' => $middle_name,
        'last_name' => $last_name,
        'full_name' => $full_name,
        'email' => $email,
        'role' => $role,
        'phone' => $phone,
        'birthday' => $birthday,
        'token' => $token
    ]);

    // -------------------------------------------------------------------
    // 🛑 ARCHITECT FIX: INSERT DEFAULT USER SETTINGS FOR STAFF 🛑
    // -------------------------------------------------------------------
    // Kunin ang auto-incremented ID ng kakagawang user (Optional ito kung username ang gamit mo sa settings)
    // Pero dahil username ang ginagamit mo pang-login at pag-identify (base sa $username variable),
    // username ang gagamitin nating user_id para sa settings table
    $sql_settings = "INSERT INTO user_settings (
        user_id, user_role, dark_mode, theme_color, email_notifications
    ) VALUES (
        :user_id, :role, 0, '#2563eb', 1
    )";
    $stmt_settings = $pdo->prepare($sql_settings);
    $stmt_settings->execute([
        'user_id' => $username,
        'role' => $role
    ]);

    // 4. MAILER LOGIC
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'primaschool1@gmail.com';
    $mail->Password = 'sbprymvvwtrgyatg';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    $mail->setFrom('primaschool1@gmail.com', $school_name);
    $mail->addAddress($email, $full_name);
    $mail->isHTML(true);

    // I-update ang link papunta sa React frontend setup-password page
    $setup_link = "http://localhost:5173/setup-password?token=$token&email=" . urlencode($email);

    $mail->Subject = "Account Activation - $school_name";
    $mail->Body = "
        <div style='font-family: sans-serif; padding: 20px; background: #f4f7f6;'>
            <div style='max-width: 600px; margin: auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);'>
                <div style='background: $theme_color; padding: 40px; text-align: center; color: white;'>
                    <h1 style='margin:0; font-size: 24px;'>Welcome, $first_name!</h1>
                    <p style='opacity: 0.9;'>Your Staff Account is ready.</p>
                </div>
                <div style='padding: 40px;'>
                    <p style='color: #4b5563;'>Ang iyong account bilang <b>" . ucfirst($role) . "</b> ay matagumpay na nagawa sa system.</p>
                    <div style='background: #f9fafb; padding: 25px; border-radius: 16px; border: 1px solid #f1f5f9; margin: 25px 0;'>
                        <p style='margin:0; font-size: 12px; color: #94a3b8; font-weight: bold; text-transform: uppercase;'>Username</p>
                        <p style='margin:0; font-size: 18px; color: #1e293b; font-weight: 800;'>$username</p>
                        <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;'>
                        <p style='margin:0; font-size: 12px; color: #94a3b8; font-weight: bold; text-transform: uppercase;'>Role</p>
                        <p style='margin:0; font-size: 16px; color: #1e293b; font-weight: 700;'>" . ucfirst($role) . "</p>
                    </div>
                    <p style='color: #64748b; font-size: 14px;'>Mangyaring i-setup ang iyong password upang ma-access ang staff dashboard at simulan ang iyong trabaho.</p>
                    <div style='text-align:center; margin: 35px 0;'>
                        <a href='$setup_link' style='display: inline-block; background: $theme_color; color: white; padding: 18px 35px; text-decoration: none; border-radius: 14px; font-weight: 900;'>Activate My Staff Account</a>
                    </div>
                </div>
                <div style='padding: 20px; text-align: center; color: #94a3b8; font-size: 11px; background: #f8fafc;'>
                    &copy; " . date('Y') . " $school_name IT Support.
                </div>
            </div>
        </div>";

    $mail->send();

    // 5. COMMIT TRANSACTION (Dito magiging final ang save sa database)
    $pdo->commit();

    // ==========================================
    // 📝 AUDIT TRAIL SNIPPET
    // ==========================================
    $action_type = 'CREATE_USER';
    $log_desc = "Created a new staff account and sent invitation to: " . $full_name . " (" . $role . ")";
    logAuditTrail($pdo, $action_type, $log_desc);
    // ==========================================

    ob_clean();
    echo json_encode(["success" => true, "message" => "Staff account created! Invitation email sent."]);

} catch (Exception $e) {
    // I-rollback ang database kung nag-fail ang email
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    ob_clean();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>