<?php
header("Content-Type: application/json; charset=UTF-8");

// === 1. RECIBIR Y VALIDAR DATOS ===
$jsonRecibido = file_get_contents('php://input');
$datos = json_decode($jsonRecibido, true);

$userInput = isset($datos['username']) ? trim($datos['username']) : '';
$passInput = isset($datos['password']) ? trim($datos['password']) : '';

if (empty($userInput) || empty($passInput)) {
    echo json_encode(["ok" => false, "mensaje" => "Por favor, completa todos los campos."]);
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

    // === 3. AUTENTICACIÓN ===
    $stmt = $pdo->prepare("SELECT id, nombre, rol, contrasena FROM usuarios WHERE usuario = :usuario");
    $stmt->execute(['usuario' => $userInput]);
    $usuarioEncontrado = $stmt->fetch();

    if ($usuarioEncontrado && $usuarioEncontrado['contrasena'] === $passInput) {
        echo json_encode([
            "ok" => true,
            "id" => $usuarioEncontrado['id'],
            "nombre" => $usuarioEncontrado['nombre'],
            "rol" => $usuarioEncontrado['rol']
        ]);
    } else {
        echo json_encode([
            "ok" => false,
            "mensaje" => "El usuario o la contraseña son incorrectos."
        ]);
    }

} catch (\PDOException $e) {
    echo json_encode([
        "ok" => false,
        "mensaje" => "Error de conexión con la base de datos: " . $e->getMessage()
    ]);
}
?>