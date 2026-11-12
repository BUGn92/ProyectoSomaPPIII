/* ==========================================================================
   MÓDULO DE EVOLUCIÓN FÍSICA Y PROGRESO DE CARGAS DEPORTIVAS (STAFF)
   ========================================================================== */

import { state } from "../state.js";
import { ClientesService } from "../services/clientes.service.js";
import { showToast } from "../utils/toast.js";
import { escapeHtml } from "../utils/sanitizer.js";

const tbodyEvFisica = document.getElementById("tbody-ev-fisica");
const formEvFisica = document.getElementById("form-ev-fisica");
const efFecha = document.getElementById("ef-fecha");
const efPeso = document.getElementById("ef-peso");
const efGrasa = document.getElementById("ef-grasa");
const efObs = document.getElementById("ef-obs");

// Elementos de Progreso Histórico de Rutinas y Paginación por Año (Cargas Deportivas)
const selectEjercicioProgreso = document.getElementById("select-ejercicio-progreso");
const chartProgresoCanvas = document.getElementById("chart-progreso-ejercicio");
const progresoMetricsSummary = document.getElementById("progreso-metrics-summary");
const metricPrVigente = document.getElementById("metric-pr-vigente");
const metricPrVigenteMes = document.getElementById("metric-pr-vigente-mes");
const metricCargaActual = document.getElementById("metric-carga-actual");
const metricProgresoNeto = document.getElementById("metric-progreso-neto");
const metricMesesCount = document.getElementById("metric-meses-count");
const btnProgresoAnioPrev = document.getElementById("btn-progreso-anio-prev");
const btnProgresoAnioNext = document.getElementById("btn-progreso-anio-next");
const labelProgresoAnio = document.getElementById("label-progreso-anio");
const progresoEmptyState = document.getElementById("progreso-empty-state");
const progresoEmptyText = document.getElementById("progreso-empty-text");
const tabLinkEvDeportiva = document.getElementById("tab-link-ev-deportiva");

let progresoChartInstance = null;
let selectedProgresoAnio = null;
let availableProgresoAnios = [];
let currentProgresoIdEjercicio = null;

function canRegisterEvolution() {
    const role = (state.currentUser?.rol || "").trim().toLowerCase();
    return role === "admin" || role === "entrenador";
}

export async function fetchClientEvFisica(dni) {
    if (!tbodyEvFisica) return;
    tbodyEvFisica.innerHTML = "";

    const res = await ClientesService.getClienteEvFisica(dni);
    if (res.ok) {
        const data = res.data || [];
        if (data.length === 0) {
            tbodyEvFisica.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-secondary);">Sin mediciones registradas</td></tr>`;
            return;
        }
        data.forEach(m => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${escapeHtml(m.fecha_medicion)}</strong></td>
                <td>${m.peso_kg ? escapeHtml(m.peso_kg) + ' kg' : '-'}</td>
                <td>${m.porcentaje_grasa ? escapeHtml(m.porcentaje_grasa) + ' %' : '-'}</td>
                <td>${escapeHtml(m.observaciones || '-')}</td>
            `;
            tbodyEvFisica.appendChild(tr);
        });
    }
}

export async function fetchClientEvDeportiva(dni) {
    await loadEjerciciosProgresoStaff(dni);
}

export async function loadEjerciciosProgresoStaff(dni) {
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
            await renderProgresoEjercicioChartStaff(dni, currentProgresoIdEjercicio, null);
        } else {
            currentProgresoIdEjercicio = null;
            selectEjercicioProgreso.innerHTML = `<option value="">Sin ejercicios en el historial</option>`;
            mostrarEstadoVacioGrafico("No se encontraron ejercicios en el historial de rutinas del socio aún.");
        }
    } catch (err) {
        console.error("Error al cargar ejercicios del historial:", err);
        selectEjercicioProgreso.innerHTML = `<option value="">Error al cargar ejercicios</option>`;
        mostrarEstadoVacioGrafico("Error de conexión al cargar el historial de ejercicios.");
    }
}

export async function renderProgresoEjercicioChartStaff(dni, idEjercicio, anio = null) {
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

export function initEvolucionModule() {
    if (formEvFisica) {
        formEvFisica.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!canRegisterEvolution()) {
                showToast("Acceso denegado", "El rol Recepcionista no puede registrar mediciones físicas.", "error");
                return;
            }
            if (!state.editingDni) return;

            const payload = {
                fecha_medicion: efFecha.value,
                peso_kg: parseFloat(efPeso.value),
                porcentaje_grasa: efGrasa.value ? parseFloat(efGrasa.value) : null,
                observaciones: efObs.value.trim() || null
            };

            const res = await ClientesService.saveClienteEvFisica(state.editingDni, payload);
            if (res.ok) {
                showToast("Medición Guardada", "Se registró la medición antropométrica.");
                formEvFisica.reset();
                if (efFecha) efFecha.value = new Date().toISOString().split("T")[0];
                fetchClientEvFisica(state.editingDni);
            } else {
                showToast("Error", res.detail || "Error al guardar medición", "error");
            }
        });
    }

    // Selector de Ejercicio para Gráfico de Progreso Histórico (Cargas Deportivas)
    if (selectEjercicioProgreso) {
        selectEjercicioProgreso.addEventListener("change", (e) => {
            const dni = state.editingDni;
            currentProgresoIdEjercicio = e.target.value ? parseInt(e.target.value) : null;
            if (dni && currentProgresoIdEjercicio) {
                renderProgresoEjercicioChartStaff(dni, currentProgresoIdEjercicio, null);
            } else {
                mostrarEstadoVacioGrafico("Selecciona un ejercicio del menú para visualizar la curva de progreso mensual.");
            }
        });
    }

    // Navegación por Año Calendario (< y >)
    if (btnProgresoAnioPrev) {
        btnProgresoAnioPrev.addEventListener("click", () => {
            const dni = state.editingDni;
            const anioIdx = availableProgresoAnios.indexOf(selectedProgresoAnio);
            if (dni && currentProgresoIdEjercicio && anioIdx > 0) {
                renderProgresoEjercicioChartStaff(dni, currentProgresoIdEjercicio, availableProgresoAnios[anioIdx - 1]);
            }
        });
    }

    if (btnProgresoAnioNext) {
        btnProgresoAnioNext.addEventListener("click", () => {
            const dni = state.editingDni;
            const anioIdx = availableProgresoAnios.indexOf(selectedProgresoAnio);
            if (dni && currentProgresoIdEjercicio && anioIdx < availableProgresoAnios.length - 1) {
                renderProgresoEjercicioChartStaff(dni, currentProgresoIdEjercicio, availableProgresoAnios[anioIdx + 1]);
            }
        });
    }

    // Redimensionar gráfico al activar la pestaña Cargas Deportivas en el modal
    if (tabLinkEvDeportiva) {
        tabLinkEvDeportiva.addEventListener("click", () => {
            if (progresoChartInstance) {
                setTimeout(() => progresoChartInstance.resize(), 60);
            }
        });
    }
}
