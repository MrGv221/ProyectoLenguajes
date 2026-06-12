<?php
// Configuramos la cabecera para que el navegador sepa que respondemos en formato JSON
header("Content-Type: application/json; charset=UTF-8");

// 1. Capturar los datos enviados desde el fetch de JavaScript (formato JSON)
$jsonRecibido = file_get_contents('php://input');
$datos = json_decode($jsonRecibido, true);

$userInput = isset($datos['username']) ? trim($datos['username']) : '';
$passInput = isset($datos['password']) ? trim($datos['password']) : '';

// Validación básica preventiva
if (empty($userInput) || empty($passInput)) {
    echo json_encode(["ok" => false, "mensaje" => "Por favor, completa todos los campos."]);
    exit;
}

// 2. Parámetros de conexión a la Base de Datos de Docker
$host = '127.0.0.1'; // O 'localhost'
$db   = 'asist_manager';
$user = 'root';
$pass = 'admin123';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

try {
    // Creamos la conexión mediante PDO
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Activa el reporte de errores detallados
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Devuelve los resultados como arreglos asociativos
    ]);

    // 3. Consulta SQL segura usando Prepared Statements (Evita inyección SQL)
    $stmt = $pdo->prepare("SELECT id, nombre, rol, contrasena FROM usuarios WHERE usuario = :usuario");
    $stmt->execute(['usuario' => $userInput]);
    $usuarioEncontrado = $stmt->fetch();

    if ($usuarioEncontrado && $usuarioEncontrado['contrasena'] === $passInput) {
        // Ahora también enviamos el ID al frontend
        echo json_encode([
            "ok" => true,
            "id" => $usuarioEncontrado['id'],     // <--- LÍNEA NUEVA
            "nombre" => $usuarioEncontrado['nombre'],
            "rol" => $usuarioEncontrado['rol']
        ]);
    } else {
        // Credenciales incorrectas
        echo json_encode([
            "ok" => false,
            "mensaje" => "El usuario o la contraseña son incorrectos."
        ]);
    }

} catch (\PDOException $e) {
    // Si la conexión a Docker falla, devolvemos el error técnico en la respuesta JSON
    echo json_encode([
        "ok" => false,
        "mensaje" => "Error de conexión con la base de datos: " . $e->getMessage()
    ]);
}
?>