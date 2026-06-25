<?php
require_once '../../db_connect.php';
header('Content-Type: application/json');

// Xóa tất cả biến session
$_SESSION = array();

// Hủy session cookie nếu có
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Hủy session
session_destroy();

echo json_encode(['status' => 'success', 'message' => 'Đăng xuất thành công']);
?>
