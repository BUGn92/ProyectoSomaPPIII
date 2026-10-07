/* ==========================================================================
   UTILIDAD DE NOTIFICACIONES FLOTANTES (TOASTS)
   ========================================================================== */

/**
 * Muestra una notificación emergente en la esquina de la pantalla.
 * @param {string} title - Título del mensaje
 * @param {string} message - Descripción o detalle
 * @param {'success'|'error'|'warning'} [type='success'] - Tipo de toast
 */
export function showToast(title, message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "fa-circle-check";
    if (type === "error") icon = "fa-circle-xmark";
    if (type === "warning") icon = "fa-circle-exclamation";
    
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" type="button" aria-label="Cerrar notificación">&times;</button>
    `;
    
    container.appendChild(toast);
    
    const closeBtn = toast.querySelector(".toast-close");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            toast.style.transform = "translateX(120%)";
            setTimeout(() => toast.remove(), 300);
        });
    }
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.transform = "translateX(120%)";
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}
