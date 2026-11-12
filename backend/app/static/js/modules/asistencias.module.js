/* ==========================================================================
   MÓDULO DE ASISTENCIAS Y CONTROL DE INACTIVIDAD (PANEL ADMIN / STAFF)
   ========================================================================== */

import {
    getAsistenciasHoy,
    getSociosInactivos,
    getEstadisticasAsistencias
} from "../services/asistencia.service.js";
import { showToast } from "../utils/toast.js";

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

let currentSubTab = "tab-ingresos-hoy";
let inactivosDiasFiltro = 15;
let cachedAsistenciasHoy = [];
let cachedInactivos = [];

function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatHora(fechaIso) {
    if (!fechaIso) return "--:--";
    try {
        const d = new Date(fechaIso);
        return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    } catch {
        return fechaIso;
    }
}

function formatFecha(fechaIso) {
    if (!fechaIso) return "Nunca";
    try {
        const d = new Date(fechaIso);
        return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
        return fechaIso;
    }
}

/**
 * Renderiza las tarjetas métricas de concurrencia e inactividad.
 * @param {object} stats 
 */
function renderEstadisticas(stats) {
    const elHoy = document.getElementById("stat-asist-hoy");
    const elSemana = document.getElementById("stat-asist-semana");
    const elMes = document.getElementById("stat-asist-mes");
    const elInactivos = document.getElementById("stat-socios-inactivos");

    if (elHoy) elHoy.textContent = stats.asistencias_hoy ?? 0;
    if (elSemana) elSemana.textContent = stats.asistencias_semana ?? 0;
    if (elMes) elMes.textContent = stats.asistencias_mes ?? 0;
    if (elInactivos) elInactivos.textContent = stats.socios_inactivos_alerta ?? 0;
}

/**
 * Renderiza la tabla de ingresos del día.
 * @param {Array} asistencias 
 */
export function renderTablaAsistenciasHoy(asistencias) {
    const tbody = document.getElementById("tbody-asistencias-hoy");
    if (!tbody) return;

    if (!asistencias || asistencias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-clipboard-user" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                    No se han registrado ingresos aún en el día de hoy.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = asistencias.map(a => {
        const foto = a.foto_url ? escapeHtml(a.foto_url) : DEFAULT_AVATAR;
        const nombre = escapeHtml(a.nombre_completo || "Socio");
        const dni = escapeHtml(a.dni_cliente);
        const hora = formatHora(a.fecha_hora);

        const cuotaOk = (a.estado_cuota || "").toLowerCase().includes("día") || (a.estado_cuota || "").toLowerCase().includes("dia");
        const cuotaBadge = cuotaOk
            ? `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Al día</span>`
            : `<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Atrasado</span>`;

        const aptoBadge = a.apto_medico_vigente
            ? `<span class="badge badge-success"><i class="fa-solid fa-heart-pulse"></i> Vigente</span>`
            : `<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> Vencido / Falta</span>`;

        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <img src="${foto}" alt="${nombre}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-light);">
                        <div>
                            <strong>${nombre}</strong>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">DNI: ${dni}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span style="font-weight: 700; color: var(--text-primary); font-size: 1.05rem;">
                        <i class="fa-regular fa-clock" style="margin-right: 0.35rem; color: var(--primary);"></i>${hora}
                    </span>
                </td>
                <td>${cuotaBadge}</td>
                <td>${aptoBadge}</td>
                <td>
                    <span class="badge badge-primary"><i class="fa-solid fa-check"></i> Registrado</span>
                </td>
            </tr>
        `;
    }).join("");
}

/**
 * Renderiza la tabla de socios inactivos (+15 días).
 * @param {Array} inactivos 
 */
export function renderTablaInactivos(inactivos) {
    const tbody = document.getElementById("tbody-socios-inactivos");
    if (!tbody) return;

    if (!inactivos || inactivos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-circle-check" style="font-size: 2rem; color: var(--success); display: block; margin-bottom: 0.5rem;"></i>
                    ¡Excelente! No hay socios inactivos con más de ${inactivosDiasFiltro} días sin asistir.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = inactivos.map(i => {
        const foto = i.foto_url ? escapeHtml(i.foto_url) : DEFAULT_AVATAR;
        const nombre = escapeHtml(i.nombre_completo || "Socio");
        const dni = escapeHtml(i.dni);
        const dias = i.dias_inactivo;
        const ultAsist = formatFecha(i.fecha_ultima_asistencia);
        const tel = i.telefono ? escapeHtml(i.telefono) : null;

        const cuotaOk = (i.estado_cuota || "").toLowerCase().includes("día") || (i.estado_cuota || "").toLowerCase().includes("dia");
        const cuotaBadge = cuotaOk
            ? `<span class="badge badge-success">Al día</span>`
            : `<span class="badge badge-danger">Atrasado</span>`;

        const diasBadge = dias >= 30
            ? `<span class="badge badge-danger" style="font-weight: 700;"><i class="fa-solid fa-fire"></i> ${dias} días</span>`
            : `<span class="badge badge-warning" style="font-weight: 700;"><i class="fa-solid fa-clock-rotate-left"></i> ${dias} días</span>`;

        // Generar enlace de WhatsApp con saludo personalizado
        const mensajeWa = encodeURIComponent(`¡Hola ${nombre.split(' ')[0]}! Te escribimos de Gimnasio SOMA. Notamos que hace unos días no te vemos por el gym y queríamos saber cómo estás y si podemos ayudarte con tu rutina.`);
        const cleanTel = tel ? tel.replace(/\D/g, "") : "";
        const btnWa = cleanTel
            ? `<a href="https://wa.me/${cleanTel}?text=${mensajeWa}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.35rem; color: #22c55e; border-color: rgba(34, 197, 94, 0.4);" title="Enviar WhatsApp de fidelización">
                <i class="fa-brands fa-whatsapp" style="font-size: 1rem;"></i> Contactar
               </a>`
            : `<span style="font-size: 0.8rem; color: var(--text-secondary);">Sin teléfono</span>`;

        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <img src="${foto}" alt="${nombre}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-light);">
                        <div>
                            <strong>${nombre}</strong>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">DNI: ${dni}</div>
                        </div>
                    </div>
                </td>
                <td>${diasBadge}</td>
                <td><small style="color: var(--text-secondary);">${ultAsist}</small></td>
                <td>${cuotaBadge}</td>
                <td>${tel || '<span style="color: var(--text-secondary); font-size: 0.85rem;">—</span>'}</td>
                <td>${btnWa}</td>
            </tr>
        `;
    }).join("");
}

