/* ==========================================================================
   ESTADO GLOBAL DE LA APLICACIÓN (SPA/MPA STATE)
   ========================================================================== */

export const state = {
    token: null,
    currentUser: null,
    
    activeSection: "clientes-section",
    activePortalTab: "socio-tab-rutina",
    
    clientesData: [],
    usuariosData: [],
    noticiasData: [],
    cachedEjercicios: [],
    
    editingDni: null,
    editingUserId: null,
    membresiaActivaActual: null
};

/**
 * Inicializa la sesión activa.
 * Usa sessionStorage para que la sesión expire al cerrar el navegador o la pestaña.
 */
export function initSessionState() {
    state.token = sessionStorage.getItem("soma_token") || localStorage.getItem("soma_token") || null;
    const rawUser = sessionStorage.getItem("soma_user") || localStorage.getItem("soma_user");
    try {
        state.currentUser = rawUser ? JSON.parse(rawUser) : null;
    } catch {
        state.currentUser = null;
    }
}

/**
 * Guarda la sesión activa para la navegación entre portales.
 * @param {string} token 
 * @param {object} user 
 */
export function setSession(token, user) {
    state.token = token;
    state.currentUser = user;
    sessionStorage.setItem("soma_token", token);
    sessionStorage.setItem("soma_user", JSON.stringify(user));
}

/**
 * Limpia la sesión activa por completo (tanto en memoria como en almacenamiento local/sesión).
 */
export function clearSession() {
    state.token = null;
    state.currentUser = null;
    sessionStorage.removeItem("soma_token");
    sessionStorage.removeItem("soma_user");
    localStorage.removeItem("soma_token");
    localStorage.removeItem("soma_user");
}
