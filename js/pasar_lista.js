document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Obtener ID y Fecha de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const idClase = urlParams.get('id');
    const fechaParam = urlParams.get('fecha'); 

    if (!idClase) {
        alert("⚠️ No se especificó ninguna clase.");
        window.location.href = "./dashboard.html";
        return;
    }

    // 2. Lógica de Fechas
    let fechaDate = new Date();
    let fechaBD = ''; 

    if (fechaParam) {
        fechaDate = new Date(fechaParam + 'T12:00:00');
        fechaBD = fechaParam; 
    } else {
        const mes = String(fechaDate.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaDate.getDate()).padStart(2, '0');
        fechaBD = `${fechaDate.getFullYear()}-${mes}-${dia}`;
    }

    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaTexto = fechaDate.toLocaleDateString('es-MX', opcionesFecha);
    document.getElementById('lblFechaActual').innerText = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);

    // 3. Traer los datos de la Clase (Color, Ícono, Nombre)
    try {
        const resMateria = await fetch(`./php/get_lista_detalle.php?id=${idClase}`);
        const dataMateria = await resMateria.json();
        if(dataMateria.ok) {
            const m = dataMateria.data;
            document.getElementById('lblNombreMateria').innerText = m.nombre;
            document.getElementById('lblDetallesMateria').innerText = `Grupo: ${m.clave_grupo} | Aula: ${m.aula}`;
            document.getElementById('iconoClase').innerHTML = `<i class="fa-solid ${m.icono}"></i>`;
            document.body.style.setProperty('--color-materia', m.color || '#9DB4C0');
        }
    } catch (e) { console.error("Error al cargar materia:", e); }

    // 4. Traer a los alumnos de la base de datos (Pasando la FECHA como parámetro)
    const contenedorLista = document.getElementById('listaAlumnosAsistencia');
    
    try {
        // NUEVO: Mandamos &fecha= para que el LEFT JOIN haga su magia
        const resAlumnos = await fetch(`./php/api_alumnos.php?lista_id=${idClase}&fecha=${fechaBD}&_t=${Date.now()}`);
        const dataAlumnos = await resAlumnos.json();

        if (dataAlumnos.ok) {
            if(dataAlumnos.alumnos.length === 0){
                contenedorLista.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--texto-mutado); font-weight: 700;">No hay alumnos matriculados.</div>`;
                return;
            }

            // Validar si el día ya está guardado como inhábil
            const esInhabil = dataAlumnos.alumnos[0].estado_asistencia === 'inhabil';
            document.getElementById('bannerInhabil').style.display = esInhabil ? 'block' : 'none';

            // Transformar el botón dependiendo del estado del día
            const btnInhabil = document.getElementById('btnDiaInhabil');
            if (esInhabil) {
                btnInhabil.innerHTML = `<i class="fa-solid fa-rotate-left"></i> Restaurar Día`;
                btnInhabil.style.backgroundColor = "#E07A5F"; // Rojo suave Cozzy
                btnInhabil.style.color = "white";
                btnInhabil.setAttribute('data-action', 'restaurar');
            } else {
                btnInhabil.innerHTML = `<i class="fa-solid fa-calendar-minus"></i> Día Inhábil`;
                btnInhabil.style.backgroundColor = "#F2CC8F"; // Amarillo suave Cozzy
                btnInhabil.style.color = "#3D405B";
                btnInhabil.setAttribute('data-action', 'inhabil');
            }

            // Dibujar la lista respetando el estado guardado en la BD
            contenedorLista.innerHTML = dataAlumnos.alumnos.map((a, index) => {
                // Si no tiene estado guardado en la BD, por defecto lo dejamos en 'asistencia'
                const estadoDefinitivo = a.estado_asistencia || 'asistencia';

                return `
                <div class="attendance-row" data-id="${a.id}">
                    <div class="student-info">
                        <span class="student-name">${a.nombre_completo}</span>
                        <span class="student-mat">${a.matricula}</span>
                    </div>
                    <div class="status-controls">
                        <input type="radio" name="status_${index}" id="pres_${index}" value="asistencia" ${estadoDefinitivo === 'asistencia' ? 'checked' : ''}>
                        <label for="pres_${index}" title="Asistencia"><i class="fa-solid fa-check"></i></label>

                        <input type="radio" name="status_${index}" id="ret_${index}" value="retardo" ${estadoDefinitivo === 'retardo' ? 'checked' : ''}>
                        <label for="ret_${index}" title="Retardo"><i class="fa-solid fa-clock"></i></label>

                        <input type="radio" name="status_${index}" id="falt_${index}" value="falta" ${estadoDefinitivo === 'falta' ? 'checked' : ''}>
                        <label for="falt_${index}" title="Falta"><i class="fa-solid fa-xmark"></i></label>
                    </div>
                </div>
                `;
            }).join('');
        }
    } catch (e) { console.error("Error al cargar alumnos:", e); }

    // 5. Botón Finalizar Pase (Guardar / Actualizar standard)
    document.getElementById('btnGuardarAsistencia').addEventListener('click', async () => {
        const filas = document.querySelectorAll('.attendance-row');
        const listaParaGuardar = [];

        filas.forEach(fila => {
            const idAlumno = fila.getAttribute('data-id');
            const radioCheck = fila.querySelector('input[type="radio"]:checked');
            // Si el día era inhábil y el profe decide cambiar a un estado manual, lo permitimos
            const estadoSeleccionado = radioCheck ? radioCheck.value : 'asistencia';
            
            listaParaGuardar.push({ alumno_id: idAlumno, estado: estadoSeleccionado });
        });

        await enviarAsistenciaAlServidor(listaParaGuardar, true);
    });

    // 6. NUEVO: Lógica del Botón "Día Inhábil / Restaurar"
    document.getElementById('btnDiaInhabil').addEventListener('click', async (e) => {
        // Leemos qué acción tiene el botón en este momento
        const accion = e.currentTarget.getAttribute('data-action');
        const esRestaurar = (accion === 'restaurar');
        
        // Mensaje dinámico
        const mensaje = esRestaurar 
            ? "¿Deseas cancelar el Día Inhábil y restaurar la asistencia normal de todos los alumnos?"
            : "⚠️ ¿Estás seguro de marcar este día como Inhábil?\nTodos los alumnos se guardarán exentos de falta hoy.";
            
        const confirmar = confirm(mensaje);
        if(!confirmar) return;

        const filas = document.querySelectorAll('.attendance-row');
        const listaModificada = [];
        
        // Si estamos restaurando, todos vuelven a 'asistencia', si no, a 'inhabil'
        const nuevoEstado = esRestaurar ? 'asistencia' : 'inhabil';

        filas.forEach(fila => {
            const idAlumno = fila.getAttribute('data-id');
            listaModificada.push({
                alumno_id: idAlumno,
                estado: nuevoEstado 
            });
        });

        await enviarAsistenciaAlServidor(listaModificada, false);
    });

    // Función global inteligente (Recibe un segundo parámetro: irADashboard)
    async function enviarAsistenciaAlServidor(paqueteAlumnos, irADashboard = false) {
        const btn = document.getElementById('btnGuardarAsistencia');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;
        btn.disabled = true;

        try {
            const respuesta = await fetch('./php/guardar_asistencia.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lista_id: idClase,
                    fecha: fechaBD,
                    alumnos: paqueteAlumnos
                })
            });

            const resultado = await respuesta.json();

            if(resultado.ok) {
                alert("✅ " + resultado.mensaje);
                
                // LÓGICA DE REDIRECCIÓN
                if (irADashboard) {
                    window.location.href = "./dashboard.html";
                } else {
                    window.location.reload(); 
                }
                
            } else {
                alert("❌ Error: " + resultado.mensaje);
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        } catch (error) {
            console.error("Error al enviar:", error);
            alert("Ocurrió un error de conexión.");
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }

});