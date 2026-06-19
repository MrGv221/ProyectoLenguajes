document.addEventListener('DOMContentLoaded', async () => {

    // === 1. VALIDAR SESIÓN Y BIENVENIDA ===
    const sesionGuardada = sessionStorage.getItem('usuarioSesion');
    if (!sesionGuardada) {
        window.location.href = "./login.html";
        return;
    }
    const usuario = JSON.parse(sesionGuardada);
    document.getElementById('txtBienvenida').innerText = `¡Hola, ${usuario.nombre}!`;

    // === 2. CONFIGURACIÓN DE FECHA ACTIVA ===
    const fechaActual = new Date();
    const diaSemana = fechaActual.getDay();

    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('txtFecha').innerText = `Hoy es ${fechaActual.toLocaleDateString('es-ES', opcionesFecha)}.`;

    if (diaSemana >= 1 && diaSemana <= 5) {
        const columnaHoy = document.getElementById(`col-${diaSemana}`);
        if (columnaHoy) columnaHoy.classList.add('active-day');
    }

    // === 3. FUNCIONES AUXILIARES ===
    function calcularFechaDelDia(diaDestino) {
        const copiaHoy = new Date();
        const diaActual = copiaHoy.getDay();

        const diferencia = diaDestino - diaActual;

        copiaHoy.setDate(copiaHoy.getDate() + diferencia);

        const yyyy = copiaHoy.getFullYear();
        const mm = String(copiaHoy.getMonth() + 1).padStart(2, '0');
        const dd = String(copiaHoy.getDate()).padStart(2, '0');

        return `${yyyy}-${mm}-${dd}`;
    }

    const mapearDias = (cadenaDias) => {
        const dias = [];
        if (cadenaDias.includes('Lunes')) dias.push(1);
        if (cadenaDias.includes('Martes')) dias.push(2);
        if (cadenaDias.includes('Miércoles')) dias.push(3);
        if (cadenaDias.includes('Jueves')) dias.push(4);
        if (cadenaDias.includes('Viernes')) dias.push(5);
        return dias;
    };

    const convertirAMinutos = (horaString) => {
        if (!horaString) return 0;
        const match = horaString.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return 0;

        let h = parseInt(match[1]);
        const m = parseInt(match[2]);
        const p = match[3].toUpperCase();

        if (h === 12) h = p === 'PM' ? 12 : 0;
        else if (p === 'PM') h += 12;

        return (h * 60) + m;
    };

    // === 4. CARGAR HORARIO DESDE LA BD ===
    try {
        const respuesta = await fetch(`./php/get_listas.php?usuario_id=${usuario.id}`);
        if (!respuesta.ok) throw new Error("No se pudo conectar con el backend.");

        const resultado = await respuesta.json();

        if (resultado.ok) {
            const listasBD = resultado.listas;

            // 1. Encontrar la clase más temprana para ajustar el inicio del grid
            let minMinutos = 24 * 60; // Maximo posible
            listasBD.forEach(clase => {
                if (clase.inicio) {
                    const match = clase.inicio.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (match) {
                        let h = parseInt(match[1]);
                        let m = parseInt(match[2]);
                        let p = match[3].toUpperCase();
                        if (h === 12) h = p === 'PM' ? 12 : 0;
                        else if (p === 'PM') h += 12;
                        const mins = h * 60 + m;
                        if (mins < minMinutos) minMinutos = mins;
                    }
                }
            });
            const inicioGridMinutos = minMinutos === 24 * 60 ? 420 : minMinutos;

            listasBD.forEach(clase => {
                const diasNumeros = mapearDias(clase.dias_clase);

                diasNumeros.forEach(diaNum => {
                    const columnaDia = document.querySelector(`#col-${diaNum} .classes-container`);

                    if (columnaDia) {
                        const fechaClase = calcularFechaDelDia(diaNum);

                        // === AQUÍ EMPIEZA LA MAGIA DINÁMICA ===
                        const inicioAbsoluto = convertirAMinutos(clase.inicio);
                        const finAbsoluto = convertirAMinutos(clase.fin);

                        // Calculamos duración (si hay error, damos 60 min por defecto)
                        let duracionMinutos = finAbsoluto - inicioAbsoluto;
                        if (duracionMinutos <= 0) duracionMinutos = 60;

                        // Restamos 2 minutos para el margen visual
                        const duracionVisual = duracionMinutos - 2;
                        const filaInicio = (inicioAbsoluto - inicioGridMinutos) + 1;

                        const gridRow = `${filaInicio} / span ${duracionVisual}`;
                        // === AQUÍ TERMINA ===

                        const tarjetaHTML = `
                <div class="class-card" style="--color-materia: ${clase.color}; grid-row: ${gridRow}; z-index: 10;">
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

    // === 5. EVENTOS DE INTERFAZ ===
    document.addEventListener('click', (e) => {
        const btnLista = e.target.closest('.btn-pass');
        if (btnLista) {
            const id = btnLista.getAttribute('data-id');
            const fecha = btnLista.getAttribute('data-fecha');

            window.location.href = `./pasar_lista.html?id=${id}&fecha=${fecha}`;
        }
    });

    document.getElementById('btnCerrarSesion').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('usuarioSesion');
        window.location.href = "./login.html";
    });

});