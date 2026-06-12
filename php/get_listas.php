<?php
header("Content-Type: application/json; charset=UTF-8");

// === 1. RECIBIR PARÁMETROS ===
$usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : 3;

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

    // === 3. OBTENER LISTAS ACTIVAS ===
    $stmt = $pdo->prepare("
        SELECT 
            id, 
            nombre, 
            aula, 
            DATE_FORMAT(hora_inicio, '%h:%i %p') AS inicio, 
            dias_clase, 
            icono, 
            color 
        FROM listas 
        WHERE usuario_id = :usuario_id AND estado = 'activa'
        ORDER BY hora_inicio ASC
    ");
    
    $stmt->execute(['usuario_id' => $usuario_id]);
    $listas = $stmt->fetchAll();

    echo json_encode([
        "ok" => true,
        "listas" => $listas
    ]);

} catch (\PDOException $e) {
    echo json_encode([
        "ok" => false,
        "mensaje" => "Error al consultar la base de datos: " . $e->getMessage()
    ]);
}
?>