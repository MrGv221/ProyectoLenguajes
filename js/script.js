document.addEventListener('DOMContentLoaded', () => {
    
    // === 1. CONTROL DE LA VENTANA MODAL (ACERCA DE) ===
    const modal = document.getElementById('modalAcerca');
    const btnAcercaDe = document.getElementById('btnAcercaDe');
    const btnCloseModal = document.querySelector('.close-modal');

    btnAcercaDe.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
    });

    btnCloseModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // === 2. EFECTO VISUAL EN EL HEADER AL HACER SCROLL ===
    const header = document.getElementById('main-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.style.boxShadow = '0 12px 35px rgba(61, 64, 91, 0.07)';
            header.querySelector('.navbar').style.padding = '0.9rem 2rem';
        } else {
            header.style.boxShadow = 'none';
            header.style.borderBottom = '1px solid rgba(157, 180, 192, 0.15)';
            header.querySelector('.navbar').style.padding = '1.2rem 2rem';
        }
    });

});