<?php
header("Content-Type: application/json; charset=UTF-8");

// === 1. RECIBIR DATOS Y VALIDAR ===
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data || !isset($data['usuario_id']) || empty($data['nombre'])) {
    echo json_encode(["ok" => false, "mensaje" => "Datos obligatorios incompletos."]);
    exit;
}

// === 2. ASIGNAR VARIABLES ===
$id = isset($data['id']) && $data['id'] !== null ? intval($data['id']) : null;
$usuario_id = intval($data['usuario_id']);
$nombre = $data['nombre'];
$clave = $data['clave'];
$aula = $data['aula'];
$inicio = $data['inicio'];
$fin = $data['fin'];
$dias = $data['dias'];
$color = $data['color'];
$icono = $data['icono'];

// === 3. CONEXIÓN A LA BASE DE DATOS ===
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

    // === 4. LÓGICA DE GUARDADO (UPDATE / INSERT) ===
    if ($id) {
        $sql = "UPDATE listas 
                SET nombre = :nombre, clave_grupo = :clave, aula = :aula, 
                    hora_inicio = :inicio, hora_fin = :fin, dias_clase = :dias, 
                    color = :color, icono = :icono 
                WHERE id = :id AND usuario_id = :usuario_id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'nombre' => $nombre, 'clave' => $clave, 'aula' => $aula,
            'inicio' => $inicio, 'fin' => $fin, 'dias' => $dias,
            'color' => $color, 'icono' => $icono, 'id' => $id, 'usuario_id' => $usuario_id
        ]);
        
        echo json_encode(["ok" => true, "mensaje" => "Materia actualizada correctamente."]);

    } else {
        $sql = "INSERT INTO listas (usuario_id, nombre, clave_grupo, aula, hora_inicio, hora_fin, dias_clase, color, icono, estado) 
                VALUES (:usuario_id, :nombre, :clave, :aula, :inicio, :fin, :dias, :color, :icono, 'activa')";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'usuario_id' => $usuario_id, 'nombre' => $nombre, 'clave' => $clave, 'aula' => $aula,
            'inicio' => $inicio, 'fin' => $fin, 'dias' => $dias, 'color' => $color, 'icono' => $icono
        ]);
        
        $nuevo_id = $pdo->lastInsertId();
        echo json_encode(["ok" => true, "mensaje" => "Materia creada correctamente.", "nuevo_id" => $nuevo_id]);
    }

} catch (\PDOException $e) {
    echo json_encode(["ok" => false, "mensaje" => "Error de base de datos: " . $e->getMessage()]);
}
?>