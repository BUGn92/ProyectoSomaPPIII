/* ==========================================================================
   MÓDULO DE AUTENTICACIÓN, CAMBIO DE CLAVE Y RECUPERACIÓN OTP
   ========================================================================== */

import { state, setSession } from "../state.js";
import { AuthService } from "../services/auth.service.js";
import { showToast } from "../utils/toast.js";
import { closeAllModals } from "./modals.module.js";

// Login
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("toggle-password");

// Cambio Obligatorio de Password
const modalCambiarPassword = document.getElementById("modal-cambiar-password");
const formCambiarPassword = document.getElementById("form-cambiar-password");
const cpActual = document.getElementById("cp-actual");
const cpNueva = document.getElementById("cp-nueva");
const cpConfirmar = document.getElementById("cp-confirmar");

// Recuperación de Contraseña por Email (OTP)
const forgotPasswordLink = document.getElementById("forgot-password-link");
const modalRecuperar = document.getElementById("modal-recuperar-password");
const btnCloseRecuperar = document.getElementById("btn-close-recuperar");
const formSolicitarReset = document.getElementById("form-solicitar-reset");
const formVerificarOtp = document.getElementById("form-verificar-otp");
const formConfirmarReset = document.getElementById("form-confirmar-reset");
const recuperarStep1 = document.getElementById("recuperar-step-1");
const recuperarStep2 = document.getElementById("recuperar-step-2");
const recuperarStep3 = document.getElementById("recuperar-step-3");
const btnVolverStep1 = document.getElementById("btn-volver-step1");

let usuarioLoginTemp = null;
let resetTokenTemp = null;
let onAuthSuccessCallback = null;

export function setOnAuthSuccess(callback) {
    onAuthSuccessCallback = callback;
}

function resetRecuperarModalState() {
    if (recuperarStep1) recuperarStep1.classList.remove("hidden");
    if (recuperarStep2) recuperarStep2.classList.add("hidden");
    if (recuperarStep3) recuperarStep3.classList.add("hidden");
    
    const elIdent = document.getElementById("reset-identificador");
    const elOtp = document.getElementById("reset-otp-code");
    const elPass = document.getElementById("reset-nueva-password");
    const elConf = document.getElementById("reset-confirmar-password");

    if (elIdent) elIdent.value = "";
    if (elOtp) elOtp.value = "";
    if (elPass) elPass.value = "";
    if (elConf) elConf.value = "";

    usuarioLoginTemp = null;
    resetTokenTemp = null;
}

