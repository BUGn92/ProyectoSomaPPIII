/* ==========================================================================
   CLIENTE HTTP CENTRALIZADO (API WRAPPER)
   ========================================================================== */

import { state, clearSession } from "../state.js";
import { showToast } from "../utils/toast.js";

let onUnauthorizedCallback = null;

/**
 * Registra un callback que se ejecuta cuando el servidor devuelve 401 (token expirado o inválido).
 * @param {Function} callback 
 */
export function setUnauthorizedHandler(callback) {
    onUnauthorizedCallback = callback;
}

/**
 * Realiza una petición HTTP autenticada a la API REST.
 * 
 * @param {string} endpoint - Ruta relativa al servidor (ej. '/api/clientes/')
 * @param {RequestInit} [options={}] - Opciones de fetch (method, headers, body)
 * @returns {Promise<{ ok: boolean, status: number, data: any, detail: string|null }>}
 */
export async function apiFetch(endpoint, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (state.token) {
        headers["Authorization"] = `Bearer ${state.token}`;
    }

    try {
        const response = await fetch(endpoint, {
            ...options,
            headers
        });

        if (response.status === 401) {
            clearSession();
            if (onUnauthorizedCallback) {
                onUnauthorizedCallback();
            } else {
                showToast("Sesión Expirada", "Por favor vuelve a iniciar sesión.", "warning");
            }
            return {
                ok: false,
                status: 401,
                data: null,
                detail: "Sesión expirada o no autorizada"
            };
        }

        let data = null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        }

        const detail = (!response.ok && data && data.detail) ? data.detail : null;

        return {
            ok: response.ok,
            status: response.status,
            data,
            detail
        };
    } catch (error) {
        console.error(`[API Error] Falló petición a ${endpoint}:`, error);
        return {
            ok: false,
            status: 0,
            data: null,
            detail: "Error de red o conexión no disponible."
        };
    }
}
