<?php
// 1. ERROR REPORTER (Para makita natin kung may nagka-crash na code)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 2. THE CORS FIX: Payagan ang lahat ng requests mula sa React
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// 3. HANDLE PREFLIGHT (OPTIONS) REQUEST
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// FORMAT RESPONSE AS JSON
header("Content-Type: application/json; charset=UTF-8");

// ==========================================
// SIGURADUHING TAMA ANG PATH NG config.php!
// ==========================================
require '../config.php';

// Kunin ang mga pinasa mula sa React FormData
$id = isset($_POST['id']) ? $_POST['id'] : '';
$full_name = isset($_POST['full_name']) ? trim($_POST['full_name']) : '';
$role = isset($_POST['role']) ? $_POST['role'] : '';

if (!empty($id)) {
    try {
        $profile_image_sql = "";
        $params = [];

        // HANDLE IMAGE UPLOAD
        if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] == 0) {
            $target_dir = "../uploads/profiles/";

            if (!file_exists($target_dir)) {
                mkdir($target_dir, 0777, true);
            }

            $file_extension = pathinfo($_FILES["profile_image"]["name"], PATHINFO_EXTENSION);
            $new_filename = $role . "_" . $id . "_" . time() . "." . $file_extension;
            $target_file = $target_dir . $new_filename;

            if (move_uploaded_file($_FILES["profile_image"]["tmp_name"], $target_file)) {
                $profile_image_sql = ", profile_image = :profile_image";
                $params['profile_image'] = $new_filename;
            } else {
                echo json_encode(["success" => false, "message" => "Upload failed. Please check folder permissions."]);
                exit;
            }
        }

        // DUAL TABLE LOGIC
        if ($role === 'student') {
            $query = "UPDATE students SET status = 'Active' $profile_image_sql WHERE student_id = :id";
        } else {
            $query = "UPDATE users SET full_name = :full_name $profile_image_sql WHERE id = :id";
            $params['full_name'] = $full_name;
        }

        $params['id'] = $id;

        // EXECUTE USING PDO
        if (isset($pdo)) {
            $stmt = $pdo->prepare($query);

            // ==========================================
            // DITO PUMASOK ANG AUDIT TRAIL NATIN
            // ==========================================
            if ($stmt->execute($params)) {

                // 📝 AUDIT TRAIL SNIPPET
                $action_type = 'UPDATE_PROFILE';

                // Dinagdagan natin ng logic para malinaw kung student o user ang in-update
                $target_name = !empty($full_name) ? $full_name : "Student ID: " . $id;
                $log_desc = "Updated profile details/image for: " . $target_name . " (" . $role . ")";

                logAuditTrail($pdo, $action_type, $log_desc);

                echo json_encode(["success" => true, "message" => "Profile updated successfully!"]);
            } else {
                echo json_encode(["success" => false, "message" => "Failed to update database."]);
            }
            // ==========================================

        } else {
            echo json_encode(["success" => false, "message" => "Fatal Error: Database connection (\$pdo) not found."]);
        }

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid User ID"]);
}
?>