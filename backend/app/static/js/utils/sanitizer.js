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

/**
 * Convierte un enlace compartido de Google Drive en una URL directa de imagen (thumbnail).
 * Soporta formatos: /file/d/{id}/..., ?id={id}, open?id={id}, uc?id={id}, etc.
 * @param {string} url
 * @returns {string}
 */
export function parseGoogleDriveUrl(url) {
    if (!url) return "";
    const cleanUrl = String(url).trim();
    const driveMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
    }
    return cleanUrl;
}
