document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Validar Sesión (Seguridad)
    const sesionGuardada = sessionStorage.getItem('usuarioSesion');
    if (!sesionGuardada) {
        window.location.href = "./login.html";
        return;
    }
    const usuario = JSON.parse(sesionGuardada);

    // 2. Configuración de Selectores Visuales y Variables Maestras
    const colores = ['#9DB4C0', '#E07A5F', '#3D405B', '#81B29A', '#F2CC8F', '#A8DADC'];
    // Actualizamos íconos para que coincidan con la base de datos de prueba
    const iconos = ['fa-code', 'fa-book', 'fa-laptop-code', 'fa-network-wired', 'fa-kanban', 'fa-flask'];
    
    let colorSeleccionado = '';
    let iconoSeleccionado = '';
    let diasSeleccionados = [];

    // Generar elementos HTML de los pickers (Pickers de Color e Ícono)
    const pColores = document.getElementById('pickerColores');
    colores.forEach(c => {
        const dot = document.createElement('div');
        dot.className = 'color-dot';
        dot.style.backgroundColor = c;
        dot.setAttribute('data-color', c);
        // Función cambiarColor(c, dot) se llama al hacer clic
        dot.onclick = () => cambiarColor(c, dot);
        pColores.appendChild(dot);
    });

    const pIconos = document.getElementById('pickerIconos');
    iconos.forEach(i => {
        const box = document.createElement('div');
        box.className = 'icon-box';
        box.setAttribute('data-icon', i);
        box.innerHTML = `<i class="fa-solid ${i}"></i>`;
        box.onclick = () => cambiarIcono(i, box);
        pIconos.appendChild(box);
    });

    // Funciones Helper para cambiar la identidad visual y la variable de color maestra
    function cambiarColor(c, el) {
        colorSeleccionado = c;
        // Cambia la variable de color en el body para que reaccione todo el diseño
        document.body.style.setProperty('--color-materia', c);
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
        el.classList.add('selected');
    }

    function cambiarIcono(i, el) {
        iconoSeleccionado = i;
        document.querySelectorAll('.icon-box').forEach(b => b.classList.remove('selected'));
        el.classList.add('selected');
    }

    // Selector de Días de Clase (Pills Cozzy)
    document.getElementById('selectorDias').addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if(pill) {
            const dia = pill.getAttribute('data-dia');
            pill.classList.toggle('active');
            if(diasSeleccionados.includes(dia)) {
                // Si ya está, lo quitamos
                diasSeleccionados = diasSeleccionados.filter(d => d !== dia);
            } else {
                // Si no está, lo agregamos
                diasSeleccionados.push(dia);
            }
        }
    });

    // Evento para Dar de Baja al alumno (A prueba de balas)
    document.querySelector('#tablaAlumnos tbody')?.addEventListener('click', async (e) => {
        const btnBaja = e.target.closest('.btn-baja-alumno');
        
        if (btnBaja) {
            e.preventDefault(); // Evitamos cualquier comportamiento por defecto del navegador
            
            const alumnoId = btnBaja.getAttribute('data-id');
            const matAlumno = btnBaja.closest('tr')?.querySelectorAll('td')[1]?.textContent || '';
            const idClase = sessionStorage.getItem('claseAEditar') || new URLSearchParams(window.location.search).get('id'); 
            
            const confirmar = confirm(`¿Estás seguro de dar de baja a la matrícula ${matAlumno.trim()}?`);
            
            if (confirmar) {
                // Bloqueamos el botón y mostramos que está "Pensando"
                btnBaja.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
                btnBaja.disabled = true;

                try {
                    const respuesta = await fetch('./php/api_alumnos.php', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: alumnoId, lista_id: idClase }) 
                    });
                    
                    const resultado = await respuesta.json();
                    
                    if (resultado.ok) {
                        // El alumno se borró, llamamos a la función para redibujar
                        cargarAlumnos(idClase); 
                    } else {
                        alert("❌ Error: " + resultado.mensaje);
                        cargarAlumnos(idClase); // Redibujamos para quitar el spinner
                    }
                } catch (error) {
                    console.error("Error al dar de baja:", error);
                    alert("Ocurrió un error de conexión.");
                    cargarAlumnos(idClase);
                }
            }
        }
    });

    // 3. Lógica de AUTO-LLENADO para el "Modo Edición"
    // Recuperamos el ID que guardamos en la sesión al hacer clic en 'Configurar'
    const idAEditar = sessionStorage.getItem('claseAEditar');
    
    if (idAEditar) {
        document.getElementById('txtEstadoPagina').innerText = "EDITAR MATERIA";
        
        try {
            // Petición real a Docker usando el nuevo PHP
            const respuesta = await fetch(`./php/get_lista_detalle.php?id=${idAEditar}`);
            if (!respuesta.ok) throw new Error("Error en la red.");
            
            const resultado = await respuesta.json();

            if (resultado.ok) {
                const materia = resultado.data;

                // A. Llenar inputs de texto
                document.getElementById('inNombre').value = materia.nombre;
                document.getElementById('inClave').value = materia.clave_grupo;
                document.getElementById('inAula').value = materia.aula;
                // Formato TIME '07:00 AM' necesita transformarse a '07:00' para el input
                document.getElementById('inHoraInicio').value = materia.hora_inicio.split(' ')[0];
                document.getElementById('inHoraFin').value = materia.hora_fin.split(' ')[0];

                // B. Llenar los Días (Pills)
                if (materia.dias_clase) {
                    // Texto: 'Lunes, Martes' -> Arreglo: ['Lunes', ' Martes']
                    const diasBD = materia.dias_clase.split(',').map(d => d.trim());
                    diasBD.forEach(diaTexto => {
                        const pillVal = {
                            'Lunes': 'L', 'Martes': 'M', 'Miércoles': 'Mi', 'Jueves': 'J', 'Viernes': 'V'
                        }[diaTexto];
                        // Buscamos la pill HTML correspondiente y la activamos
                        const pillElement = [...document.querySelectorAll('.pill')].find(p => p.textContent === pillVal);
                        if (pillElement) {
                            pillElement.classList.add('active');
                            diasSeleccionados.push(diaTexto);
                        }
                    });
                }

                // C. Llenar Color e Ícono (¡Y activar el diseño Cozzy!)
                if (materia.color) {
                    const colorDot = document.querySelector(`.color-dot[data-color="${materia.color}"]`);
                    if (colorDot) cambiarColor(materia.color, colorDot);
                }

                if (materia.icono) {
                    const iconBox = document.querySelector(`.icon-box[data-icon="${materia.icono}"]`);
                    if (iconBox) cambiarIcono(materia.icono, iconBox);
                }

                // D. Desbloquear sección de alumnos (Overlay Cozzy)
                document.getElementById('candadoAlumnos').style.display = "none";                
                // ¡NUEVO! Traer a los alumnos de la BD
                cargarAlumnos(idAEditar);                
                console.log("Datos reales cargados correctamente para editar.");

            } else {
                alert(resultado.mensaje);
                window.location.href = "./mis_clases.html";
            }

        } catch (error) {
            console.error("Error al cargar datos:", error);
            alert("No se pudieron cargar los datos de la materia.");
        }

    } else {
        // Modo Nueva Clase: Seleccionar color e ícono por defecto
        document.getElementById('candadoAlumnos').style.display = "flex";
        
        // Activamos los primeros elementos por defecto
        const defaultColor = document.querySelector('.color-dot');
        const defaultIcon = document.querySelector('.icon-box');
        if(defaultColor) cambiarColor(colores[0], defaultColor);
        if(defaultIcon) cambiarIcono(iconos[0], defaultIcon);
    }

    // === ESTE ES EL BLOQUE QUE FALTABA: Lógica para Guardar ===
    document.getElementById('btnGuardarTodo').addEventListener('click', async () => {
        // Recolectar valores de los inputs
        const nombre = document.getElementById('inNombre').value.trim();
        const clave = document.getElementById('inClave').value.trim();
        const aula = document.getElementById('inAula').value.trim();
        const inicio = document.getElementById('inHoraInicio').value;
        const fin = document.getElementById('inHoraFin').value;
        const dias = diasSeleccionados.join(', ');

        // Validación básica en el frontend
        if (!nombre || !inicio || !fin || diasSeleccionados.length === 0) {
            alert("⚠️ Por favor completa el nombre, el horario y al menos un día de la semana.");
            return;
        }

        // Armar el paquete de datos
        const data = {
            id: idAEditar || null,         // Si es null, PHP sabrá que es nueva
            usuario_id: usuario.id,        // ID del profesor en sesión
            nombre: nombre,
            clave: clave,
            aula: aula,
            inicio: inicio,
            fin: fin,
            dias: dias,
            color: colorSeleccionado,
            icono: iconoSeleccionado
        };

        try {
            // Enviar datos por POST a nuestro nuevo PHP
            const respuesta = await fetch('./php/guardar_clase.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const resultado = await respuesta.json();

            if (resultado.ok) {
                alert("✅ " + resultado.mensaje);
                
                if (!idAEditar) {
                    // Truco UX: Si era una clase nueva, guardamos el nuevo ID en la memoria y recargamos.
                    // Así la página entra en "Modo Edición", el candado de alumnos desaparece y puedes agregar gente.
                    sessionStorage.setItem('claseAEditar', resultado.nuevo_id);
                    window.location.reload();
                }
            } else {
                alert("❌ Error: " + resultado.mensaje);
            }

        } catch (error) {
            console.error("Error en Fetch:", error);
            alert("Ocurrió un error al intentar guardar en el servidor.");
        }
    });
    // ==========================================================

    // === FASE 3: LÓGICA DE ALUMNOS ===
    const tbodyAlumnos = document.querySelector('#tablaAlumnos tbody');

    // 1. Función para descargar e imprimir la tabla de alumnos
    async function cargarAlumnos(idClase) {
        const tbodyAlumnos = document.querySelector('#tablaAlumnos tbody');
        if (!tbodyAlumnos) return;
        
        // 1. Feedback visual para el usuario en lo que la base de datos responde
        tbodyAlumnos.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--texto-mutado); padding: 2rem;">Actualizando lista... <i class="fa-solid fa-spinner fa-spin"></i></td></tr>`;
        
        try {
            // 2. Cache Buster: Le agregamos la hora exacta (&_t=...) para que el navegador NUNCA use caché viejo
            const respuesta = await fetch(`./php/api_alumnos.php?lista_id=${idClase}&_t=${Date.now()}`);
            const resultado = await respuesta.json();
            
            if (resultado.ok) {
                if (resultado.alumnos.length === 0) {
                    tbodyAlumnos.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--texto-mutado); padding: 2rem;">No hay alumnos.</td></tr>`;
                    return;
                }

                // 3. Dibujamos agregando type="button" para evitar recargas fantasma
                tbodyAlumnos.innerHTML = resultado.alumnos.map(a => `
                    <tr>
                        <td style="font-weight: 600;">${a.nombre_completo}</td>
                        <td style="font-family: monospace; color: var(--texto-mutado);">${a.matricula}</td>
                        <td style="text-align: right;">
                            <button type="button" class="btn-archive btn-baja-alumno" data-id="${a.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" title="Dar de baja">
                                <i class="fa-solid fa-user-minus"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbodyAlumnos.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#e07a5f;">Error al cargar alumnos</td></tr>`;
            }
        } catch (error) { 
            console.error("Error alumnos:", error); 
            tbodyAlumnos.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#e07a5f;">Error de conexión con Docker</td></tr>`;
        }
    }

    // 2. El botón de [+] Agregar Alumno
    document.getElementById('btnAgregarAlumno').addEventListener('click', async () => {
        const inNombre = document.getElementById('inNombreAlumno');
        const inMatricula = document.getElementById('inMatricula');

        if (!inNombre.value.trim() || !inMatricula.value.trim()) {
            alert("⚠️ Por favor ingresa el nombre y la matrícula del alumno.");
            return;
        }

        try {
            const respuesta = await fetch('./php/api_alumnos.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lista_id: idAEditar,
                    nombre: inNombre.value.trim(),
                    matricula: inMatricula.value.trim()
                })
            });

            const resultado = await respuesta.json();

            if (resultado.ok) {
                // Limpiar las cajitas para el siguiente alumno
                inNombre.value = '';
                inMatricula.value = '';
                inNombre.focus(); // Regresar el cursor al nombre
                
                // Recargar la tabla para que aparezca el nuevo al instante
                cargarAlumnos(idAEditar);
            } else {
                alert("❌ Error: " + resultado.mensaje);
            }
        } catch (error) {
            console.error("Error al inscribir:", error);
            alert("Ocurrió un error al guardar al alumno.");
        }
    });


    // 4. Lógica de Cerrar Sesión
    document.getElementById('btnCerrarSesion').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('usuarioSesion');
        window.location.href = "./login.html";
    });

    // (Opcional) Borrar la variable de la sesión al salir de esta página para que no se confunda
    window.addEventListener('beforeunload', () => {
        if(sessionStorage.getItem('claseAEditar')) {
            sessionStorage.removeItem('claseAEditar');
        }
    });

});