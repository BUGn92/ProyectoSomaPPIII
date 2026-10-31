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
     * Agrega un ejercicio al catálogo.
     */
    async createEjercicio(payload) {
        return await apiFetch("/api/clientes/aux/ejercicios", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    async updateEjercicio(idEjercicio, payload) {
        return await apiFetch(`/api/clientes/aux/ejercicios/${encodeURIComponent(idEjercicio)}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },

    async deleteEjercicio(idEjercicio) {
        return await apiFetch(`/api/clientes/aux/ejercicios/${encodeURIComponent(idEjercicio)}`, {
            method: "DELETE"
        });
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
    },

    /**
     * Carga directa de foto de perfil por archivo (Admin/Recepción).
     */
    async uploadFotoDirecta(dni, file) {
        const formData = new FormData();
        formData.append("file", file);
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}/subir-foto`, {
            method: "POST",
            body: formData
        });
    },

    /**
     * Asignación directa de foto de perfil por URL (Admin/Recepción).
     */
    async asignarFotoUrl(dni, fotoUrl) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}/foto`, {
            method: "POST",
            body: JSON.stringify({ foto_url: fotoUrl })
        });
    },

    /**
     * Envío de solicitud de cambio de foto con archivo desde el portal del socio.
     */
    async solicitarCambioFoto(dni, file) {
        const formData = new FormData();
        formData.append("file", file);
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}/subir-solicitud-foto`, {
            method: "POST",
            body: formData
        });
    },

    /**
     * Envío de solicitud de cambio de foto por URL.
     */
    async solicitarCambioFotoUrl(dni, fotoPropuestaUrl) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}/solicitar-cambio-foto`, {
            method: "POST",
            body: JSON.stringify({ foto_propuesta_url: fotoPropuestaUrl })
        });
    },

    /**
     * Consulta la solicitud pendiente activa de un socio.
     */
    async getSolicitudFotoActiva(dni) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}/solicitud-foto-activa`);
    },

    /**
     * Obtiene el listado de solicitudes de fotos (Admin/Recepción).
     */
    async getSolicitudesFoto(estado = "Pendiente") {
        const query = estado ? `?estado=${encodeURIComponent(estado)}` : "";
        return await apiFetch(`/api/solicitudes-foto/${query}`);
    },

    /**
     * Aprueba una solicitud de foto.
     */
    async aprobarSolicitudFoto(idSolicitud) {
        return await apiFetch(`/api/solicitudes-foto/${idSolicitud}/aprobar`, {
            method: "POST"
        });
    },

    /**
     * Rechaza una solicitud de foto con motivo opcional.
     */
    async rechazarSolicitudFoto(idSolicitud, motivoRechazo = "") {
        return await apiFetch(`/api/solicitudes-foto/${idSolicitud}/rechazar`, {
            method: "POST",
            body: JSON.stringify({ motivo_rechazo: motivoRechazo })
        });
    },

    /**
     * Obtiene el listado de ejercicios disponibles en el historial de rutinas de un socio.
     */
    async getEjerciciosProgreso(dni) {
        return await apiFetch(`/api/clientes/${encodeURIComponent(dni)}/progreso-rutinas/ejercicios`);
    },

    /**
     * Obtiene la serie temporal de progresión de cargas para un ejercicio específico,
     * con soporte para paginación por año calendario.
     */
    async getProgresoEjercicio(dni, idEjercicio, anio = null) {
        let url = `/api/clientes/${encodeURIComponent(dni)}/progreso-rutinas?id_ejercicio=${encodeURIComponent(idEjercicio)}`;
        if (anio) {
            url += `&anio=${encodeURIComponent(anio)}`;
        }
        return await apiFetch(url);
    }
};

