/* ==========================================================================
   MÓDULO DE CONTROL DE MODALES Y PESTAÑAS INTERNAS
   ========================================================================== */

export function closeAllModals() {
    const modalIds = ["modal-cliente", "modal-noticia", "modal-usuario", "modal-cambiar-password", "modal-recuperar-password"];
    modalIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("active", "open");
    });
}

export function initModalsModule() {
    const modalCloses = document.querySelectorAll(".modal-close");
    modalCloses.forEach(btn => {
        btn.addEventListener("click", () => closeAllModals());
    });

    window.addEventListener("click", (e) => {
        const backdropModals = ["modal-cliente", "modal-noticia", "modal-usuario"];
        backdropModals.forEach(id => {
            const el = document.getElementById(id);
            if (e.target === el) closeAllModals();
        });
    });

    // Pestañas internas de la ficha del socio (General, Rutina, Evolución Física, Cargas, Pagos)
    const clientModalTabs = document.querySelectorAll("#client-modal-tabs .tab-link");
    const clientModalPanels = document.querySelectorAll("#modal-cliente .tab-content-panel");

    clientModalTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            clientModalTabs.forEach(t => t.classList.remove("active"));
            clientModalPanels.forEach(p => p.classList.remove("active"));
            
            tab.classList.add("active");
            const targetPanelId = tab.getAttribute("data-tab");
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel) targetPanel.classList.add("active");
        });
    });
}