/**
 * Carga completa de la sección de asistencias y renderizado.
 */
export async function fetchAsistenciasSection() {
    try {
        const [resStats, resHoy, resInactivos] = await Promise.all([
            getEstadisticasAsistencias(),
            getAsistenciasHoy(100),
            getSociosInactivos(inactivosDiasFiltro)
        ]);

        if (resStats.ok && resStats.data) {
            renderEstadisticas(resStats.data);
        }
        if (resHoy.ok && resHoy.data) {
            cachedAsistenciasHoy = resHoy.data;
            renderTablaAsistenciasHoy(cachedAsistenciasHoy);
        }
        if (resInactivos.ok && resInactivos.data) {
            cachedInactivos = resInactivos.data;
            renderTablaInactivos(cachedInactivos);
        }
    } catch (err) {
        console.error("Error al cargar asistencias:", err);
        showToast("Error", "No se pudieron sincronizar las asistencias.", "danger");
    }
}

/**
 * Inicializa los eventos del DOM para la sección de asistencias.
 */
export function initAsistenciasModule() {
    // 1. Selector de sub-pestañas (Hoy vs Inactivos)
    const tabButtons = document.querySelectorAll(".asistencias-subtab-btn");
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-tab");
            if (!target) return;
            currentSubTab = target;

            tabButtons.forEach(b => b.classList.toggle("active", b === btn));
            document.querySelectorAll(".asistencias-tab-panel").forEach(panel => {
                panel.classList.toggle("hidden", panel.id !== target);
            });
        });
    });

    // 2. Buscador de asistencias de hoy
    const searchHoy = document.getElementById("search-asistencias-hoy");
    if (searchHoy) {
        searchHoy.addEventListener("input", (e) => {
            const query = (e.target.value || "").trim().toLowerCase();
            const filtradas = cachedAsistenciasHoy.filter(a =>
                (a.nombre_completo || "").toLowerCase().includes(query) ||
                (a.dni_cliente || "").includes(query)
            );
            renderTablaAsistenciasHoy(filtradas);
        });
    }

    // 3. Buscador de socios inactivos
    const searchInactivos = document.getElementById("search-socios-inactivos");
    if (searchInactivos) {
        searchInactivos.addEventListener("input", (e) => {
            const query = (e.target.value || "").trim().toLowerCase();
            const filtrados = cachedInactivos.filter(i =>
                (i.nombre_completo || "").toLowerCase().includes(query) ||
                (i.dni || "").includes(query) ||
                (i.telefono || "").includes(query)
            );
            renderTablaInactivos(filtrados);
        });
    }

    // 4. Selector de umbral de días de inactividad
    const selectDias = document.getElementById("select-dias-inactividad");
    if (selectDias) {
        selectDias.addEventListener("change", async (e) => {
            inactivosDiasFiltro = parseInt(e.target.value, 10) || 15;
            const res = await getSociosInactivos(inactivosDiasFiltro);
            if (res.ok && res.data) {
                cachedInactivos = res.data;
                renderTablaInactivos(cachedInactivos);
            }
        });
    }
}
