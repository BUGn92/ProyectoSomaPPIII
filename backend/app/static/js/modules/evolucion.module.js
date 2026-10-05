/* ==========================================================================
   MÓDULO DE EVOLUCIÓN FÍSICA Y DEPORTIVA (STAFF)
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

const tbodyEvDeportiva = document.getElementById("tbody-ev-deportiva");
const formEvDeportiva = document.getElementById("form-ev-deportiva");
const edFecha = document.getElementById("ed-fecha");
const edEjercicio = document.getElementById("ed-ejercicio");
const edCarga = document.getElementById("ed-carga");
const edReps = document.getElementById("ed-reps");

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
    if (!tbodyEvDeportiva) return;
    tbodyEvDeportiva.innerHTML = "";

    const res = await ClientesService.getClienteEvDeportiva(dni);
    if (res.ok) {
        const data = res.data || [];
        if (data.length === 0) {
            tbodyEvDeportiva.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">Sin cargas registradas</td></tr>`;
            return;
        }
        data.forEach(r => {
            const tr = document.createElement("tr");
            const ejNombre = r.ejercicio ? r.ejercicio.nombre_ejercicio : 'ID: ' + r.id_ejercicio;
            const ejGrupo = r.ejercicio ? r.ejercicio.grupo_muscular : '-';

            tr.innerHTML = `
                <td><strong>${escapeHtml(r.fecha_entrenamiento)}</strong></td>
                <td>${escapeHtml(ejNombre)}</td>
                <td><span class="badge" style="background-color: rgba(255,255,255,0.05);">${escapeHtml(ejGrupo)}</span></td>
                <td><strong style="color: var(--accent);">${r.carga_real ? escapeHtml(r.carga_real) + ' kg' : '-'}</strong></td>
                <td>${escapeHtml(r.repeticiones_logradas || '-')}</td>
            `;
            tbodyEvDeportiva.appendChild(tr);
        });
    }
}

export function initEvolucionModule() {
    if (formEvFisica) {
        formEvFisica.addEventListener("submit", async (e) => {
            e.preventDefault();
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

    if (formEvDeportiva) {
        formEvDeportiva.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!state.editingDni) return;

            const payload = {
                fecha_entrenamiento: edFecha.value,
                id_ejercicio: parseInt(edEjercicio.value),
                carga_real: parseFloat(edCarga.value),
                repeticiones_logradas: edReps.value ? parseInt(edReps.value) : null
            };

            const res = await ClientesService.saveClienteEvDeportiva(state.editingDni, payload);
            if (res.ok) {
                showToast("Carga Registrada", "Se registró la carga del entrenamiento.");
                formEvDeportiva.reset();
                if (edFecha) edFecha.value = new Date().toISOString().split("T")[0];
                fetchClientEvDeportiva(state.editingDni);
            } else {
                showToast("Error", res.detail || "Error al guardar carga", "error");
            }
        });
    }
}
