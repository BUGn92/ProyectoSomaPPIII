/* ==========================================================================
   ESTADO GLOBAL DE LA APLICACIÓN (SPA STATE)
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
 * Inicializa la sesión desde localStorage si existe, o la resetea.
 */
export function initSessionState() {
    state.token = localStorage.getItem("soma_token") || null;
    const rawUser = localStorage.getItem("soma_user");
    try {
        state.currentUser = rawUser ? JSON.parse(rawUser) : null;
    } catch {
        state.currentUser = null;
    }
}

/**
 * Guarda la sesión activa en el estado y en localStorage.
 * @param {string} token 
 * @param {object} user 
 */
export function setSession(token, user) {
    state.token = token;
    state.currentUser = user;
    localStorage.setItem("soma_token", token);
    localStorage.setItem("soma_user", JSON.stringify(user));
}

/**
 * Limpia la sesión activa por completo.
 */
export function clearSession() {
    state.token = null;
    state.currentUser = null;
    localStorage.removeItem("soma_token");
    localStorage.removeItem("soma_user");
}
