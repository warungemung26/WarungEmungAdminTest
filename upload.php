<?php
// Ambil data JSON dari request
$data = json_decode(file_get_contents('php://input'), true);
if(!$data) { echo "❌ Tidak ada data!"; exit; }

$file = 'products.json';

// Baca file lama
$oldData = [];
if(file_exists($file)) {
    $oldData = json_decode(file_get_contents($file), true);
    if(!is_array($oldData)) $oldData = [];
}

// Merge produk baru ke lama
$merged = array_merge($oldData, $data);

// Simpan kembali
if(file_put_contents($file, json_encode($merged, JSON_PRETTY_PRINT))){
    echo "✅ Berhasil upload & merge ".count($data)." produk baru! Total sekarang: ".count($merged);
}else{
    echo "❌ Gagal menyimpan file!";
}
?>
