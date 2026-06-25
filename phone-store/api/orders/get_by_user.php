<?php
date_default_timezone_set('Asia/Ho_Chi_Minh');
require_once '../../db_connect.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Vui lòng đăng nhập']);
    exit;
}

$user_id = intval($_SESSION['user_id']);
$sql = "SELECT * FROM orders WHERE user_id = $user_id ORDER BY id DESC";
$result = $conn->query($sql);

$orders = [];
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $orders[] = $row;
    }
}

echo json_encode([
    'status' => 'success',
    'data' => $orders
]);
?>
