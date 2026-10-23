/* ==========================================================================
   MÓDULO DEL PORTAL DEL SOCIO (VISTA CLIENTE)
   ========================================================================== */

import { state } from "../state.js";
import { ClientesService } from "../services/clientes.service.js";
import { PagosService } from "../services/pagos.service.js";
import { NoticiasService } from "../services/noticias.service.js";
import { showToast } from "../utils/toast.js";
import { formatCurrency } from "../utils/formatters.js";
import { escapeHtml } from "../utils/sanitizer.js";
import { renderNoticiasFeed } from "./noticias.module.js";
import { renderRoutineView } from "./routine-view.module.js";

const DEFAULT_AVATAR_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

const socioHeaderName = document.getElementById("socio-header-name");
const socioAptoBadge = document.getElementById("socio-apto-badge");
const socioAptoText = document.getElementById("socio-apto-text");
const socioCuotaBadge = document.getElementById("socio-cuota-badge");
const socioCuotaText = document.getElementById("socio-cuota-text");
const socioMembresiaEstado = document.getElementById("socio-membresia-estado");
const socioMembresiaVencimiento = document.getElementById("socio-membresia-vencimiento");
const tbodySocioPagos = document.getElementById("tbody-socio-pagos");
const socioRutinaContainer = document.getElementById("socio-rutina-container");
const socioNoticiasFeed = document.getElementById("socio-noticias-feed");
const tbodySocioEvFisica = document.getElementById("tbody-socio-ev-fisica");
const tbodySocioEvDeportiva = document.getElementById("tbody-socio-ev-deportiva");

// Elementos de Foto de Perfil (SOMA-09)
const socioAvatarImg = document.getElementById("socio-avatar-img");
const socioPendingDot = document.getElementById("socio-pending-dot");
const btnAbrirModalFoto = document.getElementById("btn-abrir-modal-foto");
const modalSolicitarFoto = document.getElementById("modal-solicitar-foto");
const btnCerrarModalFoto = document.getElementById("btn-cerrar-modal-foto");
const btnCancelarModalFoto = document.getElementById("btn-cancelar-modal-foto");
const formSolicitarFoto = document.getElementById("form-solicitar-foto");
const bannerSolicitudActiva = document.getElementById("banner-solicitud-activa");
const textoSolicitudActiva = document.getElementById("texto-solicitud-activa");
const socioFotoModalPreview = document.getElementById("socio-foto-modal-preview");
const inputArchivoFotoSocio = document.getElementById("input-archivo-foto-socio");
const btnEnviarSolicitudFoto = document.getElementById("btn-enviar-solicitud-foto");

let currentClienteFotoUrl = "";
let selectedFotoFile = null;

export async function fetchSocioData() {
    const dni = state.currentUser?.usuario_login;
    if (!dni) return;

    // 1. Perfil y Apto Médico
    try {
        const resCli = await ClientesService.getClienteByDni(dni);
        if (resCli.ok && resCli.data) {
            const client = resCli.data;
            if (socioHeaderName) socioHeaderName.textContent = `${client.nombre} ${client.apellido}`;
            
            // Actualizar avatar en navbar
            currentClienteFotoUrl = client.foto_url || "";
            if (socioAvatarImg) {
                socioAvatarImg.src = client.foto_url || DEFAULT_AVATAR_SVG;
            }

            if (socioAptoBadge && socioAptoText) {
                if (client.apto_medico_vigente) {
                    socioAptoBadge.className = "badge-apto-header vigente";
                    socioAptoText.textContent = `Apto Vigente (Vence: ${client.fecha_vencimiento_apto || 'S/D'})`;
                } else {
                    socioAptoBadge.className = "badge-apto-header vencido";
                    socioAptoText.textContent = "Apto Médico Vencido / Pendiente";
                }
            }
        }
    } catch (e) {
        console.error("Error al obtener datos de perfil del socio:", e);
    }

    // 1.1 Consultar si tiene solicitud de cambio de foto pendiente
    await checkSolicitudFotoActiva(dni);

    // 2. Membresía y cuota
    await fetchSocioMembresia(dni);

    // 3. Rutina activa
    fetchSocioRutina(dni);

    // 4. Noticias para socios
    fetchSocioNoticias();

    // 5. Progreso físico y cargas
    fetchSocioProgreso(dni);

    // 6. Historial de pagos
    fetchSocioPagos(dni);
}

