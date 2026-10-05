/* ==========================================================================
   SERVICIO DE PAGOS Y CUOTAS DE SOCIOS
   ========================================================================== */

import { apiFetch } from "./api.js";

export const PagosService = {
    /**
     * Obtiene el historial de pagos de un socio.
     */
    async getPagosByCliente(dni) {
        return await apiFetch(`/api/pagos/cliente/${encodeURIComponent(dni)}`);
    },

    /**
     * Registra un nuevo pago de cuota/membresía.
     */
    async registrarPago(payload) {
        return await apiFetch("/api/pagos/", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    }
};
