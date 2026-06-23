<?php
// cashier/manage_fees.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// ARCHITECT UPDATE: PDO Connection
require '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Handle Preflight (OPTIONS) request para sa CORS
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    switch ($method) {
        case 'GET':
            // 1. READ: Naka-sort para madaling hanapin ni Cashier
            $stmt = $pdo->query("SELECT * FROM fees_catalog ORDER BY category ASC, item_name ASC");
            echo json_encode($stmt->fetchAll() ?: []);
            break;

        case 'POST':
            // 2. CREATE / UPDATE: Gamit ang Prepared Statements
            $data = json_decode(file_get_contents("php://input"), true);

            $name = $data['item_name'];
            $amt = (float) $data['amount'];
            $cat = $data['category'];
            $app = $data['applicable_to'] ?? 'All';

            if (isset($data['id'])) {
                // UPDATE Logic
                $sql = "UPDATE fees_catalog SET item_name = :name, amount = :amt, category = :cat, applicable_to = :app WHERE id = :id";
                $params = ['name' => $name, 'amt' => $amt, 'cat' => $cat, 'app' => $app, 'id' => $data['id']];
            } else {
                // INSERT Logic
                $sql = "INSERT INTO fees_catalog (item_name, amount, category, applicable_to) VALUES (:name, :amt, :cat, :app)";
                $params = ['name' => $name, 'amt' => $amt, 'cat' => $cat, 'app' => $app];
            }

            $stmt = $pdo->prepare($sql);
            if ($stmt->execute($params)) {
                echo json_encode(["status" => "success", "message" => "Item saved successfully!"]);
            }
            break;

        case 'DELETE':
            // 3. DELETE: Secure deletion via ID
            $id = $_GET['id'] ?? null;
            if ($id) {
                $stmt = $pdo->prepare("DELETE FROM fees_catalog WHERE id = :id");
                $stmt->execute(['id' => $id]);
                echo json_encode(["status" => "success"]);
            }
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>