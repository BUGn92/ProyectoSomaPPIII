/* ==========================================================================
   SERVICIO DE AUTENTICACIÓN Y SEGURIDAD DE ACCESOS
   ========================================================================== */

import { apiFetch } from "./api.js";

export const AuthService = {
    /**
     * Inicia sesión con credenciales de usuario.
     */
    async login(username, password) {
        return await apiFetch("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                usuario_login: String(username).trim(),
                password: String(password)
            })
        });
    },

    /**
     * Cambio obligatorio o voluntario de contraseña.
     */
    async cambiarPassword(passwordActual, passwordNueva) {
        return await apiFetch("/api/auth/cambiar-password", {
            method: "POST",
            body: JSON.stringify({
                password_actual: String(passwordActual),
                password_nueva: String(passwordNueva).trim()
            })
        });
    },

    /**
     * Paso 1 Recuperación: Solicita código OTP por email indicando DNI o Email.
     */
    async solicitarRecuperacionOtp(identificador) {
        return await apiFetch("/api/auth/recuperar-password/solicitar", {
            method: "POST",
            body: JSON.stringify({
                identificador: String(identificador).trim()
            })
        });
    },

    /**
     * Paso 2 Recuperación: Valida el código OTP de 6 dígitos.
     */
    async verificarOtp(usuarioLogin, otp) {
        return await apiFetch("/api/auth/recuperar-password/verificar-otp", {
            method: "POST",
            body: JSON.stringify({
                usuario_login: String(usuarioLogin).trim(),
                otp: String(otp).trim()
            })
        });
    },

    /**
     * Paso 3 Recuperación: Asigna la nueva contraseña con el token temporal de recuperación.
     */
    async confirmarNuevaPassword(token, nuevaPassword, confirmarPassword) {
        return await apiFetch("/api/auth/recuperar-password/confirmar", {
            method: "POST",
            body: JSON.stringify({
                token: String(token),
                nueva_password: String(nuevaPassword).trim(),
                confirmar_password: String(confirmarPassword).trim()
            })
        });
    }
};
