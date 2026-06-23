<?php
// admin/update_user.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=UTF-8");

// ARCHITECT UPDATE: Lumabas ng folder para mahanap ang config.php
require '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (isset($data->id)) {
    try {
        $id = $data->id;
        $first_name = trim($data->first_name);
        $middle_name = trim($data->middle_name ?? '');
        $last_name = trim($data->last_name);
        $username = trim($data->username);
        $email = trim($data->email);
        $role = trim($data->role);
        $phone = trim($data->phone_number ?? '');
        $birthday = trim($data->birthday ?? '');

        // I-construct ang full_name para sa display purposes
        $full_name = trim($first_name . " " . ($middle_name ? $middle_name . " " : "") . $last_name);

        // Base query gamit ang PDO Named Parameters
        $sql = "UPDATE users SET 
                username = :username, 
                first_name = :first_name, 
                middle_name = :middle_name, 
                last_name = :last_name, 
                full_name = :full_name, 
                email = :email, 
                role = :role, 
                phone_number = :phone, 
                birthday = :birthday";

        $params = [
            'username' => $username,
            'first_name' => $first_name,
            'middle_name' => $middle_name,
            'last_name' => $last_name,
            'full_name' => $full_name,
            'email' => $email,
            'role' => $role,
            'phone' => $phone,
            'birthday' => $birthday,
            'id' => $id
        ];

        // Kung may pinasang password (optional update)
        if (!empty($data->password)) {
            $sql .= ", password = :password";
            $params['password'] = password_hash($data->password, PASSWORD_DEFAULT);
        }

        $sql .= " WHERE id = :id";

        $stmt = $pdo->prepare($sql);

        if ($stmt->execute($params)) {
            // 📝 AUDIT TRAIL SNIPPET
            $action_type = 'UPDATE_USER';
            $log_desc = "Updated account details for user: " . $full_name . " (" . $role . ")";
            logAuditTrail($pdo, $action_type, $log_desc);
            echo json_encode(["success" => true, "message" => "User updated successfully!"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update user."]);
        }

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request. User ID is missing."]);
}
?>