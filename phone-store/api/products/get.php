<?php
require_once '../../db_connect.php';
header('Content-Type: application/json');

$sql = "SELECT * FROM products ORDER BY id DESC";
$result = $conn->query($sql);

$products = [];
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
}

echo json_encode([
    'status' => 'success',
    'data' => $products
]);
?>
