<?php
// registrar/process_enrollment.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require '../config.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['student_id']) || empty($data['selected_fees'])) {
    echo json_encode(["success" => false, "message" => "Missing required data. Please select fees."]);
    exit();
}

$student_id = $data['student_id'];
$selected_fees = $data['selected_fees'];

// ARCHITECT FIX: Kinuha natin ang mga bagong data galing sa React
$section_id = $data['section_id'] ?? null;
$student_status = $data['student_status'] ?? 'Regular';

try {
    $pdo->beginTransaction();

    $total_amount = 0;
    $items_to_save = [];

    // 1. KUNIN ANG MGA DETALYE NG FEES
    $placeholders = implode(',', array_fill(0, count($selected_fees), '?'));
    $stmt_fees = $pdo->prepare("SELECT id, item_name, amount FROM fees_catalog WHERE id IN ($placeholders)");
    $stmt_fees->execute($selected_fees);
    $fees_results = $stmt_fees->fetchAll();

    foreach ($fees_results as $fee) {
        $total_amount += (float) $fee['amount'];
        $items_to_save[] = $fee;
    }

    // 2. INSERT SA STUDENT_BILLING (Tinanggal ang school_year para iwas SQL Error)
    $sql_bill = "INSERT INTO student_billing (student_id, total_amount, paid_amount, balance, payment_status) 
                 VALUES (:sid, :total, 0, :bal, 'Unpaid')";
    $stmt_bill = $pdo->prepare($sql_bill);
    $stmt_bill->execute([
        'sid' => $student_id,
        'total' => $total_amount,
        'bal' => $total_amount
    ]);
    $billing_id = $pdo->lastInsertId();

    // 3. INSERT SA STUDENT_BILLING_ITEMS
    $sql_item = "INSERT INTO student_billing_items (billing_id, fee_id, item_name, amount, paid_amount) 
                 VALUES (:bid, :fid, :name, :amt, 0)";
    $stmt_item = $pdo->prepare($sql_item);

    foreach ($items_to_save as $item) {
        $stmt_item->execute([
            'bid' => $billing_id,
            'fid' => $item['id'],
            'name' => $item['item_name'],
            'amt' => $item['amount']
        ]);
    }

    // 🛑 4. THE MISSING BRIDGE: AUTO-ASSIGN CLASSES 🛑
    $selected_classes = $data['selected_classes'] ?? []; // Galing sa React Subject Picker

    if ($student_status === 'Regular' && !empty($section_id)) {
        // REGULAR LOGIC: Kunin lahat ng klase sa Section
        $stmt_classes = $pdo->prepare("SELECT id FROM class_assignments WHERE section_id = :section_id AND is_active = 1");
        $stmt_classes->execute(['section_id' => $section_id]);
        $classes = $stmt_classes->fetchAll(PDO::FETCH_ASSOC);

        if (count($classes) > 0) {
            $sql_enroll_class = "INSERT INTO enrolled_classes (student_id, class_assignment_id, status) VALUES (:sid, :ca_id, 'Enrolled')";
            $stmt_enroll_class = $pdo->prepare($sql_enroll_class);
            foreach ($classes as $cls) {
                $stmt_enroll_class->execute(['sid' => $student_id, 'ca_id' => $cls['id']]);
            }
        }
    } else if ($student_status === 'Irregular' && !empty($selected_classes)) {
        // IRREGULAR LOGIC: I-save isa-isa yung mga piniling klase
        $sql_enroll_class = "INSERT INTO enrolled_classes (student_id, class_assignment_id, status) VALUES (:sid, :ca_id, 'Enrolled')";
        $stmt_enroll_class = $pdo->prepare($sql_enroll_class);
        foreach ($selected_classes as $class_id) {
            $stmt_enroll_class->execute(['sid' => $student_id, 'ca_id' => $class_id]);
        }
    }

    // 5. UPDATE ENROLLMENT STATUS SA 'Assessed'
// 5. UPDATE ENROLLMENT STATUS SA 'Assessed' AT I-SAVE ANG SECTION
    // Kapag irregular, null ang section_id. Kapag regular, isasave niya ang ID ng section.
    $stmt_enroll = $pdo->prepare("UPDATE enrollments SET status = 'Assessed', section_id = :sec_id WHERE student_id = :sid AND status = 'Pending'");
    $stmt_enroll->execute([
        'sid' => $student_id,
        'sec_id' => empty($section_id) ? null : $section_id
    ]);

    // WALA NA YUNG FALLBACK DITO. Diretso commit na!

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Enrollment assessed & Subject Classes assigned successfully!",
        "billing_id" => $billing_id
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>