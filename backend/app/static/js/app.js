/* ==========================================================================
   SOMA GYM - MAIN APPLICATION ENTRY POINT (ORCHESTRATOR)
   Arquitectura Modular con ES6 Modules, RBAC y Sanitización Anti-XSS
   ========================================================================== */

import { clearSession } from "./state.js";
import { setUnauthorizedHandler } from "./services/api.js";

// Módulos de interfaz y lógica
import { initModalsModule } from "./modules/modals.module.js";
import { initAuthModule, setOnAuthSuccess } from "./modules/auth.module.js";
import { initRouterModule, initAuth, logout } from "./modules/router.module.js";
import { initClientesModule, fetchClientes } from "./modules/clientes.module.js";
import { initRutinasModule } from "./modules/rutinas.module.js";
import { initEvolucionModule } from "./modules/evolucion.module.js";
import { initPagosModule, setOnPagoRegistrado } from "./modules/pagos.module.js";
import { initNoticiasModule } from "./modules/noticias.module.js";
import { initUsuariosModule } from "./modules/usuarios.module.js";
import { initPortalSocioModule } from "./modules/portal-socio.module.js";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Configuración de sesión inicial (siempre arrancar desde login en recarga)
    clearSession();

    // 2. Conectar interceptor de token expirado (401) con el logout
    setUnauthorizedHandler(logout);

    // 3. Conectar evento de login exitoso con el enrutador
    setOnAuthSuccess(initAuth);

    // 4. Conectar registro de cuotas con actualización de tabla de socios
    setOnPagoRegistrado(fetchClientes);

    // 5. Inicializar escuchadores de eventos en cada módulo
    initModalsModule();
    initAuthModule();
    initRouterModule();
    initClientesModule();
    initRutinasModule();
    initEvolucionModule();
    initPagosModule();
    initNoticiasModule();
    initUsuariosModule();
    initPortalSocioModule();

    // 6. Arrancar control de vistas
    initAuth();
});
