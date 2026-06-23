<?php
// admin/branding.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// ARCHITECT UPDATE 1: Lumabas ng folder para mahanap ang config.php
require '../config.php';

// --- 1. GET SETTINGS (Walang Audit Trail Dito!) ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM school_settings WHERE id = 1");
        $branding = $stmt->fetch();

        // Kung walang nahanap, mag-return ng empty object para hindi mag-crash ang React
        echo json_encode($branding ?: (object) []);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// --- 2. POST / UPDATE SETTINGS ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // ARCHITECT UPDATE 2: Gamitin ang PDO para sa security (iwas SQL Injection)
    $school_name = $_POST['school_name'] ?? 'School System';
    $theme_color = $_POST['theme_color'] ?? '#2563eb';

    try {
        $logo_sql = "";
        $params = [
            'name' => $school_name,
            'color' => $theme_color
        ];

        // Handle Logo Upload kung meron
        if (isset($_FILES['logo']) && $_FILES['logo']['error'] === 0) {
            // ARCHITECT UPDATE 3: Path ay dapat nasa root uploads folder
            $target_dir = "../uploads/branding/";
            if (!file_exists($target_dir)) {
                mkdir($target_dir, 0777, true);
            }

            $file_extension = pathinfo($_FILES["logo"]["name"], PATHINFO_EXTENSION);
            $new_filename = "school_logo_" . time() . "." . $file_extension;
            $target_file = $target_dir . $new_filename;

            if (move_uploaded_file($_FILES["logo"]["tmp_name"], $target_file)) {
                // ARCHITECT UPDATE 4: File name lang ang i-save, wag buong URL
                $logo_sql = ", school_logo = :logo";
                $params['logo'] = $new_filename;
            }
        }

        // Update the database
        $query = "UPDATE school_settings SET school_name = :name, theme_color = :color $logo_sql WHERE id = 1";
        $stmt = $pdo->prepare($query);

        // ==========================================
        // DITO PUMASOK ANG AUDIT TRAIL NATIN
        // ==========================================
        if ($stmt->execute($params)) {

            // 📝 AUDIT TRAIL SNIPPET
            $action_type = 'UPDATE_BRANDING';
            $log_desc = "Updated system branding/settings. School Name: " . $school_name;
            logAuditTrail($pdo, $action_type, $log_desc);

            echo json_encode(["success" => true, "message" => "System branding updated!"]);

        } else {
            echo json_encode(["success" => false, "message" => "Update failed."]);
        }
        // ==========================================

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
    exit;
}
?>