export function initAuthModule() {
    // 1. Toggle ver/ocultar contraseña
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener("click", () => {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            const icon = togglePasswordBtn.querySelector("i");
            if (icon) {
                if (type === "text") {
                    icon.classList.replace("fa-eye", "fa-eye-slash");
                } else {
                    icon.classList.replace("fa-eye-slash", "fa-eye");
                }
            }
        });
    }

    // 2. Envío del Login
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            if (!username || !password) {
                showToast("Atención", "Por favor ingresa usuario y contraseña", "warning");
                return;
            }

            const res = await AuthService.login(username, password);
            if (res.ok && res.data) {
                setSession(res.data.access_token, res.data.usuario);
                showToast("Acceso Concedido", `Bienvenido de nuevo, ${res.data.usuario.nombre}.`);
                if (onAuthSuccessCallback) onAuthSuccessCallback();
            } else {
                showToast("Acceso Denegado", res.detail || "Usuario o contraseña inválidos", "error");
            }
        });
    }

    // 3. Formulario de Cambio Obligatorio de Password
    if (formCambiarPassword) {
        formCambiarPassword.addEventListener("submit", async (e) => {
            e.preventDefault();
            const actual = cpActual.value;
            const nueva = cpNueva.value.trim();
            const confirmar = cpConfirmar.value.trim();

            if (nueva !== confirmar) {
                showToast("Error", "La nueva contraseña y su confirmación no coinciden.", "error");
                return;
            }

            if (nueva.length < 6) {
                showToast("Error", "La nueva contraseña debe tener al menos 6 caracteres.", "error");
                return;
            }

            const res = await AuthService.cambiarPassword(actual, nueva);
            if (res.ok) {
                if (state.currentUser) {
                    state.currentUser.debe_cambiar_password = false;
                    localStorage.setItem("soma_user", JSON.stringify(state.currentUser));
                }
                if (modalCambiarPassword) modalCambiarPassword.classList.remove("active");
                showToast("Contraseña Actualizada", "Tu contraseña ha sido modificada con éxito.");
                if (onAuthSuccessCallback) onAuthSuccessCallback();
            } else {
                showToast("Error al Actualizar", res.detail || "No se pudo cambiar la clave.", "error");
            }
        });
    }

    // 4. Asistente de Recuperación por Email (OTP)
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", (e) => {
            e.preventDefault();
            resetRecuperarModalState();
            if (modalRecuperar) modalRecuperar.classList.add("active");
        });
    }

    if (btnCloseRecuperar) {
        btnCloseRecuperar.addEventListener("click", () => {
            if (modalRecuperar) modalRecuperar.classList.remove("active");
            resetRecuperarModalState();
        });
    }

    if (btnVolverStep1) {
        btnVolverStep1.addEventListener("click", () => {
            if (recuperarStep2) recuperarStep2.classList.add("hidden");
            if (recuperarStep1) recuperarStep1.classList.remove("hidden");
        });
    }

    // Paso 1 OTP: Solicitar código
    if (formSolicitarReset) {
        formSolicitarReset.addEventListener("submit", async (e) => {
            e.preventDefault();
            const identificador = document.getElementById("reset-identificador").value.trim();
            if (!identificador) return;

            const btnSubmit = document.getElementById("btn-solicitar-otp");
            if (btnSubmit) btnSubmit.disabled = true;

            const res = await AuthService.solicitarRecuperacionOtp(identificador);
            if (btnSubmit) btnSubmit.disabled = false;

            if (res.ok && res.data) {
                usuarioLoginTemp = res.data.usuario_login;
                const elDest = document.getElementById("reset-email-dest");
                if (elDest) elDest.textContent = res.data.email_enviado || res.data.usuario_login;

                if (recuperarStep1) recuperarStep1.classList.add("hidden");
                if (recuperarStep2) recuperarStep2.classList.remove("hidden");
                
                const elOtp = document.getElementById("reset-otp-code");
                if (elOtp) elOtp.focus();

                showToast("Código OTP Enviado", res.data.message || "Revisa tu casilla de correo", "success");
            } else {
                showToast("Error", res.detail || "No se pudo solicitar la recuperación", "error");
            }
        });
    }

    // Paso 2 OTP: Verificar código de 6 dígitos
    if (formVerificarOtp) {
        formVerificarOtp.addEventListener("submit", async (e) => {
            e.preventDefault();
            const otp = document.getElementById("reset-otp-code").value.trim();
            if (!otp || otp.length !== 6 || isNaN(otp)) {
                showToast("Error", "El código OTP debe ser numérico de 6 dígitos", "error");
                return;
            }

            const btnVerify = document.getElementById("btn-verificar-otp");
            if (btnVerify) btnVerify.disabled = true;

            const res = await AuthService.verificarOtp(usuarioLoginTemp, otp);
            if (btnVerify) btnVerify.disabled = false;

            if (res.ok && res.data) {
                resetTokenTemp = res.data.token_recuperacion;
                if (recuperarStep2) recuperarStep2.classList.add("hidden");
                if (recuperarStep3) recuperarStep3.classList.remove("hidden");

                const elPass = document.getElementById("reset-nueva-password");
                if (elPass) elPass.focus();

                showToast("Código Verificado", "Identidad verificada. Ingresa tu nueva clave.", "success");
            } else {
                showToast("Error", res.detail || "Código OTP inválido o expirado", "error");
            }
        });
    }

    // Paso 3 OTP: Confirmar nueva clave
    if (formConfirmarReset) {
        formConfirmarReset.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nueva = document.getElementById("reset-nueva-password").value;
            const confirmar = document.getElementById("reset-confirmar-password").value;

            if (nueva !== confirmar) {
                showToast("Error", "Las contraseñas no coinciden", "error");
                return;
            }
            if (nueva.trim().length < 6) {
                showToast("Error", "La contraseña debe tener al menos 6 caracteres", "error");
                return;
            }

            const btnConfirm = document.getElementById("btn-confirmar-reset");
            if (btnConfirm) btnConfirm.disabled = true;

            const res = await AuthService.confirmarNuevaPassword(resetTokenTemp, nueva, confirmar);
            if (btnConfirm) btnConfirm.disabled = false;

            if (res.ok) {
                showToast("¡Restablecida!", res.data?.message || "Tu contraseña fue actualizada", "success");
                if (modalRecuperar) modalRecuperar.classList.remove("active");
                resetRecuperarModalState();
            } else {
                showToast("Error", res.detail || "Error al restablecer contraseña", "error");
            }
        });
    }
}
