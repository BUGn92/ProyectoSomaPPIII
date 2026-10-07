/* ==========================================================================
   MÓDULO DE GESTIÓN DE PERSONAL / USUARIOS (SOLO ADMINISTRADOR)
   ========================================================================== */

import { state } from "../state.js";
import { UsuariosService } from "../services/usuarios.service.js";
import { showToast } from "../utils/toast.js";
import { escapeHtml } from "../utils/sanitizer.js";

const tbodyUsuarios = document.getElementById("tbody-usuarios");
const searchUsuariosInput = document.getElementById("search-usuarios");
const toggleInactivos = document.getElementById("toggle-inactivos");

const modalUsuario = document.getElementById("modal-usuario");
const formUsuario = document.getElementById("form-usuario");
const uId = document.getElementById("u-id");
const uNombre = document.getElementById("u-nombre");
const uLogin = document.getElementById("u-login");
const uPassword = document.getElementById("u-password");
const uPasswordGroup = document.getElementById("u-password-group");
const uRol = document.getElementById("u-rol");

export async function fetchUsuarios() {
    const incluirInactivos = toggleInactivos && toggleInactivos.checked;
    const res = await UsuariosService.getUsuarios(incluirInactivos);
    if (res.ok) {
        state.usuariosData = res.data || [];
        renderUsuarios(state.usuariosData);
    } else {
        showToast("Error", res.detail || "No se pudo cargar la lista de usuarios", "error");
    }
}

export function renderUsuarios(users) {
    if (!tbodyUsuarios) return;
    tbodyUsuarios.innerHTML = "";

    if (!users || users.length === 0) {
        tbodyUsuarios.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No hay usuarios registrados</td></tr>`;
        return;
    }

    users.forEach(u => {
        const tr = document.createElement("tr");
        let badgeClass = "badge-primary";
        const rolLower = (u.rol || "").toLowerCase();
        if (rolLower === "admin") badgeClass = "badge-success";
        if (rolLower === "cliente") badgeClass = "badge-inactive";
        if (rolLower === "secretaria" || rolLower === "recepcionista") badgeClass = "badge-warning";

        const esActivo = u.activo !== false;
        const estadoBadge = esActivo
            ? `<span class="badge badge-success">Activo</span>`
            : `<span class="badge badge-inactive">Inactivo</span>`;

        let pagoBadge = `<span style="color: var(--text-secondary); font-size: 0.8rem;">—</span>`;
        if (rolLower === "cliente" && u.estado_pago) {
            const estadoPago = u.estado_pago;
            let pagoClass = "badge-primary";
            let pagoIcon = "fa-circle-check";
            if (estadoPago === "Vencido") {
                pagoClass = "badge-danger";
                pagoIcon = "fa-circle-exclamation";
            } else if (estadoPago === "Sin membresía") {
                pagoClass = "badge-inactive";
                pagoIcon = "fa-circle-minus";
            } else if (estadoPago === "Al día") {
                pagoClass = "badge-success";
                pagoIcon = "fa-circle-check";
            }
            const vencTxt = u.fecha_vencimiento_cuota
                ? ` <small style="opacity:0.75;">(vence: ${escapeHtml(u.fecha_vencimiento_cuota)})</small>`
                : "";
            pagoBadge = `<span class="badge ${pagoClass}"><i class="fa-solid ${pagoIcon}"></i> ${escapeHtml(estadoPago)}</span>${vencTxt}`;
        }

        const accionBtn = esActivo
            ? `<button type="button" class="btn-icon btn-icon-delete btn-delete" data-id="${u.id_usuario}" title="Dar de baja (borrado lógico)" aria-label="Dar de baja a ${escapeHtml(u.nombre)}"><i class="fa-solid fa-user-slash"></i></button>`
            : `<button type="button" class="btn-icon btn-icon-reactivate btn-reactivate" data-id="${u.id_usuario}" title="Reactivar usuario" aria-label="Reactivar a ${escapeHtml(u.nombre)}"><i class="fa-solid fa-user-check"></i></button>`;

        tr.innerHTML = `
            <td><strong>#${escapeHtml(u.id_usuario)}</strong></td>
            <td>${escapeHtml(u.nombre)}</td>
            <td><code>${escapeHtml(u.usuario_login)}</code></td>
            <td><span class="badge ${badgeClass}">${escapeHtml(u.rol)}</span></td>
            <td>${estadoBadge}</td>
            <td>${pagoBadge}</td>
            <td class="actions-col">
                <div class="table-actions">
                    <button type="button" class="btn-icon btn-icon-edit btn-edit" data-id="${u.id_usuario}" title="Editar Usuario" aria-label="Editar a ${escapeHtml(u.nombre)}"><i class="fa-solid fa-pen-to-square"></i></button>
                    ${accionBtn}
                </div>
            </td>
        `;
        tbodyUsuarios.appendChild(tr);
    });

    tbodyUsuarios.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", () => openUserModal("edit", parseInt(btn.getAttribute("data-id"))));
    });
    tbodyUsuarios.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", () => deleteUser(parseInt(btn.getAttribute("data-id"))));
    });
    tbodyUsuarios.querySelectorAll(".btn-reactivate").forEach(btn => {
        btn.addEventListener("click", () => reactivateUser(parseInt(btn.getAttribute("data-id"))));
    });
}

export function openUserModal(mode, id = null) {
    state.editingUserId = id;
    if (formUsuario) formUsuario.reset();
    
    if (mode === "create") {
        document.getElementById("modal-usuario-title").textContent = "Nuevo Usuario";
        if (uPasswordGroup) uPasswordGroup.classList.remove("hidden");
        if (uPassword) uPassword.setAttribute("required", "true");
    } else {
        document.getElementById("modal-usuario-title").textContent = `Editar Usuario #${id}`;
        if (uPasswordGroup) uPasswordGroup.classList.add("hidden");
        if (uPassword) uPassword.removeAttribute("required");

        const user = state.usuariosData.find(u => u.id_usuario === id);
        if (user) {
            uId.value = user.id_usuario;
            uNombre.value = user.nombre;
            uLogin.value = user.usuario_login;
            uRol.value = user.rol;
        }
    }
    if (modalUsuario) modalUsuario.classList.add("active", "open");
}

