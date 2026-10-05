/* ==========================================================================
   GUARDIAS DE SEGURIDAD Y CONTROL DE NAVEGACIÓN (MPA GUARDS)
   ========================================================================== */

import { state, initSessionState, clearSession } from "./state.js";

/**
 * Devuelve la URL del portal que le corresponde al rol del usuario.
 * @param {string} role 
 * @returns {string} 'socio.html' | 'entrenador.html' | 'admin.html' | 'index.html'
 */
export function getRedirectUrlForRole(role) {
    const r = (role || "").trim().toLowerCase();
    if (r === "cliente" || r === "socio") {
        return "socio.html";
    } else if (r === "entrenador") {
        return "entrenador.html";
    } else if (r === "admin" || r === "recepcionista" || r === "secretaria") {
        return "admin.html";
    }
    return "index.html";
}

/**
 * Guardia de página: verifica que exista una sesión activa y que el rol esté autorizado.
 * Si no está autenticado o el rol no coincide, redirige al portal correspondiente.
 * 
 * @param {string[]} [allowedRoles=[]] - Roles permitidos en esta página (ej. ['admin', 'recepcionista'])
 * @returns {boolean}
 */
export function requireAuth(allowedRoles = []) {
    initSessionState();
    
    if (!state.token || !state.currentUser) {
        clearSession();
        window.location.href = "index.html";
        return false;
    }

    const currentRole = (state.currentUser.rol || "").trim().toLowerCase();
    
    if (allowedRoles.length > 0) {
        const normalizedAllowed = allowedRoles.map(r => r.trim().toLowerCase());
        if (!normalizedAllowed.includes(currentRole)) {
            window.location.href = getRedirectUrlForRole(currentRole);
            return false;
        }
    }

    return true;
}

/**
 * Se ejecuta en la pantalla de login (index.html):
 * Si el usuario ya tiene sesión iniciada, lo redirige directo a su portal.
 */
export function redirectIfAuthenticated() {
    initSessionState();
    if (state.token && state.currentUser) {
        const dest = getRedirectUrlForRole(state.currentUser.rol);
        if (dest && dest !== "index.html") {
            window.location.href = dest;
            return true;
        }
    }
    return false;
}

/**
 * Cierre de sesión transversal: limpia localStorage y redirige a index.html.
 */
export function logout() {
    clearSession();
    window.location.href = "index.html";
}
