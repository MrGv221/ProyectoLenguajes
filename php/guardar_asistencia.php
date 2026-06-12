<?php
header("Content-Type: application/json; charset=UTF-8");

// === 1. RECIBIR DATOS ===
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!isset($data['lista_id']) || !isset($data['fecha']) || !isset($data['alumnos'])) {
    echo json_encode(["ok" => false, "mensaje" => "Datos incompletos para guardar asistencia."]);
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

    $pdo->beginTransaction();

    // === 3. PREPARAR CONSULTAS ===
    $sql_check = "SELECT id FROM registros_asistencia WHERE alumno_id = :alumno_id AND lista_id = :lista_id AND fecha = :fecha";
    $stmt_check = $pdo->prepare($sql_check);

    $sql_update = "UPDATE registros_asistencia SET estado_asistencia = :estado WHERE id = :id";
    $stmt_update = $pdo->prepare($sql_update);

    $sql_insert = "INSERT INTO registros_asistencia (alumno_id, lista_id, fecha, estado_asistencia) 
                   VALUES (:alumno_id, :lista_id, :fecha, :estado)";
    $stmt_insert = $pdo->prepare($sql_insert);

    // === 4. PROCESAR REGISTROS ===
    foreach ($data['alumnos'] as $alumno) {
        
        $stmt_check->execute([
            'alumno_id' => intval($alumno['alumno_id']),
            'lista_id' => intval($data['lista_id']),
            'fecha' => $data['fecha']
        ]);
        
        $registroExistente = $stmt_check->fetch();

        if ($registroExistente) {
            $stmt_update->execute([
                'estado' => $alumno['estado'],
                'id' => $registroExistente['id']
            ]);
        } else {
            $stmt_insert->execute([
                'alumno_id' => intval($alumno['alumno_id']),
                'lista_id' => intval($data['lista_id']),
                'fecha' => $data['fecha'],
                'estado' => $alumno['estado']
            ]);
        }
    }

    // === 5. CONFIRMAR TRANSACCIÓN ===
    $pdo->commit();
    echo json_encode(["ok" => true, "mensaje" => "Pase de lista guardado con éxito en registros_asistencia."]);

} catch (\PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack(); 
    }
    echo json_encode(["ok" => false, "mensaje" => "Error de BD: " . $e->getMessage()]);
}
?>