async function deleteUser(id) {
    if (id === state.currentUser?.id_usuario) {
        showToast("Advertencia", "No puedes dar de baja tu propio usuario en sesión.", "warning");
        return;
    }
    const user = state.usuariosData.find(u => u.id_usuario === id);
    const nombre = user ? user.nombre : `#${id}`;
    if (!confirm(`¿Dar de baja a "${nombre}"?\nEl usuario quedará inactivo y no podrá iniciar sesión, pero sus datos se conservan en la base de datos.`)) return;

    const res = await UsuariosService.deleteUsuario(id);
    if (res.ok) {
        showToast("Baja realizada", `"${nombre}" fue dado de baja correctamente.`);
        fetchUsuarios();
    } else {
        showToast("Error", res.detail || "No se pudo dar de baja al usuario", "error");
    }
}

async function reactivateUser(id) {
    const user = state.usuariosData.find(u => u.id_usuario === id);
    const nombre = user ? user.nombre : `#${id}`;
    if (!confirm(`¿Reactivar a "${nombre}"?\nEl usuario podrá volver a iniciar sesión.`)) return;

    const res = await UsuariosService.reactivateUsuario(id);
    if (res.ok) {
        showToast("Éxito", `"${nombre}" fue reactivado correctamente.`);
        fetchUsuarios();
    } else {
        showToast("Error", res.detail || "No se pudo reactivar", "error");
    }
}

export function initUsuariosModule() {
    if (searchUsuariosInput) {
        searchUsuariosInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = state.usuariosData.filter(u => 
                (u.nombre || "").toLowerCase().includes(query) ||
                (u.usuario_login || "").toLowerCase().includes(query)
            );
            renderUsuarios(filtered);
        });
    }

    if (toggleInactivos) {
        toggleInactivos.addEventListener("change", () => fetchUsuarios());
    }

    if (formUsuario) {
        formUsuario.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
                nombre: uNombre.value.trim(),
                usuario_login: uLogin.value.trim(),
                rol: uRol.value
            };

            if (!state.editingUserId) {
                payload.password = uPassword.value;
            }

            const res = state.editingUserId
                ? await UsuariosService.updateUsuario(state.editingUserId, payload)
                : await UsuariosService.createUsuario(payload);

            if (res.ok) {
                showToast("Éxito", state.editingUserId ? "Usuario actualizado" : "Usuario creado con éxito");
                if (modalUsuario) modalUsuario.classList.remove("active", "open");
                fetchUsuarios();
            } else {
                showToast("Error", res.detail || "No se pudo guardar el usuario", "error");
            }
        });
    }
}
