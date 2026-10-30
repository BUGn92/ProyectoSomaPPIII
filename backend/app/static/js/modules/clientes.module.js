/* ==========================================================================
   MÓDULO DE GESTIÓN DE CLIENTES / SOCIOS (PANEL STAFF)
   ========================================================================== */

import { state } from "../state.js";
import { ClientesService } from "../services/clientes.service.js";
import { showToast } from "../utils/toast.js";
import { escapeHtml, parseGoogleDriveUrl } from "../utils/sanitizer.js";

import { fetchClientRutina, fetchEjerciciosAux } from "./rutinas.module.js";
import { fetchClientEvFisica, fetchClientEvDeportiva } from "./evolucion.module.js";
import { fetchClientPagos, fetchClientMembresia } from "./pagos.module.js";

const DEFAULT_AVATAR_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

const tbodyClientes = document.getElementById("tbody-clientes");
const searchClientesInput = document.getElementById("search-clientes");
const toggleInactivosClientes = document.getElementById("toggle-inactivos-clientes");

const modalCliente = document.getElementById("modal-cliente");
const formCliente = document.getElementById("form-cliente");

// Campos de ficha
const cDni = document.getElementById("c-dni");
const cNombre = document.getElementById("c-nombre");
const cApellido = document.getElementById("c-apellido");
const cEdad = document.getElementById("c-edad");
const cEmail = document.getElementById("c-email");
const cTelefono = document.getElementById("c-telefono");
const cCalle = document.getElementById("c-calle");
const cNumero = document.getElementById("c-numero");
const cCiudad = document.getElementById("c-ciudad");
const cActivo = document.getElementById("c-activo");
const cApto = document.getElementById("c-apto");
const cVencimiento = document.getElementById("c-vencimiento");
const groupVencimientoApto = document.getElementById("group-vencimiento-apto");

// Elementos de Fotos de Perfil (SOMA-09)
const btnSolicitudesFoto = document.getElementById("btn-solicitudes-foto");
const badgeSolicitudesCount = document.getElementById("badge-solicitudes-count");
const modalSolicitudesFoto = document.getElementById("modal-solicitudes-foto");
const tbodySolicitudesFoto = document.getElementById("tbody-solicitudes-foto");
const cFotoPreview = document.getElementById("c-foto-preview");
const cFotoFile = document.getElementById("c-foto-file");
const cFotoUrl = document.getElementById("c-foto-url");
const btnCFotoPreview = document.getElementById("btn-c-foto-preview");
const btnEliminarFotoCliente = document.getElementById("btn-eliminar-foto-cliente");

let selectedClienteFotoFile = null;
let removeClienteFoto = false;

// Pestañas
const clientModalTabs = document.querySelectorAll("#client-modal-tabs .tab-link");
const clientModalPanels = document.querySelectorAll("#modal-cliente .tab-content-panel");
const tabLinkRutina = document.getElementById("tab-link-rutina");
const tabLinkEvFisica = document.getElementById("tab-link-ev-fisica");
const tabLinkEvDeportiva = document.getElementById("tab-link-ev-deportiva");
const tabLinkPagos = document.getElementById("tab-link-pagos");

// Pago Inicial en Alta
const piMonto = document.getElementById("pi-monto");
const piMetodo = document.getElementById("pi-metodo");
const piMeses = document.getElementById("pi-meses");
const piDescripcion = document.getElementById("pi-descripcion");
const groupPagoInicialTitle = document.getElementById("group-pago-inicial-title");
const groupPagoMonto = document.getElementById("group-pago-monto");
const groupPagoMetodo = document.getElementById("group-pago-metodo");
const groupPagoMeses = document.getElementById("group-pago-meses");
const groupPagoDescripcion = document.getElementById("group-pago-descripcion");

export async function fetchClientes() {
    const incluirInactivos = toggleInactivosClientes && toggleInactivosClientes.checked;
    const res = await ClientesService.getClientes(incluirInactivos);
    if (res.ok) {
        state.clientesData = res.data || [];
        renderClientes(state.clientesData);
        actualizarBadgeSolicitudes();
    } else {
        showToast("Error", res.detail || "No se pudo cargar la lista de socios", "error");
    }
}

