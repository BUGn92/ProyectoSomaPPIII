/* ==========================================================================
   MÓDULO DE GESTIÓN DE CLIENTES / SOCIOS (PANEL STAFF)
   ========================================================================== */

import { state } from "../state.js";
import { ClientesService } from "../services/clientes.service.js";
import { showToast } from "../utils/toast.js";
import { escapeHtml } from "../utils/sanitizer.js";

import { fetchClientRutina, fetchEjerciciosAux } from "./rutinas.module.js";
import { fetchClientEvFisica, fetchClientEvDeportiva } from "./evolucion.module.js";
import { fetchClientPagos, fetchClientMembresia } from "./pagos.module.js";

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
    } else {
        showToast("Error", res.detail || "No se pudo cargar la lista de socios", "error");
    }
}

export function renderClientes(clients) {
    if (!tbodyClientes) return;
    tbodyClientes.innerHTML = "";

    if (!clients || clients.length === 0) {
        tbodyClientes.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No se encontraron socios registrados</td></tr>`;
        return;
    }

    const canAdmin = (state.currentUser?.rol || "").toLowerCase() === "admin";

    clients.forEach(c => {
        const tr = document.createElement("tr");
        
        const aptoBadge = c.apto_medico_vigente 
            ? `<span class="badge badge-success"><i class="fa-solid fa-check"></i> Al día (${escapeHtml(c.fecha_vencimiento_apto) || 'Sin fecha'})</span>`
            : `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> Vencido / Falta</span>`;
            
        const estadoBadge = c.activo
            ? `<span class="badge badge-success">Activo</span>`
            : `<span class="badge badge-inactive">Inactivo</span>`;
            
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

        tr.innerHTML = `
            <td><strong>${escapeHtml(c.dni)}</strong></td>
            <td>${escapeHtml(c.nombre)} ${escapeHtml(c.apellido)}</td>
            <td>${c.edad ? escapeHtml(c.edad) + ' años' : '-'}</td>
            <td>${escapeHtml(c.email || c.telefono || '-')}</td>
            <td>${escapeHtml(dirText)}</td>
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
    } else {
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

        const client = state.clientesData.find(c => c.dni === dni);
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

            const payload = {
                dni: cDni.value.trim(),
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

            const res = state.editingDni
                ? await ClientesService.updateCliente(state.editingDni, payload)
                : await ClientesService.createCliente(payload);

            if (res.ok) {
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
}
