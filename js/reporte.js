document.addEventListener('DOMContentLoaded', async () => {
    
    // === 1. OBTENER ID DE LA URL ===
    const urlParams = new URLSearchParams(window.location.search);
    const idClase = urlParams.get('id');

    if (!idClase) {
        alert("No se especificó ninguna clase.");
        window.location.href = "./mis_clases.html";
        return;
    }

    // === 2. DETALLES DE LA CLASE ===
    try {
        const resMateria = await fetch(`./php/get_lista_detalle.php?id=${idClase}`);
        const dataMateria = await resMateria.json();
        if(dataMateria.ok) {
            const m = dataMateria.data;
            document.getElementById('lblNombreMateria').innerText = m.nombre;
            document.getElementById('iconoClase').innerHTML = `<i class="fa-solid ${m.icono}"></i>`;
            document.body.style.setProperty('--color-materia', m.color || '#9DB4C0');
        }
    } catch (e) { console.error(e); }

    // === 3. CARGAR REPORTES Y DIBUJAR TABLA ===
    const tbody = document.querySelector('#tablaReporte tbody');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Calculando estadísticas...</td></tr>`;

    try {
        const resReporte = await fetch(`./php/get_reporte.php?lista_id=${idClase}`);
        const dataReporte = await resReporte.json();

        if (dataReporte.ok) {
            const totalDiasClase = dataReporte.total_dias_evaluables;
            document.getElementById('lblDetallesMateria').innerText = `Días evaluados hasta hoy: ${totalDiasClase}`;

            if(dataReporte.alumnos.length === 0){
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; font-weight: bold; color: var(--texto-mutado);">No hay alumnos matriculados.</td></tr>`;
                return;
            }

            tbody.innerHTML = dataReporte.alumnos.map(a => {
                let porcentaje = 100;
                if (totalDiasClase > 0) {
                    const clasesAprobadas = parseInt(a.total_asistencias) + parseInt(a.total_retardos) + parseInt(a.total_justificados);
                    porcentaje = Math.round((clasesAprobadas / totalDiasClase) * 100);
                    if (porcentaje > 100) porcentaje = 100; 
                }

                let colorClase = 'safe'; 
                if (porcentaje < 80) colorClase = 'danger'; 
                else if (porcentaje < 90) colorClase = 'warning'; 

                return `
                <tr class="student-row" data-id="${a.alumno_id}" data-nombre="${a.nombre_completo}" data-matricula="${a.matricula}">
                    <td>
                        <div style="font-weight: 700; color: var(--texto-oscuro);">${a.nombre_completo}</div>
                        <div style="font-size: 0.8rem; color: var(--texto-mutado); font-family: monospace;">${a.matricula}</div>
                    </td>
                    <td style="text-align: center;"><span class="badge badge-green">${a.total_asistencias}</span></td>
                    <td style="text-align: center;"><span class="badge badge-yellow">${a.total_retardos}</span></td>
                    <td style="text-align: center;"><span class="badge badge-red">${a.total_faltas}</span></td>
                    <td style="text-align: center;"><span class="badge badge-gray">${a.total_justificados}</span></td>
                    <td style="text-align: right;"><span class="percentage ${colorClase}">${porcentaje}%</span></td>
                </tr>
                `;
            }).join('');

            document.querySelectorAll('.student-row').forEach(fila => {
                fila.addEventListener('click', () => {
                    const idAlumno = fila.getAttribute('data-id');
                    const nombre = fila.getAttribute('data-nombre');
                    const matricula = fila.getAttribute('data-matricula');
                    
                    abrirModalHistorial(idAlumno, nombre, matricula);
                });
            });

        }
    } catch (e) { 
        console.error(e); 
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Error al cargar datos.</td></tr>`;
    }

    // === 4. LÓGICA DE LA VENTANA FLOTANTE (MODAL) ===
    const modal = document.getElementById('modalDetalles');
    const btnCerrar = document.getElementById('btnCerrarModal');
    
    let historialActual = []; 
    let alumnoIdActual = null;
    let huboCambios = false; 

    const cerrarYRecargar = () => {
        modal.style.display = 'none';
        if (huboCambios) window.location.reload(); 
    };

    btnCerrar.addEventListener('click', cerrarYRecargar);
    modal.addEventListener('click', (e) => {
        if(e.target === modal) cerrarYRecargar();
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            const btnClick = e.currentTarget;
            btnClick.classList.add('active');
            
            const filtro = btnClick.getAttribute('data-filter');
            dibujarListaHistorial(filtro);
        });
    });

    async function abrirModalHistorial(idAlumno, nombre, matricula) {
        alumnoIdActual = idAlumno;
        document.getElementById('modalNombreAlumno').innerText = nombre;
        document.getElementById('modalMatriculaAlumno').innerText = matricula;
        
        const listaUL = document.getElementById('listaFechasModal');
        listaUL.innerHTML = `<li style="text-align: center; color: var(--texto-mutado);"><i class="fa-solid fa-spinner fa-spin"></i> Cargando historial...</li>`;
        modal.style.display = 'flex';

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.tab-btn[data-filter="todo"]').classList.add('active');

        try {
            const res = await fetch(`./php/get_historial_alumno.php?lista_id=${idClase}&alumno_id=${idAlumno}&_t=${Date.now()}`);
            const data = await res.json();
            
            if (data.ok) {
                historialActual = data.historial;
                dibujarListaHistorial('todo');
            } else {
                listaUL.innerHTML = `<li style="text-align: center; color: red;">Error: ${data.mensaje}</li>`;
            }
        } catch(e) {
            listaUL.innerHTML = `<li style="text-align: center; color: red;">Error de conexión.</li>`;
        }
    }

    // === 5. RENDERIZAR HISTORIAL DEL MODAL ===
    function dibujarListaHistorial(filtro) {
        const listaUL = document.getElementById('listaFechasModal');
        
        let datosFiltrados = historialActual;
        if (filtro !== 'todo') {
            datosFiltrados = historialActual.filter(item => item.estado_asistencia === filtro);
        }

        if (datosFiltrados.length === 0) {
            listaUL.innerHTML = `<li style="text-align: center; padding: 2rem; color: var(--texto-mutado);">No hay registros en esta categoría.</li>`;
            return;
        }

        listaUL.innerHTML = datosFiltrados.map((item, index) => {
            const estado = item.estado_asistencia; 
            const fechaTxt = new Date(item.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
            
            const cAsist = estado === 'asistencia' ? 'checked' : '';
            const cRet = estado === 'retardo' ? 'checked' : '';
            const cFalt = estado === 'falta' ? 'checked' : '';
            const cJust = estado === 'justificado' ? 'checked' : '';

            const claseFila = estado ? `row-${estado}` : 'row-sin-registro';
            const estiloSinRegistro = !estado ? `border: 1px dashed #E07A5F; background-color: #fff9f8;` : '';

            return `
            <li class="history-row ${claseFila}" data-fecha="${item.fecha}" data-estado-actual="${estado || 'ninguno'}" style="${estiloSinRegistro}">
                <div class="history-date" style="text-transform: capitalize;">
                    <i class="fa-regular fa-calendar"></i> ${fechaTxt}
                    ${!estado ? '<span style="font-size: 0.7rem; background: #E07A5F; color: white; padding: 0.1rem 0.4rem; border-radius: 5px; margin-left: 0.5rem;">Sin Evaluar</span>' : ''}
                </div>
                <div class="status-controls mini-controls">
                    <input type="radio" name="mod_${index}" id="m_pres_${index}" value="asistencia" ${cAsist} class="btn-cambio-estado">
                    <label for="m_pres_${index}" title="Asistencia"><i class="fa-solid fa-check"></i></label>

                    <input type="radio" name="mod_${index}" id="m_ret_${index}" value="retardo" ${cRet} class="btn-cambio-estado">
                    <label for="m_ret_${index}" title="Retardo"><i class="fa-solid fa-clock"></i></label>

                    <input type="radio" name="mod_${index}" id="m_falt_${index}" value="falta" ${cFalt} class="btn-cambio-estado">
                    <label for="m_falt_${index}" title="Falta"><i class="fa-solid fa-xmark"></i></label>

                    <input type="radio" name="mod_${index}" id="m_just_${index}" value="justificado" ${cJust} class="btn-cambio-estado">
                    <label for="m_just_${index}" title="Justificar"><i class="fa-solid fa-file-medical"></i></label>
                </div>
            </li>
            `;
        }).join('');

        activarEventosDeCambio();
    }

    // === 6. GUARDAR CAMBIO DE ESTADO INDIVIDUAL ===
    function activarEventosDeCambio() {
        document.querySelectorAll('.btn-cambio-estado').forEach(radio => {
            radio.addEventListener('change', async (e) => {
                const nuevoEstado = e.target.value;
                const fila = e.target.closest('.history-row');
                const fecha = fila.getAttribute('data-fecha');
                const estadoAnterior = fila.getAttribute('data-estado-actual');

                if (nuevoEstado === estadoAnterior) return;

                const confirmar = confirm(`¿Estás seguro de cambiar el estado del día ${fecha} a "${nuevoEstado.toUpperCase()}" para este alumno?`);
                if (!confirmar) {
                    dibujarListaHistorial(document.querySelector('.tab-btn.active').getAttribute('data-filter'));
                    return;
                }

                fila.style.opacity = '0.5';
                fila.style.pointerEvents = 'none';

                try {
                    const res = await fetch('./php/guardar_asistencia.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            lista_id: idClase,
                            fecha: fecha,
                            alumnos: [{ alumno_id: alumnoIdActual, estado: nuevoEstado }]
                        })
                    });
                    const resultado = await res.json();
                    
                    if (resultado.ok) {
                        huboCambios = true; 
                        
                        const itemIndex = historialActual.findIndex(i => i.fecha === fecha);
                        if (itemIndex > -1) historialActual[itemIndex].estado_asistencia = nuevoEstado;
                        
                        dibujarListaHistorial(document.querySelector('.tab-btn.active').getAttribute('data-filter'));
                    } else {
                        alert("Error al guardar: " + resultado.mensaje);
                        dibujarListaHistorial(document.querySelector('.tab-btn.active').getAttribute('data-filter'));
                    }
                } catch(err) {
                    console.error(err);
                    alert("Error de conexión al guardar.");
                    dibujarListaHistorial(document.querySelector('.tab-btn.active').getAttribute('data-filter'));
                }
            });
        });
    }

    // === 7. EXPORTAR A EXCEL (CSV) ===
    document.getElementById('btnDescargarExcel').addEventListener('click', () => {
        const tabla = document.getElementById('tablaReporte');
        
        if (tabla.querySelectorAll('.student-row').length === 0) {
            alert("No hay datos de alumnos para exportar.");
            return;
        }

        let csvContent = "\uFEFF"; 
        const filas = tabla.querySelectorAll('tr');

        filas.forEach(fila => {
            const celdas = fila.querySelectorAll('th, td');
            const filaArray = [];

            celdas.forEach(celda => {
                let texto = celda.innerText.trim().replace(/\n/g, ' - ');
                texto = `"${texto}"`;
                filaArray.push(texto);
            });

            csvContent += filaArray.join(',') + "\r\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        const nombreMateria = document.getElementById('lblNombreMateria').innerText.replace(/\s+/g, '_');
        const fechaHoy = new Date().toISOString().split('T')[0]; 
        
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_${nombreMateria}_${fechaHoy}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

});