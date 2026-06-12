document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const usernameValue = document.getElementById('username').value.trim();
        const passwordValue = document.getElementById('password').value.trim();

        if (usernameValue === "" || passwordValue === "") {
            alert("Por favor, rellena todos los campos.");
            return;
        }

        try {
            // Hacemos la petición POST directamente al archivo PHP intermediario
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

            // Parseamos la respuesta JSON que generó el archivo PHP
            const resultado = await respuesta.json();

            if (resultado.ok) {
                // Creamos el objeto de sesión con los datos reales que vinieron de MySQL
                const usuarioSesion = {
                    id: resultado.id,
                    usuario: usernameValue,
                    nombre: resultado.nombre,
                    rol: resultado.rol
                };
                
                // Guardamos en la memoria del navegador para el Dashboard
                sessionStorage.setItem('usuarioSesion', JSON.stringify(usuarioSesion));

                // Redirección directa al panel de control
                window.location.href = "./dashboard.html";
            } else {
                // Si el PHP determinó que los datos están mal, mostramos su mensaje exacto
                alert(resultado.mensaje);
            }

        } catch (error) {
            console.error("Error en la comunicación con el backend:", error);
            alert("Ocurrió un error al intentar validar tus credenciales. Verifica que el servidor esté activo.");
        }
    });

});