export async function actualizarBadgeSolicitudes() {
    if (!badgeSolicitudesCount) return;
    const rol = (state.currentUser?.rol || "").trim().toLowerCase();
    if (rol !== "admin" && rol !== "recepcionista") {
        if (btnSolicitudesFoto) btnSolicitudesFoto.classList.add("hidden");
        return;
    }
    if (btnSolicitudesFoto) btnSolicitudesFoto.classList.remove("hidden");

    try {
        const res = await ClientesService.getSolicitudesFoto("Pendiente");
        if (res.ok && Array.isArray(res.data)) {
            const count = res.data.length;
            badgeSolicitudesCount.textContent = count;
            if (count > 0) {
                badgeSolicitudesCount.classList.remove("hidden");
            } else {
                badgeSolicitudesCount.classList.add("hidden");
            }
        }
    } catch (e) {
        console.error("Error al actualizar contador de solicitudes de fotos:", e);
    }
}

export async function cargarYRenderizarSolicitudesFoto() {
    if (!tbodySolicitudesFoto) return;
    tbodySolicitudesFoto.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin"></i> Cargando solicitudes...</td></tr>`;

    const res = await ClientesService.getSolicitudesFoto("Pendiente");
    if (!res.ok) {
        tbodySolicitudesFoto.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--danger);">Error al cargar solicitudes: ${escapeHtml(res.detail || 'desconocido')}</td></tr>`;
        return;
    }

    const solicitudes = res.data || [];
    if (solicitudes.length === 0) {
        tbodySolicitudesFoto.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);"><i class="fa-solid fa-circle-check" style="color: var(--success); font-size: 1.5rem; display: block; margin-bottom: 0.5rem;"></i> No hay solicitudes de cambio de foto pendientes.</td></tr>`;
        return;
    }

    tbodySolicitudesFoto.innerHTML = "";
    solicitudes.forEach(sol => {
        const socio = state.clientesData.find(c => c.dni === sol.dni_cliente);
        const nombreSocio = socio ? `${socio.nombre} ${socio.apellido}` : "Socio";
        const fotoActual = socio?.foto_url || DEFAULT_AVATAR_SVG;
        const fechaStr = sol.fecha_solicitud ? new Date(sol.fecha_solicitud).toLocaleString() : "-";

        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid var(--border-light)";
        tr.innerHTML = `
            <td style="padding: 0.75rem; font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(fechaStr)}</td>
            <td style="padding: 0.75rem;">
                <strong>${escapeHtml(nombreSocio)}</strong><br>
                <small style="color: var(--text-secondary);">DNI: ${escapeHtml(sol.dni_cliente)}</small>
            </td>
            <td style="padding: 0.75rem; text-align: center;">
                <img src="${escapeHtml(fotoActual)}" class="avatar-table-preview" alt="Foto Actual" title="Foto Actual">
            </td>
            <td style="padding: 0.75rem; text-align: center;">
                <img src="${escapeHtml(sol.foto_propuesta_url)}" class="avatar-table-preview proposed" alt="Propuesta" title="Foto Propuesta">
            </td>
            <td style="padding: 0.75rem; text-align: center;">
                <div style="display: inline-flex; gap: 0.5rem;">
                    <button class="btn-icon btn-icon-approve btn-aprobar-sol" data-id="${sol.id_solicitud}" title="Aprobar Foto">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    <button class="btn-icon btn-icon-reject btn-rechazar-sol" data-id="${sol.id_solicitud}" title="Rechazar Foto">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </td>
        `;
        tbodySolicitudesFoto.appendChild(tr);
    });

    tbodySolicitudesFoto.querySelectorAll(".btn-aprobar-sol").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");
            btn.disabled = true;
            const res = await ClientesService.aprobarSolicitudFoto(id);
            if (res.ok) {
                showToast("Foto Aprobada", "El avatar del socio ha sido actualizado.", "success");
                await cargarYRenderizarSolicitudesFoto();
                await actualizarBadgeSolicitudes();
                await fetchClientes();
            } else {
                showToast("Error", res.detail || "No se pudo aprobar la foto", "error");
                btn.disabled = false;
            }
        });
    });

    tbodySolicitudesFoto.querySelectorAll(".btn-rechazar-sol").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");
            const motivo = prompt("Indica el motivo de rechazo (opcional):", "La foto no es clara o no corresponde al socio.");
            if (motivo === null) return;
            btn.disabled = true;
            const res = await ClientesService.rechazarSolicitudFoto(id, motivo);
            if (res.ok) {
                showToast("Foto Rechazada", "La solicitud fue rechazada.", "info");
                await cargarYRenderizarSolicitudesFoto();
                await actualizarBadgeSolicitudes();
            } else {
                showToast("Error", res.detail || "No se pudo rechazar la solicitud", "error");
                btn.disabled = false;
            }
        });
    });
}

