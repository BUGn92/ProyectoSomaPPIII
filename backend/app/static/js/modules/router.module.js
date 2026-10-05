/* ==========================================================================
   MÓDULO DE ENRUTAMIENTO, NAVEGACIÓN Y CONTROL DE ACCESO (SPA ROUTER)
   ========================================================================== */

import { state, clearSession } from "../state.js";
import { showToast } from "../utils/toast.js";

import { fetchClientes, openClientModal } from "./clientes.module.js";
import { fetchNoticias, openNoticiaModal } from "./noticias.module.js";
import { fetchUsuarios, openUserModal } from "./usuarios.module.js";
import { fetchSocioData } from "./portal-socio.module.js";
import { fetchEjerciciosAux } from "./rutinas.module.js";

// Páginas principales
const loginPage = document.getElementById("login-page");
const dashboardPage = document.getElementById("dashboard-page");
const portalSocioPage = document.getElementById("portal-socio-page");

// Sidebar & Perfil Staff
const navItems = document.querySelectorAll(".sidebar-nav li");
const currentUserNameSpan = document.getElementById("current-user-name");
const currentUserRoleSpan = document.getElementById("current-user-role");
const navNoticiasLi = document.getElementById("nav-noticias-li");
const navUsuariosLi = document.getElementById("nav-usuarios-li");
const btnLogout = document.getElementById("btn-logout");
const btnSocioLogout = document.getElementById("btn-socio-logout");

// Header actions Staff
const sectionTitle = document.getElementById("section-title");
const sectionSubtitle = document.getElementById("section-subtitle");
const btnActionAdd = document.getElementById("btn-action-add");
const btnActionAddText = document.getElementById("btn-action-add-text");

// Secciones Staff
const crudSections = document.querySelectorAll(".crud-section");

// Modal de cambio forzoso
const modalCambiarPassword = document.getElementById("modal-cambiar-password");
const cpActual = document.getElementById("cp-actual");
const cpNueva = document.getElementById("cp-nueva");
const cpConfirmar = document.getElementById("cp-confirmar");

export function initAuth() {
    if (state.token && state.currentUser) {
        if (loginPage) loginPage.classList.add("hidden");
        
        // 1. Verificar si tiene pendiente cambio forzoso de clave
        if (state.currentUser.debe_cambiar_password) {
            if (modalCambiarPassword) {
                modalCambiarPassword.classList.add("active");
                if (cpActual) cpActual.value = "";
                if (cpNueva) cpNueva.value = "";
                if (cpConfirmar) cpConfirmar.value = "";
            }
        } else {
            if (modalCambiarPassword) modalCambiarPassword.classList.remove("active");
        }

        // 2. Redirección por Rol (RBAC)
        const role = (state.currentUser.rol || "").trim().toLowerCase();
        if (role === "cliente" || role === "socio") {
            // Portal del Socio
            if (dashboardPage) dashboardPage.classList.add("hidden");
            if (portalSocioPage) portalSocioPage.classList.remove("hidden");
            
            fetchSocioData();
        } else {
            // Panel Staff / Administrativo
            if (portalSocioPage) portalSocioPage.classList.add("hidden");
            if (dashboardPage) dashboardPage.classList.remove("hidden");
            
            if (currentUserNameSpan) currentUserNameSpan.textContent = state.currentUser.nombre;
            if (currentUserRoleSpan) currentUserRoleSpan.textContent = state.currentUser.rol;
            
            if (role === "admin") {
                if (navUsuariosLi) navUsuariosLi.classList.remove("hidden");
            } else {
                if (navUsuariosLi) navUsuariosLi.classList.add("hidden");
                if (state.activeSection === "usuarios-section") {
                    switchSection("clientes-section");
                }
            }

            if (role === "entrenador") {
                if (btnActionAdd) btnActionAdd.classList.add("hidden");
            }

            fetchEjerciciosAux();
            fetchStaffData();
        }
    } else {
        if (loginPage) loginPage.classList.remove("hidden");
        if (dashboardPage) dashboardPage.classList.add("hidden");
        if (portalSocioPage) portalSocioPage.classList.add("hidden");
        if (modalCambiarPassword) modalCambiarPassword.classList.remove("active");
        
        clearSession();
    }
}

export function logout() {
    clearSession();
    initAuth();
    showToast("Sesión Cerrada", "Has salido del sistema de manera segura.");
}

export function switchSection(sectionId) {
    state.activeSection = sectionId;
    
    navItems.forEach(item => {
        if (item.getAttribute("data-target") === sectionId) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
    
    crudSections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.remove("hidden");
        } else {
            section.classList.add("hidden");
        }
    });
    
    const role = (state.currentUser?.rol || "").trim().toLowerCase();
    
    if (sectionId === "clientes-section") {
        if (sectionTitle) sectionTitle.textContent = "Gestión de Socios";
        if (sectionSubtitle) sectionSubtitle.textContent = "Alta, modificación, rutinas y evolución física.";
        if (role === "admin" || role === "recepcionista") {
            if (btnActionAdd) btnActionAdd.classList.remove("hidden");
            if (btnActionAddText) btnActionAddText.textContent = "Nuevo Socio";
        } else {
            if (btnActionAdd) btnActionAdd.classList.add("hidden");
        }
        fetchClientes();
    } else if (sectionId === "noticias-section") {
        if (sectionTitle) sectionTitle.textContent = "Muro de Novedades del Gym";
        if (sectionSubtitle) sectionSubtitle.textContent = "Publicación de noticias y avisos oficiales para los socios.";
        if (role === "admin" || role === "recepcionista") {
            if (btnActionAdd) btnActionAdd.classList.remove("hidden");
            if (btnActionAddText) btnActionAddText.textContent = "Publicar Novedad";
        } else {
            if (btnActionAdd) btnActionAdd.classList.add("hidden");
        }
        fetchNoticias();
    } else if (sectionId === "usuarios-section") {
        if (sectionTitle) sectionTitle.textContent = "Personal / Usuarios del Sistema";
        if (sectionSubtitle) sectionSubtitle.textContent = "Administración de accesos de recepcionistas, entrenadores y administradores.";
        if (role === "admin") {
            if (btnActionAdd) btnActionAdd.classList.remove("hidden");
            if (btnActionAddText) btnActionAddText.textContent = "Nuevo Usuario";
        } else {
            if (btnActionAdd) btnActionAdd.classList.add("hidden");
        }
        fetchUsuarios();
    }
}

export function fetchStaffData() {
    if (!state.currentUser || state.currentUser.rol === "Cliente") return;
    if (state.activeSection === "clientes-section") fetchClientes();
    else if (state.activeSection === "noticias-section") fetchNoticias();
    else if (state.activeSection === "usuarios-section") fetchUsuarios();
}

export function initRouterModule() {
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const target = item.getAttribute("data-target");
            if (target) switchSection(target);
        });
    });

    if (btnActionAdd) {
        btnActionAdd.addEventListener("click", () => {
            if (state.activeSection === "clientes-section") {
                openClientModal("create");
            } else if (state.activeSection === "noticias-section") {
                openNoticiaModal();
            } else if (state.activeSection === "usuarios-section") {
                openUserModal("create");
            }
        });
    }

    if (btnLogout) btnLogout.addEventListener("click", logout);
    if (btnSocioLogout) btnSocioLogout.addEventListener("click", logout);
}
