/* ==========================================================================
   ENTRY POINT: PÁGINA DE LOGIN Y RECUPERACIÓN (INDEX.HTML)
   ========================================================================== */

import { state } from "./state.js";
import { initAuthModule, setOnAuthSuccess } from "./modules/auth.module.js";
import { initModalsModule } from "./modules/modals.module.js";
import { redirectIfAuthenticated, getRedirectUrlForRole } from "./guards.js";

document.addEventListener("DOMContentLoaded", () => {
    // Si ya tiene sesión abierta, redirigir directo al portal que le corresponde
    if (redirectIfAuthenticated()) return;

    // Inicializar listeners de modales y de autenticación
    initModalsModule();
    initAuthModule();

    // Cuando el login sea exitoso, redirigir según el rol del usuario
    setOnAuthSuccess(() => {
        if (state.currentUser?.debe_cambiar_password) {
            const modalPass = document.getElementById("modal-cambiar-password");
            if (modalPass) modalPass.classList.add("active");
            return;
        }

        const dest = getRedirectUrlForRole(state.currentUser?.rol);
        window.location.href = dest;
    });
});
