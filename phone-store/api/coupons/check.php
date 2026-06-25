<?php
require_once '../../db_connect.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $code = $conn->real_escape_string($data['code'] ?? '');

    if (empty($code)) {
        echo json_encode(['status' => 'error', 'message' => 'Vui lòng nhập mã giảm giá']);
        exit;
    }

    $sql = "SELECT * FROM coupons WHERE code = '$code' AND is_active = 1";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $coupon = $result->fetch_assoc();
        echo json_encode([
            'status' => 'success',
            'discount_percent' => $coupon['discount_percent'],
            'message' => 'Áp dụng mã thành công! Giảm ' . $coupon['discount_percent'] . '%'
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn']);
    }
}
?>
