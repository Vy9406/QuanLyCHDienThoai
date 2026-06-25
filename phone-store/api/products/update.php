<?php
require_once '../../db_connect.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'] ?? 0;
    if ($id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid ID']);
        exit;
    }

    $name = $conn->real_escape_string($_POST['name'] ?? '');
    $brand = $conn->real_escape_string($_POST['brand'] ?? '');
    $price = $_POST['price'] ?? 0;
    $stock = $_POST['stock'] ?? 0;
    $description = $conn->real_escape_string($_POST['description'] ?? '');
    
    // Check if new image is uploaded
    $imageUrl = $_POST['existing_image'] ?? '';
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        
        $fileName = time() . '_' . basename($_FILES['image']['name']);
        $targetPath = $uploadDir . $fileName;
        
        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
            $imageUrl = 'uploads/' . $fileName;
        }
    } else if (isset($_POST['image_url']) && !empty($_POST['image_url'])) {
        $imageUrl = $_POST['image_url'];
    }

    $imageUrl = $conn->real_escape_string($imageUrl);

    $sql = "UPDATE products 
            SET name='$name', brand='$brand', price=$price, stock=$stock, image='$imageUrl', description='$description' 
            WHERE id=$id";
            
    if ($conn->query($sql) === TRUE) {
        echo json_encode(['status' => 'success', 'message' => 'Product updated successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>
