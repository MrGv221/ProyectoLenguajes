document.addEventListener('DOMContentLoaded', () => {

    // === 1. CAPTURAR FORMULARIO ===
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        // === 2. VALIDACIÓN DE CAMPOS ===
        const usernameValue = document.getElementById('username').value.trim();
        const passwordValue = document.getElementById('password').value.trim();

        if (usernameValue === "" || passwordValue === "") {
            alert("Por favor, rellena todos los campos.");
            return;
        }

        // === 3. AUTENTICACIÓN CON EL SERVIDOR ===
        try {
            const respuesta = await fetch('./php/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: usernameValue,
                    password: passwordValue
                })
            });
            
            if (!respuesta.ok) {
                throw new Error("No se pudo obtener respuesta del servidor backend.");
            }

            const resultado = await respuesta.json();

            // === 4. GESTIÓN DE SESIÓN Y REDIRECCIÓN ===
            if (resultado.ok) {
                const usuarioSesion = {
                    id: resultado.id,
                    usuario: usernameValue,
                    nombre: resultado.nombre,
                    rol: resultado.rol
                };
                
                sessionStorage.setItem('usuarioSesion', JSON.stringify(usuarioSesion));
                window.location.href = "./dashboard.html";
            } else {
                alert(resultado.mensaje);
            }

        } catch (error) {
            console.error("Error en la comunicación con el backend:", error);
            alert("Ocurrió un error al intentar validar tus credenciales. Verifica que el servidor esté activo.");
        }
    });

});