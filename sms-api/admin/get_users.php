<?php
// admin/get_users.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// ARCHITECT UPDATE: Lumabas ng isang folder para mahanap ang config.php
require '../config.php';

try {
    // Ginamit ang $pdo vault natin
    // Kinuha natin pati ang birthday at phone_number para kumpleto sa Edit Modal ng React
    $sql = "SELECT 
                id, 
                username, 
                first_name, 
                middle_name, 
                last_name, 
                full_name, 
                email, 
                phone_number, 
                birthday, 
                role, 
                is_verified, 
                profile_image 
            FROM users 
            ORDER BY id DESC";

    $stmt = $pdo->query($sql);
    $users = $stmt->fetchAll();

    // Siguraduhing laging array ang ibabalik para hindi mag-error ang .map() sa React
    echo json_encode($users ? $users : []);

} catch (PDOException $e) {
    // Mag-send ng 500 status code kung may error sa database
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>