<?php
require_once '../../db_connect.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Không có quyền']);
    exit;
}

// Lấy danh sách tất cả khách hàng đã nhắn tin, sắp xếp theo tin nhắn mới nhất
$sql = "SELECT 
            u.id AS user_id,
            u.username,
            u.full_name,
            (SELECT message FROM messages WHERE from_user_id = u.id AND to_user_id = 0 ORDER BY created_at DESC LIMIT 1) AS last_message,
            (SELECT created_at FROM messages WHERE from_user_id = u.id AND to_user_id = 0 ORDER BY created_at DESC LIMIT 1) AS last_time,
            (SELECT COUNT(*) FROM messages WHERE from_user_id = u.id AND to_user_id = 0 AND is_read = 0) AS unread_count
        FROM users u
        WHERE u.id IN (SELECT DISTINCT from_user_id FROM messages WHERE from_role = 'customer')
        ORDER BY last_time DESC";

$result = $conn->query($sql);
$convs = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $convs[] = $row;
    }
}

echo json_encode(['status' => 'success', 'data' => $convs]);
?>
