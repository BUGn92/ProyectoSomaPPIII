/* ==========================================================================
   UTILIDAD DE SEGURIDAD - SANITIZACIÓN ANTI-XSS
   ========================================================================== */

/**
 * Escapa caracteres HTML peligrosos para prevenir ataques de Cross-Site Scripting (XSS).
 * Utilizar siempre al interpolar variables de usuario o de la BD en innerHTML.
 * 
 * @param {string|number|null|undefined} value 
 * @returns {string} Cadena sanitizada segura para HTML
 */
export function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Sanitiza números de documento o IDs asegurando que solo contengan caracteres alfanuméricos.
 * @param {string|number} input 
 * @returns {string}
 */
export function sanitizeAlphaNum(input) {
    if (!input) return "";
    return String(input).replace(/[^a-zA-Z0-9_-]/g, "");
}
