/* ==========================================================================
   SERVICIO DE USUARIOS / PERSONAL DEL SISTEMA
   ========================================================================== */

import { apiFetch } from "./api.js";

export const UsuariosService = {
    /**
     * Obtiene los usuarios del sistema junto a su estado de membresía (si son clientes).
     */
    async getUsuarios(incluirInactivos = false) {
        const query = incluirInactivos ? "?incluir_inactivos=true" : "";
        return await apiFetch(`/api/usuarios/con-pago${query}`);
    },

    /**
     * Registra un nuevo usuario del sistema.
     */
    async createUsuario(payload) {
        return await apiFetch("/api/usuarios/", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    /**
     * Actualiza datos de un usuario existente.
     */
    async updateUsuario(id, payload) {
        return await apiFetch(`/api/usuarios/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },

    /**
     * Da de baja lógica a un usuario.
     */
    async deleteUsuario(id) {
        return await apiFetch(`/api/usuarios/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });
    },

    /**
     * Reactiva un usuario del sistema previamente inactivo.
     */
    async reactivateUsuario(id) {
        return await apiFetch(`/api/usuarios/${encodeURIComponent(id)}/reactivar`, {
            method: "POST"
        });
    }
};
