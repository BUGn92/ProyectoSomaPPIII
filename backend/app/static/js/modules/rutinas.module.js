/* ==========================================================================
   MÓDULO DE CONSTRUCTOR INTERACTIVO DE RUTINAS (ADMIN / ENTRENADOR)
   ========================================================================== */

import { state } from "../state.js";
import { ClientesService } from "../services/clientes.service.js";
import { showToast } from "../utils/toast.js";
import { escapeHtml } from "../utils/sanitizer.js";
import { renderRoutineView } from "./routine-view.module.js";

const formRutina = document.getElementById("form-rutina");
const rFecha = document.getElementById("r-fecha");
const rPeriodo = document.getElementById("r-periodo");
const rObjetivo = document.getElementById("r-objetivo");
const rObs = document.getElementById("r-obs");
const btnAddRoutineRow = document.getElementById("btn-add-routine-row");
const btnAddRoutineDay = document.getElementById("btn-add-routine-day");
const routineDayTabs = document.getElementById("routine-day-tabs");
const routineDaysContainer = document.getElementById("routine-days-container");
const routinePreview = document.getElementById("routine-preview");
const routineManagementActions = document.getElementById("routine-management-actions");
const btnEditRoutine = document.getElementById("btn-edit-routine");
const btnEditRoutineLabel = document.getElementById("btn-edit-routine-label");
const btnCancelRoutine = document.getElementById("btn-cancel-routine");
const selectEdEjercicio = document.getElementById("ed-ejercicio");
let canEditRoutine = false;

function showRoutineEditor(show) {
    if (routinePreview) routinePreview.classList.toggle("hidden", show);
    if (formRutina) formRutina.classList.toggle("hidden", !show);
}

/**
 * Carga el catálogo de ejercicios en memoria y rellena el select de evolución deportiva.
 */
export async function fetchEjerciciosAux() {
    try {
        const res = await ClientesService.getEjerciciosAux();
        if (res.ok) {
            state.cachedEjercicios = res.data || [];
            if (selectEdEjercicio) {
                selectEdEjercicio.innerHTML = '<option value="" disabled selected>Selecciona un ejercicio...</option>';
                state.cachedEjercicios.forEach(ej => {
                    const opt = document.createElement("option");
                    opt.value = ej.id_ejercicio;
                    opt.textContent = `${ej.nombre_ejercicio} (${ej.grupo_muscular})`;
                    selectEdEjercicio.appendChild(opt);
                });
            }
        }
    } catch (err) {
        console.error("Error al cargar catálogo de ejercicios:", err);
    }
}

/**
 * Agrega una nueva fila al constructor interactivo de rutinas.
 */
