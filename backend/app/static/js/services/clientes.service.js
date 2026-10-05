/* ==========================================================================
   SERVICIO DE CLIENTES / SOCIOS, RUTINAS Y SEGUIMIENTO
   ========================================================================== */

import { apiFetch } from "./api.js";

export const ClientesService = {
    /**
     * Obtiene el listado de socios registrados.
     * @param {boolean} incluirInactivos
     */
    async getClientes(incluirInactivos = false) {
        const query = incluirInactivos ? "?incluir_inactivos=true" : "";
        return await apiFetch(`/api/clientes/${query}`);
    },

    /**
     * Obtiene un socio por DNI.
     */
    async getClienteByDni(dni) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}`);
    },

    /**
     * Registra un nuevo socio con pago inicial obligatorio.
     */
    async createCliente(payload) {
        return await apiFetch("/api/clientes/", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    /**
     * Actualiza datos de un socio existente.
     */
    async updateCliente(dni, payload) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },

    /**
     * Realiza la baja lógica del socio.
     */
    async deleteCliente(dni) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}`, {
            method: "DELETE"
        });
    },

    /**
     * Reactiva un socio previamente dado de baja.
     */
    async reactivateCliente(dni) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}/reactivar`, {
            method: "POST"
        });
    },

    /**
     * Obtiene el catálogo auxiliar de ejercicios musculares.
     */
    async getEjerciciosAux() {
        return await apiFetch("/api/clientes/aux/ejercicios");
    },

    /**
     * Obtiene la rutina activa de un socio.
     */
    async getClienteRutina(dni) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}/rutina`);
    },

    /**
     * Asigna o actualiza la rutina de un socio.
     */
    async saveClienteRutina(dni, payload) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}/rutina`, {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    /**
     * Obtiene el historial de evolución antropométrica.
     */
    async getClienteEvFisica(dni) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}/evolucion-fisica`);
    },

    /**
     * Registra una nueva medición antropométrica.
     */
    async saveClienteEvFisica(dni, payload) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}/evolucion-fisica`, {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    /**
     * Obtiene el historial deportivo de cargas por ejercicio.
     */
    async getClienteEvDeportiva(dni) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}/registro-entrenamiento`);
    },

    /**
     * Registra una nueva carga deportiva.
     */
    async saveClienteEvDeportiva(dni, payload) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}/registro-entrenamiento`, {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    /**
     * Consulta el estado de membresía activa y fecha de fin.
     */
    async getClienteMembresia(dni) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}/membresia`);
    }
};
