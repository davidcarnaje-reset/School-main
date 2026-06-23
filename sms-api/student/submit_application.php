<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $scholarship_id = $_POST['scholarship_id'] ?? '';

    if (empty($email) || empty($scholarship_id)) {
        echo json_encode(["status" => "error", "message" => "Missing required fields."]);
        exit;
    }

    try {
        // 1. Kunin ang student_id at current school_year ng bata
        $stmt = $pdo->prepare("
            SELECT s.student_id, e.school_year 
            FROM students s 
            LEFT JOIN enrollments e ON s.student_id = e.student_id 
            WHERE s.email = :email 
            ORDER BY e.id DESC LIMIT 1
        ");
        $stmt->execute(['email' => $email]);
        $student = $stmt->fetch();

        if (!$student) {
            echo json_encode(["status" => "error", "message" => "Student not found."]);
            exit;
        }

        $student_id = $student['student_id'];
        $current_sy = $student['school_year'] ?? 'TBA'; // Dynamic na School Year

        // 2. ANTI-SPAM: I-check kung may pending na application na siya sa scholarship na ito
        $checkStmt = $pdo->prepare("SELECT id FROM scholarship_applications WHERE student_id = :sid AND scholarship_id = :schid AND status IN ('Pending', 'Approved')");
        $checkStmt->execute(['sid' => $student_id, 'schid' => $scholarship_id]);

        if ($checkStmt->rowCount() > 0) {
            echo json_encode(["status" => "error", "message" => "You already have an active or pending application for this scholarship."]);
            exit;
        }

        $uploaded_filenames = [];

        // 3. Upload Logic with STRICT SECURITY
        if (isset($_FILES['requirements'])) {
            $files = $_FILES['requirements'];
            $target_dir = "../uploads/requirements/";

            if (!is_dir($target_dir))
                mkdir($target_dir, 0777, true);

            // Allowed file extensions
            $allowed_exts = ['pdf', 'jpg', 'jpeg', 'png'];

            foreach ($files['name'] as $key => $val) {
                if ($files['error'][$key] === 0) {
                    $ext = strtolower(pathinfo($files['name'][$key], PATHINFO_EXTENSION));

                    // SECURITY CHECK: Bypass malicious files
                    if (!in_array($ext, $allowed_exts)) {
                        echo json_encode(["status" => "error", "message" => "Invalid file type. Only PDF, JPG, and PNG are allowed."]);
                        exit;
                    }

                    $new_name = "REQ_" . $student_id . "_" . time() . "_" . $key . "." . $ext;

                    if (move_uploaded_file($files['tmp_name'][$key], $target_dir . $new_name)) {
                        $uploaded_filenames[] = $new_name;
                    }
                }
            }
        }

        if (count($uploaded_filenames) > 0) {
            // I-save as comma-separated string sa 'requirements_file' column mo
            $files_string = implode(",", $uploaded_filenames);

            $sql = "INSERT INTO scholarship_applications 
                    (student_id, scholarship_id, sy, requirements_file, status, date_applied) 
                    VALUES (:sid, :schid, :sy, :files, 'Pending', NOW())";

            $stmt_insert = $pdo->prepare($sql);
            $stmt_insert->execute([
                'sid' => $student_id,
                'schid' => $scholarship_id,
                'sy' => $current_sy, // Ginamit natin ang dynamic SY
                'files' => $files_string
            ]);

            echo json_encode(["status" => "success", "message" => "Application submitted successfully! Please wait for registrar verification."]);
        } else {
            echo json_encode(["status" => "error", "message" => "No valid files were uploaded."]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
    }
}
?>