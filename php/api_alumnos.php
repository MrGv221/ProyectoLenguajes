<?php
header("Content-Type: application/json; charset=UTF-8");

// === 1. CONFIGURACIÓN DE BASE DE DATOS ===
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

    // === 2. DETECCIÓN DEL MÉTODO HTTP ===
    $metodo = $_SERVER['REQUEST_METHOD'];

    if ($metodo === 'GET') {
        
        // === 3. LEER ALUMNOS ===
        $lista_id = isset($_GET['lista_id']) ? intval($_GET['lista_id']) : 0;
        $fecha = isset($_GET['fecha']) ? $_GET['fecha'] : null;

        if ($fecha) {
            $sql = "SELECT a.id, a.nombre_completo, a.matricula, r.estado_asistencia 
                    FROM alumnos a 
                    LEFT JOIN registros_asistencia r ON a.id = r.alumno_id AND r.fecha = :fecha AND r.lista_id = :lista_id
                    WHERE a.lista_id = :lista_id 
                    ORDER BY a.nombre_completo ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['lista_id' => $lista_id, 'fecha' => $fecha]);
        } else {
            $sql = "SELECT id, nombre_completo, matricula, NULL as estado_asistencia 
                    FROM alumnos WHERE lista_id = :lista_id ORDER BY nombre_completo ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['lista_id' => $lista_id]);
        }
        
        $alumnos = $stmt->fetchAll();
        echo json_encode(["ok" => true, "alumnos" => $alumnos]);

    } elseif ($metodo === 'POST') {
        
        // === 4. INSCRIBIR NUEVO ALUMNO ===
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);

        if (!isset($data['lista_id']) || empty($data['nombre']) || empty($data['matricula'])) {
            echo json_encode(["ok" => false, "mensaje" => "Faltan datos del alumno."]);
            exit;
        }

        $sql = "INSERT INTO alumnos (lista_id, nombre_completo, matricula) VALUES (:lista_id, :nombre, :matricula)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'lista_id' => intval($data['lista_id']),
            'nombre' => trim($data['nombre']),
            'matricula' => trim($data['matricula'])
        ]);

        echo json_encode(["ok" => true, "mensaje" => "Alumno registrado exitosamente."]);

    } elseif ($metodo === 'DELETE') {
        
        // === 5. DAR DE BAJA ALUMNO ===
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);

        if (!isset($data['id'])) {
            echo json_encode(["ok" => false, "mensaje" => "ID del alumno no proporcionado."]);
            exit;
        }

        $sql = "DELETE FROM alumnos WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => intval($data['id'])]);

        echo json_encode(["ok" => true, "mensaje" => "Alumno dado de baja exitosamente."]);
    }

} catch (\PDOException $e) {
    echo json_encode(["ok" => false, "mensaje" => "Error BD: " . $e->getMessage()]);
}
?>