/* ==========================================================================
   MÓDULO DEL PORTAL DEL SOCIO (VISTA CLIENTE)
   ========================================================================== */

import { state } from "../state.js";
import { ClientesService } from "../services/clientes.service.js";
import { PagosService } from "../services/pagos.service.js";
import { NoticiasService } from "../services/noticias.service.js";
import { formatCurrency } from "../utils/formatters.js";
import { escapeHtml } from "../utils/sanitizer.js";
import { renderNoticiasFeed } from "./noticias.module.js";

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

export async function fetchSocioData() {
    const dni = state.currentUser?.usuario_login;
    if (!dni) return;

    // 1. Perfil y Apto Médico
    try {
        const resCli = await ClientesService.getClienteByDni(dni);
        if (resCli.ok && resCli.data) {
            const client = resCli.data;
            if (socioHeaderName) socioHeaderName.textContent = `${client.nombre} ${client.apellido}`;
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
    socioRutinaContainer.innerHTML = "";

    const res = await ClientesService.getClienteRutina(dni);
    if (res.ok && res.data && res.data.detalles && res.data.detalles.length > 0) {
        const rutina = res.data;
        const entrenador = rutina.detalles.find(det => det.usuario)?.usuario;
        const entrenadorNombre = entrenador ? entrenador.nombre : 'No informado';

        let exercisesHtml = "";
        rutina.detalles.forEach((det, index) => {
            const ejNombre = det.ejercicio ? det.ejercicio.nombre_ejercicio : 'Ejercicio #' + det.id_ejercicio;
            const ejGrupo = det.ejercicio ? det.ejercicio.grupo_muscular : 'General';
            
            exercisesHtml += `
                <tr>
                    <td class="routine-order" data-label="N°">${index + 1}</td>
                    <td data-label="Ejercicio">
                        <strong class="routine-exercise-name">${escapeHtml(ejNombre)}</strong>
                        <span class="routine-muscle-group">${escapeHtml(ejGrupo)}</span>
                    </td>
                    <td class="routine-number" data-label="Series">${det.series}</td>
                    <td class="routine-number" data-label="Repeticiones">${det.repeticiones}</td>
                    <td class="routine-value" data-label="Carga">${det.carga ? escapeHtml(det.carga) + ' kg' : 'A criterio'}</td>
                    <td class="routine-value" data-label="Descanso">${escapeHtml(det.descanso || '90 seg')}</td>
                </tr>
            `;
        });

        const obsBox = rutina.observaciones ? `
            <div class="routine-obs-box">
                <strong><i class="fa-solid fa-comment-dots"></i> Indicaciones del Entrenador:</strong><br>
                ${escapeHtml(rutina.observaciones)}
            </div>
        ` : "";

        socioRutinaContainer.innerHTML = `
            <div class="routine-card">
                <div class="routine-header-banner">
                    <div>
                        <div class="routine-goal-title">
                            <i class="fa-solid fa-bullseye" style="color: var(--primary);"></i>
                            <span>${escapeHtml(rutina.objetivo || 'Plan de Entrenamiento')}</span>
                        </div>
                        <div class="routine-meta-pills">
                            <span class="meta-pill"><i class="fa-regular fa-calendar"></i> Inicio: ${escapeHtml(rutina.fecha_inicio)}</span>
                            <span class="meta-pill"><i class="fa-solid fa-clock"></i> Duración: ${rutina.periodo ? rutina.periodo + ' semanas' : 'Mensual'}</span>
                            <span class="meta-pill"><i class="fa-solid fa-dumbbell"></i> ${rutina.detalles.length} ejercicios</span>
                            <span class="meta-pill routine-trainer"><i class="fa-solid fa-user-tie"></i> Entrenador: ${escapeHtml(entrenadorNombre)}</span>
                        </div>
                    </div>
                </div>
                ${obsBox}
                <div class="routine-sheet-container">
                    <table class="routine-sheet">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Ejercicio</th>
                                <th>Series</th>
                                <th>Repeticiones</th>
                                <th>Carga</th>
                                <th>Descanso</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${exercisesHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        socioRutinaContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clipboard-list"></i>
                <h3>Aún no tienes una rutina asignada</h3>
                <p>Tu entrenador asignará tu plan personalizado de entrenamiento a la brevedad.</p>
            </div>
        `;
    }
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
}
