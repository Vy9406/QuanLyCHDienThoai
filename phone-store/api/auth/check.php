<?php
require_once '../../db_connect.php';
header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'status' => 'success',
        'is_logged_in' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role'],
            'full_name' => $_SESSION['full_name']
        ]
    ]);
} else {
    echo json_encode([
        'status' => 'success',
        'is_logged_in' => false
    ]);
}
?>
