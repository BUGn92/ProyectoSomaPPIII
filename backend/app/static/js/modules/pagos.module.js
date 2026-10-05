/* ==========================================================================
   MÓDULO DE PAGOS Y MEMBRESÍAS (FICHA DEL SOCIO)
   ========================================================================== */

import { state } from "../state.js";
import { PagosService } from "../services/pagos.service.js";
import { ClientesService } from "../services/clientes.service.js";
import { showToast } from "../utils/toast.js";
import { formatCurrency, calcularPreviewFecha } from "../utils/formatters.js";
import { escapeHtml } from "../utils/sanitizer.js";

const formPago = document.getElementById("form-pago");
const tbodyHistorialPagos = document.getElementById("tbody-historial-pagos");
const pMonto = document.getElementById("p-monto");
const pMetodo = document.getElementById("p-metodo");
const pMeses = document.getElementById("p-meses");
const pDescripcion = document.getElementById("p-descripcion");
const pNuevoVencimientoPreview = document.getElementById("p-nuevo-vencimiento-preview");

let onPagoRegistradoCallback = null;

export function setOnPagoRegistrado(callback) {
    onPagoRegistradoCallback = callback;
}

export async function fetchClientMembresia(dni) {
    const res = await ClientesService.getClienteMembresia(dni);
    if (res.ok) {
        state.membresiaActivaActual = res.data;
    } else {
        state.membresiaActivaActual = null;
    }
    actualizarPreviewVencimiento();
}

export async function fetchClientPagos(dni) {
    if (!tbodyHistorialPagos) return;
    const res = await PagosService.getPagosByCliente(dni);
    if (res.ok) {
        renderHistorialPagos(res.data || []);
    } else {
        tbodyHistorialPagos.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-secondary)">Sin pagos registrados</td></tr>`;
    }
}

export function renderHistorialPagos(pagos) {
    if (!tbodyHistorialPagos) return;
    tbodyHistorialPagos.innerHTML = "";

    if (!pagos || pagos.length === 0) {
        tbodyHistorialPagos.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);padding:1.5rem">Sin pagos registrados</td></tr>`;
        return;
    }

    pagos.forEach(p => {
        const tr = document.createElement("tr");
        const vencBadge = p.fecha_vencimiento_cuota 
            ? `<span class="badge badge-success">${escapeHtml(p.fecha_vencimiento_cuota)}</span>` 
            : "-";

        tr.innerHTML = `
            <td>${escapeHtml(p.fecha_pago)}</td>
            <td><strong>${formatCurrency(p.monto)}</strong></td>
            <td>${escapeHtml(p.metodo_pago || "-")}</td>
            <td>${p.meses_abonados} mes${p.meses_abonados !== 1 ? "es" : ""}</td>
            <td>${vencBadge}</td>
            <td>${escapeHtml(p.descripcion || "-")}</td>
        `;
        tbodyHistorialPagos.appendChild(tr);
    });
}

export function actualizarPreviewVencimiento() {
    if (!pNuevoVencimientoPreview) return;
    const meses = parseInt(pMeses ? pMeses.value : 1) || 1;
    const fechaFin = state.membresiaActivaActual ? state.membresiaActivaActual.fecha_fin : null;
    const nuevaFecha = calcularPreviewFecha(fechaFin, meses);
    const base = (fechaFin && new Date(fechaFin + "T00:00:00") >= new Date())
        ? `Acumula desde ${escapeHtml(fechaFin)}`
        : "El socio está vencido, el vencimiento se calcula desde hoy";
    pNuevoVencimientoPreview.textContent = `Nuevo vencimiento estimado: ${nuevaFecha} (${base})`;
}

export function initPagosModule() {
    if (pMeses) {
        pMeses.addEventListener("input", actualizarPreviewVencimiento);
    }

    if (formPago) {
        formPago.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!state.editingDni) return;

            const montoVal = parseFloat(pMonto.value);
            if (!montoVal || montoVal <= 0) {
                showToast("Error", "Ingresa un monto válido para el pago", "error");
                return;
            }

            const payload = {
                dni_cliente: state.editingDni,
                monto: montoVal,
                metodo_pago: pMetodo.value,
                meses_abonados: parseInt(pMeses.value) || 1,
                descripcion: pDescripcion.value.trim() || null,
            };

            const res = await PagosService.registrarPago(payload);
            if (res.ok) {
                const nuevaFechaVenc = res.data?.fecha_vencimiento_cuota || "";
                showToast("Éxito", `Pago registrado. Nuevo vencimiento: ${nuevaFechaVenc}`);
                formPago.reset();
                if (pMeses) pMeses.value = 1;
                fetchClientPagos(state.editingDni);
                fetchClientMembresia(state.editingDni);
                if (onPagoRegistradoCallback) onPagoRegistradoCallback();
            } else {
                showToast("Error", res.detail || "No se pudo registrar el pago", "error");
            }
        });
    }
}