export async function fetchSocioMembresia(dni) {
    if (!socioCuotaBadge) return;
    try {
        const resMem = await ClientesService.getClienteMembresia(dni);
        if (resMem.ok && resMem.data && resMem.data.fecha_fin) {
            const membresia = resMem.data;
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const partes = membresia.fecha_fin.split("-");
            const fechaFin = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));

            if (fechaFin >= hoy && membresia.estado === "Activo") {
                socioCuotaBadge.className = "badge-apto-header vigente";
                if (socioCuotaText) socioCuotaText.textContent = `Cuota al día (Vence: ${membresia.fecha_fin})`;
                if (socioMembresiaEstado) socioMembresiaEstado.innerHTML = `<span class="badge badge-success"><i class="fa-solid fa-check"></i> Al Día</span>`;
                if (socioMembresiaVencimiento) socioMembresiaVencimiento.textContent = membresia.fecha_fin;
            } else {
                socioCuotaBadge.className = "badge-apto-header vencido";
                if (socioCuotaText) socioCuotaText.textContent = `Cuota Vencida (${membresia.fecha_fin})`;
                if (socioMembresiaEstado) socioMembresiaEstado.innerHTML = `<span class="badge badge-danger"><i class="fa-solid fa-circle-exclamation"></i> Vencida</span>`;
                if (socioMembresiaVencimiento) socioMembresiaVencimiento.textContent = membresia.fecha_fin;
            }
        } else {
            socioCuotaBadge.className = "badge-apto-header vencido";
            if (socioCuotaText) socioCuotaText.textContent = "Cuota Impaga / Sin Registro";
            if (socioMembresiaEstado) socioMembresiaEstado.innerHTML = `<span class="badge badge-danger">Sin Membresía</span>`;
            if (socioMembresiaVencimiento) socioMembresiaVencimiento.textContent = "Sin fecha registrada";
        }
    } catch (err) {
        console.error("Error al obtener membresía del socio:", err);
        socioCuotaBadge.className = "badge-apto-header vencido";
        if (socioCuotaText) socioCuotaText.textContent = "Cuota Pendiente";
    }
}

export async function fetchSocioRutina(dni) {
    if (!socioRutinaContainer) return;
    const res = await ClientesService.getClienteRutina(dni);
    if (!res.ok) {
        console.error("No se pudo cargar la rutina del socio:", res.detail);
        socioRutinaContainer.innerHTML = `<div class="empty-state"><h3>No se pudo cargar la rutina</h3><p>${escapeHtml(res.detail || "Intenta nuevamente más tarde.")}</p></div>`;
        return;
    }
    socioRutinaContainer.innerHTML = renderRoutineView(res.data);
}

export async function fetchSocioNoticias() {
    const res = await NoticiasService.getNoticias();
    if (res.ok) {
        state.noticiasData = res.data || [];
        if (socioNoticiasFeed) {
            renderNoticiasFeed(socioNoticiasFeed, false);
        }
    }
}

