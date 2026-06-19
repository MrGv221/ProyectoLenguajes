document.addEventListener('DOMContentLoaded', async () => {

    // === 1. VALIDAR SESIÓN ===
    const sesionGuardada = sessionStorage.getItem('usuarioSesion');
    if (!sesionGuardada) {
        window.location.href = "./login.html";
        return;
    }
    const usuario = JSON.parse(sesionGuardada);

    // === 2. CONFIGURACIÓN VISUAL (PICKERS) ===
    const colores = ['#9DB4C0', '#E07A5F', '#3D405B', '#81B29A', '#F2CC8F', '#A8DADC', '#E491C9'];
    const iconos = ['fa-code', 'fa-book', 'fa-laptop-code', 'fa-calculator', 'fa-chess', 'fa-flask', 'fa-brain'];

    let colorSeleccionado = '';
    let iconoSeleccionado = '';
    let diasSeleccionados = [];

    const pColores = document.getElementById('pickerColores');
    colores.forEach(c => {
        const dot = document.createElement('div');
        dot.className = 'color-dot';
        dot.style.backgroundColor = c;
        dot.setAttribute('data-color', c);
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

    function cambiarColor(c, el) {
        colorSeleccionado = c;
        document.body.style.setProperty('--color-materia', c);
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
        el.classList.add('selected');
    }

    function cambiarIcono(i, el) {
        iconoSeleccionado = i;
        document.querySelectorAll('.icon-box').forEach(b => b.classList.remove('selected'));
        el.classList.add('selected');
    }

    // === 3. SELECTOR DE DÍAS ===
    document.getElementById('selectorDias').addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (pill) {
            const dia = pill.getAttribute('data-dia');
            pill.classList.toggle('active');
            if (diasSeleccionados.includes(dia)) {
                diasSeleccionados = diasSeleccionados.filter(d => d !== dia);
            } else {
                diasSeleccionados.push(dia);
            }
        }
    });

    // === 4. BAJA DE ALUMNOS ===
    document.querySelector('#tablaAlumnos tbody')?.addEventListener('click', async (e) => {
        const btnBaja = e.target.closest('.btn-baja-alumno');

        if (btnBaja) {
            e.preventDefault();

            const alumnoId = btnBaja.getAttribute('data-id');
            const matAlumno = btnBaja.closest('tr')?.querySelectorAll('td')[1]?.textContent || '';
            const idClase = sessionStorage.getItem('claseAEditar') || new URLSearchParams(window.location.search).get('id');

            const confirmar = confirm(`¿Estás seguro de dar de baja a la matrícula ${matAlumno.trim()}?`);

            if (confirmar) {
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
                        cargarAlumnos(idClase);
                    } else {
                        alert("Error: " + resultado.mensaje);
                        cargarAlumnos(idClase);
                    }
                } catch (error) {
                    console.error("Error al dar de baja:", error);
                    alert("Ocurrió un error de conexión.");
                    cargarAlumnos(idClase);
                }
            }
        }
    });

    // === 5. MODO EDICIÓN (AUTO-LLENADO) ===
    const idAEditar = sessionStorage.getItem('claseAEditar');

    if (idAEditar) {
        document.getElementById('txtEstadoPagina').innerText = "EDITAR MATERIA";

        try {
            const respuesta = await fetch(`./php/get_lista_detalle.php?id=${idAEditar}`);
            if (!respuesta.ok) throw new Error("Error en la red.");

            const resultado = await respuesta.json();

            if (resultado.ok) {
                const materia = resultado.data;

                document.getElementById('inNombre').value = materia.nombre;
                document.getElementById('inClave').value = materia.clave_grupo;
                document.getElementById('inAula').value = materia.aula;
                document.getElementById('inHoraInicio').value = materia.hora_inicio.split(' ')[0];
                document.getElementById('inHoraFin').value = materia.hora_fin.split(' ')[0];

                if (materia.dias_clase) {
                    const diasBD = materia.dias_clase.split(',').map(d => d.trim());
                    diasBD.forEach(diaTexto => {
                        const pillVal = {
                            'Lunes': 'L', 'Martes': 'M', 'Miércoles': 'Mi', 'Jueves': 'J', 'Viernes': 'V'
                        }[diaTexto];
                        const pillElement = [...document.querySelectorAll('.pill')].find(p => p.textContent === pillVal);
                        if (pillElement) {
                            pillElement.classList.add('active');
                            diasSeleccionados.push(diaTexto);
                        }
                    });
                }

                if (materia.color) {
                    const colorDot = document.querySelector(`.color-dot[data-color="${materia.color}"]`);
                    if (colorDot) cambiarColor(materia.color, colorDot);
                }

                if (materia.icono) {
                    const iconBox = document.querySelector(`.icon-box[data-icon="${materia.icono}"]`);
                    if (iconBox) cambiarIcono(materia.icono, iconBox);
                }

                document.getElementById('candadoAlumnos').style.display = "none";
                cargarAlumnos(idAEditar);

            } else {
                alert(resultado.mensaje);
                window.location.href = "./mis_clases.html";
            }

        } catch (error) {
            console.error("Error al cargar datos:", error);
            alert("No se pudieron cargar los datos de la materia.");
        }

    } else {
        document.getElementById('candadoAlumnos').style.display = "flex";

        const defaultColor = document.querySelector('.color-dot');
        const defaultIcon = document.querySelector('.icon-box');
        if (defaultColor) cambiarColor(colores[0], defaultColor);
        if (defaultIcon) cambiarIcono(iconos[0], defaultIcon);
    }

    // === 6. GUARDAR MATERIA ===
    document.getElementById('btnGuardarTodo').addEventListener('click', async () => {
        const nombre = document.getElementById('inNombre').value.trim();
        const clave = document.getElementById('inClave').value.trim();
        const aula = document.getElementById('inAula').value.trim();
        const inicio = document.getElementById('inHoraInicio').value;
        const fin = document.getElementById('inHoraFin').value;
        const dias = diasSeleccionados.join(', ');

        if (!nombre || !inicio || !fin || diasSeleccionados.length === 0) {
            alert("Por favor completa el nombre, el horario y al menos un día de la semana.");
            return;
        }

        const data = {
            id: idAEditar || null,
            usuario_id: usuario.id,
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
            const respuesta = await fetch('./php/guardar_clase.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const resultado = await respuesta.json();

            if (resultado.ok) {
                alert("" + resultado.mensaje);

                if (!idAEditar) {
                    sessionStorage.setItem('claseAEditar', resultado.nuevo_id);
                    window.location.reload();
                }
            } else {
                alert("Error: " + resultado.mensaje);
            }

        } catch (error) {
            console.error("Error en Fetch:", error);
            alert("Ocurrió un error al intentar guardar en el servidor.");
        }
    });

    // === 7. CARGAR ALUMNOS ===
    const tbodyAlumnos = document.querySelector('#tablaAlumnos tbody');

    async function cargarAlumnos(idClase) {
        const tbodyAlumnos = document.querySelector('#tablaAlumnos tbody');
        if (!tbodyAlumnos) return;

        tbodyAlumnos.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--texto-mutado); padding: 2rem;">Actualizando lista... <i class="fa-solid fa-spinner fa-spin"></i></td></tr>`;

        try {
            const respuesta = await fetch(`./php/api_alumnos.php?lista_id=${idClase}&_t=${Date.now()}`);
            const resultado = await respuesta.json();

            if (resultado.ok) {
                if (resultado.alumnos.length === 0) {
                    tbodyAlumnos.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--texto-mutado); padding: 2rem;">No hay alumnos.</td></tr>`;
                    return;
                }

                tbodyAlumnos.innerHTML = resultado.alumnos.map(a => `
                    <tr>
                        <td style="font-weight: 600;">${a.nombre_completo}</td>
                        <td style="font-family: monospace; color: var(--texto-mutado); text-align: center;">${a.matricula}</td>
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

    // === 8. INSCRIBIR ALUMNO ===
    document.getElementById('btnAgregarAlumno').addEventListener('click', async () => {
        const inNombre = document.getElementById('inNombreAlumno');
        const inMatricula = document.getElementById('inMatricula');

        if (!inNombre.value.trim() || !inMatricula.value.trim()) {
            alert("Por favor ingresa el nombre y la matrícula del alumno.");
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
                inNombre.value = '';
                inMatricula.value = '';
                inNombre.focus();

                cargarAlumnos(idAEditar);
            } else {
                alert("Error: " + resultado.mensaje);
            }
        } catch (error) {
            console.error("Error al inscribir:", error);
            alert("Ocurrió un error al guardar al alumno.");
        }
    });

    // === 9. SESIÓN Y LIMPIEZA ===
    document.getElementById('btnCerrarSesion').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('usuarioSesion');
        window.location.href = "./login.html";
    });

    window.addEventListener('beforeunload', () => {
        if (sessionStorage.getItem('claseAEditar')) {
            sessionStorage.removeItem('claseAEditar');
        }
    });

});