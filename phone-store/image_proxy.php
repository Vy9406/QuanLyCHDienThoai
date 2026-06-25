<?php
if (!isset($_GET['url'])) {
    exit;
}
$url = $_GET['url'];

if (strpos($url, 'http') !== 0) {
    header("Location: $url");
    exit;
}

if (strpos($url, 'placehold.co') !== false || strpos($url, 'hoanghamobile.com') !== false) {
    header("Location: $url");
    exit;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
curl_setopt($ch, CURLOPT_REFERER, 'https://www.thegioididong.com/');
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$data = curl_exec($ch);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 200 && $data) {
    header("Content-Type: $contentType");
    header("Cache-Control: public, max-age=86400");
    echo $data;
} else {
    header("Location: https://placehold.co/600x600/1c1c1e/ffffff?text=No+Image");
}
?>
