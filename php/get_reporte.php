<?php
header("Content-Type: application/json; charset=UTF-8");

// === 1. RECIBIR PARÁMETROS ===
$lista_id = isset($_GET['lista_id']) ? intval($_GET['lista_id']) : 0;

if ($lista_id === 0) {
    echo json_encode(["ok" => false, "mensaje" => "ID de lista no proporcionado."]);
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

    // === 3. CALCULAR DÍAS EVALUABLES ===
    $sqlDias = "SELECT COUNT(DISTINCT fecha) as dias_totales 
                FROM registros_asistencia 
                WHERE lista_id = :lista_id AND estado_asistencia != 'inhabil'";
    $stmtDias = $pdo->prepare($sqlDias);
    $stmtDias->execute(['lista_id' => $lista_id]);
    $total_dias = (int) $stmtDias->fetchColumn();

    // === 4. OBTENER CONTEO DE ALUMNOS ===
    $sqlAlumnos = "
        SELECT 
            a.id as alumno_id, 
            a.nombre_completo, 
            a.matricula,
            SUM(CASE WHEN r.estado_asistencia = 'asistencia' THEN 1 ELSE 0 END) as total_asistencias,
            SUM(CASE WHEN r.estado_asistencia = 'retardo' THEN 1 ELSE 0 END) as total_retardos,
            SUM(CASE WHEN r.estado_asistencia = 'falta' THEN 1 ELSE 0 END) as total_faltas,
            SUM(CASE WHEN r.estado_asistencia = 'justificado' THEN 1 ELSE 0 END) as total_justificados
        FROM alumnos a
        LEFT JOIN registros_asistencia r ON a.id = r.alumno_id AND r.lista_id = :lista_id
        WHERE a.lista_id = :lista_id
        GROUP BY a.id, a.nombre_completo, a.matricula
        ORDER BY a.nombre_completo ASC
    ";
    
    $stmtAlumnos = $pdo->prepare($sqlAlumnos);
    $stmtAlumnos->execute(['lista_id' => $lista_id]);
    $alumnos = $stmtAlumnos->fetchAll();

    echo json_encode([
        "ok" => true, 
        "total_dias_evaluables" => $total_dias,
        "alumnos" => $alumnos
    ]);

} catch (\PDOException $e) {
    echo json_encode(["ok" => false, "mensaje" => "Error de BD: " . $e->getMessage()]);
}
?>