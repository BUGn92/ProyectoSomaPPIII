/* ==========================================================================
   SERVICIO DE MURO DE NOVEDADES Y COMUNICADOS
   ========================================================================== */

import { apiFetch } from "./api.js";

export const NoticiasService = {
    /**
     * Obtiene el listado de noticias publicadas.
     */
    async getNoticias() {
        return await apiFetch("/api/noticias/");
    },

    /**
     * Publica una nueva novedad en el muro.
     */
    async crearNoticia(payload) {
        return await apiFetch("/api/noticias/", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    /**
     * Elimina una noticia por su ID.
     */
    async deleteNoticia(id) {
        return await apiFetch(`/api/noticias/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });
    }
};
