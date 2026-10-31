import { state } from "../state.js";
import { ClientesService } from "../services/clientes.service.js";
import { showToast } from "../utils/toast.js";
import { escapeHtml } from "../utils/sanitizer.js";

const tbodyEjercicios = document.getElementById("tbody-ejercicios");
const searchEjercicios = document.getElementById("search-ejercicios");
const modalEjercicio = document.getElementById("modal-ejercicio");
const formEjercicio = document.getElementById("form-ejercicio");
const nombreEjercicio = document.getElementById("ej-nombre");
const grupoMuscular = document.getElementById("ej-grupo-muscular");
const modalEjercicioTitle = document.getElementById("modal-ejercicio-title");
let editingExerciseId = null;

function renderEjercicios(ejercicios) {
    if (!tbodyEjercicios) return;
    tbodyEjercicios.innerHTML = "";

    if (!ejercicios.length) {
        tbodyEjercicios.innerHTML = `
            <tr><td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                No se encontraron ejercicios
            </td></tr>`;
        return;
    }

    ejercicios.forEach((ejercicio) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(ejercicio.nombre_ejercicio)}</td>
            <td>${escapeHtml(ejercicio.grupo_muscular)}</td>
            <td class="actions-col">
                <button type="button" class="btn-icon btn-icon-edit" data-exercise-id="${ejercicio.id_ejercicio}" title="Editar ejercicio">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button type="button" class="btn-icon btn-icon-delete" data-exercise-id="${ejercicio.id_ejercicio}" title="Dar de baja ejercicio">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbodyEjercicios.appendChild(row);
    });

    tbodyEjercicios.querySelectorAll(".btn-icon-edit").forEach((button) => {
        button.addEventListener("click", () => {
            const ejercicio = state.cachedEjercicios.find(item =>
                item.id_ejercicio === Number(button.dataset.exerciseId)
            );
            if (ejercicio) openExerciseModal(ejercicio);
        });
    });
    tbodyEjercicios.querySelectorAll(".btn-icon-delete").forEach((button) => {
        button.addEventListener("click", () => deleteExercise(Number(button.dataset.exerciseId)));
    });
}

export async function fetchEjerciciosCatalogo() {
    const res = await ClientesService.getEjerciciosAux();
    if (!res.ok) {
        showToast("Error", res.detail || "No se pudo cargar el catálogo de ejercicios.", "error");
        return;
    }

    state.cachedEjercicios = res.data || [];
    renderEjercicios(state.cachedEjercicios);
}

function openExerciseModal(ejercicio = null) {
    if (!modalEjercicio) return;
    formEjercicio?.reset();
    editingExerciseId = ejercicio?.id_ejercicio || null;
    if (modalEjercicioTitle) {
        modalEjercicioTitle.textContent = editingExerciseId ? "Modificar ejercicio" : "Agregar ejercicio";
    }
    if (ejercicio) {
        nombreEjercicio.value = ejercicio.nombre_ejercicio;
        grupoMuscular.value = ejercicio.grupo_muscular;
    }
    modalEjercicio.classList.add("active", "open");
    nombreEjercicio?.focus();
}

function closeExerciseModal() {
    modalEjercicio?.classList.remove("active", "open");
    editingExerciseId = null;
}

async function deleteExercise(idEjercicio) {
    const ejercicio = state.cachedEjercicios.find(item => item.id_ejercicio === idEjercicio);
    if (!ejercicio || !confirm(`¿Dar de baja el ejercicio "${ejercicio.nombre_ejercicio}"?`)) return;

    const res = await ClientesService.deleteEjercicio(idEjercicio);
    if (!res.ok) {
        showToast("Error", res.detail || "No se pudo dar de baja el ejercicio.", "error");
        return;
    }
    await fetchEjerciciosCatalogo();
    showToast("Ejercicio dado de baja", "Ya no aparecerá en nuevas rutinas.", "success");
}

export function initEjerciciosModule() {
    searchEjercicios?.addEventListener("input", (event) => {
        const query = event.target.value.toLowerCase().trim();
        const filtered = state.cachedEjercicios.filter((ejercicio) =>
            ejercicio.nombre_ejercicio.toLowerCase().includes(query) ||
            ejercicio.grupo_muscular.toLowerCase().includes(query)
        );
        renderEjercicios(filtered);
    });

    document.getElementById("btn-nuevo-ejercicio")?.addEventListener("click", openExerciseModal);
    modalEjercicio?.querySelectorAll(".modal-close").forEach((button) => {
        button.addEventListener("click", closeExerciseModal);
    });

    formEjercicio?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const isEditing = Boolean(editingExerciseId);
        const payload = {
            nombre_ejercicio: nombreEjercicio.value.trim(),
            grupo_muscular: grupoMuscular.value.trim()
        };
        const res = editingExerciseId
            ? await ClientesService.updateEjercicio(editingExerciseId, payload)
            : await ClientesService.createEjercicio(payload);

        if (!res.ok) {
            showToast("No se pudo agregar", res.detail || "Verifica los datos ingresados.", "error");
            return;
        }

        closeExerciseModal();
        await fetchEjerciciosCatalogo();
        showToast(
            isEditing ? "Ejercicio modificado" : "Ejercicio agregado",
            isEditing ? "Los cambios fueron guardados." : "El ejercicio quedó disponible para todas las rutinas.",
            "success"
        );
    });
}