export async function fetchSocioProgreso(dni) {
    if (tbodySocioEvFisica) tbodySocioEvFisica.innerHTML = "";
    if (tbodySocioEvDeportiva) tbodySocioEvDeportiva.innerHTML = "";

    const resFis = await ClientesService.getClienteEvFisica(dni);
    if (resFis.ok && tbodySocioEvFisica) {
        const fisData = resFis.data || [];
        if (fisData.length === 0) {
            tbodySocioEvFisica.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-secondary);">Sin mediciones cargadas aún</td></tr>`;
        } else {
            fisData.forEach(m => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${escapeHtml(m.fecha_medicion)}</strong></td>
                    <td>${m.peso_kg ? escapeHtml(m.peso_kg) + ' kg' : '-'}</td>
                    <td>${m.porcentaje_grasa ? escapeHtml(m.porcentaje_grasa) + ' %' : '-'}</td>
                    <td>${escapeHtml(m.observaciones || '-')}</td>
                `;
                tbodySocioEvFisica.appendChild(tr);
            });
        }
    }

    const resDep = await ClientesService.getClienteEvDeportiva(dni);
    if (resDep.ok && tbodySocioEvDeportiva) {
        const depData = resDep.data || [];
        if (depData.length === 0) {
            tbodySocioEvDeportiva.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-secondary);">Sin registros de cargas aún</td></tr>`;
        } else {
            depData.forEach(r => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${escapeHtml(r.fecha_entrenamiento)}</strong></td>
                    <td>${escapeHtml(r.ejercicio ? r.ejercicio.nombre_ejercicio : 'ID: ' + r.id_ejercicio)}</td>
                    <td><strong style="color: var(--accent);">${r.carga_real ? escapeHtml(r.carga_real) + ' kg' : '-'}</strong></td>
                    <td>${escapeHtml(r.repeticiones_logradas || '-')}</td>
                `;
                tbodySocioEvDeportiva.appendChild(tr);
            });
        }
    }
}

export async function fetchSocioPagos(dni) {
    if (!tbodySocioPagos) return;
    tbodySocioPagos.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-secondary);">Cargando pagos...</td></tr>`;

    const res = await PagosService.getPagosByCliente(dni);
    if (res.ok) {
        const pagos = res.data || [];
        if (pagos.length === 0) {
            tbodySocioPagos.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-secondary);">No tienes pagos registrados aún.</td></tr>`;
            return;
        }
        tbodySocioPagos.innerHTML = "";
        pagos.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${escapeHtml(p.fecha_pago)}</strong></td>
                <td>${escapeHtml(p.descripcion || 'Cuota mensual')}</td>
                <td style="text-align:center;">${p.meses_abonados || 1}</td>
                <td><span class="badge badge-info">${escapeHtml(p.fecha_vencimiento_cuota || '-')}</span></td>
                <td>${escapeHtml(p.metodo_pago || '-')}</td>
                <td><strong style="color: var(--accent);">${formatCurrency(p.monto)}</strong></td>
            `;
            tbodySocioPagos.appendChild(tr);
        });
    } else {
        tbodySocioPagos.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-secondary);">No se pudo cargar el historial de pagos.</td></tr>`;
    }
}

export async function checkSolicitudFotoActiva(dni) {
    try {
        const resSol = await ClientesService.getSolicitudFotoActiva(dni);
        if (resSol.ok && resSol.data) {
            const sol = resSol.data;
            if (socioPendingDot) socioPendingDot.classList.remove("hidden");
            if (bannerSolicitudActiva) {
                bannerSolicitudActiva.classList.remove("hidden");
                if (textoSolicitudActiva) {
                    const fechaStr = sol.fecha_solicitud ? new Date(sol.fecha_solicitud).toLocaleDateString() : "";
                    textoSolicitudActiva.textContent = `Tienes una propuesta enviada ${fechaStr ? 'el ' + fechaStr : ''} en revisión por el personal. Si subes otra, la reemplazará.`;
                }
            }
        } else {
            if (socioPendingDot) socioPendingDot.classList.add("hidden");
            if (bannerSolicitudActiva) bannerSolicitudActiva.classList.add("hidden");
        }
    } catch (err) {
        console.error("Error consultando solicitud de foto activa:", err);
    }
}

export function initPortalSocioModule() {
    const portalTabBtns = document.querySelectorAll(".portal-tab-btn");
    const portalPanels = document.querySelectorAll(".portal-panel");

    portalTabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            portalTabBtns.forEach(b => b.classList.remove("active"));
            portalPanels.forEach(p => p.classList.remove("active"));
            
            btn.classList.add("active");
            const tabId = btn.getAttribute("data-portal-tab");
            state.activePortalTab = tabId;
            const panel = document.getElementById(tabId);
            if (panel) panel.classList.add("active");
        });
    });

    // Gestión de Foto de Perfil (SOMA-09)
    if (btnAbrirModalFoto && modalSolicitarFoto) {
        btnAbrirModalFoto.addEventListener("click", () => {
            selectedFotoFile = null;
            if (inputArchivoFotoSocio) inputArchivoFotoSocio.value = "";
            if (btnEnviarSolicitudFoto) btnEnviarSolicitudFoto.disabled = true;
            if (socioFotoModalPreview) {
                socioFotoModalPreview.src = currentClienteFotoUrl || DEFAULT_AVATAR_SVG;
            }
            modalSolicitarFoto.classList.add("active");
        });
    }

    const cerrarModalFoto = () => {
        if (modalSolicitarFoto) modalSolicitarFoto.classList.remove("active");
        selectedFotoFile = null;
        if (inputArchivoFotoSocio) inputArchivoFotoSocio.value = "";
    };

    if (btnCerrarModalFoto) btnCerrarModalFoto.addEventListener("click", cerrarModalFoto);
    if (btnCancelarModalFoto) btnCancelarModalFoto.addEventListener("click", cerrarModalFoto);

    if (inputArchivoFotoSocio) {
        inputArchivoFotoSocio.addEventListener("change", (e) => {
            const file = e.target.files?.[0];
            if (file) {
                selectedFotoFile = file;
                const objectUrl = URL.createObjectURL(file);
                if (socioFotoModalPreview) socioFotoModalPreview.src = objectUrl;
                if (btnEnviarSolicitudFoto) btnEnviarSolicitudFoto.disabled = false;
            }
        });
    }

    if (formSolicitarFoto) {
        formSolicitarFoto.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!selectedFotoFile) {
                showToast("Atención", "Debes seleccionar una imagen para enviar la solicitud.", "warning");
                return;
            }

            const dni = state.currentUser?.usuario_login;
            if (!dni) return;

            if (btnEnviarSolicitudFoto) {
                btnEnviarSolicitudFoto.disabled = true;
                btnEnviarSolicitudFoto.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Enviando...`;
            }

            try {
                const res = await ClientesService.solicitarCambioFoto(dni, selectedFotoFile);
                if (res.ok) {
                    showToast("¡Solicitud Enviada!", "Tu nueva foto fue enviada al staff para su aprobación.", "success");
                    cerrarModalFoto();
                    await checkSolicitudFotoActiva(dni);
                } else {
                    showToast("Error", res.detail || "No se pudo enviar la solicitud de foto.", "error");
                }
            } catch (err) {
                console.error("Error enviando solicitud de foto:", err);
                showToast("Error", "Error de conexión al enviar la imagen.", "error");
            } finally {
                if (btnEnviarSolicitudFoto) {
                    btnEnviarSolicitudFoto.disabled = false;
                    btnEnviarSolicitudFoto.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Enviar Solicitud`;
                }
            }
        });
    }
}
