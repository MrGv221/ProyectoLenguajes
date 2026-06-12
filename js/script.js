document.addEventListener('DOMContentLoaded', () => {
    
    // === 1. Control de la Ventana Modal (Acerca de) ===
    const modal = document.getElementById('modalAcerca');
    const btnAcercaDe = document.getElementById('btnAcercaDe');
    const btnCloseModal = document.querySelector('.close-modal');

    // Abrir Modal al hacer clic en el botón
    btnAcercaDe.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
    });

    // Cerrar Modal al hacer clic en la 'X'
    btnCloseModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Cerrar Modal si se hace clic fuera del recuadro blanco
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // === 3. Efecto visual dinámico en el Header al hacer Scroll ===
    const header = document.getElementById('main-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            // Añade un sombreado más pronunciado y reduce levemente el padding
            header.style.boxShadow = '0 12px 35px rgba(61, 64, 91, 0.07)';
            header.querySelector('.navbar').style.padding = '0.9rem 2rem';
        } else {
            // Regresa al estado inicial relajado y acogedor
            header.style.boxShadow = 'none';
            header.style.borderBottom = '1px solid rgba(157, 180, 192, 0.15)';
            header.querySelector('.navbar').style.padding = '1.2rem 2rem';
        }
    });

});