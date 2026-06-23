<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method == 'GET') {
        // Kukunin lang ang Active para sa Catalog, pero lahat ay accessible kung kailangan
        $stmt = $pdo->query("SELECT * FROM scholarships_catalog WHERE status = 'Active' ORDER BY id DESC");
        $list = $stmt->fetchAll();

        // Siguraduhin na float ang value para sa React slider/math
        foreach ($list as &$row) {
            $row['discount_value'] = (float) $row['discount_value'];
        }
        echo json_encode($list);
    }

    if ($method == 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['action'])) {
            echo json_encode(["status" => "error", "message" => "Invalid Request"]);
            exit;
        }

        $action = $data['action'];

        // --- ADD O EDIT (Pinagsama natin para malinis) ---
        if ($action == 'add' || $action == 'edit') {
            $code = $data['code'];
            $name = $data['name'];
            $type = $data['discount_type'];
            $val = (float) $data['discount_value'];
            $desc = !empty($data['description']) ? $data['description'] : null;

            if ($action == 'add') {
                $sql = "INSERT INTO scholarships_catalog (code, name, discount_type, discount_value, description, status) 
                        VALUES (:code, :name, :type, :val, :desc, 'Active')";
                $stmt = $pdo->prepare($sql);
                $stmt->execute(['code' => $code, 'name' => $name, 'type' => $type, 'val' => $val, 'desc' => $desc]);
                echo json_encode(["status" => "success", "message" => "Scholarship created!"]);
            } else {
                $sql = "UPDATE scholarships_catalog SET code=:code, name=:name, discount_type=:type, 
                        discount_value=:val, description=:desc WHERE id=:id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute(['code' => $code, 'name' => $name, 'type' => $type, 'val' => $val, 'desc' => $desc, 'id' => $data['id']]);
                echo json_encode(["status" => "success", "message" => "Scholarship updated!"]);
            }
        }

        // --- DEACTIVATE (Soft Delete) ---
        if ($action == 'delete') {
            $id = (int) $data['id'];
            $stmt = $pdo->prepare("UPDATE scholarships_catalog SET status = 'Inactive' WHERE id = :id");
            if ($stmt->execute(['id' => $id])) {
                echo json_encode(["status" => "success", "message" => "Scholarship deactivated!"]);
            }
        }
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>