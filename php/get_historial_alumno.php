<?php
header("Content-Type: application/json; charset=UTF-8");

// === 1. RECIBIR PARÁMETROS ===
$lista_id = isset($_GET['lista_id']) ? intval($_GET['lista_id']) : 0;
$alumno_id = isset($_GET['alumno_id']) ? intval($_GET['alumno_id']) : 0;

if ($lista_id === 0 || $alumno_id === 0) {
    echo json_encode(["ok" => false, "mensaje" => "Faltan parámetros."]);
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
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // === 3. OBTENER HISTORIAL ===
    $sql = "SELECT 
                fechas.fecha, 
                r.estado_asistencia 
            FROM (
                SELECT DISTINCT fecha 
                FROM registros_asistencia 
                WHERE lista_id = :lista_id AND estado_asistencia != 'inhabil'
            ) AS fechas
            LEFT JOIN registros_asistencia r 
                ON fechas.fecha = r.fecha AND r.alumno_id = :alumno_id AND r.lista_id = :lista_id
            ORDER BY fechas.fecha DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['lista_id' => $lista_id, 'alumno_id' => $alumno_id]);
    $historial = $stmt->fetchAll();

    echo json_encode(["ok" => true, "historial" => $historial]);

} catch (\PDOException $e) {
    echo json_encode(["ok" => false, "mensaje" => "Error de BD: " . $e->getMessage()]);
}
?>