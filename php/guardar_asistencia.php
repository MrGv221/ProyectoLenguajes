<?php
header("Content-Type: application/json; charset=UTF-8");

$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!isset($data['lista_id']) || !isset($data['fecha']) || !isset($data['alumnos'])) {
    echo json_encode(["ok" => false, "mensaje" => "Datos incompletos para guardar asistencia."]);
    exit;
}

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

    // 1. Preparamos una consulta para verificar si el alumno ya tiene asistencia ese día
    $sql_check = "SELECT id FROM registros_asistencia WHERE alumno_id = :alumno_id AND lista_id = :lista_id AND fecha = :fecha";
    $stmt_check = $pdo->prepare($sql_check);

    // 2. Preparamos consulta para actualizar
    $sql_update = "UPDATE registros_asistencia SET estado_asistencia = :estado WHERE id = :id";
    $stmt_update = $pdo->prepare($sql_update);

    // 3. Preparamos consulta para insertar nuevo
    $sql_insert = "INSERT INTO registros_asistencia (alumno_id, lista_id, fecha, estado_asistencia) 
                   VALUES (:alumno_id, :lista_id, :fecha, :estado)";
    $stmt_insert = $pdo->prepare($sql_insert);

    // Recorremos la lista de alumnos que nos mandó JavaScript
    foreach ($data['alumnos'] as $alumno) {
        
        // Revisamos si ya existe el registro
        $stmt_check->execute([
            'alumno_id' => intval($alumno['alumno_id']),
            'lista_id' => intval($data['lista_id']),
            'fecha' => $data['fecha']
        ]);
        
        $registroExistente = $stmt_check->fetch();

        if ($registroExistente) {
            // Si ya existe, lo actualizamos (por si el profe corrigió una falta)
            $stmt_update->execute([
                'estado' => $alumno['estado'],
                'id' => $registroExistente['id']
            ]);
        } else {
            // Si no existe, lo insertamos
            $stmt_insert->execute([
                'alumno_id' => intval($alumno['alumno_id']),
                'lista_id' => intval($data['lista_id']),
                'fecha' => $data['fecha'],
                'estado' => $alumno['estado']
            ]);
        }
    }

    $pdo->commit();
    echo json_encode(["ok" => true, "mensaje" => "Pase de lista guardado con éxito en registros_asistencia."]);

} catch (\PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack(); 
    }
    echo json_encode(["ok" => false, "mensaje" => "Error de BD: " . $e->getMessage()]);
}
?>