function renderEstadoPago(fechaVencimiento) {
    if (!fechaVencimiento) {
        return `<span class="badge badge-inactive">Sin membresía</span>`;
    }

    const [anio, mes, dia] = fechaVencimiento.split("-").map(Number);
    const vencimientoUtc = Date.UTC(anio, mes - 1, dia);
    const hoy = new Date();
    const hoyUtc = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const diasRestantes = Math.round((vencimientoUtc - hoyUtc) / 86400000);
    const fechaVisible = `${dia.toString().padStart(2, "0")}/${mes.toString().padStart(2, "0")}/${anio}`;

    if (diasRestantes < 0) {
        return `<span class="badge badge-danger"><i class="fa-solid fa-circle" aria-hidden="true"></i> Vencido · ${fechaVisible}</span>`;
    }
    if (diasRestantes > 7) {
        return `<span class="badge badge-success"><i class="fa-solid fa-circle" aria-hidden="true"></i> Al día · ${diasRestantes} días · ${fechaVisible}</span>`;
    }

    const estado = diasRestantes === 0
        ? "Vence hoy"
        : `Vence en ${diasRestantes} día${diasRestantes === 1 ? "" : "s"}`;
    return `<span class="badge badge-warning"><i class="fa-solid fa-circle" aria-hidden="true"></i> ${estado} · ${fechaVisible}</span>`;
}

