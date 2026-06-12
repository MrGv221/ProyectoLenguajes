<?php
header("Content-Type: application/json; charset=UTF-8");

// 1. Capturar el ID del usuario que solicita las listas (por defecto usamos el 3 del Admin para pruebas)
$usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : 3;

// 2. Parámetros de conexión a la Base de Datos de Docker
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

    // 3. Consulta SQL usando DATE_FORMAT para transformar la hora militar (07:00:00) a formato legible (07:00 AM)
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

    // Devolvemos las listas reales de la BD
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