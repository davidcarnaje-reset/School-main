<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->subject_id)) {
    echo json_encode(["success" => false, "message" => "Subject ID is required."]);
    exit;
}

try {
    // 🛑 ARCHITECT LOGIC: Simulan ang Transaction para safe ang pagbubura
    $pdo->beginTransaction();

    // 1. Hanapin muna lahat ng Class Assignments (Schedules) na naka-link sa subject na ito
    $stmt = $pdo->prepare("SELECT id FROM class_assignments WHERE subject_id = :id");
    $stmt->execute(['id' => $data->subject_id]);
    $classes = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!empty($classes)) {
        // Kung may mga schedules na nahanap, burahin muna ang mga naka-enroll na bata sa schedules na 'yon
        $class_ids = implode(',', $classes);
        $pdo->exec("DELETE FROM enrolled_classes WHERE class_assignment_id IN ($class_ids)");

        // 2. Pagkatapos mabura ang enrolled_classes, burahin naman ang class_assignments (schedules)
        $pdo->exec("DELETE FROM class_assignments WHERE subject_id = " . intval($data->subject_id));
    }

    // 3. Panghuli, burahin ang mismong subject sa masterlist
    $stmt = $pdo->prepare("DELETE FROM subjects WHERE id = :id");
    $stmt->execute(['id' => $data->subject_id]);

    // I-commit ang lahat ng pagbubura!
    $pdo->commit();
    echo json_encode(["success" => true, "message" => "Subject and all connected records successfully deleted!"]);

} catch (PDOException $e) {
    // Kapag may pumalya, i-cancel ang lahat ng binura
    $pdo->rollBack();
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>