<?php
// I-off ang error display sa output para hindi masira ang JSON response
error_reporting(0);
ini_set('display_errors', 0);
ob_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ARCHITECT UPDATE: PHPMailer Paths & PDO Config
require '../libs/PHPMailer/Exception.php';
require '../libs/PHPMailer/PHPMailer.php';
require '../libs/PHPMailer/SMTP.php';
require '../config.php'; // Siguraduhing ito ay PDO connection ($pdo)

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['email']) || empty($data['last_name']) || empty($data['first_name'])) {
    ob_clean();
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit();
}

try {
    // -------------------------------------------------------------------
    // 1. ID GENERATION (PDO Style)
    // -------------------------------------------------------------------
    $current_year = date('Y');
    $id_prefix = $current_year . "-";

    $stmt_check = $pdo->prepare("SELECT student_id FROM students WHERE student_id LIKE ? ORDER BY id DESC LIMIT 1");
    $stmt_check->execute([$id_prefix . '%']);
    $last_student = $stmt_check->fetch();

    if ($last_student) {
        $last_num = (int) substr($last_student['student_id'], 5);
        $new_num = str_pad($last_num + 1, 4, '0', STR_PAD_LEFT);
    } else {
        $new_num = "0001";
    }
    $student_id = $id_prefix . $new_num;

    // Enrollment ID & Token
    $enroll_id = "ENR-" . date('y') . "-" . strtoupper(bin2hex(random_bytes(2)));
    $token = bin2hex(random_bytes(32));

    // -------------------------------------------------------------------
    // 2. DATABASE TRANSACTION (PDO)
    // -------------------------------------------------------------------
    $pdo->beginTransaction();

    // A. INSERT TO STUDENTS MASTERLIST
    $sql_student = "INSERT INTO students (
        student_id, lrn, first_name, middle_name, last_name, suffix, nickname, 
        gender, dob, place_of_birth, nationality, religion, civil_status, email, mobile_no, 
        alt_mobile_no, address_house, address_brgy, address_city, address_province, address_zip,
        father_name, father_occ, father_contact, mother_name, mother_occ, mother_contact,
        guardian_name, guardian_rel, guardian_contact, guardian_address, verification_token
    ) VALUES (
        :sid, :lrn, :fname, :mname, :lname, :suffix, :nickname, :gender, :dob, :pob, :nat, :rel, :civ, :email, :mob, 
        :alt, :house, :brgy, :city, :prov, :zip, :faname, :faocc, :facontact, :moname, :moocc, :mocontact,
        :guname, :gurel, :gucontact, :guaddress, :token
    )";

    $stmt_s = $pdo->prepare($sql_student);
    $stmt_s->execute([
        'sid' => $student_id,
        'lrn' => $data['lrn'] ?? '',
        'fname' => $data['first_name'],
        'mname' => $data['middle_name'] ?? '',
        'lname' => $data['last_name'],
        'suffix' => $data['suffix'] ?? '',
        'nickname' => $data['nickname'] ?? '',
        'gender' => $data['gender'],
        'dob' => $data['dob'],
        'pob' => $data['place_of_birth'] ?? '',
        'nat' => $data['nationality'] ?? 'Filipino',
        'rel' => $data['religion'] ?? '',
        'civ' => $data['civil_status'] ?? 'Single',
        'email' => $data['email'],
        'mob' => $data['mobile_no'],
        'alt' => $data['alt_mobile_no'] ?? '',
        'house' => $data['address_house'] ?? '',
        'brgy' => $data['address_brgy'] ?? '',
        'city' => $data['address_city'] ?? '',
        'prov' => $data['address_province'] ?? '',
        'zip' => $data['address_zip'] ?? '',
        'faname' => $data['father_name'] ?? '',
        'faocc' => $data['father_occ'] ?? '',
        'facontact' => $data['father_contact'] ?? '',
        'moname' => $data['mother_name'] ?? '',
        'moocc' => $data['mother_occ'] ?? '',
        'mocontact' => $data['mother_contact'] ?? '',
        'guname' => $data['guardian_name'] ?? '',
        'gurel' => $data['guardian_rel'] ?? '',
        'gucontact' => $data['guardian_contact'] ?? '',
        'guaddress' => $data['guardian_address'] ?? '',
        'token' => $token
    ]);

    // B. INSERT TO ENROLLMENTS
    $sql_enroll = "INSERT INTO enrollments (
        enrollment_id, student_id, school_year, enrollment_type, grade_level, program_id, payment_plan, status
    ) VALUES (
        :enid, :sid, :sy, :etype, :grade, :prog, :pplan, 'Pending'
    )";
    $stmt_e = $pdo->prepare($sql_enroll);
    $stmt_e->execute([
        'enid' => $enroll_id,
        'sid' => $student_id,
        'sy' => $data['school_year'],
        'etype' => $data['enrollment_type'],
        'grade' => $data['grade_level'],
        'prog' => !empty($data['program_id']) ? $data['program_id'] : null,
        'pplan' => $data['payment_plan'] ?? 'Full Payment'
    ]);

    // -------------------------------------------------------------------
    // 🛑 ARCHITECT FIX: C. INSERT DEFAULT USER SETTINGS 🛑
    // -------------------------------------------------------------------
    $sql_settings = "INSERT INTO user_settings (
        user_id, user_role, dark_mode, theme_color, email_notifications
    ) VALUES (
        :user_id, 'student', 0, '#2563eb', 1
    )";
    $stmt_settings = $pdo->prepare($sql_settings);
    $stmt_settings->execute([
        'user_id' => $student_id
    ]);


    // -------------------------------------------------------------------
    // 3. BRANDING & EMAIL DISPATCH
    // -------------------------------------------------------------------
    $stmt_brand = $pdo->query("SELECT * FROM school_settings LIMIT 1");
    $branding = $stmt_brand->fetch();
    $school_name = $branding['school_name'] ?? "School Portal";
    $theme_color = $branding['theme_color'] ?? "#2563eb";

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'primaschool1@gmail.com';
    $mail->Password = 'sbprymvvwtrgyatg'; // Security Warning: Use ENV variables in real production
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    $mail->setFrom('primaschool1@gmail.com', $school_name);
    $mail->addAddress($data['email'], $data['first_name'] . " " . $data['last_name']);
    $mail->isHTML(true);

    $setup_link = "http://localhost:5173/setup-password?token=$token&email=" . urlencode($data['email']);

    $mail->Subject = "Welcome to $school_name - Student Portal Access";
    $mail->Body = "
        <div style='font-family: sans-serif; padding: 20px; background: #f4f7f6;'>
            <div style='max-width: 600px; margin: auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);'>
                <div style='background: $theme_color; padding: 40px; text-align: center; color: white;'>
                    <h1 style='margin:0; font-size: 24px;'>Welcome, {$data['first_name']}!</h1>
                    <p style='opacity: 0.9;'>Official Student Registration</p>
                </div>
                <div style='padding: 40px;'>
                    <p style='color: #4b5563;'>Mabuhay! Gamitin ang mga detalye sa ibaba para sa iyong official records:</p>
                    <div style='background: #f9fafb; padding: 25px; border-radius: 16px; border: 1px solid #f1f5f9; margin: 25px 0;'>
                        <p style='margin:0; font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase;'>Student ID</p>
                        <p style='margin:0; font-size: 18px; color: #1e293b; font-weight: 800;'>$student_id</p>
                        <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;'>
                        <p style='margin:0; font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase;'>Enrollment ID</p>
                        <p style='margin:0; font-size: 16px; color: #1e293b; font-weight: 700;'>$enroll_id</p>
                    </div>
                    <p style='color: #64748b; font-size: 14px;'>Mangyaring i-setup ang iyong account para ma-access ang iyong schedules at financial records.</p>
                    <div style='text-align:center; margin: 35px 0;'>
                        <a href='$setup_link' style='display: inline-block; background: $theme_color; color: white; padding: 18px 35px; text-decoration: none; border-radius: 14px; font-weight: bold;'>Setup My Student Portal</a>
                    </div>
                </div>
            </div>
        </div>";

    $mail->send();
    $pdo->commit();
    ob_clean();

    echo json_encode(["success" => true, "student_id" => $student_id]);

} catch (Exception $e) {
    if ($pdo->inTransaction())
        $pdo->rollBack();
    ob_clean();
    echo json_encode(["success" => false, "message" => "Process Error: " . $e->getMessage()]);
}
?>