document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Validar Sesión
    const sesionGuardada = sessionStorage.getItem('usuarioSesion');
    if (!sesionGuardada) {
        window.location.href = "./login.html";
        return;
    }
    const usuario = JSON.parse(sesionGuardada);

    // 2. Obtener las clases de la BD
    try {
        const respuesta = await fetch(`./php/get_listas.php?usuario_id=${usuario.id}`);
        if (!respuesta.ok) throw new Error("Error en la respuesta del servidor.");
        
        const resultado = await respuesta.json();
        const contenedor = document.getElementById('gridMisClases');

        if (resultado.ok && resultado.listas.length > 0) {
            resultado.listas.forEach(clase => {
                const tarjetaHTML = `
                    <div class="class-card admin-card" style="--color-materia: ${clase.color};">
                        <div class="class-card-icon-bg">
                            <i class="fa-solid ${clase.icono}"></i>
                        </div>
                        <h3>${clase.nombre}</h3>
                        <div class="class-info">
                            <span><i class="fa-solid fa-calendar-days"></i> ${clase.dias_clase}</span>
                            <span><i class="fa-solid fa-clock"></i> ${clase.inicio}</span>
                            <span><i class="fa-solid fa-location-dot"></i> ${clase.aula}</span>
                        </div>
                        <div class="card-actions admin-actions">
                            <button class="btn-report-admin" data-id="${clase.id}" style="background-color: #9DB4C0; color: white;">
                                <i class="fa-solid fa-chart-simple"></i> Reporte
                            </button>
                            <button class="btn-edit-admin" data-id="${clase.id}">
                                <i class="fa-solid fa-gear"></i> Configurar
                            </button>
                            <button class="btn-archive" data-id="${clase.id}">
                                <i class="fa-solid fa-box-archive"></i> Archivar
                            </button>
                        </div>
                    </div>
                `;
                contenedor.insertAdjacentHTML('beforeend', tarjetaHTML);
            });
        } else {
            contenedor.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #666;">No tienes materias activas. ¡Crea la primera!</p>`;
        }

    } catch (error) {
        console.error(error);
        alert("Ocurrió un error al cargar tus clases.");
    }

    // 3. Lógica de botones administrativos
    document.getElementById('gridMisClases').addEventListener('click', (e) => {
        // Capturamos el nuevo botón de reporte junto con los otros
        const btnReporte = e.target.closest('.btn-report-admin');
        const btnConfigurar = e.target.closest('.btn-edit-admin');
        const btnArchivar = e.target.closest('.btn-archive');

        // NUEVO: Redirección directa mandando el ID por la URL
        if (btnReporte) {
            const idClase = btnReporte.getAttribute('data-id');
            window.location.href = `./reporte.html?id=${idClase}`;
        }

        if (btnConfigurar) {
            const idClase = btnConfigurar.getAttribute('data-id');
            sessionStorage.setItem('claseAEditar', idClase);
            window.location.href = "./gestionar_clase.html";
        }

        if (btnArchivar) {
            const idClase = btnArchivar.getAttribute('data-id');
            const confirmar = confirm("¿Estás seguro de archivar esta materia? Desaparecerá de tu horario.");
            
            if (confirmar) {
                const archivarMateria = async () => {
                    try {
                        const respuesta = await fetch('./php/archivar_clase.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                id: idClase, 
                                usuario_id: usuario.id 
                            })
                        });

                        const resultado = await respuesta.json();

                        if (resultado.ok) {
                            window.location.reload();
                        } else {
                            alert("❌ Error: " + resultado.mensaje);
                        }
                    } catch (error) {
                        console.error("Error al archivar:", error);
                        alert("Ocurrió un error al conectar con el servidor.");
                    }
                };

                archivarMateria();
            }
        }
    });

    // 4. Cerrar Sesión
    document.getElementById('btnCerrarSesion').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('usuarioSesion');
        window.location.href = "./login.html";
    });
});