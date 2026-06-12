<?php
header("Content-Type: application/json; charset=UTF-8");

// 1. Recibir los datos por POST
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data || !isset($data['id']) || !isset($data['usuario_id'])) {
    echo json_encode(["ok" => false, "mensaje" => "Faltan datos para procesar la solicitud."]);
    exit;
}

$id_clase = intval($data['id']);
$usuario_id = intval($data['usuario_id']);

// 2. Conexión a la Base de Datos (Docker)
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

    // 3. Ejecutar el Soft Delete (Update)
    $sql = "UPDATE listas SET estado = 'archivada' WHERE id = :id AND usuario_id = :usuario_id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id_clase, 'usuario_id' => $usuario_id]);

    // Comprobamos si realmente se modificó alguna fila
    if ($stmt->rowCount() > 0) {
        echo json_encode(["ok" => true, "mensaje" => "Materia archivada correctamente."]);
    } else {
        echo json_encode(["ok" => false, "mensaje" => "No se encontró la materia o ya estaba archivada."]);
    }

} catch (\PDOException $e) {
    echo json_encode(["ok" => false, "mensaje" => "Error de base de datos: " . $e->getMessage()]);
}
?>