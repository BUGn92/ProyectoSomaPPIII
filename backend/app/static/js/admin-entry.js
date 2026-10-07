/* ==========================================================================
   ENTRY POINT: PORTAL DE ADMINISTRACIÓN Y RECEPCIÓN (ADMIN.HTML)
   ========================================================================== */

import { state } from "./state.js";
import { requireAuth, logout } from "./guards.js";
import { setUnauthorizedHandler } from "./services/api.js";

import { initModalsModule } from "./modules/modals.module.js";
import { initClientesModule, fetchClientes, openClientModal } from "./modules/clientes.module.js";
import { initRutinasModule, fetchEjerciciosAux } from "./modules/rutinas.module.js";
import { initEvolucionModule } from "./modules/evolucion.module.js";
import { initPagosModule, setOnPagoRegistrado } from "./modules/pagos.module.js";
import { initNoticiasModule, fetchNoticias, openNoticiaModal } from "./modules/noticias.module.js";
import { initUsuariosModule, fetchUsuarios, openUserModal } from "./modules/usuarios.module.js";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Proteger acceso: Admin, Recepcionista, Secretaria
    if (!requireAuth(["admin", "recepcionista", "secretaria"])) return;

    // 2. Interceptor 401
    setUnauthorizedHandler(logout);

    // 3. Perfil del staff en sidebar
    const currentUserNameSpan = document.getElementById("current-user-name");
    const currentUserRoleSpan = document.getElementById("current-user-role");
    const navUsuariosLi = document.getElementById("nav-usuarios-li");
    const roleLower = (state.currentUser?.rol || "").trim().toLowerCase();

    if (currentUserNameSpan) currentUserNameSpan.textContent = state.currentUser.nombre;
    if (currentUserRoleSpan) currentUserRoleSpan.textContent = state.currentUser.rol;

    // Ocultar pestaña de Personal si es recepcionista
    if (navUsuariosLi) {
        navUsuariosLi.classList.toggle("hidden", roleLower !== "admin");
    }

    // 4. Logout
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) btnLogout.addEventListener("click", logout);

    // 5. Navegación entre Secciones
    const navItems = document.querySelectorAll(".sidebar-nav li");
    const crudSections = document.querySelectorAll(".crud-section");
    const sectionTitle = document.getElementById("section-title");
    const sectionSubtitle = document.getElementById("section-subtitle");
    const btnActionAdd = document.getElementById("btn-action-add");
    const btnActionAddText = document.getElementById("btn-action-add-text");

    let currentSection = "clientes-section";

    function switchSection(targetId) {
        currentSection = targetId;
        state.activeSection = targetId;

        navItems.forEach(item => {
            item.classList.toggle("active", item.getAttribute("data-target") === targetId);
        });
        crudSections.forEach(section => {
            section.classList.toggle("hidden", section.id !== targetId);
        });

        if (targetId === "clientes-section") {
            if (sectionTitle) sectionTitle.textContent = "Gestión de Socios";
            if (sectionSubtitle) sectionSubtitle.textContent = "Alta de socios con cobro inicial, cuotas, rutinas y fichas.";
            if (btnActionAdd) btnActionAdd.classList.remove("hidden");
            if (btnActionAddText) btnActionAddText.textContent = "Nuevo Socio";
            fetchClientes();
        } else if (targetId === "noticias-section") {
            if (sectionTitle) sectionTitle.textContent = "Muro de Novedades del Gym";
            if (sectionSubtitle) sectionSubtitle.textContent = "Publicación de comunicados oficiales para la comunidad.";
            if (btnActionAdd) btnActionAdd.classList.remove("hidden");
            if (btnActionAddText) btnActionAddText.textContent = "Publicar Novedad";
            fetchNoticias();
        } else if (targetId === "usuarios-section") {
            if (sectionTitle) sectionTitle.textContent = "Personal / Usuarios del Sistema";
            if (sectionSubtitle) sectionSubtitle.textContent = "Administración de accesos de recepcionistas, entrenadores y administradores.";
            if (btnActionAdd) btnActionAdd.classList.remove("hidden");
            if (btnActionAddText) btnActionAddText.textContent = "Nuevo Usuario";
            fetchUsuarios();
        }
    }

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const target = item.getAttribute("data-target");
            if (target) switchSection(target);
        });
    });

    if (btnActionAdd) {
        btnActionAdd.addEventListener("click", () => {
            if (currentSection === "clientes-section") openClientModal("create");
            else if (currentSection === "noticias-section") openNoticiaModal();
            else if (currentSection === "usuarios-section") openUserModal("create");
        });
    }

    // 6. Conectar recarga de clientes al registrar un pago
    setOnPagoRegistrado(fetchClientes);

    // 7. Inicializar módulos
    initModalsModule();
    initClientesModule();
    initRutinasModule();
    initEvolucionModule();
    initPagosModule();
    initNoticiasModule();
    initUsuariosModule();

    // 8. Cargar datos iniciales
    fetchEjerciciosAux();
    fetchClientes();
});