export function renderClientes(clients) {
    if (!tbodyClientes) return;
    tbodyClientes.innerHTML = "";

    const esAdmin = (state.currentUser?.rol || "").toLowerCase() === "admin";
    if (!clients || clients.length === 0) {
        const columnas = esAdmin ? 8 : 9;
        tbodyClientes.innerHTML = `<tr><td colspan="${columnas}" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No se encontraron socios registrados</td></tr>`;
        return;
    }

    const canAdmin = esAdmin;

    clients.forEach(c => {
        const tr = document.createElement("tr");
        
        const aptoBadge = c.apto_medico_vigente 
            ? `<span class="badge badge-success"><i class="fa-solid fa-check"></i> Al día (${escapeHtml(c.fecha_vencimiento_apto) || 'Sin fecha'})</span>`
            : `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> Vencido / Falta</span>`;
            
        const estadoBadge = c.activo
            ? `<span class="badge badge-success">Activo</span>`
            : `<span class="badge badge-inactive">Inactivo</span>`;
        const pagoBadge = renderEstadoPago(c.fecha_vencimiento_cuota);
        let dirText = "-";
        if (c.direccion) {
            dirText = `${c.direccion.calle || ''} ${c.direccion.numero || ''} (${c.direccion.ciudad || ''})`.trim() || "-";
        }

        let actionBtnHtml = "";
        if (canAdmin) {
            actionBtnHtml = c.activo
                ? `<button class="btn-icon btn-icon-delete" data-dni="${escapeHtml(c.dni)}" title="Dar de baja al socio (borrado lógico)"><i class="fa-solid fa-user-slash"></i></button>`
                : `<button class="btn-icon btn-icon-reactivate" data-dni="${escapeHtml(c.dni)}" title="Reactivar socio"><i class="fa-solid fa-user-check"></i></button>`;
        }

        const avatarHtml = c.foto_url 
            ? `<img src="${escapeHtml(c.foto_url)}" class="avatar-cell-img" alt="Foto">`
            : `<div class="avatar-cell-placeholder"><i class="fa-solid fa-user"></i></div>`;

        tr.innerHTML = `
            <td><strong>${escapeHtml(c.dni)}</strong></td>
            <td>
                <div class="user-cell-flex">
                    ${avatarHtml}
                    <span>${escapeHtml(c.nombre)} ${escapeHtml(c.apellido)}</span>
                </div>
            </td>
            <td>${c.edad ? escapeHtml(c.edad) + ' años' : '-'}</td>
            ${esAdmin
                ? `<td>${pagoBadge}</td>`
                : `<td>${escapeHtml(c.email || c.telefono || '-')}</td><td>${escapeHtml(dirText)}</td>`}
            <td>${aptoBadge}</td>
            <td>${estadoBadge}</td>
            <td>${escapeHtml(c.fecha_alta)}</td>
            <td class="actions-col">
                <div class="table-actions">
                    <button class="btn-icon btn-icon-routine" data-dni="${escapeHtml(c.dni)}" title="Asignar / Modificar Rutina de Entrenamiento"><i class="fa-solid fa-dumbbell"></i></button>
                    <button class="btn-icon btn-icon-edit" data-dni="${escapeHtml(c.dni)}" title="Ver / Editar Ficha General"><i class="fa-solid fa-pen-to-square"></i></button>
                    ${actionBtnHtml}
                </div>
            </td>
        `;
        tbodyClientes.appendChild(tr);
    });

    tbodyClientes.querySelectorAll(".btn-icon-routine").forEach(btn => {
        btn.addEventListener("click", () => openClientModal("edit", btn.getAttribute("data-dni"), "tab-rutina"));
    });
    tbodyClientes.querySelectorAll(".btn-icon-edit").forEach(btn => {
        btn.addEventListener("click", () => openClientModal("edit", btn.getAttribute("data-dni"), "tab-general"));
    });
    tbodyClientes.querySelectorAll(".btn-icon-delete").forEach(btn => {
        btn.addEventListener("click", () => deleteClient(btn.getAttribute("data-dni")));
    });
    tbodyClientes.querySelectorAll(".btn-icon-reactivate").forEach(btn => {
        btn.addEventListener("click", () => reactivateClient(btn.getAttribute("data-dni")));
    });
}

