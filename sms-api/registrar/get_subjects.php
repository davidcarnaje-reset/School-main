<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // 1. FETCH SUBJECTS
    $sql_subjects = "SELECT 
                        s.id, 
                        s.subject_code, 
                        s.subject_description, 
                        s.units, 
                        s.grade_level_applicable,  -- IMPORTANTE ITO
                        s.level_category,          -- IMPORTANTE ITO
                        s.program_id,              -- IMPORTANTE ITO
                        COALESCE(p.program_code, 'General') as program_code
                     FROM subjects s 
                     LEFT JOIN academic_programs p ON s.program_id = p.id 
                     ORDER BY s.id DESC";

    $stmtS = $pdo->prepare($sql_subjects);
    $stmtS->execute();
    $subjects = $stmtS->fetchAll(PDO::FETCH_ASSOC);

    // TINANGGAL YUNG DUPLICATE EXECUTION DITO PARA MAS MABILIS ANG SERVER

    // 2. FETCH PROGRAMS
    $sql_programs = "SELECT id, department, program_code 
                     FROM academic_programs 
                     WHERE status = 'Active' 
                     ORDER BY department ASC";

    $stmtP = $pdo->prepare($sql_programs);
    $stmtP->execute();
    $programs = $stmtP->fetchAll(PDO::FETCH_ASSOC);

    // 3. SEND RESPONSE
    echo json_encode([
        "success" => true,
        "subjects" => $subjects ?: [],
        "programs" => $programs ?: []
    ]);

} catch (PDOException $e) {
    http_response_code(500); // This triggers the Axios error you see
    echo json_encode([
        "success" => false,
        "message" => "Database Error: " . $e->getMessage()
    ]);
}
?>