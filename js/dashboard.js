document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Validar Sesión (Seguridad básica)
    const sesionGuardada = sessionStorage.getItem('usuarioSesion');
    if (!sesionGuardada) {
        window.location.href = "./login.html";
        return;
    }
    const usuario = JSON.parse(sesionGuardada);
    document.getElementById('txtBienvenida').innerText = `¡Hola, ${usuario.nombre}!`;

    // 2. Psicología UX: Identificar y resaltar el día actual
    const fechaActual = new Date();
    const diaSemana = fechaActual.getDay(); // 0 = Domingo, 1 = Lunes... 6 = Sábado
    
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('txtFecha').innerText = `Hoy es ${fechaActual.toLocaleDateString('es-ES', opcionesFecha)}.`;

    if (diaSemana >= 1 && diaSemana <= 5) {
        const columnaHoy = document.getElementById(`col-${diaSemana}`);
        if(columnaHoy) columnaHoy.classList.add('active-day');
    }

    // FUNCIÓN HELPER NUEVA: Calcula la fecha YYYY-MM-DD exacta del lunes, martes, etc., de la semana actual
    function calcularFechaDelDia(diaDestino) {
        const copiaHoy = new Date();
        const diaActual = copiaHoy.getDay(); // El día de hoy (ej. Jueves = 4)
        
        // Calculamos la diferencia de días entre la columna destino (1 al 5) y hoy
        const diferencia = diaDestino - diaActual;
        
        copiaHoy.setDate(copiaHoy.getDate() + diferencia);
        
        const yyyy = copiaHoy.getFullYear();
        const mm = String(copiaHoy.getMonth() + 1).padStart(2, '0');
        const dd = String(copiaHoy.getDate()).padStart(2, '0');
        
        return `${yyyy}-${mm}-${dd}`;
    }

    // Traduce el texto de la BD a los IDs de tus columnas (1 al 5)
    const mapearDias = (cadenaDias) => {
        const dias = [];
        if (cadenaDias.includes('Lunes')) dias.push(1);
        if (cadenaDias.includes('Martes')) dias.push(2);
        if (cadenaDias.includes('Miércoles')) dias.push(3);
        if (cadenaDias.includes('Jueves')) dias.push(4);
        if (cadenaDias.includes('Viernes')) dias.push(5);
        return dias;
    };

    // 3. Petición Real al Servidor PHP -> MySQL de Docker
    try {
        const respuesta = await fetch(`./php/get_listas.php?usuario_id=${usuario.id}`);
        if (!respuesta.ok) throw new Error("No se pudo conectar con el backend.");
        
        const resultado = await respuesta.json();

        if (resultado.ok) {
            const listasBD = resultado.listas;

            // 4. Inyectar las tarjetas reales en sus respectivos días
            listasBD.forEach(clase => {
                const diasNumeros = mapearDias(clase.dias_clase);
                
                diasNumeros.forEach(diaNum => {
                    const columnaDia = document.querySelector(`#col-${diaNum} .classes-container`);
                    
                    if (columnaDia) {
                        // Calculamos la fecha exacta para este día específico de la columna
                        const fechaClase = calcularFechaDelDia(diaNum);

                        // Agregamos data-fecha al botón dinámicamente
                        const tarjetaHTML = `
                            <div class="class-card" style="--color-materia: ${clase.color};">
                                <div class="class-card-icon-bg">
                                    <i class="fa-solid ${clase.icono}"></i>
                                </div>
                                <h3>${clase.nombre}</h3>
                                <div class="class-info">
                                    <span><i class="fa-solid fa-clock"></i> ${clase.inicio}</span>
                                    <span><i class="fa-solid fa-location-dot"></i> ${clase.aula}</span>
                                </div>
                                <div class="card-actions">
                                    <button class="btn-pass" data-id="${clase.id}" data-fecha="${fechaClase}">
                                        <i class="fa-solid fa-check-to-slot"></i> Lista
                                    </button>
                                </div>
                            </div>
                        `;
                        columnaDia.insertAdjacentHTML('beforeend', tarjetaHTML);
                    }
                });
            });

        } else {
            console.error("Error devuelto por el servidor:", resultado.mensaje);
            alert("No se pudieron cargar las listas de asistencia.");
        }

    } catch (error) {
        console.error("Error en la comunicación Fetch:", error);
        alert("Ocurrió un error al conectar con la base de datos.");
    }

    // === NUEVO: Evento Click para redireccionar al Pase de Lista ===
    // Al usar delegación de eventos, no importa cuántas tarjetas se creen, todas responderán al clic
    document.addEventListener('click', (e) => {
        const btnLista = e.target.closest('.btn-pass');
        if (btnLista) {
            const id = btnLista.getAttribute('data-id');
            const fecha = btnLista.getAttribute('data-fecha');
            
            // Te manda con el ID de la clase y la fecha correspondiente a esa columna
            window.location.href = `./pasar_lista.html?id=${id}&fecha=${fecha}`;
        }
    });

    // 5. Cerrar Sesión
    document.getElementById('btnCerrarSesion').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('usuarioSesion');
        window.location.href = "./login.html";
    });

});