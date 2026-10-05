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
 * Guardia de página para portales internos (socio.html, entrenador.html, admin.html):
 * Verifica que exista una sesión activa. Si no está autenticado o el rol no corresponde,
 * redirige inmediatamente a index.html (Login).
 * 
 * @param {string[]} [allowedRoles=[]] - Roles permitidos en esta página
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
 * Cierre de sesión transversal: limpia almacenamiento y redirige al login.
 */
export function logout() {
    clearSession();
    window.location.href = "index.html";
}
