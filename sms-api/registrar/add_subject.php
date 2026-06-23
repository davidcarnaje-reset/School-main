<?php
// registrar/add_subject.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require '../config.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

// 1. VALIDATION
if (empty($data->subject_code) || empty($data->subject_description) || empty($data->level_category)) {
    echo json_encode(["success" => false, "message" => "Subject Code, Description, and Category are required."]);
    exit();
}

try {
    /**
     * ARCHITECT UPDATE:
     * Gagamitin natin ang level_category at semester base sa bagong table structure.
     * Tinanggal natin ang course_applicable dahil redundant na ito.
     * 🛑 ARCHITECT FIX: Idinagdag ang `subject_type` sa SQL Insert Statement.
     */
    $query = "INSERT INTO subjects 
                (level_category, subject_type, subject_code, subject_description, units, grade_level_applicable, program_id, semester) 
              VALUES 
                (:lcat, :subject_type, :code, :description, :units, :grade_level, :program_id, :semester)";

    $stmt = $pdo->prepare($query);

    // 2. LOGIC: Handling ng K-10 vs SHS/College at "GE" subjects
    $level_cat = $data->level_category;
    $raw_program = $data->program_id ?? '';

    // 🛑 ARCHITECT FIX: Kunin ang subject_type galing React, default to 'None' kung K-10
    $subject_type = ($level_cat === 'K-10') ? 'None' : ($data->subject_type ?? 'None');

    // 🛑 ARCHITECT FIX: Sinalo natin ang "GE" para maging NULL sa database
    if ($level_cat === 'K-10' || $raw_program === 'GE' || empty($raw_program)) {
        $program_id = null;
    } else {
        $program_id = intval($raw_program);
    }

    $semester = ($level_cat === 'K-10') ? 'N/A' : ($data->semester ?? '1st');

    // 3. BINDING & SANITIZATION
    $stmt->bindValue(':lcat', $level_cat, PDO::PARAM_STR);
    $stmt->bindValue(':subject_type', $subject_type, PDO::PARAM_STR); // 🛑 NEW: Bind Subject Type
    $stmt->bindValue(':code', strtoupper(trim($data->subject_code)), PDO::PARAM_STR);
    $stmt->bindValue(':description', trim($data->subject_description), PDO::PARAM_STR);
    $stmt->bindValue(':units', intval($data->units), PDO::PARAM_INT);
    $stmt->bindValue(':grade_level', trim($data->grade_level_applicable), PDO::PARAM_STR);
    $stmt->bindValue(':program_id', $program_id, $program_id === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $stmt->bindValue(':semester', $semester, PDO::PARAM_STR);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Subject successfully added to curriculum!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to save subject record."]);
    }

} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        echo json_encode(["success" => false, "message" => "Error: Subject Code already exists."]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
    }
}
?>