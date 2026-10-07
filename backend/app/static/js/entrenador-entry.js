/* ==========================================================================
   ENTRY POINT: PORTAL DEL ENTRENADOR (ENTRENADOR.HTML)
   ========================================================================== */

import { state } from "./state.js";
import { requireAuth, logout } from "./guards.js";
import { setUnauthorizedHandler } from "./services/api.js";

import { initModalsModule } from "./modules/modals.module.js";
import { initClientesModule, fetchClientes } from "./modules/clientes.module.js";
import { initRutinasModule, fetchEjerciciosAux } from "./modules/rutinas.module.js";
import { initEvolucionModule } from "./modules/evolucion.module.js";
import { initNoticiasModule, fetchNoticias } from "./modules/noticias.module.js";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Proteger acceso: Entrenadores (o Admin)
    if (!requireAuth(["entrenador", "admin"])) return;

    // 2. Interceptor 401
    setUnauthorizedHandler(logout);

    // 3. Perfil del profesor en sidebar
    const currentUserNameSpan = document.getElementById("current-user-name");
    const currentUserRoleSpan = document.getElementById("current-user-role");
    if (currentUserNameSpan) currentUserNameSpan.textContent = state.currentUser.nombre;
    if (currentUserRoleSpan) currentUserRoleSpan.textContent = state.currentUser.rol;

    // 4. Logout
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) btnLogout.addEventListener("click", logout);

    // 5. Navegación entre Socios y Novedades
    const navItems = document.querySelectorAll(".sidebar-nav li");
    const crudSections = document.querySelectorAll(".crud-section");
    const sectionTitle = document.getElementById("section-title");
    const sectionSubtitle = document.getElementById("section-subtitle");

    function switchSection(targetId) {
        navItems.forEach(item => {
            item.classList.toggle("active", item.getAttribute("data-target") === targetId);
        });
        crudSections.forEach(section => {
            section.classList.toggle("hidden", section.id !== targetId);
        });

        if (targetId === "clientes-section") {
            if (sectionTitle) sectionTitle.textContent = "Alumnos y Rutinas";
            if (sectionSubtitle) sectionSubtitle.textContent = "Consulta de fichas, asignación de rutinas y seguimiento de cargas.";
            fetchClientes();
        } else if (targetId === "noticias-section") {
            if (sectionTitle) sectionTitle.textContent = "Muro de Novedades del Gym";
            if (sectionSubtitle) sectionSubtitle.textContent = "Avisos oficiales y novedades del gimnasio.";
            fetchNoticias();
        }
    }

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const target = item.getAttribute("data-target");
            if (target) switchSection(target);
        });
    });

    // 6. Inicializar módulos funcionales
    initModalsModule();
    initClientesModule();
    initRutinasModule();
    initEvolucionModule();
    initNoticiasModule();

    // 7. Cargar datos iniciales
    fetchEjerciciosAux();
    fetchClientes();
});