export async function openClientModal(mode, dni = null, defaultTab = "tab-general") {
    state.editingDni = dni;
    if (formCliente) formCliente.reset();
    
    clientModalTabs.forEach(t => t.classList.remove("active"));
    clientModalPanels.forEach(p => p.classList.remove("active"));
    
    const activeTabBtn = document.querySelector(`#client-modal-tabs button[data-tab="${defaultTab}"]`) || clientModalTabs[0];
    const activePanel = document.getElementById(defaultTab) || clientModalPanels[0];
    
    if (activeTabBtn) activeTabBtn.classList.add("active");
    if (activePanel) activePanel.classList.add("active");

    const isTrainer = (state.currentUser?.rol || "").trim().toLowerCase() === "entrenador";
    const btnGuardarCliente = document.getElementById("btn-guardar-cliente");
    const readonlyNotice = document.getElementById("readonly-trainer-notice");

    if (mode === "create") {
        document.getElementById("modal-cliente-title").textContent = "Registrar Nuevo Socio";
        cDni.removeAttribute("disabled");
        cDni.disabled = false;
        cNombre.disabled = false;
        cApellido.disabled = false;
        cEdad.disabled = false;
        cEmail.disabled = false;
        cTelefono.disabled = false;
        cCalle.disabled = false;
        cNumero.disabled = false;
        cCiudad.disabled = false;
        cActivo.disabled = false;
        cActivo.checked = true;
        cApto.disabled = false;
        cApto.checked = false;
        cVencimiento.disabled = false;
        groupVencimientoApto.style.opacity = "0.4";
        groupVencimientoApto.style.pointerEvents = "none";
        
        if (btnGuardarCliente) btnGuardarCliente.classList.remove("hidden");
        if (readonlyNotice) readonlyNotice.classList.add("hidden");

        tabLinkRutina.style.display = "none";
        tabLinkEvFisica.style.display = "none";
        tabLinkEvDeportiva.style.display = "none";
        if (tabLinkPagos) tabLinkPagos.style.display = "none";

        if (groupPagoInicialTitle) groupPagoInicialTitle.style.display = "block";
        if (groupPagoMonto) groupPagoMonto.style.display = "block";
        if (groupPagoMetodo) groupPagoMetodo.style.display = "block";
        if (groupPagoMeses) groupPagoMeses.style.display = "block";
        if (groupPagoDescripcion) groupPagoDescripcion.style.display = "block";
        if (piMonto) piMonto.required = true;

        selectedClienteFotoFile = null;
        removeClienteFoto = false;
        if (cFotoFile) cFotoFile.value = "";
        if (cFotoUrl) cFotoUrl.value = "";
        if (cFotoPreview) cFotoPreview.src = DEFAULT_AVATAR_SVG;
        if (btnEliminarFotoCliente) btnEliminarFotoCliente.classList.add("hidden");
    } else {
        const client = (state.clientesData || []).find(c => String(c.dni) === String(dni));
        document.getElementById("modal-cliente-title").textContent = `Ficha del Socio: DNI ${dni}`;
        cDni.setAttribute("disabled", "true");
        cDni.disabled = true;
        
        tabLinkRutina.style.display = "block";
        tabLinkEvFisica.style.display = "block";
        tabLinkEvDeportiva.style.display = "block";
        if (tabLinkPagos) tabLinkPagos.style.display = "block";

        if (groupPagoInicialTitle) groupPagoInicialTitle.style.display = "none";
        if (groupPagoMonto) groupPagoMonto.style.display = "none";
        if (groupPagoMetodo) groupPagoMetodo.style.display = "none";
        if (groupPagoMeses) groupPagoMeses.style.display = "none";
        if (groupPagoDescripcion) groupPagoDescripcion.style.display = "none";
        if (piMonto) piMonto.required = false;

        const disableInputs = isTrainer;
        cNombre.disabled = disableInputs;
        cApellido.disabled = disableInputs;
        cEdad.disabled = disableInputs;
        cEmail.disabled = disableInputs;
        cTelefono.disabled = disableInputs;
        cCalle.disabled = disableInputs;
        cNumero.disabled = disableInputs;
        cCiudad.disabled = disableInputs;
        cActivo.disabled = disableInputs;
        cApto.disabled = disableInputs;
        cVencimiento.disabled = disableInputs;

        if (btnGuardarCliente) btnGuardarCliente.classList.toggle("hidden", isTrainer);
        if (readonlyNotice) readonlyNotice.classList.toggle("hidden", !isTrainer);

        selectedClienteFotoFile = null;
        removeClienteFoto = false;
        if (cFotoFile) cFotoFile.value = "";
        if (cFotoUrl) cFotoUrl.value = client?.foto_url || "";

        if (client) {
            cDni.value = client.dni;
            cNombre.value = client.nombre;
            cApellido.value = client.apellido;
            cEdad.value = client.edad || "";
            cEmail.value = client.email || "";
            cTelefono.value = client.telefono || "";
            cActivo.checked = client.activo;
            cApto.checked = client.apto_medico_vigente;
            cVencimiento.value = client.fecha_vencimiento_apto || "";

            if (cFotoPreview) {
                cFotoPreview.src = client.foto_url || DEFAULT_AVATAR_SVG;
            }
            if (btnEliminarFotoCliente) {
                btnEliminarFotoCliente.classList.toggle("hidden", !client.foto_url);
            }
            
            if (client.direccion) {
                cCalle.value = client.direccion.calle || "";
                cNumero.value = client.direccion.numero || "";
                cCiudad.value = client.direccion.ciudad || "";
            }

            if (cApto.checked) {
                groupVencimientoApto.style.opacity = "1";
                groupVencimientoApto.style.pointerEvents = "all";
            } else {
                groupVencimientoApto.style.opacity = "0.4";
                groupVencimientoApto.style.pointerEvents = "none";
            }
        }

        if (!state.cachedEjercicios || state.cachedEjercicios.length === 0) {
            await fetchEjerciciosAux();
        }

        fetchClientRutina(dni);
        fetchClientEvFisica(dni);
        fetchClientEvDeportiva(dni);
        fetchClientPagos(dni);
        fetchClientMembresia(dni);
    }
    
    if (modalCliente) modalCliente.classList.add("active", "open");
}

