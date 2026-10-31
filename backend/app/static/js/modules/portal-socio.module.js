/* ==========================================================================
   MÓDULO DEL PORTAL DEL SOCIO (VISTA CLIENTE)
   ========================================================================== */

import { state } from "../state.js";
import { ClientesService } from "../services/clientes.service.js";
import { PagosService } from "../services/pagos.service.js";
import { NoticiasService } from "../services/noticias.service.js";
import { showToast } from "../utils/toast.js";
import { formatCurrency } from "../utils/formatters.js";
import { escapeHtml, parseGoogleDriveUrl } from "../utils/sanitizer.js";
import { renderNoticiasFeed } from "./noticias.module.js";
import { renderRoutineView } from "./routine-view.module.js";

export { parseGoogleDriveUrl };

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
const inputDriveLinkSocio = document.getElementById("input-drive-link-socio");
const btnPrevisualizarDrive = document.getElementById("btn-previsualizar-drive");
const inputArchivoFotoSocio = document.getElementById("input-archivo-foto-socio");
const btnEnviarSolicitudFoto = document.getElementById("btn-enviar-solicitud-foto");

// Elementos de Progreso Histórico de Rutinas y Paginación por Año
const selectEjercicioProgreso = document.getElementById("select-ejercicio-progreso");
const chartProgresoCanvas = document.getElementById("chart-progreso-ejercicio");
const progresoMetricsSummary = document.getElementById("progreso-metrics-summary");
const metricPrVigente = document.getElementById("metric-pr-vigente");
const metricPrVigenteMes = document.getElementById("metric-pr-vigente-mes");
const metricCargaInicial = document.getElementById("metric-carga-inicial");
const metricCargaActual = document.getElementById("metric-carga-actual");
const metricProgresoNeto = document.getElementById("metric-progreso-neto");
const metricMesesCount = document.getElementById("metric-meses-count");
const btnProgresoAnioPrev = document.getElementById("btn-progreso-anio-prev");
const btnProgresoAnioNext = document.getElementById("btn-progreso-anio-next");
const labelProgresoAnio = document.getElementById("label-progreso-anio");
const progresoEmptyState = document.getElementById("progreso-empty-state");
const progresoEmptyText = document.getElementById("progreso-empty-text");

