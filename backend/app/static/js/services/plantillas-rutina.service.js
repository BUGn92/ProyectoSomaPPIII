/* ==========================================================================
   SERVICIO DE PLANTILLAS DE RUTINAS PREDILIGIDAS (INICIACIÓN Y OBJETIVOS)
   ========================================================================== */

import { apiFetch } from "./api.js";

export const PlantillasRutinaService = {
    /**
     * Obtiene el listado de plantillas de rutinas prediseñadas.
     * @param {string} [objetivo] - Filtro opcional por objetivo
     */
    async getPlantillas(objetivo = null) {
        const query = objetivo ? `?objetivo=${encodeURIComponent(objetivo)}` : "";
        return await apiFetch(`/api/plantillas-rutina/${query}`);
    },

    /**
     * Obtiene el detalle completo de una plantilla de rutina por su ID.
     * @param {number|string} id
     */
    async getPlantilla(id) {
        return await apiFetch(`/api/plantillas-rutina/${encodeURIComponent(id)}`);
    }
};