async function deleteClient(dni) {
    const client = state.clientesData.find(c => c.dni === dni);
    const nombre = client ? `${client.nombre} ${client.apellido}` : dni;
    if (!confirm(`¿Dar de baja al socio "${nombre}" (DNI: ${dni})?\nEl socio quedará inactivo pero todos sus datos y pagos se conservan en el sistema. Se puede reactivar luego.`)) return;

    const res = await ClientesService.deleteCliente(dni);
    if (res.ok) {
        showToast("Baja realizada", `"${nombre}" fue dado de baja. Sus datos se conservan en el sistema.`);
        fetchClientes();
    } else {
        showToast("Error", res.detail || "No se pudo dar de baja al socio", "error");
    }
}

async function reactivateClient(dni) {
    const client = state.clientesData.find(c => c.dni === dni);
    const nombre = client ? `${client.nombre} ${client.apellido}` : dni;
    if (!confirm(`¿Reactivar al socio "${nombre}" (DNI: ${dni})?`)) return;

    const res = await ClientesService.reactivateCliente(dni);
    if (res.ok) {
        showToast("Éxito", `"${nombre}" fue reactivado correctamente.`);
        fetchClientes();
    } else {
        showToast("Error", res.detail || "No se pudo reactivar el socio", "error");
    }
}

