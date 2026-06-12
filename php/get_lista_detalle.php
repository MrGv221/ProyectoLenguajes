<?php
header("Content-Type: application/json; charset=UTF-8");

// === 1. RECIBIR PARÁMETROS ===
$lista_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($lista_id === 0) {
    echo json_encode(["ok" => false, "mensaje" => "ID de lista no válido"]);
    exit;
}

// === 2. CONEXIÓN A LA BASE DE DATOS ===
$host = '127.0.0.1';
$db   = 'asist_manager';
$user = 'root';
$pass = 'admin123';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // === 3. OBTENER DETALLES DE LA MATERIA ===
    $stmt = $pdo->prepare("SELECT * FROM listas WHERE id = :id");
    $stmt->execute(['id' => $lista_id]);
    $lista = $stmt->fetch();

    if ($lista) {
        echo json_encode([
            "ok" => true,
            "data" => $lista
        ]);
    } else {
        echo json_encode([
            "ok" => false,
            "mensaje" => "Materia no encontrada."
        ]);
    }

} catch (\PDOException $e) {
    echo json_encode([
        "ok" => false,
        "mensaje" => "Error al conectar con la base de datos: " . $e->getMessage()
    ]);
}
?>