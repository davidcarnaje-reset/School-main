<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS')
    exit();

$payload = json_decode(file_get_contents("php://input"), true);
$drafts = $payload['drafts'] ?? [];
$section_id = $payload['section_id'] ?? '';
$school_year = $payload['school_year'] ?? '2026-2027';

if (empty($drafts) || empty($section_id)) {
    echo json_encode(["success" => false, "message" => "No data provided."]);
    exit();
}

try {
    // 🚦 SIMULA NG TRANSACTION: "All or Nothing"
    $pdo->beginTransaction();

    foreach ($drafts as $draft) {
        $tid = $draft['teacher_id'];
        $room_id = $draft['room_id'];
        $subid = $draft['subject_id'];
        $subject_code = $draft['subject_code'];

        // I-format ang days mula Array ["M", "W"] papuntang String "M,W"
        $days_arr = $draft['days'];
        $days = implode(',', $days_arr);
        $display_days = implode('', $days_arr); // Para sa display na "MW"

        $start = $draft['start_time'];
        $end = $draft['end_time'];

        // ==========================================
        // 🛑 ARCHITECT FIX: ILAGAY ITO DITO MISMO
        // ==========================================
        if (strtotime($start) >= strtotime($end)) {
            $pdo->rollBack(); // Cancel transaction
            echo json_encode(["success" => false, "message" => "Invalid Schedule in $subject_code: End time must be after start time."]);
            exit();
        }

        if (strtotime($start) < strtotime("06:00") || strtotime($end) > strtotime("22:00")) {
            $pdo->rollBack(); // Cancel transaction
            echo json_encode(["success" => false, "message" => "Invalid Schedule in $subject_code: Classes must be between 6:00 AM and 10:00 PM."]);
            exit();
        }
        // ==========================================
        // END NG TIME VALIDATION
        // ==========================================

        // Formatting time para sa 'schedule' string (e.g., MWF 08:00 am - 09:00 am)
        $start_am_pm = date("h:i a", strtotime($start));
        $end_am_pm = date("h:i a", strtotime($end));
        $schedule_str = "$display_days $start_am_pm - $end_am_pm";

        // DYNAMIC DAY CHECKER (Kaparehas ng Single Assign)
        $dayConditions = [];
        foreach ($days_arr as $d) {
            $safeD = preg_replace('/[^a-zA-Z]/', '', $d);
            if (!empty($safeD))
                $dayConditions[] = "FIND_IN_SET('$safeD', ca.days) > 0";
        }
        $dayQueryPart = "(" . implode(" OR ", $dayConditions) . ")";

        // 🔍 CONFLICT CHECK QUERY
        $check_sql = "SELECT ca.*, u.full_name as teacher, r.room_name 
                      FROM class_assignments ca
                      JOIN users u ON ca.teacher_id = u.id
                      LEFT JOIN rooms r ON ca.room_id = r.id
                      WHERE ca.is_active = 1 
                      AND $dayQueryPart 
                      AND (:start < ca.end_time AND :end > ca.start_time)
                      AND (ca.teacher_id = :tid OR ca.room_id = :room_id OR ca.section_id = :sid)";

        $stmt_check = $pdo->prepare($check_sql);
        $stmt_check->execute([
            ':start' => $start,
            ':end' => $end,
            ':tid' => $tid,
            ':room_id' => $room_id,
            ':sid' => $section_id
        ]);

        $conflict = $stmt_check->fetch(PDO::FETCH_ASSOC);

        if ($conflict) {
            // 🛑 KUNG MAY CONFLICT KAHIT ISA, I-CANCEL LAHAT NG NA-QUEUE NA INSRET!
            $pdo->rollBack();

            $reason = "";
            if ($conflict['teacher_id'] == $tid)
                $reason = "Teacher " . $conflict['teacher'] . " is busy.";
            else if ($conflict['room_id'] == $room_id)
                $reason = "Room " . ($conflict['room_name'] ?? 'Selected Room') . " is occupied.";
            else if ($conflict['section_id'] == $section_id)
                $reason = "This section already has a class.";

            // Ipaalam sa React kung saang subject nagka-conflict
            echo json_encode([
                "success" => false,
                "message" => "CONFLICT in $subject_code: $reason (Time blocked: " . $conflict['schedule'] . "). Save cancelled."
            ]);
            exit();
        }

        // ✅ KUNG WALANG CONFLICT SA CURRENT ROW, I-QUEUE ANG INSERT
        $sql_insert = "INSERT INTO class_assignments 
                        (teacher_id, subject_id, section_id, room_id, schedule, days, start_time, end_time, school_year) 
                       VALUES 
                        (:tid, :subid, :sid, :room_id, :sched, :days, :start, :end, :sy)";

        $stmt_insert = $pdo->prepare($sql_insert);
        $stmt_insert->execute([
            ':tid' => $tid,
            ':subid' => $subid,
            ':sid' => $section_id,
            ':room_id' => $room_id,
            ':sched' => $schedule_str,
            ':days' => $days,
            ':start' => $start,
            ':end' => $end,
            ':sy' => $school_year
        ]);
    }

    // 🏁 KUNG NAKALUSOT LAHAT SA LOOP NANG WALANG ERROR, I-SAVE NA NANG TULUYAN
    $pdo->commit();
    echo json_encode(["success" => true, "message" => "All curriculum subjects successfully assigned!"]);

} catch (PDOException $e) {
    $pdo->rollBack(); // Cancel lahat kapag may database error
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>