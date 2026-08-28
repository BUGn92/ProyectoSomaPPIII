/* ==========================================================================
   SOMA GYM - FRONTEND APPLICATION SCRIPT (SPA LOGIC)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // --- ESTADO GLOBAL ---
    let token = localStorage.getItem("soma_token") || null;
    let currentUser = JSON.parse(localStorage.getItem("soma_user")) || null;
    
    let activeSection = "clientes-section";
    let clientesData = [];
    let usuariosData = [];
    let editingDni = null; // Para edición de Cliente
    let editingUserId = null; // Para edición de Usuario

    // --- ELEMENTOS DOM ---
    const loginPage = document.getElementById("login-page");
    const dashboardPage = document.getElementById("dashboard-page");
    
    // Login Elements
    const loginForm = document.getElementById("login-form");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const togglePasswordBtn = document.getElementById("toggle-password");
    
    // Sidebar & Profile Elements
    const navItems = document.querySelectorAll(".sidebar-nav li");
    const currentUserNameSpan = document.getElementById("current-user-name");
    const currentUserRoleSpan = document.getElementById("current-user-role");
    const navUsuariosLi = document.getElementById("nav-usuarios-li");
    const btnLogout = document.getElementById("btn-logout");
    
    // Header actions
    const sectionTitle = document.getElementById("section-title");
    const sectionSubtitle = document.getElementById("section-subtitle");
    const btnActionAdd = document.getElementById("btn-action-add");
    const btnActionAddText = document.getElementById("btn-action-add-text");
    
    // Sections
    const crudSections = document.querySelectorAll(".crud-section");
    const clientesSection = document.getElementById("clientes-section");
    const usuariosSection = document.getElementById("usuarios-section");
    
    // Search boxes
    const searchClientesInput = document.getElementById("search-clientes");
    const searchUsuariosInput = document.getElementById("search-usuarios");
    
    // Tables body
    const tbodyClientes = document.getElementById("tbody-clientes");
    const tbodyUsuarios = document.getElementById("tbody-usuarios");
    
    // Modales
    const modalCliente = document.getElementById("modal-cliente");
    const modalUsuario = document.getElementById("modal-usuario");
    const modalCloses = document.querySelectorAll(".modal-close");
    
    // Formularios Modales
    const formCliente = document.getElementById("form-cliente");
    const formUsuario = document.getElementById("form-usuario");
    
    // Campos del formulario cliente
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

    // Campos del formulario usuario
    const uId = document.getElementById("u-id");
    const uNombre = document.getElementById("u-nombre");
    const uLogin = document.getElementById("u-login");
    const uPassword = document.getElementById("u-password");
    const uPasswordGroup = document.getElementById("u-password-group");
    const uRol = document.getElementById("u-rol");

    // Elementos de Pestañas de Evolución
    const tabLinks = document.querySelectorAll(".tab-link");
    const tabContentPanels = document.querySelectorAll(".tab-content-panel");
    const formEvFisica = document.getElementById("form-ev-fisica");
    const formEvDeportiva = document.getElementById("form-ev-deportiva");
    const selectEdEjercicio = document.getElementById("ed-ejercicio");
    const tbodyEvFisica = document.getElementById("tbody-ev-fisica");
    const tbodyEvDeportiva = document.getElementById("tbody-ev-deportiva");
    const tabLinkEvFisica = document.getElementById("tab-link-ev-fisica");
    const tabLinkEvDeportiva = document.getElementById("tab-link-ev-deportiva");

    // --- MANEJO DEL TOAST (NOTIFICACIONES) ---
    function showToast(title, message, type = "success") {
        const container = document.getElementById("toast-container");
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        
        let icon = "fa-circle-check";
        if (type === "error") icon = "fa-circle-xmark";
        if (type === "warning") icon = "fa-circle-exclamation";
        
        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        container.appendChild(toast);
        
        // Clic para cerrar
        toast.querySelector(".toast-close").addEventListener("click", () => {
            toast.style.transform = "translateX(120%)";
            setTimeout(() => toast.remove(), 300);
        });
        
        // Auto-eliminar después de 4 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.transform = "translateX(120%)";
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }

    // --- CONTROL DE ACCESO ---
    function initAuth() {
        if (token && currentUser) {
            // Mostrar Dashboard
            loginPage.classList.add("hidden");
            dashboardPage.classList.remove("hidden");
            
            // Cargar datos del perfil
            currentUserNameSpan.textContent = currentUser.nombre;
            currentUserRoleSpan.textContent = currentUser.rol;
            
            // Si es Admin, mostrar pestaña de Usuarios, si no ocultarla
            if (currentUser.rol.toLowerCase() === "admin") {
                navUsuariosLi.classList.remove("hidden");
            } else {
                navUsuariosLi.classList.add("hidden");
                // Si la sección activa es de usuarios y no es admin, forzar cambio
                if (activeSection === "usuarios-section") {
                    switchSection("clientes-section");
                }
            }
            
            // Cargar datos
            fetchData();
        } else {
            // Mostrar Login
            loginPage.classList.remove("hidden");
            dashboardPage.classList.add("hidden");
            // Limpiar datos
            localStorage.removeItem("soma_token");
            localStorage.removeItem("soma_user");
            token = null;
            currentUser = null;
        }
    }

    // Toggle de visibilidad de password
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener("click", () => {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            const icon = togglePasswordBtn.querySelector("i");
            if (type === "text") {
                icon.classList.replace("fa-eye", "fa-eye-slash");
            } else {
                icon.classList.replace("fa-eye-slash", "fa-eye");
            }
        });
    }

    // Envío del Login
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario_login: username, password: password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                token = data.access_token;
                currentUser = data.usuario;
                localStorage.setItem("soma_token", token);
                localStorage.setItem("soma_user", JSON.stringify(currentUser));
                
                showToast("Acceso Concedido", `Bienvenido de nuevo, ${currentUser.nombre}.`);
                initAuth();
            } else {
                showToast("Acceso Denegado", data.detail || "Usuario o contraseña inválidos", "error");
            }
        } catch (err) {
            showToast("Error de Conexión", "No se pudo conectar con el servidor", "error");
            console.error(err);
        }
    });

    // Logout
    btnLogout.addEventListener("click", () => {
        token = null;
        currentUser = null;
        initAuth();
        showToast("Sesión Cerrada", "Has salido del sistema de manera segura.");
    });

    // --- ENRUTAMIENTO SPA ---
    function switchSection(sectionId) {
        activeSection = sectionId;
        
        // Quitar activos de nav
        navItems.forEach(item => item.classList.remove("active"));
        const targetNav = document.querySelector(`.sidebar-nav li[data-target="${sectionId}"]`);
        if (targetNav) targetNav.classList.add("active");
        
        // Mostrar sección correcta
        crudSections.forEach(sec => sec.classList.add("hidden"));
        document.getElementById(sectionId).classList.remove("hidden");
        
        // Actualizar headers y botones según la sección
        if (sectionId === "clientes-section") {
            sectionTitle.textContent = "Gestión de Clientes";
            sectionSubtitle.textContent = "Alta, baja y modificación de socios de SOMA.";
            btnActionAddText.textContent = "Nuevo Cliente";
            btnActionAdd.classList.remove("hidden");
        } else if (sectionId === "usuarios-section") {
            sectionTitle.textContent = "Usuarios del Sistema";
            sectionSubtitle.textContent = "Administración de cuentas del personal (Admin, Recepcionista, Entrenador).";
            btnActionAddText.textContent = "Nuevo Usuario";
            
            // Solo los Admins pueden agregar usuarios
            if (currentUser.rol.toLowerCase() === "admin") {
                btnActionAdd.classList.remove("hidden");
            } else {
                btnActionAdd.classList.add("hidden");
            }
        }
    }

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const target = item.getAttribute("data-target");
            switchSection(target);
        });
    });

    // --- CONSUMO DE API (FETCH) ---
    async function apiFetch(url, options = {}) {
        options.headers = options.headers || {};
        if (token) {
            options.headers["Authorization"] = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(url, options);
            if (response.status === 401) {
                // Token expirado o inválido
                token = null;
                currentUser = null;
                initAuth();
                showToast("Sesión Expirada", "Por favor ingresa de nuevo.", "warning");
                return null;
            }
            return response;
        } catch (err) {
            showToast("Error de Red", "Fallo al comunicar con la API.", "error");
            console.error(err);
            return null;
        }
    }

    async function fetchData() {
        if (activeSection === "clientes-section") {
            await loadClientes();
        } else if (activeSection === "usuarios-section") {
            await loadUsuarios();
        }
    }

    // Cargar Clientes
    async function loadClientes() {
        const response = await apiFetch("/api/clientes/");
        if (response && response.ok) {
            clientesData = await response.json();
            renderClientes(clientesData);
        }
    }

    // Cargar Usuarios
    async function loadUsuarios() {
        const response = await apiFetch("/api/usuarios/");
        if (response && response.ok) {
            usuariosData = await response.json();
            renderUsuarios(usuariosData);
        }
    }

    // --- RENDERIZACIÓN DE TABLAS ---
    function renderClientes(data) {
        tbodyClientes.innerHTML = "";
        
        if (data.length === 0) {
            tbodyClientes.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-secondary);">No se encontraron clientes registrados.</td></tr>`;
            return;
        }
        
        data.forEach(c => {
            const tr = document.createElement("tr");
            
            // Nombre Completo
            const fullName = `${c.nombre} ${c.apellido}`;
            
            // Contacto
            const contact = `
                <div><i class="fa-solid fa-envelope" style="font-size: 0.8rem; color: var(--text-secondary); margin-right: 4px;"></i> ${c.email || '-'}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px;"><i class="fa-solid fa-phone" style="font-size: 0.75rem; margin-right: 4px;"></i> ${c.telefono || '-'}</div>
            `;
            
            // Dirección
            let addressStr = "-";
            if (c.direccion) {
                const parts = [];
                if (c.direccion.calle) parts.push(c.direccion.calle);
                if (c.direccion.numero) parts.push(c.direccion.numero);
                if (c.direccion.ciudad) parts.push(c.direccion.ciudad);
                addressStr = parts.join(", ");
            }
            
            // Apto Médico Badge
            const aptoBadge = c.apto_medico_vigente 
                ? `<span class="badge badge-success"><i class="fa-solid fa-heart-pulse"></i> Sí</span>`
                : `<span class="badge badge-danger"><i class="fa-solid fa-circle-exclamation"></i> Vencido/Falta</span>`;
                
            // Vencimiento Apto fecha formateada
            let vencimientoStr = "";
            if (c.fecha_vencimiento_apto) {
                vencimientoStr = `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Vence: ${c.fecha_vencimiento_apto}</div>`;
            }
            
            // Estado Badge
            const statusBadge = c.activo 
                ? `<span class="badge badge-success">Activo</span>`
                : `<span class="badge badge-danger">Inactivo</span>`;
                
            // Acciones habilitadas
            let actionButtons = `
                <div class="table-actions">
                    <button class="btn-icon btn-icon-edit" data-id="${c.dni}" title="Editar Cliente"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon btn-icon-delete" data-id="${c.dni}" title="Eliminar Cliente"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            
            tr.innerHTML = `
                <td style="font-weight: 600;">${c.dni}</td>
                <td style="font-weight: 500;">${fullName}</td>
                <td>${c.edad || '-'}</td>
                <td>${contact}</td>
                <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${addressStr}</td>
                <td>
                    ${aptoBadge}
                    ${vencimientoStr}
                </td>
                <td>${statusBadge}</td>
                <td style="font-size: 0.85rem; color: var(--text-secondary);">${c.fecha_alta}</td>
                <td>${actionButtons}</td>
            `;
            
            // Vincular eventos a los botones de acción
            tr.querySelector(".btn-icon-edit").addEventListener("click", () => openEditClienteModal(c));
            tr.querySelector(".btn-icon-delete").addEventListener("click", () => deleteCliente(c.dni, fullName));
            
            tbodyClientes.appendChild(tr);
        });
    }

    function renderUsuarios(data) {
        tbodyUsuarios.innerHTML = "";
        
        if (data.length === 0) {
            tbodyUsuarios.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No se encontraron usuarios.</td></tr>`;
            return;
        }
        
        data.forEach(u => {
            const tr = document.createElement("tr");
            
            // Rol Badge
            let roleClass = "badge-warning";
            if (u.rol.toLowerCase() === "admin") roleClass = "badge-success";
            else if (u.rol.toLowerCase() === "recepcionista") roleClass = "badge-success";
            
            const roleBadge = `<span class="badge ${roleClass}">${u.rol}</span>`;
            
            // Acciones habilitadas solo para administradores
            let actionButtons = "-";
            if (currentUser.rol.toLowerCase() === "admin") {
                actionButtons = `
                    <div class="table-actions">
                        <button class="btn-icon btn-icon-edit" data-id="${u.id_usuario}" title="Editar Usuario"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn-icon btn-icon-delete" data-id="${u.id_usuario}" title="Eliminar Usuario" ${u.id_usuario === currentUser.id_usuario ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                `;
            }
            
            tr.innerHTML = `
                <td>${u.id_usuario}</td>
                <td style="font-weight: 500;">${u.nombre}</td>
                <td style="font-weight: 600; color: var(--primary);">${u.usuario_login}</td>
                <td>${roleBadge}</td>
                <td>${actionButtons}</td>
            `;
            
            if (currentUser.rol.toLowerCase() === "admin") {
                tr.querySelector(".btn-icon-edit").addEventListener("click", () => openEditUsuarioModal(u));
                if (u.id_usuario !== currentUser.id_usuario) {
                    tr.querySelector(".btn-icon-delete").addEventListener("click", () => deleteUsuario(u.id_usuario, u.nombre));
                }
            }
            
            tbodyUsuarios.appendChild(tr);
        });
    }

    // --- FILTRADOS DINAÁMICOS (SEARCH) ---
    searchClientesInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        if (!term) {
            renderClientes(clientesData);
            return;
        }
        const filtered = clientesData.filter(c => 
            c.dni.toLowerCase().includes(term) || 
            c.nombre.toLowerCase().includes(term) || 
            c.apellido.toLowerCase().includes(term)
        );
        renderClientes(filtered);
    });

    searchUsuariosInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        if (!term) {
            renderUsuarios(usuariosData);
            return;
        }
        const filtered = usuariosData.filter(u => 
            u.nombre.toLowerCase().includes(term) || 
            u.usuario_login.toLowerCase().includes(term)
        );
        renderUsuarios(filtered);
    });

    // --- MANEJO DE MODALES ---
    btnActionAdd.addEventListener("click", () => {
        if (activeSection === "clientes-section") {
            openCreateClienteModal();
        } else if (activeSection === "usuarios-section") {
            openCreateUsuarioModal();
        }
    });

    modalCloses.forEach(close => {
        close.addEventListener("click", () => {
            closeModals();
        });
    });

    // Ocultar campo de vencimiento de apto si el checkbox de apto no está seleccionado
    if (cApto) {
        cApto.addEventListener("change", (e) => {
            if (e.target.checked) {
                groupVencimientoApto.style.display = "block";
            } else {
                groupVencimientoApto.style.display = "none";
                cVencimiento.value = "";
            }
        });
    }

    // --- MANEJO DE PESTAÑAS DENTRO DEL MODAL CLIENTE ---
    function selectModalTab(tabId) {
        tabLinks.forEach(link => {
            if (link.getAttribute("data-tab") === tabId) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });

        tabContentPanels.forEach(panel => {
            if (panel.id === tabId) {
                panel.classList.add("active");
            } else {
                panel.classList.remove("active");
            }
        });
    }

    tabLinks.forEach(link => {
        link.addEventListener("click", () => {
            const targetTab = link.getAttribute("data-tab");
            selectModalTab(targetTab);
        });
    });

    function closeModals() {
        modalCliente.classList.remove("open");
        modalUsuario.classList.remove("open");
        
        // Limpiar formularios
        formCliente.reset();
        formUsuario.reset();
        formEvFisica.reset();
        formEvDeportiva.reset();
        
        editingDni = null;
        editingUserId = null;
    }

    // Modal Cliente: Crear
    function openCreateClienteModal() {
        editingDni = null;
        formCliente.reset();
        
        // Habilitar campo DNI para creación
        cDni.disabled = false;
        
        groupVencimientoApto.style.display = "none";
        document.getElementById("modal-cliente-title").textContent = "Registrar Nuevo Cliente";
        
        // Ocultar pestañas de evolución en creación
        tabLinkEvFisica.classList.add("hidden");
        tabLinkEvDeportiva.classList.add("hidden");
        
        // Activar la pestaña general por defecto
        selectModalTab("tab-general");
        
        modalCliente.classList.add("open");
    }

    // Modal Cliente: Editar
    async function openEditClienteModal(cliente) {
        editingDni = cliente.dni;
        formCliente.reset();
        formEvFisica.reset();
        formEvDeportiva.reset();
        
        // Deshabilitar DNI ya que es llave primaria y no se edita directamente
        cDni.disabled = true;
        
        // Rellenar campos
        cDni.value = cliente.dni;
        cNombre.value = cliente.nombre;
        cApellido.value = cliente.apellido;
        cEdad.value = cliente.edad || "";
        cEmail.value = cliente.email || "";
        cTelefono.value = cliente.telefono || "";
        
        if (cliente.direccion) {
            cCalle.value = cliente.direccion.calle || "";
            cNumero.value = cliente.direccion.numero || "";
            cCiudad.value = cliente.direccion.ciudad || "";
        }
        
        cActivo.checked = cliente.activo;
        cApto.checked = cliente.apto_medico_vigente;
        
        if (cliente.apto_medico_vigente) {
            groupVencimientoApto.style.display = "block";
            cVencimiento.value = cliente.fecha_vencimiento_apto || "";
        } else {
            groupVencimientoApto.style.display = "none";
        }
        
        document.getElementById("modal-cliente-title").textContent = "Editar Ficha de Cliente";
        
        // Mostrar pestañas de evolución al editar
        tabLinkEvFisica.classList.remove("hidden");
        tabLinkEvDeportiva.classList.remove("hidden");
        
        // Activar pestaña general por defecto al abrir
        selectModalTab("tab-general");
        
        // Cargar históricos
        loadEvolucionFisica(cliente.dni);
        loadEvolucionDeportiva(cliente.dni);
        loadEjercicios();
        
        // Colocar fecha de hoy por defecto en los formularios de evolución
        const todayStr = new Date().toISOString().split('T')[0];
        document.getElementById("ef-fecha").value = todayStr;
        document.getElementById("ed-fecha").value = todayStr;
        
        modalCliente.classList.add("open");
    }

    // --- CARGAR EVOLUCIÓN DESDE LA API ---
    async function loadEvolucionFisica(dni) {
        tbodyEvFisica.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">Cargando...</td></tr>`;
        const response = await apiFetch(`/api/clientes/${dni}/evolucion-fisica`);
        if (response && response.ok) {
            const data = await response.json();
            tbodyEvFisica.innerHTML = "";
            if (data.length === 0) {
                tbodyEvFisica.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No se registran mediciones.</td></tr>`;
                return;
            }
            data.forEach(item => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td style="font-weight:600;">${item.fecha_medicion}</td>
                    <td style="font-weight:500; color: var(--primary);">${parseFloat(item.peso_kg).toFixed(2)} kg</td>
                    <td>${item.porcentaje_grasa ? parseFloat(item.porcentaje_grasa).toFixed(2) + ' %' : '-'}</td>
                    <td style="font-style: italic; color: var(--text-secondary);">${item.observaciones || '-'}</td>
                `;
                tbodyEvFisica.appendChild(tr);
            });
        }
    }

    async function loadEvolucionDeportiva(dni) {
        tbodyEvDeportiva.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Cargando...</td></tr>`;
        const response = await apiFetch(`/api/clientes/${dni}/registro-entrenamiento`);
        if (response && response.ok) {
            const data = await response.json();
            tbodyEvDeportiva.innerHTML = "";
            if (data.length === 0) {
                tbodyEvDeportiva.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No se registran cargas logradas.</td></tr>`;
                return;
            }
            data.forEach(item => {
                const tr = document.createElement("tr");
                const exName = item.ejercicio ? item.ejercicio.nombre_ejercicio : `Ejercicio #${item.id_ejercicio}`;
                const exGroup = item.ejercicio ? item.ejercicio.grupo_muscular : '-';
                tr.innerHTML = `
                    <td style="font-weight:600;">${item.fecha_entrenamiento}</td>
                    <td style="font-weight:500;">${exName}</td>
                    <td style="color: var(--text-secondary); font-size:0.85rem;">${exGroup}</td>
                    <td style="font-weight:600; color: var(--primary);">${parseFloat(item.carga_real).toFixed(2)} kg</td>
                    <td style="font-weight:600;">${item.repeticiones_logradas} reps</td>
                `;
                tbodyEvDeportiva.appendChild(tr);
            });
        }
    }

    let ejerciciosCargados = false;
    async function loadEjercicios() {
        if (ejerciciosCargados) return;
        const response = await apiFetch("/api/clientes/aux/ejercicios");
        if (response && response.ok) {
            const data = await response.json();
            selectEdEjercicio.innerHTML = `<option value="" disabled selected>Selecciona un ejercicio...</option>`;
            data.forEach(ex => {
                const option = document.createElement("option");
                option.value = ex.id_ejercicio;
                option.textContent = `${ex.nombre_ejercicio} (${ex.grupo_muscular})`;
                selectEdEjercicio.appendChild(option);
            });
            ejerciciosCargados = true;
        }
    }

    // --- ENVIAR NUEVOS REGISTROS DE EVOLUCIÓN ---
    formEvFisica.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!editingDni) return;
        
        const payload = {
            fecha_medicion: document.getElementById("ef-fecha").value,
            peso_kg: parseFloat(document.getElementById("ef-peso").value),
            porcentaje_grasa: document.getElementById("ef-grasa").value ? parseFloat(document.getElementById("ef-grasa").value) : null,
            observaciones: document.getElementById("ef-obs").value.trim() || null
        };
        
        const response = await apiFetch(`/api/clientes/${editingDni}/evolucion-fisica`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (response && response.ok) {
            showToast("Medición Guardada", "Se ha añadido el registro antropométrico con éxito.");
            formEvFisica.reset();
            const todayStr = new Date().toISOString().split('T')[0];
            document.getElementById("ef-fecha").value = todayStr;
            loadEvolucionFisica(editingDni);
            loadClientes(); // Recargar tabla general de clientes por si cambió el peso/grasa
        } else if (response) {
            const data = await response.json();
            showToast("Error", data.detail || "No se pudo guardar la medición física.", "error");
        }
    });

    formEvDeportiva.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!editingDni) return;
        
        const payload = {
            fecha_entrenamiento: document.getElementById("ed-fecha").value,
            id_ejercicio: parseInt(selectEdEjercicio.value),
            carga_real: parseFloat(document.getElementById("ed-carga").value),
            repeticiones_logradas: parseInt(document.getElementById("ed-reps").value)
        };
        
        const response = await apiFetch(`/api/clientes/${editingDni}/registro-entrenamiento`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (response && response.ok) {
            showToast("Carga Guardada", "Se ha registrado la carga de rutina con éxito.");
            formEvDeportiva.reset();
            const todayStr = new Date().toISOString().split('T')[0];
            document.getElementById("ed-fecha").value = todayStr;
            loadEvolucionDeportiva(editingDni);
        } else if (response) {
            const data = await response.json();
            showToast("Error", data.detail || "No se pudo guardar el registro deportivo.", "error");
        }
    });

    // Modal Usuario: Crear
    function openCreateUsuarioModal() {
        editingUserId = null;
        formUsuario.reset();
        
        // Requerir password en creación
        uPassword.required = true;
        uPasswordGroup.style.display = "flex";
        
        document.getElementById("modal-usuario-title").textContent = "Nuevo Usuario del Sistema";
        modalUsuario.classList.add("open");
    }

    // Modal Usuario: Editar
    function openEditUsuarioModal(usuario) {
        editingUserId = usuario.id_usuario;
        formUsuario.reset();
        
        // Llenar campos
        uId.value = usuario.id_usuario;
        uNombre.value = usuario.nombre;
        uLogin.value = usuario.usuario_login;
        uRol.value = usuario.rol;
        
        // No requerir password al editar (dejar vacío si no se cambia)
        uPassword.required = false;
        
        document.getElementById("modal-usuario-title").textContent = "Editar Datos de Usuario";
        modalUsuario.classList.add("open");
    }

    // --- ACCIONES CRUD CLIENTE ---
    formCliente.addEventListener("submit", async (e) => {
        e.preventDefault();
        
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
        
        let url = "/api/clientes/";
        let method = "POST";
        
        if (editingDni) {
            url = `/api/clientes/${editingDni}`;
            method = "PUT";
            // Eliminar DNI del payload de actualización
            delete payload.dni;
        }
        
        try {
            const response = await apiFetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            if (response && response.ok) {
                showToast("Acción Exitosa", editingDni ? "Se actualizaron los datos del cliente correctamente." : "Cliente registrado exitosamente.");
                closeModals();
                loadClientes();
            } else if (response) {
                const data = await response.json();
                showToast("Error", data.detail || "Ocurrió un error al guardar los datos.", "error");
            }
        } catch (err) {
            console.error(err);
        }
    });

    async function deleteCliente(dni, fullName) {
        if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente al cliente ${fullName}?\nEsta acción no se puede deshacer y eliminará también su dirección asociada.`)) {
            return;
        }
        
        try {
            const response = await apiFetch(`/api/clientes/${dni}`, { method: "DELETE" });
            if (response && response.ok) {
                showToast("Cliente Eliminado", `Se ha dado de baja permanentemente a ${fullName}.`);
                loadClientes();
            } else if (response) {
                const data = await response.json();
                showToast("Error", data.detail || "No se pudo eliminar al cliente.", "error");
            }
        } catch (err) {
            console.error(err);
        }
    }

    // --- ACCIONES CRUD USUARIO ---
    formUsuario.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const payload = {
            nombre: uNombre.value.trim(),
            usuario_login: uLogin.value.trim(),
            rol: uRol.value
        };
        
        if (uPassword.value) {
            payload.password = uPassword.value;
        }
        
        let url = "/api/usuarios/";
        let method = "POST";
        
        if (editingUserId) {
            url = `/api/usuarios/${editingUserId}`;
            method = "PUT";
        }
        
        try {
            const response = await apiFetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            if (response && response.ok) {
                showToast("Guardado", editingUserId ? "Datos de usuario modificados." : "Nuevo usuario creado con éxito.");
                closeModals();
                loadUsuarios();
            } else if (response) {
                const data = await response.json();
                showToast("Error", data.detail || "No se pudieron guardar los datos.", "error");
            }
        } catch (err) {
            console.error(err);
        }
    });

    async function deleteUsuario(id, nombre) {
        if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario ${nombre}?`)) {
            return;
        }
        
        try {
            const response = await apiFetch(`/api/usuarios/${id}`, { method: "DELETE" });
            if (response && response.ok) {
                showToast("Usuario Eliminado", `El usuario ${nombre} ha sido eliminado del sistema.`);
                loadUsuarios();
            } else if (response) {
                const data = await response.json();
                showToast("Error", data.detail || "No se pudo eliminar al usuario.", "error");
            }
        } catch (err) {
            console.error(err);
        }
    }

    // --- INICIALIZACIÓN ---
    initAuth();
});
