<?php
require_once '../../db_connect.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Vui lòng đăng nhập']);
    exit;
}

$userId = intval($_SESSION['user_id']);
$username = $conn->real_escape_string($_SESSION['username'] ?? '');
$fullName = $conn->real_escape_string($_SESSION['full_name'] ?? '');

// Lấy tất cả đơn hàng: có user_id khớp, hoặc đơn cũ chưa lưu user_id nhưng tên khớp
$sql = "SELECT id, customer_name, customer_phone, customer_address, total_amount, payment_method, status, created_at 
        FROM orders 
        WHERE user_id = $userId
           OR (user_id IS NULL AND (customer_name = '$fullName' OR customer_name = '$username'))
        ORDER BY id DESC";

$result = $conn->query($sql);
$orders = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $orders[] = $row;
    }
}

echo json_encode(['status' => 'success', 'data' => $orders]);
?>
