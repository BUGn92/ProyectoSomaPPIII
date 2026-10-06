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
const routineBuilderTbody = document.getElementById("routine-builder-tbody");
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
export function addRoutineBuilderRow(detail = null) {
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
    updateRoutineRowNumbers();
}

export function updateRoutineRowNumbers() {
    if (!routineBuilderTbody) return;
    const rows = routineBuilderTbody.querySelectorAll("tr");
    rows.forEach((row, index) => {
        const numSpan = row.querySelector(".routine-row-number");
        if (numSpan) numSpan.textContent = index + 1;
        const upBtn = row.querySelector('[data-direction="up"]');
        const downBtn = row.querySelector('[data-direction="down"]');
        if (upBtn) upBtn.disabled = index === 0;
        if (downBtn) downBtn.disabled = index === rows.length - 1;
    });
}

export async function fetchClientRutina(dni) {
    showRoutineEditor(false);
    if (routinePreview) routinePreview.innerHTML = "";
    if (routineManagementActions) routineManagementActions.classList.add("hidden");
    if (btnEditRoutine) btnEditRoutine.disabled = true;
    if (!state.cachedEjercicios || state.cachedEjercicios.length === 0) {
        await fetchEjerciciosAux();
    }
    if (routineBuilderTbody) routineBuilderTbody.innerHTML = "";
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
        
        rutina.detalles.forEach(det => addRoutineBuilderRow(det));
    } else {
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

    if (routineBuilderTbody) {
        routineBuilderTbody.addEventListener("click", (event) => {
            const button = event.target.closest("button");
            if (!button) return;

            const row = button.closest("tr");
            if (button.classList.contains("btn-remove-row")) {
                row.remove();
            } else if (button.classList.contains("btn-move-row")) {
                if (button.dataset.direction === "up" && row.previousElementSibling) {
                    routineBuilderTbody.insertBefore(row, row.previousElementSibling);
                } else if (button.dataset.direction === "down" && row.nextElementSibling) {
                    routineBuilderTbody.insertBefore(row.nextElementSibling, row);
                }
            }
            updateRoutineRowNumbers();
        });
    }

    if (btnAddRoutineRow) {
        btnAddRoutineRow.addEventListener("click", () => addRoutineBuilderRow());
    }

    if (formRutina) {
        formRutina.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!state.editingDni) return;

            const rows = routineBuilderTbody.querySelectorAll("tr");
            if (rows.length === 0) {
                showToast("Advertencia", "Debes agregar al menos un ejercicio a la rutina.", "warning");
                return;
            }

            const detalles = [];
            let valid = true;

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

            if (!valid || detalles.length === 0) {
                showToast("Error", "Completa todos los campos obligatorios de los ejercicios.", "error");
                return;
            }

            const payload = {
                fecha_inicio: rFecha.value,
                periodo: rPeriodo.value ? parseInt(rPeriodo.value) : null,
                objetivo: rObjetivo.value.trim(),
                observaciones: rObs.value.trim() || null,
                activa: true,
                detalles: detalles
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
