/* ==========================================================================
   ENTRY POINT: PÁGINA DE LOGIN Y RECUPERACIÓN (INDEX.HTML)
   ========================================================================== */

import { state, clearSession } from "./state.js";
import { initAuthModule, setOnAuthSuccess } from "./modules/auth.module.js";
import { initModalsModule } from "./modules/modals.module.js";
import { getRedirectUrlForRole } from "./guards.js";

document.addEventListener("DOMContentLoaded", () => {
    // Requerimiento estricto: Siempre arrancar desde el login al abrir la app o entrar al inicio
    clearSession();

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
