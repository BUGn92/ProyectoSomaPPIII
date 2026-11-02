/* ==========================================================================
   SERVICIO DE ASISTENCIAS Y CHECK-IN DIGITAL (API CLIENT)
   ========================================================================== */

import { apiFetch } from "./api.js";

/**
 * Registra el check-in de un socio por su DNI.
 * @param {string} dni 
 * @returns {Promise<{ ok: boolean, status: number, data: any, detail: string|null }>}
 */
export async function realizarCheckin(dni) {
    return await apiFetch("/api/asistencias/checkin", {
        method: "POST",
        body: JSON.stringify({ dni })
    });
}

/**
 * Obtiene las asistencias registradas en el día de la fecha.
 * @param {number} [limit=100]
 */
export async function getAsistenciasHoy(limit = 100) {
    return await apiFetch(`/api/asistencias/hoy?limit=${limit}`);
}

/**
 * Obtiene el historial de asistencias de un cliente.
 * @param {string} dni
 * @param {number} [limit=50]
 */
export async function getAsistenciasCliente(dni, limit = 50) {
    return await apiFetch(`/api/asistencias/cliente/${encodeURIComponent(dni)}?limit=${limit}`);
}

/**
 * Obtiene la lista de socios inactivos con más de `dias` sin asistir.
 * @param {number} [dias=15]
 */
export async function getSociosInactivos(dias = 15) {
    return await apiFetch(`/api/asistencias/inactivos?dias=${dias}`);
}

/**
 * Obtiene métricas y estadísticas de asistencia.
 */
export async function getEstadisticasAsistencias() {
    return await apiFetch("/api/asistencias/estadisticas");
}