export function initClientesModule() {
    if (searchClientesInput) {
        searchClientesInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = state.clientesData.filter(c => 
                (c.dni || "").toLowerCase().includes(query) ||
                (c.nombre || "").toLowerCase().includes(query) ||
                (c.apellido || "").toLowerCase().includes(query)
            );
            renderClientes(filtered);
        });
    }

    if (toggleInactivosClientes) {
        toggleInactivosClientes.addEventListener("change", () => fetchClientes());
    }

    if (cDni) {
        cDni.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 8);
        });
    }

    if (cApto) {
        cApto.addEventListener("change", (e) => {
            if (e.target.checked) {
                groupVencimientoApto.style.opacity = "1";
                groupVencimientoApto.style.pointerEvents = "all";
            } else {
                groupVencimientoApto.style.opacity = "0.4";
                groupVencimientoApto.style.pointerEvents = "none";
                cVencimiento.value = "";
            }
        });
    }

    if (formCliente) {
        formCliente.addEventListener("submit", async (e) => {
            e.preventDefault();
            const role = (state.currentUser?.rol || "").trim().toLowerCase();
            if (role === "entrenador") {
                showToast("Advertencia", "Los entrenadores tienen acceso de solo lectura a la ficha general.", "warning");
                return;
            }

            const dniVal = cDni.value.trim();
            if (!state.editingDni) {
                if (!/^\d{7,8}$/.test(dniVal)) {
                    showToast("DNI Inválido", "El DNI debe contener exactamente 7 u 8 dígitos numéricos (sin puntos ni letras).", "error");
                    cDni.focus();
                    return;
                }
            }

            const payload = {
                dni: dniVal,
                nombre: cNombre.value.trim(),
                apellido: cApellido.value.trim(),
                edad: cEdad.value ? parseInt(cEdad.value) : null,
                email: cEmail.value.trim() || null,
                telefono: cTelefono.value.trim() || null,
                calle: cCalle.value.trim() || null,
                numero: cNumero.value.trim() || null,
                ciudad: cCiudad.value.trim() || null,
                activo: cActivo.checked,
                apto_medico_vigente: cApto.checked,
                fecha_vencimiento_apto: cApto.checked && cVencimiento.value ? cVencimiento.value : null
            };

            if (!state.editingDni) {
                const montoVal = parseFloat(piMonto ? piMonto.value : 0);
                if (!montoVal || montoVal <= 0) {
                    showToast("Error", "Debes ingresar el monto del pago inicial para registrar el socio.", "error");
                    return;
                }
                payload.primer_pago = {
                    monto: montoVal,
                    metodo_pago: piMetodo ? piMetodo.value : "Efectivo",
                    meses_abonados: piMeses ? parseInt(piMeses.value) || 1 : 1,
                    descripcion: piDescripcion ? piDescripcion.value.trim() || null : null,
                };
            }

            if (cFotoUrl && cFotoUrl.value.trim()) {
                payload.foto_url = parseGoogleDriveUrl(cFotoUrl.value.trim());
            }

            if (removeClienteFoto) {
                payload.foto_url = null;
            }

            const res = state.editingDni
                ? await ClientesService.updateCliente(state.editingDni, payload)
                : await ClientesService.createCliente(payload);

            if (res.ok) {
                const targetDni = state.editingDni || payload.dni;
                if (selectedClienteFotoFile) {
                    await ClientesService.uploadFotoDirecta(targetDni, selectedClienteFotoFile);
                }
                showToast("Éxito", state.editingDni 
                    ? "Datos del socio actualizados" 
                    : `Socio registrado. Cuenta autogenerada (Login: ${payload.dni}, Clave: clave1234)`);
                if (modalCliente) modalCliente.classList.remove("active");
                fetchClientes();
            } else {
                showToast("Error", res.detail || "No se pudo guardar el socio", "error");
            }
        });
    }

    // Eventos de Foto en Ficha (SOMA-09)
    const aplicarPreviewFotoUrl = () => {
        const raw = cFotoUrl?.value?.trim();
        if (!raw) return;
        const direct = parseGoogleDriveUrl(raw);
        selectedClienteFotoFile = null;
        removeClienteFoto = false;
        if (cFotoFile) cFotoFile.value = "";
        if (cFotoPreview) cFotoPreview.src = direct;
        if (btnEliminarFotoCliente) btnEliminarFotoCliente.classList.remove("hidden");
    };

    if (cFotoUrl) {
        cFotoUrl.addEventListener("input", () => {
            if (cFotoUrl.value.trim().length > 10) {
                aplicarPreviewFotoUrl();
            }
        });
        cFotoUrl.addEventListener("change", aplicarPreviewFotoUrl);
    }

    if (btnCFotoPreview) {
        btnCFotoPreview.addEventListener("click", (e) => {
            e.preventDefault();
            aplicarPreviewFotoUrl();
        });
    }

    if (cFotoFile) {
        cFotoFile.addEventListener("change", (e) => {
            const file = e.target.files?.[0];
            if (file) {
                selectedClienteFotoFile = file;
                removeClienteFoto = false;
                if (cFotoUrl) cFotoUrl.value = "";
                if (cFotoPreview) cFotoPreview.src = URL.createObjectURL(file);
                if (btnEliminarFotoCliente) btnEliminarFotoCliente.classList.remove("hidden");
            }
        });
    }

    if (btnEliminarFotoCliente) {
        btnEliminarFotoCliente.addEventListener("click", () => {
            selectedClienteFotoFile = null;
            removeClienteFoto = true;
            if (cFotoFile) cFotoFile.value = "";
            if (cFotoUrl) cFotoUrl.value = "";
            if (cFotoPreview) cFotoPreview.src = DEFAULT_AVATAR_SVG;
            btnEliminarFotoCliente.classList.add("hidden");
        });
    }

    if (btnSolicitudesFoto && modalSolicitudesFoto) {
        btnSolicitudesFoto.addEventListener("click", () => {
            modalSolicitudesFoto.classList.add("active");
            cargarYRenderizarSolicitudesFoto();
        });

        modalSolicitudesFoto.querySelectorAll(".modal-close").forEach(btn => {
            btn.addEventListener("click", () => {
                modalSolicitudesFoto.classList.remove("active", "open");
            });
        });
    }
}