export function addRoutineBuilderRow(detail = null, targetTbody = null) {
    const routineBuilderTbody = targetTbody || routineDaysContainer?.querySelector(".routine-day-panel:not(.hidden) tbody");
    if (!routineBuilderTbody) return;

    const tr = document.createElement("tr");
    
    let optionsHtml = '<option value="" disabled selected>Seleccionar ejercicio...</option>';
    state.cachedEjercicios.forEach(ej => {
        const selected = detail && detail.id_ejercicio === ej.id_ejercicio ? "selected" : "";
        optionsHtml += `<option value="${ej.id_ejercicio}" ${selected}>${escapeHtml(ej.nombre_ejercicio)} (${escapeHtml(ej.grupo_muscular)})</option>`;
    });

    const seriesVal = detail ? parseInt(detail.series) || 3 : 3;
    const repsVal = detail ? parseInt(detail.repeticiones) || 10 : 10;
    const cargaVal = detail && detail.carga ? escapeHtml(detail.carga) : "";
    const descansoVal = detail && detail.descanso ? escapeHtml(detail.descanso) : "90 seg";

    tr.innerHTML = `
        <td class="routine-order-cell" data-label="Orden">
            <span class="routine-row-number"></span>
        </td>
        <td data-label="Ejercicio">
            <select class="rb-ejercicio" required>${optionsHtml}</select>
        </td>
        <td data-label="Series">
            <input type="number" min="1" max="20" class="rb-series" required value="${seriesVal}" placeholder="Series">
        </td>
        <td data-label="Repeticiones">
            <input type="number" min="1" max="100" class="rb-reps" required value="${repsVal}" placeholder="Reps">
        </td>
        <td data-label="Carga (kg)">
            <input type="number" step="0.5" min="0" max="500" class="rb-carga" value="${cargaVal}" placeholder="Ej: 50.0">
        </td>
        <td data-label="Descanso">
            <input type="text" class="rb-descanso" value="${descansoVal}" placeholder="Ej: 90 seg">
        </td>
        <td class="routine-actions-cell" data-label="Acciones">
            <div class="routine-row-actions">
                <button type="button" class="btn-move-row" data-direction="up" title="Mover ejercicio hacia arriba" aria-label="Mover ejercicio hacia arriba"><i class="fa-solid fa-arrow-up"></i></button>
                <button type="button" class="btn-move-row" data-direction="down" title="Mover ejercicio hacia abajo" aria-label="Mover ejercicio hacia abajo"><i class="fa-solid fa-arrow-down"></i></button>
                <button type="button" class="btn-remove-row" title="Quitar ejercicio" aria-label="Quitar ejercicio"><i class="fa-solid fa-trash"></i></button>
            </div>
        </td>
    `;

    routineBuilderTbody.appendChild(tr);
    updateRoutineRowNumbers(routineBuilderTbody);
}

export function updateRoutineRowNumbers(tbody) {
    const rows = tbody?.querySelectorAll("tr") || [];
    rows.forEach((row, index) => {
        row.querySelector(".routine-row-number").textContent = index + 1;
        row.querySelector('[data-direction="up"]').disabled = index === 0;
        row.querySelector('[data-direction="down"]').disabled = index === rows.length - 1;
    });
}

function updateRoutineDayControls() {
    const tabs = routineDayTabs?.querySelectorAll(".routine-day-tab") || [];
    const panels = routineDaysContainer?.querySelectorAll(".routine-day-panel") || [];

    tabs.forEach((tab, index) => {
        const button = tab.querySelector("[data-day-index]");
        const removeButton = tab.querySelector("[data-remove-day]");
        button.dataset.dayIndex = index;
        button.textContent = `Día ${index + 1}`;
        button.classList.toggle("active", !panels[index].classList.contains("hidden"));
        button.setAttribute("aria-selected", String(!panels[index].classList.contains("hidden")));
        removeButton.dataset.dayIndex = index;
        removeButton.disabled = tabs.length === 1;
        panels[index].dataset.dayIndex = index;
    });
    if (btnAddRoutineDay) btnAddRoutineDay.disabled = tabs.length >= 7;
}

function showRoutineDay(index) {
    const panels = routineDaysContainer?.querySelectorAll(".routine-day-panel") || [];
    panels.forEach((panel, panelIndex) => panel.classList.toggle("hidden", panelIndex !== index));
    updateRoutineDayControls();
}

function addRoutineBuilderDay(details = []) {
    const tabsCount = routineDayTabs?.querySelectorAll(".routine-day-tab").length || 0;
    if (!routineDayTabs || !routineDaysContainer || tabsCount >= 7) return false;

    const index = tabsCount;
    const tab = document.createElement("div");
    tab.className = "routine-day-tab";
    tab.innerHTML = `
        <button type="button" class="routine-day-tab-button" data-day-index="${index}" role="tab">
            Día ${index + 1}
        </button>
        <button type="button" class="routine-day-remove" data-remove-day data-day-index="${index}" aria-label="Quitar Día ${index + 1}" title="Quitar día">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    routineDayTabs.appendChild(tab);

    const panel = document.createElement("section");
    panel.className = `routine-day-panel${index === 0 ? "" : " hidden"}`;
    panel.dataset.dayIndex = index;
    panel.innerHTML = `
        <div class="routine-builder-container">
            <table class="routine-builder-table">
                <thead>
                    <tr>
                        <th class="routine-order-column">Orden</th>
                        <th>Ejercicio</th>
                        <th>Series</th>
                        <th>Reps</th>
                        <th>Carga (kg)</th>
                        <th>Descanso</th>
                        <th class="routine-actions-column">Acciones</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;
    routineDaysContainer.appendChild(panel);
    details.forEach(detail => addRoutineBuilderRow(detail, panel.querySelector("tbody")));
    updateRoutineDayControls();
    return true;
}

