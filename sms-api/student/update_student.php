<?php
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. Load the PDO Config
$configPath = dirname(__DIR__) . '/config.php';
if (file_exists($configPath)) {
    require_once $configPath;
} else {
    echo json_encode(["success" => false, "message" => "Config not found."]);
    exit();
}

// 2. IMPORTANT: Check if $pdo exists instead of $conn
if (!isset($pdo)) {
    echo json_encode(["success" => false, "message" => "PDO variable missing."]);
    exit();
}

try {
    if (empty($_POST['student_id'])) {
        throw new Exception("Student ID is missing.");
    }

    $student_id = $_POST['student_id'];
    $email = $_POST['email'] ?? '';
    $mobile_no = $_POST['mobile_no'] ?? '';
    $address_house = $_POST['address_house'] ?? '';

    $image_sql = "";
    $params = [
        ':email' => $email,
        ':mobile' => $mobile_no,
        ':address' => $address_house,
        ':id' => $student_id
    ];

    // 3. Image Upload Logic
    if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === 0) {
        $target_dir = "../uploads/profiles/";
        if (!is_dir($target_dir)) mkdir($target_dir, 0777, true);

        $file_ext = strtolower(pathinfo($_FILES["profile_image"]["name"], PATHINFO_EXTENSION));
        $new_filename = $student_id . "_" . time() . "." . $file_ext;
        
        if (move_uploaded_file($_FILES["profile_image"]["tmp_name"], $target_dir . $new_filename)) {
            $image_sql = ", profile_image = :image";
            $params[':image'] = $new_filename;
        }
    }

    // 4. PDO Update Query (Mas safe ito sa SQL Injection)
    $sql = "UPDATE students SET 
                email = :email, 
                mobile_no = :mobile, 
                address_house = :address 
                $image_sql 
            WHERE student_id = :id";

    $stmt = $pdo->prepare($sql);
    
    if ($stmt->execute($params)) {
        ob_clean();
        echo json_encode(["success" => true, "message" => "Profile updated successfully!"]);
    } else {
        throw new Exception("Failed to update record.");
    }

} catch (Exception $e) {
    ob_clean();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>