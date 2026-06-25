<?php
require_once '../../db_connect.php';
header('Content-Type: application/json');

// Check admin auth
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'] ?? '';
    $brand = $_POST['brand'] ?? '';
    $price = $_POST['price'] ?? 0;
    $stock = $_POST['stock'] ?? 0;
    $description = $_POST['description'] ?? '';
    
    // Handle image upload
    $imageUrl = '';
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        
        $fileName = time() . '_' . basename($_FILES['image']['name']);
        $targetPath = $uploadDir . $fileName;
        
        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
            $imageUrl = 'uploads/' . $fileName; // Relative path from frontend
        }
    } else {
        // Fallback to image URL if provided as text
        $imageUrl = $_POST['image_url'] ?? '';
    }

    $name = $conn->real_escape_string($name);
    $brand = $conn->real_escape_string($brand);
    $description = $conn->real_escape_string($description);
    $imageUrl = $conn->real_escape_string($imageUrl);

    $sql = "INSERT INTO products (name, brand, price, stock, image, description) 
            VALUES ('$name', '$brand', $price, $stock, '$imageUrl', '$description')";
            
    if ($conn->query($sql) === TRUE) {
        echo json_encode(['status' => 'success', 'message' => 'Product added successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>
