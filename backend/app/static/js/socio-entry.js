/* ==========================================================================
   ENTRY POINT: PORTAL DEL SOCIO (SOCIO.HTML)
   ========================================================================== */

import { requireAuth, logout } from "./guards.js";
import { setUnauthorizedHandler } from "./services/api.js";
import { initPortalSocioModule, fetchSocioData } from "./modules/portal-socio.module.js";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Proteger acceso: solo clientes/socios
    if (!requireAuth(["cliente", "socio"])) return;

    // 2. Interceptor 401
    setUnauthorizedHandler(logout);

    // 3. Botón de cerrar sesión
    const btnSocioLogout = document.getElementById("btn-socio-logout");
    if (btnSocioLogout) {
        btnSocioLogout.addEventListener("click", logout);
    }

    // 4. Inicializar pestañas y cargar datos del alumno
    initPortalSocioModule();
    fetchSocioData();
});