export async function fetchClientRutina(dni) {
    showRoutineEditor(false);
    if (routinePreview) routinePreview.innerHTML = "";
    if (routineManagementActions) routineManagementActions.classList.add("hidden");
    if (btnEditRoutine) btnEditRoutine.disabled = true;
    if (!state.cachedEjercicios || state.cachedEjercicios.length === 0) {
        await fetchEjerciciosAux();
    }
    if (routineDayTabs) routineDayTabs.innerHTML = "";
    if (routineDaysContainer) routineDaysContainer.innerHTML = "";
    if (formRutina) formRutina.reset();
    
    if (rFecha) rFecha.value = new Date().toISOString().split("T")[0];
    if (rPeriodo) rPeriodo.value = 4;
    if (rObjetivo) rObjetivo.value = "Hipertrofia y Acondicionamiento";
    if (rObs) rObs.value = "";

    const res = await ClientesService.getClienteRutina(dni);
    if (!res.ok) {
        showToast("Error", res.detail || "No se pudo cargar la rutina del socio.", "error");
        if (routinePreview) {
            routinePreview.innerHTML = `<div class="empty-state"><h3>No se pudo cargar la rutina</h3><p>${escapeHtml(res.detail || "Intenta nuevamente más tarde.")}</p></div>`;
        }
        return;
    }

    const activeRoutine = res.data;
    if (routinePreview) routinePreview.innerHTML = renderRoutineView(activeRoutine);
    if (routineManagementActions) routineManagementActions.classList.toggle("hidden", !canEditRoutine);
    if (btnEditRoutine) btnEditRoutine.disabled = !canEditRoutine;
    if (btnEditRoutineLabel) {
        btnEditRoutineLabel.textContent = activeRoutine?.detalles?.length ? "Modificar rutina" : "Crear rutina";
    }
    showRoutineEditor(false);

    if (res.data?.detalles?.length > 0) {
        const rutina = res.data;
        if (rFecha) rFecha.value = rutina.fecha_inicio || "";
        if (rPeriodo) rPeriodo.value = rutina.periodo || 4;
        if (rObjetivo) rObjetivo.value = rutina.objetivo || "";
        if (rObs) rObs.value = rutina.observaciones || "";
        const dias = rutina.dias?.length
            ? rutina.dias
            : [{ detalles: rutina.detalles }];
        dias.forEach(dia => addRoutineBuilderDay(dia.detalles || []));
    } else {
        addRoutineBuilderDay();
        addRoutineBuilderRow();
    }
}