let currentClienteFotoUrl = "";
let selectedFotoFile = null;
let progresoChartInstance = null;
let selectedProgresoAnio = null;
let availableProgresoAnios = [];
let currentProgresoIdEjercicio = null;

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

    // 2. Cargar opciones del gráfico de progreso de rutinas históricas
    await loadEjerciciosProgreso(dni);
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

            // Redimensionar gráfico si se visualiza la pestaña de evolución
            if (tabId === "socio-tab-evolucion" && progresoChartInstance) {
                setTimeout(() => progresoChartInstance.resize(), 60);
            }
        });
    });

    // Selector de Ejercicio para Gráfico de Progreso Histórico
    if (selectEjercicioProgreso) {
        selectEjercicioProgreso.addEventListener("change", (e) => {
            const dni = state.currentUser?.usuario_login;
            currentProgresoIdEjercicio = e.target.value ? parseInt(e.target.value) : null;
            if (dni && currentProgresoIdEjercicio) {
                renderProgresoEjercicioChart(dni, currentProgresoIdEjercicio, null);
            } else {
                mostrarEstadoVacioGrafico("Selecciona un ejercicio del menú para visualizar la curva de progreso mensual.");
            }
        });
    }

    // Navegación por Año Calendario (< y >)
    if (btnProgresoAnioPrev) {
        btnProgresoAnioPrev.addEventListener("click", () => {
            const dni = state.currentUser?.usuario_login;
            const anioIdx = availableProgresoAnios.indexOf(selectedProgresoAnio);
            if (dni && currentProgresoIdEjercicio && anioIdx > 0) {
                renderProgresoEjercicioChart(dni, currentProgresoIdEjercicio, availableProgresoAnios[anioIdx - 1]);
            }
        });
    }

    if (btnProgresoAnioNext) {
        btnProgresoAnioNext.addEventListener("click", () => {
            const dni = state.currentUser?.usuario_login;
            const anioIdx = availableProgresoAnios.indexOf(selectedProgresoAnio);
            if (dni && currentProgresoIdEjercicio && anioIdx < availableProgresoAnios.length - 1) {
                renderProgresoEjercicioChart(dni, currentProgresoIdEjercicio, availableProgresoAnios[anioIdx + 1]);
            }
        });
    }

    // Gestión de Foto de Perfil (SOMA-09)
    if (btnAbrirModalFoto && modalSolicitarFoto) {
        btnAbrirModalFoto.addEventListener("click", () => {
            selectedFotoFile = null;
            if (inputArchivoFotoSocio) inputArchivoFotoSocio.value = "";
            if (inputDriveLinkSocio) inputDriveLinkSocio.value = "";
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
        if (inputDriveLinkSocio) inputDriveLinkSocio.value = "";
    };

    if (btnCerrarModalFoto) btnCerrarModalFoto.addEventListener("click", cerrarModalFoto);
    if (btnCancelarModalFoto) btnCancelarModalFoto.addEventListener("click", cerrarModalFoto);

    const aplicarPreviewDrive = () => {
        const rawUrl = inputDriveLinkSocio?.value?.trim();
        if (!rawUrl) return;
        const directUrl = parseGoogleDriveUrl(rawUrl);
        selectedFotoFile = null;
        if (inputArchivoFotoSocio) inputArchivoFotoSocio.value = "";
        if (socioFotoModalPreview) socioFotoModalPreview.src = directUrl;
        if (btnEnviarSolicitudFoto) btnEnviarSolicitudFoto.disabled = false;
    };

    if (inputDriveLinkSocio) {
        inputDriveLinkSocio.addEventListener("input", () => {
            if (inputDriveLinkSocio.value.trim().length > 10) {
                aplicarPreviewDrive();
            }
        });
        inputDriveLinkSocio.addEventListener("change", aplicarPreviewDrive);
    }

    if (btnPrevisualizarDrive) {
        btnPrevisualizarDrive.addEventListener("click", (e) => {
            e.preventDefault();
            const rawUrl = inputDriveLinkSocio?.value?.trim();
            if (!rawUrl) {
                showToast("Aviso", "Pega primero un enlace de Google Drive en el campo.", "warning");
                return;
            }
            aplicarPreviewDrive();
        });
    }

    if (inputArchivoFotoSocio) {
        inputArchivoFotoSocio.addEventListener("change", (e) => {
            const file = e.target.files?.[0];
            if (file) {
                selectedFotoFile = file;
                if (inputDriveLinkSocio) inputDriveLinkSocio.value = "";
                const objectUrl = URL.createObjectURL(file);
                if (socioFotoModalPreview) socioFotoModalPreview.src = objectUrl;
                if (btnEnviarSolicitudFoto) btnEnviarSolicitudFoto.disabled = false;
            }
        });
    }

    if (formSolicitarFoto) {
        formSolicitarFoto.addEventListener("submit", async (e) => {
            e.preventDefault();
            const driveUrl = inputDriveLinkSocio?.value?.trim();

            if (!driveUrl && !selectedFotoFile) {
                showToast("Atención", "Debes ingresar un enlace de Google Drive o seleccionar un archivo.", "warning");
                return;
            }

            const dni = state.currentUser?.usuario_login;
            if (!dni) return;

            if (btnEnviarSolicitudFoto) {
                btnEnviarSolicitudFoto.disabled = true;
                btnEnviarSolicitudFoto.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Enviando...`;
            }

            try {
                let res;
                if (driveUrl) {
                    const parsedUrl = parseGoogleDriveUrl(driveUrl);
                    res = await ClientesService.solicitarCambioFotoUrl(dni, parsedUrl);
                } else {
                    res = await ClientesService.solicitarCambioFoto(dni, selectedFotoFile);
                }

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


/* ==========================================================================
   VISUALIZACIÓN DE PROGRESO DE RUTINAS HISTÓRICAS (CHART.JS)
   ========================================================================== */

export async function loadEjerciciosProgreso(dni) {
    if (!selectEjercicioProgreso) return;
    selectEjercicioProgreso.innerHTML = `<option value="">Cargando ejercicios...</option>`;

    try {
        const res = await ClientesService.getEjerciciosProgreso(dni);
        if (res.ok && res.data && res.data.length > 0) {
            selectEjercicioProgreso.innerHTML = `<option value="">Selecciona un ejercicio...</option>`;
            res.data.forEach(ej => {
                const opt = document.createElement("option");
                opt.value = ej.id_ejercicio;
                opt.textContent = `${ej.nombre_ejercicio} (${ej.grupo_muscular || 'General'})`;
                selectEjercicioProgreso.appendChild(opt);
            });

            // Seleccionar automáticamente el primer ejercicio
            currentProgresoIdEjercicio = res.data[0].id_ejercicio;
            selectEjercicioProgreso.value = currentProgresoIdEjercicio;
            await renderProgresoEjercicioChart(dni, currentProgresoIdEjercicio, null);
        } else {
            selectEjercicioProgreso.innerHTML = `<option value="">Sin ejercicios en tu historial</option>`;
            mostrarEstadoVacioGrafico("No se encontraron ejercicios en tu historial de rutinas aún.");
        }
    } catch (err) {
        console.error("Error al cargar ejercicios del historial:", err);
        selectEjercicioProgreso.innerHTML = `<option value="">Error al cargar ejercicios</option>`;
        mostrarEstadoVacioGrafico("Error de conexión al cargar el historial de ejercicios.");
    }
}

export async function renderProgresoEjercicioChart(dni, idEjercicio, anio = null) {
    if (!idEjercicio) {
        mostrarEstadoVacioGrafico("Selecciona un ejercicio del menú para visualizar la curva de progreso mensual.");
        return;
    }

    try {
        const res = await ClientesService.getProgresoEjercicio(dni, idEjercicio, anio);
        if (!res.ok || !res.data || !res.data.puntos || res.data.puntos.length === 0) {
            mostrarEstadoVacioGrafico("No hay datos históricos registrados para este ejercicio en el período seleccionado.");
            return;
        }

        const data = res.data;
        const puntos = data.puntos;

        // Actualizar estado de paginación por año
        availableProgresoAnios = data.anios_disponibles || [];
        selectedProgresoAnio = data.anio_seleccionado;
        if (labelProgresoAnio) {
            labelProgresoAnio.textContent = selectedProgresoAnio || "-";
        }

        const anioIdx = availableProgresoAnios.indexOf(selectedProgresoAnio);
        if (btnProgresoAnioPrev) {
            const hasPrev = anioIdx > 0;
            btnProgresoAnioPrev.disabled = !hasPrev;
            btnProgresoAnioPrev.style.opacity = hasPrev ? "1" : "0.35";
            btnProgresoAnioPrev.style.cursor = hasPrev ? "pointer" : "default";
        }
        if (btnProgresoAnioNext) {
            const hasNext = anioIdx >= 0 && anioIdx < availableProgresoAnios.length - 1;
            btnProgresoAnioNext.disabled = !hasNext;
            btnProgresoAnioNext.style.opacity = hasNext ? "1" : "0.35";
            btnProgresoAnioNext.style.cursor = hasNext ? "pointer" : "default";
        }

        // 1. Actualizar métricas resumen (PR de los últimos 3 meses y progreso)
        if (progresoMetricsSummary) {
            const inicial = puntos[0].carga;
            const actual = puntos[puntos.length - 1].carga;
            const dif = Math.round((actual - inicial) * 10) / 10;
            const signo = dif > 0 ? "+" : "";

            if (metricPrVigente) {
                metricPrVigente.textContent = data.pr_vigente ? `${data.pr_vigente} kg` : "-";
            }
            if (metricPrVigenteMes) {
                metricPrVigenteMes.textContent = data.pr_vigente_mes ? `Récord en ${data.pr_vigente_mes}` : "Sin récord registrado";
            }
            if (metricCargaInicial) metricCargaInicial.textContent = `${inicial} kg`;
            if (metricCargaActual) metricCargaActual.textContent = `${actual} kg`;
            if (metricProgresoNeto) {
                metricProgresoNeto.textContent = `${signo}${dif} kg`;
                metricProgresoNeto.style.color = dif > 0 ? "#10b981" : (dif < 0 ? "#ef4444" : "#94a3b8");
            }
            if (metricMesesCount) metricMesesCount.textContent = `${puntos.length} / 12 meses`;
            progresoMetricsSummary.style.display = "grid";
        }

        // 2. Mostrar Canvas y ocultar empty state
        if (progresoEmptyState) progresoEmptyState.style.display = "none";
        if (chartProgresoCanvas) chartProgresoCanvas.style.display = "block";

        // 3. Preparar datos para Chart.js con destaque visual de PR
        const labels = puntos.map(p => p.etiqueta_mes);
        const cargas = puntos.map(p => p.carga);
        const pointBackgroundColors = puntos.map(p => p.es_pr ? "#f59e0b" : "#818cf8");
        const pointBorderColors = puntos.map(p => p.es_pr ? "#ffffff" : "#ffffff");
        const pointRadii = puntos.map(p => p.es_pr ? 8 : 5);
        const pointHoverRadii = puntos.map(p => p.es_pr ? 12 : 8);

        const detalles = puntos.map(p => ({
            series: p.series,
            reps: p.repeticiones,
            volumen: p.volumen_total,
            objetivo: p.objetivo,
            activa: p.activa,
            es_pr: p.es_pr,
            pr_ventana: p.pr_ventana
        }));

        if (progresoChartInstance) {
            progresoChartInstance.destroy();
            progresoChartInstance = null;
        }

        if (typeof Chart !== "undefined" && chartProgresoCanvas) {
            const ctx = chartProgresoCanvas.getContext("2d");
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, "rgba(99, 102, 241, 0.40)");
            gradient.addColorStop(1, "rgba(99, 102, 241, 0.02)");

            progresoChartInstance = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [{
                        label: `Carga - ${data.nombre_ejercicio} (${selectedProgresoAnio || ''})`,
                        data: cargas,
                        borderColor: "#6366f1",
                        borderWidth: 3,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: pointBackgroundColors,
                        pointBorderColor: pointBorderColors,
                        pointBorderWidth: 2,
                        pointRadius: pointRadii,
                        pointHoverRadius: pointHoverRadii,
                        pointHoverBackgroundColor: "#4f46e5",
                        pointHoverBorderColor: "#ffffff"
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                color: "#cbd5e1",
                                font: { family: "Outfit, sans-serif", size: 13, weight: "600" }
                            }
                        },
                        tooltip: {
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            titleColor: "#f8fafc",
                            bodyColor: "#cbd5e1",
                            borderColor: "rgba(99, 102, 241, 0.4)",
                            borderWidth: 1,
                            padding: 12,
                            boxPadding: 6,
                            usePointStyle: true,
                            callbacks: {
                                label: function(context) {
                                    const idx = context.dataIndex;
                                    const d = detalles[idx];
                                    const lines = [];
                                    if (d.es_pr) {
                                        lines.push(` ⭐ ¡RÉCORD PERSONAL (PR)!: ${context.parsed.y} kg`);
                                    } else {
                                        lines.push(` Carga planificada: ${context.parsed.y} kg`);
                                    }
                                    lines.push(` Series x Reps: ${d.series} x ${d.reps}`);
                                    lines.push(` Volumen Total: ${d.volumen} kg`);
                                    lines.push(` Objetivo: ${d.objetivo || 'General'}`);
                                    lines.push(d.activa ? ` Estado: Rutina Vigente` : ` Estado: Histórico mensual`);
                                    return lines;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: "rgba(255, 255, 255, 0.06)"
                            },
                            ticks: {
                                color: "#94a3b8",
                                font: { family: "Outfit, sans-serif", size: 12 }
                            }
                        },
                        y: {
                            beginAtZero: false,
                            grid: {
                                color: "rgba(255, 255, 255, 0.06)"
                            },
                            ticks: {
                                color: "#94a3b8",
                                font: { family: "Outfit, sans-serif", size: 12 },
                                callback: function(val) {
                                    return `${val} kg`;
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (err) {
        console.error("Error al renderizar gráfico de progreso:", err);
        mostrarEstadoVacioGrafico("No se pudo cargar el gráfico de progreso.");
    }
}

function mostrarEstadoVacioGrafico(mensaje) {
    if (progresoMetricsSummary) progresoMetricsSummary.style.display = "none";
    if (chartProgresoCanvas) chartProgresoCanvas.style.display = "none";
    if (labelProgresoAnio) labelProgresoAnio.textContent = "-";
    if (btnProgresoAnioPrev) btnProgresoAnioPrev.disabled = true;
    if (btnProgresoAnioNext) btnProgresoAnioNext.disabled = true;
    if (progresoEmptyState) {
        progresoEmptyState.style.display = "flex";
        if (progresoEmptyText) progresoEmptyText.textContent = mensaje;
    }
    if (progresoChartInstance) {
        progresoChartInstance.destroy();
        progresoChartInstance = null;
    }
}