export function initRutinasModule() {
    const role = (state.currentUser?.rol || "").trim().toLowerCase();
    canEditRoutine = role === "admin" || role === "entrenador";
    if (btnEditRoutine) {
        btnEditRoutine.addEventListener("click", () => showRoutineEditor(true));
    }
    if (btnCancelRoutine) {
        btnCancelRoutine.addEventListener("click", () => {
            if (state.editingDni) fetchClientRutina(state.editingDni);
        });
    }

    if (routineDayTabs) {
        routineDayTabs.addEventListener("click", (event) => {
            const button = event.target.closest("button");
            if (!button) return;

            if (button.hasAttribute("data-remove-day")) {
                const tabs = routineDayTabs.querySelectorAll(".routine-day-tab");
                if (tabs.length <= 1) return;
                const dayIndex = parseInt(button.dataset.dayIndex);
                button.closest(".routine-day-tab").remove();
                routineDaysContainer.querySelector(`.routine-day-panel[data-day-index="${dayIndex}"]`)?.remove();
                const panels = routineDaysContainer.querySelectorAll(".routine-day-panel");
                panels.forEach((panel, index) => panel.dataset.dayIndex = index);
                showRoutineDay(Math.min(dayIndex, panels.length - 1));
            } else if (button.hasAttribute("data-day-index")) {
                showRoutineDay(parseInt(button.dataset.dayIndex));
            }
        });
    }

    if (routineDaysContainer) {
        routineDaysContainer.addEventListener("click", (event) => {
            const button = event.target.closest("button");
            if (!button) return;

            const row = button.closest("tr");
            const tbody = button.closest("tbody");
            if (button.classList.contains("btn-remove-row")) {
                row.remove();
            } else if (button.classList.contains("btn-move-row")) {
                if (button.dataset.direction === "up" && row.previousElementSibling) {
                    tbody.insertBefore(row, row.previousElementSibling);
                } else if (button.dataset.direction === "down" && row.nextElementSibling) {
                    tbody.insertBefore(row.nextElementSibling, row);
                } else {
                    return;
                }
            }
            updateRoutineRowNumbers(tbody);
        });
    }

    if (btnAddRoutineRow) {
        btnAddRoutineRow.addEventListener("click", () => addRoutineBuilderRow());
    }

    if (btnAddRoutineDay) {
        btnAddRoutineDay.addEventListener("click", () => {
            if (addRoutineBuilderDay()) {
                showRoutineDay(routineDayTabs.querySelectorAll(".routine-day-tab").length - 1);
            }
        });
    }

    if (formRutina) {
        formRutina.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!state.editingDni) return;

            const dayBodies = Array.from(routineDaysContainer.querySelectorAll(".routine-day-panel tbody"));
            if (dayBodies.length === 0 || dayBodies.length > 7) {
                showToast("Error", "La rutina debe tener entre 1 y 7 días.", "error");
                return;
            }

            const dias = [];
            let valid = true;

            dayBodies.forEach(tbody => {
                const rows = tbody.querySelectorAll("tr");
                if (rows.length === 0) valid = false;
                const detalles = [];
                rows.forEach(row => {
                    const idEj = parseInt(row.querySelector(".rb-ejercicio").value);
                    const series = parseInt(row.querySelector(".rb-series").value);
                    const reps = parseInt(row.querySelector(".rb-reps").value);
                    const cargaVal = row.querySelector(".rb-carga").value;
                    const carga = cargaVal ? parseFloat(cargaVal) : null;
                    const descanso = row.querySelector(".rb-descanso").value.trim() || null;

                    if (!idEj || isNaN(series) || isNaN(reps)) {
                        valid = false;
                    } else {
                        detalles.push({
                            id_ejercicio: idEj,
                            series: series,
                            repeticiones: reps,
                            carga: carga,
                            descanso: descanso
                        });
                    }
                });
                dias.push({ detalles });
            });

            if (!valid) {
                showToast("Error", "Cada día debe tener al menos un ejercicio y todos los campos obligatorios completos.", "error");
                return;
            }

            const payload = {
                fecha_inicio: rFecha.value,
                periodo: rPeriodo.value ? parseInt(rPeriodo.value) : null,
                objetivo: rObjetivo.value.trim(),
                observaciones: rObs.value.trim() || null,
                activa: true,
                dias
            };

            const res = await ClientesService.saveClienteRutina(state.editingDni, payload);
            if (res.ok) {
                showToast("Rutina Asignada", `La rutina fue asignada exitosamente al socio ${state.editingDni}.`);
                await fetchClientRutina(state.editingDni);
            } else {
                showToast("Error", res.detail || "No se pudo guardar la rutina.", "error");
            }
        });
    }
}
