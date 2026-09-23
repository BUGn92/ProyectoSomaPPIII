/* ==========================================================================
   SOMA GYM - FRONTEND APPLICATION SCRIPT (SPA LOGIC)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // --- ESTADO GLOBAL ---
    let token = localStorage.getItem("soma_token") || null;
    let currentUser = JSON.parse(localStorage.getItem("soma_user")) || null;
    
    let activeSection = "clientes-section";
    let activePortalTab = "socio-tab-rutina";
    let clientesData = [];
    let usuariosData = [];
    let noticiasData = [];
    let cachedEjercicios = [];
    
    let editingDni = null; // Para edición de Cliente
    let editingUserId = null; // Para edición de Usuario

    // --- ELEMENTOS DOM PRINCIPALES ---
    const loginPage = document.getElementById("login-page");
    const dashboardPage = document.getElementById("dashboard-page");
    const portalSocioPage = document.getElementById("portal-socio-page");
    
    // Login
    const loginForm = document.getElementById("login-form");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const togglePasswordBtn = document.getElementById("toggle-password");
    
    // Sidebar & Profile Staff
    const navItems = document.querySelectorAll(".sidebar-nav li");
    const currentUserNameSpan = document.getElementById("current-user-name");
    const currentUserRoleSpan = document.getElementById("current-user-role");
    const navNoticiasLi = document.getElementById("nav-noticias-li");
    const navUsuariosLi = document.getElementById("nav-usuarios-li");
    const btnLogout = document.getElementById("btn-logout");
    
    // Header actions Staff
    const sectionTitle = document.getElementById("section-title");
    const sectionSubtitle = document.getElementById("section-subtitle");
    const btnActionAdd = document.getElementById("btn-action-add");
    const btnActionAddText = document.getElementById("btn-action-add-text");
    
    // Sections Staff
    const crudSections = document.querySelectorAll(".crud-section");
    const clientesSection = document.getElementById("clientes-section");
    const noticiasSection = document.getElementById("noticias-section");
    const usuariosSection = document.getElementById("usuarios-section");
    
    // Search boxes
    const searchClientesInput = document.getElementById("search-clientes");
    const searchUsuariosInput = document.getElementById("search-usuarios");
    
    // Tables body Staff
    const tbodyClientes = document.getElementById("tbody-clientes");
    const tbodyUsuarios = document.getElementById("tbody-usuarios");
    const adminNoticiasFeed = document.getElementById("admin-noticias-feed");
    
    // Modales
    const modalCliente = document.getElementById("modal-cliente");
    const modalNoticia = document.getElementById("modal-noticia");
    const modalUsuario = document.getElementById("modal-usuario");
    const modalCambiarPassword = document.getElementById("modal-cambiar-password");
    const modalCloses = document.querySelectorAll(".modal-close");
    
    // Formularios Modales
    const formCliente = document.getElementById("form-cliente");
    const formNoticia = document.getElementById("form-noticia");
    const formUsuario = document.getElementById("form-usuario");
    const formCambiarPassword = document.getElementById("form-cambiar-password");
    
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

    // Campos del modal cliente - Pestañas y Rutinas
    const clientModalTabs = document.querySelectorAll("#client-modal-tabs .tab-link");
    const clientModalPanels = document.querySelectorAll("#modal-cliente .tab-content-panel");
    const tabLinkRutina = document.getElementById("tab-link-rutina");
    const tabLinkEvFisica = document.getElementById("tab-link-ev-fisica");
    const tabLinkEvDeportiva = document.getElementById("tab-link-ev-deportiva");
    
    // Formulario de Rutina (Entrenador)
    const formRutina = document.getElementById("form-rutina");
    const rFecha = document.getElementById("r-fecha");
    const rPeriodo = document.getElementById("r-periodo");
    const rObjetivo = document.getElementById("r-objetivo");
    const rObs = document.getElementById("r-obs");
    const btnAddRoutineRow = document.getElementById("btn-add-routine-row");
    const routineBuilderTbody = document.getElementById("routine-builder-tbody");
    
    // Formularios de Evolución (Admin/Entrenador)
    const formEvFisica = document.getElementById("form-ev-fisica");
    const formEvDeportiva = document.getElementById("form-ev-deportiva");
    const selectEdEjercicio = document.getElementById("ed-ejercicio");
    const tbodyEvFisica = document.getElementById("tbody-ev-fisica");
    const tbodyEvDeportiva = document.getElementById("tbody-ev-deportiva");

    // Campos de Noticia
    const nTitulo = document.getElementById("n-titulo");
    const nCategoria = document.getElementById("n-categoria");
    const nContenido = document.getElementById("n-contenido");

    // Campos de Usuario
    const uId = document.getElementById("u-id");
    const uNombre = document.getElementById("u-nombre");
    const uLogin = document.getElementById("u-login");
    const uPassword = document.getElementById("u-password");
    const uPasswordGroup = document.getElementById("u-password-group");
    const uRol = document.getElementById("u-rol");

    // Campos de Cambio Obligatorio de Password
    const cpActual = document.getElementById("cp-actual");
    const cpNueva = document.getElementById("cp-nueva");
    const cpConfirmar = document.getElementById("cp-confirmar");

    // Elementos del Portal del Socio
    const socioHeaderName = document.getElementById("socio-header-name");
    const socioAptoBadge = document.getElementById("socio-apto-badge");
    const socioAptoText = document.getElementById("socio-apto-text");
    const btnSocioLogout = document.getElementById("btn-socio-logout");
    const portalTabBtns = document.querySelectorAll(".portal-tab-btn");
    const portalPanels = document.querySelectorAll(".portal-panel");
    const socioRutinaContainer = document.getElementById("socio-rutina-container");
    const socioNoticiasFeed = document.getElementById("socio-noticias-feed");
    const tbodySocioEvFisica = document.getElementById("tbody-socio-ev-fisica");
    const tbodySocioEvDeportiva = document.getElementById("tbody-socio-ev-deportiva");

    // --- NOTIFICACIONES TOAST ---
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
        
        toast.querySelector(".toast-close").addEventListener("click", () => {
            toast.style.transform = "translateX(120%)";
            setTimeout(() => toast.remove(), 300);
        });
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.transform = "translateX(120%)";
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }

    // --- CONTROL DE ACCESO Y VISTAS ---
    function initAuth() {
        if (token && currentUser) {
            loginPage.classList.add("hidden");
            
            // 1. Verificar si tiene pendiente el cambio forzoso de clave
            if (currentUser.debe_cambiar_password) {
                modalCambiarPassword.classList.add("active");
                cpActual.value = "";
                cpNueva.value = "";
                cpConfirmar.value = "";
            } else {
                modalCambiarPassword.classList.remove("active");
            }

            // 2. Redirección por Rol
            const role = (currentUser.rol || "").trim().toLowerCase();
            if (role === "cliente" || role === "socio") {
                // Vista Portal del Socio
                dashboardPage.classList.add("hidden");
                portalSocioPage.classList.remove("hidden");
                
                socioHeaderName.textContent = currentUser.nombre;
                fetchSocioData();
            } else {
                // Vista Panel Administrativo / Staff
                portalSocioPage.classList.add("hidden");
                dashboardPage.classList.remove("hidden");
                
                currentUserNameSpan.textContent = currentUser.nombre;
                currentUserRoleSpan.textContent = currentUser.rol;
                
                // Mostrar u ocultar pestañas según rol de staff
                if (role === "admin") {
                    navUsuariosLi.classList.remove("hidden");
                } else {
                    navUsuariosLi.classList.add("hidden");
                    if (activeSection === "usuarios-section") {
                        switchSection("clientes-section");
                    }
                }
                
                fetchEjerciciosAux();
                fetchStaffData();
            }
        } else {
            loginPage.classList.remove("hidden");
            dashboardPage.classList.add("hidden");
            portalSocioPage.classList.add("hidden");
            modalCambiarPassword.classList.remove("active");
            
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

    // Formulario de Cambio Obligatorio de Password
    formCambiarPassword.addEventListener("submit", async (e) => {
        e.preventDefault();
        const actual = cpActual.value;
        const nueva = cpNueva.value.trim();
        const confirmar = cpConfirmar.value.trim();

        if (nueva !== confirmar) {
            showToast("Error", "La nueva contraseña y su confirmación no coinciden.", "error");
            return;
        }

        try {
            const response = await fetch("/api/auth/cambiar-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ password_actual: actual, password_nueva: nueva })
            });

            const data = await response.json();
            if (response.ok) {
                currentUser.debe_cambiar_password = false;
                localStorage.setItem("soma_user", JSON.stringify(currentUser));
                modalCambiarPassword.classList.remove("active");
                showToast("Contraseña Actualizada", "Tu contraseña ha sido modificada con éxito. Ya puedes navegar.");
                initAuth();
            } else {
                showToast("Error al Actualizar", data.detail || "No se pudo cambiar la clave.", "error");
            }
        } catch (err) {
            showToast("Error", "Error de red al actualizar la contraseña.", "error");
        }
    });

    // Logout
    function logout() {
        token = null;
        currentUser = null;
        initAuth();
        showToast("Sesión Cerrada", "Has salido del sistema de manera segura.");
    }
    btnLogout.addEventListener("click", logout);
    btnSocioLogout.addEventListener("click", logout);

    // --- ENRUTAMIENTO Y SECCIONES EN PANEL STAFF ---
    function switchSection(sectionId) {
        activeSection = sectionId;
        
        navItems.forEach(item => {
            if (item.getAttribute("data-target") === sectionId) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });
        
        crudSections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.remove("hidden");
            } else {
                section.classList.add("hidden");
            }
        });
        
        const role = (currentUser.rol || "").trim().toLowerCase();
        
        if (sectionId === "clientes-section") {
            sectionTitle.textContent = "Gestión de Socios";
            sectionSubtitle.textContent = "Alta, modificación, rutinas y evolución física.";
            if (role === "admin" || role === "recepcionista") {
                btnActionAdd.classList.remove("hidden");
                btnActionAddText.textContent = "Nuevo Socio";
            } else {
                btnActionAdd.classList.add("hidden");
            }
            fetchClientes();
        } else if (sectionId === "noticias-section") {
            sectionTitle.textContent = "Muro de Novedades del Gym";
            sectionSubtitle.textContent = "Publicación de noticias y avisos oficiales para los socios.";
            if (role === "admin" || role === "recepcionista") {
                btnActionAdd.classList.remove("hidden");
                btnActionAddText.textContent = "Publicar Novedad";
            } else {
                btnActionAdd.classList.add("hidden");
            }
            fetchNoticias();
        } else if (sectionId === "usuarios-section") {
            sectionTitle.textContent = "Personal / Usuarios del Sistema";
            sectionSubtitle.textContent = "Administración de accesos de recepcionistas, entrenadores y administradores.";
            if (role === "admin") {
                btnActionAdd.classList.remove("hidden");
                btnActionAddText.textContent = "Nuevo Usuario";
            } else {
                btnActionAdd.classList.add("hidden");
            }
            fetchUsuarios();
        }
    }

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const target = item.getAttribute("data-target");
            if (target) switchSection(target);
        });
    });

    btnActionAdd.addEventListener("click", () => {
        if (activeSection === "clientes-section") {
            openClientModal("create");
        } else if (activeSection === "noticias-section") {
            openNoticiaModal();
        } else if (activeSection === "usuarios-section") {
            openUserModal("create");
        }
    });

    // --- ENRUTAMIENTO PESTAÑAS PORTAL DEL SOCIO ---
    portalTabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            portalTabBtns.forEach(b => b.classList.remove("active"));
            portalPanels.forEach(p => p.classList.remove("active"));
            
            btn.classList.add("active");
            const tabId = btn.getAttribute("data-portal-tab");
            activePortalTab = tabId;
            document.getElementById(tabId).classList.add("active");
        });
    });

    // --- MANEJO DE MODALES GENÉRICOS ---
    function closeAllModals() {
        modalCliente.classList.remove("active", "open");
        modalNoticia.classList.remove("active", "open");
        modalUsuario.classList.remove("active", "open");
        modalCambiarPassword.classList.remove("active", "open");
    }

    modalCloses.forEach(btn => {
        btn.addEventListener("click", () => closeAllModals());
    });

    window.addEventListener("click", (e) => {
        if (e.target === modalCliente || e.target === modalNoticia || e.target === modalUsuario) {
            closeAllModals();
        }
    });

    // Control de tabs dentro de modal Cliente
    clientModalTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            clientModalTabs.forEach(t => t.classList.remove("active"));
            clientModalPanels.forEach(p => p.classList.remove("active"));
            
            tab.classList.add("active");
            const targetPanelId = tab.getAttribute("data-tab");
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel) targetPanel.classList.add("active");
        });
    });

    // Toggle de visibilidad de fecha vencimiento apto médico
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

    // --- CARGA DE DATOS AUXILIARES (CATÁLOGO DE EJERCICIOS) ---
    async function fetchEjerciciosAux() {
        try {
            const response = await fetch("/api/clientes/aux/ejercicios", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                cachedEjercicios = await response.json();
                
                // Cargar en el select de Evolución Deportiva
                selectEdEjercicio.innerHTML = '<option value="" disabled selected>Selecciona un ejercicio...</option>';
                cachedEjercicios.forEach(ej => {
                    const opt = document.createElement("option");
                    opt.value = ej.id_ejercicio;
                    opt.textContent = `${ej.nombre_ejercicio} (${ej.grupo_muscular})`;
                    selectEdEjercicio.appendChild(opt);
                });
            }
        } catch (err) {
            console.error("Error al cargar catálogo de ejercicios:", err);
        }
    }

    // --- GESTIÓN DE CLIENTES / SOCIOS (STAFF) ---
    async function fetchClientes() {
        try {
            const response = await fetch("/api/clientes/", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                clientesData = await response.json();
                renderClientes(clientesData);
            }
        } catch (err) {
            showToast("Error", "No se pudo cargar la lista de socios", "error");
        }
    }

    function renderClientes(clients) {
        tbodyClientes.innerHTML = "";
        if (clients.length === 0) {
            tbodyClientes.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No se encontraron socios registrados</td></tr>`;
            return;
        }

        clients.forEach(c => {
            const tr = document.createElement("tr");
            
            const aptoBadge = c.apto_medico_vigente 
                ? `<span class="badge badge-success"><i class="fa-solid fa-check"></i> Al día (${c.fecha_vencimiento_apto || 'Sin fecha'})</span>`
                : `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> Vencido / Falta</span>`;
                
            const estadoBadge = c.activo
                ? `<span class="badge badge-success">Activo</span>`
                : `<span class="badge badge-inactive">Inactivo</span>`;
                
            let dirText = "-";
            if (c.direccion) {
                dirText = `${c.direccion.calle || ''} ${c.direccion.numero || ''} (${c.direccion.ciudad || ''})`.trim();
            }

            const canDelete = currentUser.rol.toLowerCase() === "admin";
            const deleteBtnHtml = canDelete 
                ? `<button class="btn-icon btn-icon-delete" data-dni="${c.dni}" title="Eliminar Socio"><i class="fa-solid fa-trash"></i></button>`
                : ``;

            tr.innerHTML = `
                <td><strong>${c.dni}</strong></td>
                <td>${c.nombre} ${c.apellido}</td>
                <td>${c.edad ? c.edad + ' años' : '-'}</td>
                <td>${c.email || c.telefono || '-'}</td>
                <td>${dirText}</td>
                <td>${aptoBadge}</td>
                <td>${estadoBadge}</td>
                <td>${c.fecha_alta}</td>
                <td class="actions-col">
                    <div class="table-actions">
                        <button class="btn-icon btn-icon-routine" data-dni="${c.dni}" title="Asignar / Modificar Rutina de Entrenamiento"><i class="fa-solid fa-dumbbell"></i></button>
                        <button class="btn-icon btn-icon-edit" data-dni="${c.dni}" title="Ver / Editar Ficha General"><i class="fa-solid fa-pen-to-square"></i></button>
                        ${deleteBtnHtml}
                    </div>
                </td>
            `;
            tbodyClientes.appendChild(tr);
        });

        // Eventos en botones de la tabla
        document.querySelectorAll("#table-clientes .btn-icon-routine").forEach(btn => {
            btn.addEventListener("click", () => openClientModal("edit", btn.getAttribute("data-dni"), "tab-rutina"));
        });

        document.querySelectorAll("#table-clientes .btn-icon-edit").forEach(btn => {
            btn.addEventListener("click", () => openClientModal("edit", btn.getAttribute("data-dni"), "tab-general"));
        });

        document.querySelectorAll("#table-clientes .btn-icon-delete").forEach(btn => {
            btn.addEventListener("click", () => deleteClient(btn.getAttribute("data-dni")));
        });
    }

    // Buscador en tiempo real de clientes
    searchClientesInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = clientesData.filter(c => 
            c.dni.toLowerCase().includes(query) ||
            c.nombre.toLowerCase().includes(query) ||
            c.apellido.toLowerCase().includes(query)
        );
        renderClientes(filtered);
    });

    // Abrir Modal de Cliente
    async function openClientModal(mode, dni = null, defaultTab = "tab-general") {
        editingDni = dni;
        formCliente.reset();
        
        // Reset tabs a la pestaña indicada
        clientModalTabs.forEach(t => t.classList.remove("active"));
        clientModalPanels.forEach(p => p.classList.remove("active"));
        
        const activeTabBtn = document.querySelector(`#client-modal-tabs button[data-tab="${defaultTab}"]`) || clientModalTabs[0];
        const activePanel = document.getElementById(defaultTab) || clientModalPanels[0];
        
        if (activeTabBtn) activeTabBtn.classList.add("active");
        if (activePanel) activePanel.classList.add("active");

        const isTrainer = (currentUser.rol || "").trim().toLowerCase() === "entrenador";
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

            // Ocultar pestañas secundarias en modo alta
            tabLinkRutina.style.display = "none";
            tabLinkEvFisica.style.display = "none";
            tabLinkEvDeportiva.style.display = "none";
        } else {
            document.getElementById("modal-cliente-title").textContent = `Ficha del Socio: DNI ${dni}`;
            cDni.setAttribute("disabled", "true");
            cDni.disabled = true;
            
            // Mostrar pestañas de rutina y evolución
            tabLinkRutina.style.display = "block";
            tabLinkEvFisica.style.display = "block";
            tabLinkEvDeportiva.style.display = "block";

            // Permisos por rol en la ficha general
            if (isTrainer) {
                // Entrenador: Solo Lectura en Datos Personales
                cNombre.disabled = true;
                cApellido.disabled = true;
                cEdad.disabled = true;
                cEmail.disabled = true;
                cTelefono.disabled = true;
                cCalle.disabled = true;
                cNumero.disabled = true;
                cCiudad.disabled = true;
                cActivo.disabled = true;
                cApto.disabled = true;
                cVencimiento.disabled = true;
                if (btnGuardarCliente) btnGuardarCliente.classList.add("hidden");
                if (readonlyNotice) readonlyNotice.classList.remove("hidden");
            } else {
                // Admin / Recepcionista: Edición Habilitada
                cNombre.disabled = false;
                cApellido.disabled = false;
                cEdad.disabled = false;
                cEmail.disabled = false;
                cTelefono.disabled = false;
                cCalle.disabled = false;
                cNumero.disabled = false;
                cCiudad.disabled = false;
                cActivo.disabled = false;
                cApto.disabled = false;
                cVencimiento.disabled = false;
                if (btnGuardarCliente) btnGuardarCliente.classList.remove("hidden");
                if (readonlyNotice) readonlyNotice.classList.add("hidden");
            }

            const client = clientesData.find(c => c.dni === dni);
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

            // Asegurar catálogo de ejercicios cargado
            if (!cachedEjercicios || cachedEjercicios.length === 0) {
                await fetchEjerciciosAux();
            }

            // Cargar Rutina y Evolución
            fetchClientRutina(dni);
            fetchClientEvFisica(dni);
            fetchClientEvDeportiva(dni);
        }
        
        modalCliente.classList.add("active", "open");
    }

    // Guardar Cliente (Create / Update)
    formCliente.addEventListener("submit", async (e) => {
        e.preventDefault();
        const role = (currentUser.rol || "").trim().toLowerCase();
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

        try {
            let url = "/api/clientes/";
            let method = "POST";
            if (editingDni) {
                url = `/api/clientes/${editingDni}`;
                method = "PUT";
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                showToast("Éxito", editingDni ? "Datos del socio actualizados" : `Socio registrado. Cuenta autogenerada (Login: ${payload.dni}, Clave: clave1234)`);
                modalCliente.classList.remove("active");
                fetchClientes();
            } else {
                showToast("Error", data.detail || "No se pudo guardar el socio", "error");
            }
        } catch (err) {
            showToast("Error", "Error de comunicación con el servidor", "error");
        }
    });

    // Eliminar Cliente
    async function deleteClient(dni) {
        if (!confirm(`¿Estás seguro de eliminar permanentemente al socio con DNI ${dni}? Se eliminarán todas sus rutinas, historial físico y su cuenta de usuario.`)) return;

        try {
            const response = await fetch(`/api/clientes/${dni}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                showToast("Eliminado", `Socio ${dni} eliminado correctamente`);
                fetchClientes();
            } else {
                const data = await response.json();
                showToast("Error", data.detail || "No se pudo eliminar el socio", "error");
            }
        } catch (err) {
            showToast("Error", "Error al eliminar el socio", "error");
        }
    }

    // --- CONSTRUCTOR Y GESTOR DE RUTINAS (ADMIN / ENTRENADOR) ---
    function addRoutineBuilderRow(detail = null) {
        const tr = document.createElement("tr");
        
        let optionsHtml = '<option value="" disabled selected>Seleccionar ejercicio...</option>';
        cachedEjercicios.forEach(ej => {
            const selected = detail && detail.id_ejercicio === ej.id_ejercicio ? 'selected' : '';
            optionsHtml += `<option value="${ej.id_ejercicio}" ${selected}>${ej.nombre_ejercicio} (${ej.grupo_muscular})</option>`;
        });

        tr.innerHTML = `
            <td>
                <select class="rb-ejercicio" required>${optionsHtml}</select>
            </td>
            <td>
                <input type="number" min="1" max="20" class="rb-series" required value="${detail ? detail.series : 3}" placeholder="Series">
            </td>
            <td>
                <input type="number" min="1" max="100" class="rb-reps" required value="${detail ? detail.repeticiones : 10}" placeholder="Reps">
            </td>
            <td>
                <input type="number" step="0.5" min="0" max="500" class="rb-carga" value="${detail && detail.carga ? detail.carga : ''}" placeholder="Ej: 50.0">
            </td>
            <td>
                <input type="text" class="rb-descanso" value="${detail && detail.descanso ? detail.descanso : '90 seg'}" placeholder="Ej: 90 seg">
            </td>
            <td style="text-align: center;">
                <button type="button" class="btn-remove-row" title="Quitar Ejercicio"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;

        tr.querySelector(".btn-remove-row").addEventListener("click", () => tr.remove());
        routineBuilderTbody.appendChild(tr);
    }

    btnAddRoutineRow.addEventListener("click", () => addRoutineBuilderRow());

    async function fetchClientRutina(dni) {
        if (!cachedEjercicios || cachedEjercicios.length === 0) {
            await fetchEjerciciosAux();
        }
        routineBuilderTbody.innerHTML = "";
        formRutina.reset();
        
        // Default fecha inicio
        rFecha.value = new Date().toISOString().split("T")[0];
        rPeriodo.value = 4;
        rObjetivo.value = "Hipertrofia y Acondicionamiento";
        rObs.value = "";

        try {
            const response = await fetch(`/api/clientes/${dni}/rutina`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const rutina = await response.json();
                if (rutina && rutina.detalles && rutina.detalles.length > 0) {
                    rFecha.value = rutina.fecha_inicio;
                    rPeriodo.value = rutina.periodo || 4;
                    rObjetivo.value = rutina.objetivo || "";
                    rObs.value = rutina.observaciones || "";
                    
                    rutina.detalles.forEach(det => addRoutineBuilderRow(det));
                } else {
                    // Agregar fila vacía por defecto
                    addRoutineBuilderRow();
                }
            } else {
                addRoutineBuilderRow();
            }
        } catch (err) {
            console.error("Error al cargar rutina del cliente:", err);
            addRoutineBuilderRow();
        }
    }

    // Guardar Rutina Asignada por Entrenador
    formRutina.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!editingDni) return;

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

        try {
            const response = await fetch(`/api/clientes/${editingDni}/rutina`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showToast("Rutina Asignada", `La rutina fue asignada exitosamente al socio ${editingDni}.`);
            } else {
                const errData = await response.json();
                showToast("Error", errData.detail || "No se pudo guardar la rutina.", "error");
            }
        } catch (err) {
            showToast("Error", "Error de red al guardar la rutina.", "error");
        }
    });

    // --- EVOLUCIÓN FÍSICA Y DEPORTIVA (STAFF) ---
    async function fetchClientEvFisica(dni) {
        tbodyEvFisica.innerHTML = "";
        try {
            const response = await fetch(`/api/clientes/${dni}/evolucion-fisica`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.length === 0) {
                    tbodyEvFisica.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-secondary);">Sin mediciones registradas</td></tr>`;
                    return;
                }
                data.forEach(m => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><strong>${m.fecha_medicion}</strong></td>
                        <td>${m.peso_kg ? m.peso_kg + ' kg' : '-'}</td>
                        <td>${m.porcentaje_grasa ? m.porcentaje_grasa + ' %' : '-'}</td>
                        <td>${m.observaciones || '-'}</td>
                    `;
                    tbodyEvFisica.appendChild(tr);
                });
            }
        } catch (err) {
            console.error("Error al cargar evolución física:", err);
        }
    }

    formEvFisica.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!editingDni) return;

        const payload = {
            fecha_medicion: document.getElementById("ef-fecha").value,
            peso_kg: parseFloat(document.getElementById("ef-peso").value),
            porcentaje_grasa: document.getElementById("ef-grasa").value ? parseFloat(document.getElementById("ef-grasa").value) : null,
            observaciones: document.getElementById("ef-obs").value.trim() || null
        };

        try {
            const response = await fetch(`/api/clientes/${editingDni}/evolucion-fisica`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showToast("Medición Guardada", "Se registró la medición antropométrica.");
                formEvFisica.reset();
                document.getElementById("ef-fecha").value = new Date().toISOString().split("T")[0];
                fetchClientEvFisica(editingDni);
            }
        } catch (err) {
            showToast("Error", "Error al guardar medición", "error");
        }
    });

    async function fetchClientEvDeportiva(dni) {
        tbodyEvDeportiva.innerHTML = "";
        try {
            const response = await fetch(`/api/clientes/${dni}/registro-entrenamiento`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.length === 0) {
                    tbodyEvDeportiva.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">Sin cargas registradas</td></tr>`;
                    return;
                }
                data.forEach(r => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><strong>${r.fecha_entrenamiento}</strong></td>
                        <td>${r.ejercicio ? r.ejercicio.nombre_ejercicio : 'ID: ' + r.id_ejercicio}</td>
                        <td><span class="badge" style="background-color: rgba(255,255,255,0.05);">${r.ejercicio ? r.ejercicio.grupo_muscular : '-'}</span></td>
                        <td><strong style="color: var(--accent);">${r.carga_real ? r.carga_real + ' kg' : '-'}</strong></td>
                        <td>${r.repeticiones_logradas || '-'}</td>
                    `;
                    tbodyEvDeportiva.appendChild(tr);
                });
            }
        } catch (err) {
            console.error("Error al cargar historial deportivo:", err);
        }
    }

    formEvDeportiva.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!editingDni) return;

        const payload = {
            fecha_entrenamiento: document.getElementById("ed-fecha").value,
            id_ejercicio: parseInt(document.getElementById("ed-ejercicio").value),
            carga_real: parseFloat(document.getElementById("ed-carga").value),
            repeticiones_logradas: document.getElementById("ed-reps").value ? parseInt(document.getElementById("ed-reps").value) : null
        };

        try {
            const response = await fetch(`/api/clientes/${editingDni}/registro-entrenamiento`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showToast("Carga Registrada", "Se registró la carga del entrenamiento.");
                formEvDeportiva.reset();
                document.getElementById("ed-fecha").value = new Date().toISOString().split("T")[0];
                fetchClientEvDeportiva(editingDni);
            }
        } catch (err) {
            showToast("Error", "Error al guardar carga", "error");
        }
    });

    // --- MURO DE NOVEDADES (STAFF & SOCIO) ---
    async function fetchNoticias() {
        try {
            const response = await fetch("/api/noticias/", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                noticiasData = await response.json();
                renderNoticiasFeed(adminNoticiasFeed, true);
            }
        } catch (err) {
            console.error("Error al cargar noticias:", err);
        }
    }

    function renderNoticiasFeed(container, canDelete = false) {
        container.innerHTML = "";
        if (noticiasData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-bullhorn"></i>
                    <h3>No hay comunicados publicados</h3>
                    <p>Las noticias y avisos del gimnasio aparecerán en este muro.</p>
                </div>
            `;
            return;
        }

        noticiasData.forEach(n => {
            const card = document.createElement("div");
            card.className = "news-card";

            const deleteBtn = (canDelete && currentUser.rol.toLowerCase() === "admin")
                ? `<button class="btn-delete-news" data-id="${n.id_noticia}"><i class="fa-solid fa-trash"></i> Eliminar</button>`
                : ``;

            card.innerHTML = `
                <div class="news-header">
                    <span class="news-badge"><i class="fa-solid fa-tag"></i> ${n.categoria}</span>
                    ${deleteBtn}
                </div>
                <h3 class="news-title">${n.titulo}</h3>
                <div class="news-body">${n.contenido}</div>
                <div class="news-footer">
                    <div class="news-meta">
                        <span><i class="fa-solid fa-user-pen"></i> ${n.autor ? n.autor.nombre : 'Administración'}</span>
                        <span><i class="fa-regular fa-calendar"></i> ${n.fecha_publicacion}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        if (canDelete) {
            container.querySelectorAll(".btn-delete-news").forEach(btn => {
                btn.addEventListener("click", () => deleteNoticia(parseInt(btn.getAttribute("data-id"))));
            });
        }
    }

    function openNoticiaModal() {
        formNoticia.reset();
        modalNoticia.classList.add("active", "open");
    }

    formNoticia.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            titulo: nTitulo.value.trim(),
            categoria: nCategoria.value,
            contenido: nContenido.value.trim()
        };

        try {
            const response = await fetch("/api/noticias/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showToast("Publicado", "La novedad fue publicada en el muro.");
                modalNoticia.classList.remove("active", "open");
                fetchNoticias();
            } else {
                const data = await response.json();
                showToast("Error", data.detail || "No se pudo publicar la novedad", "error");
            }
        } catch (err) {
            showToast("Error", "Error de conexión al publicar", "error");
        }
    });

    async function deleteNoticia(id) {
        if (!confirm("¿Deseas eliminar este comunicado del muro de novedades?")) return;
        try {
            const response = await fetch(`/api/noticias/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                showToast("Eliminada", "Noticia eliminada correctamente.");
                fetchNoticias();
            }
        } catch (err) {
            showToast("Error", "No se pudo eliminar la noticia.", "error");
        }
    }

    // --- PORTAL DEL SOCIO (VISTA CLIENTE) ---
    async function fetchSocioData() {
        const dni = currentUser.usuario_login;
        
        // 1. Obtener datos del cliente para apto médico
        try {
            const resCli = await fetch(`/api/clientes/${dni}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resCli.ok) {
                const client = await resCli.json();
                socioHeaderName.textContent = `${client.nombre} ${client.apellido}`;
                if (client.apto_medico_vigente) {
                    socioAptoBadge.className = "badge-apto-header vigente";
                    socioAptoText.textContent = `Apto Vigente (Vence: ${client.fecha_vencimiento_apto || 'S/D'})`;
                } else {
                    socioAptoBadge.className = "badge-apto-header vencido";
                    socioAptoText.textContent = "Apto Médico Vencido / Pendiente";
                }
            }
        } catch (e) {
            console.error("Error al obtener datos de perfil del socio:", e);
        }

        // 2. Cargar Rutina del Socio
        fetchSocioRutina(dni);

        // 3. Cargar Novedades
        fetchSocioNoticias();

        // 4. Cargar Progreso Físico y Cargas
        fetchSocioProgreso(dni);
    }

    async function fetchSocioRutina(dni) {
        socioRutinaContainer.innerHTML = "";
        try {
            const response = await fetch(`/api/clientes/${dni}/rutina`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const rutina = await response.json();
                if (!rutina || !rutina.detalles || rutina.detalles.length === 0) {
                    socioRutinaContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fa-solid fa-clipboard-list"></i>
                            <h3>Aún no tienes una rutina asignada</h3>
                            <p>Tu entrenador asignará tu plan personalizado de entrenamiento a la brevedad.</p>
                        </div>
                    `;
                    return;
                }

                let exercisesHtml = "";
                rutina.detalles.forEach(det => {
                    const ejNombre = det.ejercicio ? det.ejercicio.nombre_ejercicio : 'Ejercicio #' + det.id_ejercicio;
                    const ejGrupo = det.ejercicio ? det.ejercicio.grupo_muscular : 'General';
                    
                    exercisesHtml += `
                        <div class="routine-exercise-card">
                            <div class="ex-top">
                                <div class="ex-name">${ejNombre}</div>
                                <span class="ex-muscle">${ejGrupo}</span>
                            </div>
                            <div class="ex-metrics-grid">
                                <div class="metric-chip">
                                    <span class="metric-label">Series</span>
                                    <span class="metric-val">${det.series}</span>
                                </div>
                                <div class="metric-chip">
                                    <span class="metric-label">Repeticiones</span>
                                    <span class="metric-val">${det.repeticiones}</span>
                                </div>
                                <div class="metric-chip">
                                    <span class="metric-label">Carga Sugerida</span>
                                    <span class="metric-val">${det.carga ? det.carga + ' kg' : 'A criterio'}</span>
                                </div>
                                <div class="metric-chip">
                                    <span class="metric-label">Descanso</span>
                                    <span class="metric-val">${det.descanso || '90 seg'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                });

                const obsBox = rutina.observaciones ? `
                    <div class="routine-obs-box">
                        <strong><i class="fa-solid fa-comment-dots"></i> Indicaciones del Entrenador:</strong><br>
                        ${rutina.observaciones}
                    </div>
                ` : ``;

                socioRutinaContainer.innerHTML = `
                    <div class="routine-card">
                        <div class="routine-header-banner">
                            <div>
                                <div class="routine-goal-title">
                                    <i class="fa-solid fa-bullseye" style="color: var(--primary);"></i>
                                    <span>${rutina.objetivo || 'Plan de Entrenamiento'}</span>
                                </div>
                                <div class="routine-meta-pills">
                                    <span class="meta-pill"><i class="fa-regular fa-calendar"></i> Inicio: ${rutina.fecha_inicio}</span>
                                    <span class="meta-pill"><i class="fa-solid fa-clock"></i> Duración: ${rutina.periodo ? rutina.periodo + ' semanas' : 'Mensual'}</span>
                                    <span class="meta-pill"><i class="fa-solid fa-dumbbell"></i> ${rutina.detalles.length} ejercicios</span>
                                </div>
                            </div>
                        </div>
                        ${obsBox}
                        <div class="routine-exercise-grid">
                            ${exercisesHtml}
                        </div>
                    </div>
                `;
            }
        } catch (err) {
            console.error("Error al cargar rutina del socio:", err);
        }
    }

    async function fetchSocioNoticias() {
        try {
            const response = await fetch("/api/noticias/", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                noticiasData = await response.json();
                renderNoticiasFeed(socioNoticiasFeed, false);
            }
        } catch (err) {
            console.error("Error al cargar novedades del socio:", err);
        }
    }

    async function fetchSocioProgreso(dni) {
        tbodySocioEvFisica.innerHTML = "";
        tbodySocioEvDeportiva.innerHTML = "";

        try {
            // Mediciones
            const resFis = await fetch(`/api/clientes/${dni}/evolucion-fisica`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resFis.ok) {
                const fisData = await resFis.json();
                if (fisData.length === 0) {
                    tbodySocioEvFisica.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-secondary);">Sin mediciones cargadas aún</td></tr>`;
                } else {
                    fisData.forEach(m => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td><strong>${m.fecha_medicion}</strong></td>
                            <td>${m.peso_kg ? m.peso_kg + ' kg' : '-'}</td>
                            <td>${m.porcentaje_grasa ? m.porcentaje_grasa + ' %' : '-'}</td>
                            <td>${m.observaciones || '-'}</td>
                        `;
                        tbodySocioEvFisica.appendChild(tr);
                    });
                }
            }

            // Cargas
            const resDep = await fetch(`/api/clientes/${dni}/registro-entrenamiento`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resDep.ok) {
                const depData = await resDep.json();
                if (depData.length === 0) {
                    tbodySocioEvDeportiva.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-secondary);">Sin registros de cargas aún</td></tr>`;
                } else {
                    depData.forEach(r => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td><strong>${r.fecha_entrenamiento}</strong></td>
                            <td>${r.ejercicio ? r.ejercicio.nombre_ejercicio : 'ID: ' + r.id_ejercicio}</td>
                            <td><strong style="color: var(--accent);">${r.carga_real ? r.carga_real + ' kg' : '-'}</strong></td>
                            <td>${r.repeticiones_logradas || '-'}</td>
                        `;
                        tbodySocioEvDeportiva.appendChild(tr);
                    });
                }
            }
        } catch (err) {
            console.error("Error al cargar progreso del socio:", err);
        }
    }

    // --- GESTIÓN DE USUARIOS DEL SISTEMA (SOLO ADMIN) ---
    async function fetchUsuarios() {
        try {
            const response = await fetch("/api/usuarios/", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                usuariosData = await response.json();
                renderUsuarios(usuariosData);
            }
        } catch (err) {
            showToast("Error", "No se pudo cargar la lista de usuarios", "error");
        }
    }

    function renderUsuarios(users) {
        tbodyUsuarios.innerHTML = "";
        if (users.length === 0) {
            tbodyUsuarios.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No hay usuarios registrados</td></tr>`;
            return;
        }

        users.forEach(u => {
            const tr = document.createElement("tr");
            let badgeClass = "badge-primary";
            if (u.rol.toLowerCase() === "admin") badgeClass = "badge-success";
            if (u.rol.toLowerCase() === "cliente") badgeClass = "badge-inactive";

            tr.innerHTML = `
                <td><strong>#${u.id_usuario}</strong></td>
                <td>${u.nombre}</td>
                <td><code>${u.usuario_login}</code></td>
                <td><span class="badge ${badgeClass}">${u.rol}</span></td>
                <td class="actions-col">
                    <button class="btn-action btn-edit" data-id="${u.id_usuario}" title="Editar Usuario"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-action btn-delete" data-id="${u.id_usuario}" title="Eliminar Usuario"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbodyUsuarios.appendChild(tr);
        });

        document.querySelectorAll("#table-usuarios .btn-edit").forEach(btn => {
            btn.addEventListener("click", () => openUserModal("edit", parseInt(btn.getAttribute("data-id"))));
        });

        document.querySelectorAll("#table-usuarios .btn-delete").forEach(btn => {
            btn.addEventListener("click", () => deleteUser(parseInt(btn.getAttribute("data-id"))));
        });
    }

    searchUsuariosInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = usuariosData.filter(u => 
            u.nombre.toLowerCase().includes(query) ||
            u.usuario_login.toLowerCase().includes(query)
        );
        renderUsuarios(filtered);
    });

    function openUserModal(mode, id = null) {
        editingUserId = id;
        formUsuario.reset();
        
        if (mode === "create") {
            document.getElementById("modal-usuario-title").textContent = "Nuevo Usuario";
            uPasswordGroup.classList.remove("hidden");
            uPassword.setAttribute("required", "true");
        } else {
            document.getElementById("modal-usuario-title").textContent = `Editar Usuario #${id}`;
            uPasswordGroup.classList.add("hidden");
            uPassword.removeAttribute("required");

            const user = usuariosData.find(u => u.id_usuario === id);
            if (user) {
                uId.value = user.id_usuario;
                uNombre.value = user.nombre;
                uLogin.value = user.usuario_login;
                uRol.value = user.rol;
            }
        }
        modalUsuario.classList.add("active", "open");
    }

    formUsuario.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            nombre: uNombre.value.trim(),
            usuario_login: uLogin.value.trim(),
            rol: uRol.value
        };

        if (!editingUserId) {
            payload.password = uPassword.value;
        }

        try {
            let url = "/api/usuarios/";
            let method = "POST";
            if (editingUserId) {
                url = `/api/usuarios/${editingUserId}`;
                method = "PUT";
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                showToast("Éxito", editingUserId ? "Usuario actualizado" : "Usuario creado con éxito");
                modalUsuario.classList.remove("active", "open");
                fetchUsuarios();
            } else {
                showToast("Error", data.detail || "No se pudo guardar el usuario", "error");
            }
        } catch (err) {
            showToast("Error", "Error de comunicación", "error");
        }
    });

    async function deleteUser(id) {
        if (id === currentUser.id_usuario) {
            showToast("Advertencia", "No puedes eliminar tu propio usuario en sesión.", "warning");
            return;
        }
        if (!confirm(`¿Eliminar usuario #${id}?`)) return;

        try {
            const response = await fetch(`/api/usuarios/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                showToast("Eliminado", "Usuario eliminado");
                fetchUsuarios();
            }
        } catch (err) {
            showToast("Error", "No se pudo eliminar", "error");
        }
    }

    function fetchStaffData() {
        if (!currentUser || currentUser.rol === "Cliente") return;
        if (activeSection === "clientes-section") fetchClientes();
        else if (activeSection === "noticias-section") fetchNoticias();
        else if (activeSection === "usuarios-section") fetchUsuarios();
    }

    // --- RECUPERACIÓN DE CONTRASEÑA POR EMAIL (OTP) ---
    const forgotPasswordLink = document.getElementById("forgot-password-link");
    const modalRecuperar = document.getElementById("modal-recuperar-password");
    const btnCloseRecuperar = document.getElementById("btn-close-recuperar");
    const formSolicitarReset = document.getElementById("form-solicitar-reset");
    const formVerificarOtp = document.getElementById("form-verificar-otp");
    const formConfirmarReset = document.getElementById("form-confirmar-reset");
    const recuperarStep1 = document.getElementById("recuperar-step-1");
    const recuperarStep2 = document.getElementById("recuperar-step-2");
    const recuperarStep3 = document.getElementById("recuperar-step-3");
    const btnVolverStep1 = document.getElementById("btn-volver-step1");

    let usuarioLoginTemp = null;
    let resetTokenTemp = null;

    function resetRecuperarModalState() {
        if (recuperarStep1) recuperarStep1.classList.remove("hidden");
        if (recuperarStep2) recuperarStep2.classList.add("hidden");
        if (recuperarStep3) recuperarStep3.classList.add("hidden");
        
        const elIdent = document.getElementById("reset-identificador");
        const elOtp = document.getElementById("reset-otp-code");
        const elPass = document.getElementById("reset-nueva-password");
        const elConf = document.getElementById("reset-confirmar-password");

        if (elIdent) elIdent.value = "";
        if (elOtp) elOtp.value = "";
        if (elPass) elPass.value = "";
        if (elConf) elConf.value = "";

        usuarioLoginTemp = null;
        resetTokenTemp = null;
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", (e) => {
            e.preventDefault();
            resetRecuperarModalState();
            modalRecuperar.classList.add("active");
        });
    }

    if (btnCloseRecuperar) {
        btnCloseRecuperar.addEventListener("click", () => {
            modalRecuperar.classList.remove("active");
            resetRecuperarModalState();
        });
    }

    if (btnVolverStep1) {
        btnVolverStep1.addEventListener("click", () => {
            recuperarStep2.classList.add("hidden");
            recuperarStep1.classList.remove("hidden");
        });
    }

    // Paso 1: Enviar código OTP por Email
    if (formSolicitarReset) {
        formSolicitarReset.addEventListener("submit", async (e) => {
            e.preventDefault();
            const identificador = document.getElementById("reset-identificador").value.trim();
            if (!identificador) return;

            try {
                const btnSubmit = document.getElementById("btn-solicitar-otp");
                if (btnSubmit) btnSubmit.disabled = true;

                const resp = await fetch("/api/auth/recuperar-password/solicitar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ identificador })
                });
                const data = await resp.json();
                if (btnSubmit) btnSubmit.disabled = false;

                if (!resp.ok) throw new Error(data.detail || "Error al solicitar recuperación");

                usuarioLoginTemp = data.usuario_login;
                const elDest = document.getElementById("reset-email-dest");
                if (elDest) elDest.textContent = data.email_enviado || data.usuario_login;

                recuperarStep1.classList.add("hidden");
                recuperarStep2.classList.remove("hidden");
                
                const elOtp = document.getElementById("reset-otp-code");
                if (elOtp) elOtp.focus();

                showToast("Código OTP Enviado", data.message, "success");
            } catch (err) {
                const btnSubmit = document.getElementById("btn-solicitar-otp");
                if (btnSubmit) btnSubmit.disabled = false;
                showToast("Error", err.message, "error");
            }
        });
    }

    // Paso 2: Verificar Código OTP
    if (formVerificarOtp) {
        formVerificarOtp.addEventListener("submit", async (e) => {
            e.preventDefault();
            const otp = document.getElementById("reset-otp-code").value.trim();
            if (!otp || otp.length !== 6) {
                showToast("Error", "El código OTP debe ser numérico de 6 dígitos", "error");
                return;
            }

            try {
                const btnVerify = document.getElementById("btn-verificar-otp");
                if (btnVerify) btnVerify.disabled = true;

                const resp = await fetch("/api/auth/recuperar-password/verificar-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        usuario_login: usuarioLoginTemp,
                        otp: otp
                    })
                });
                const data = await resp.json();
                if (btnVerify) btnVerify.disabled = false;

                if (!resp.ok) throw new Error(data.detail || "Error al verificar OTP");

                resetTokenTemp = data.token_recuperacion;
                recuperarStep2.classList.add("hidden");
                recuperarStep3.classList.remove("hidden");

                const elPass = document.getElementById("reset-nueva-password");
                if (elPass) elPass.focus();

                showToast("Código Verificado", "Identidad verificada. Ingresá tu nueva clave.", "success");
            } catch (err) {
                const btnVerify = document.getElementById("btn-verificar-otp");
                if (btnVerify) btnVerify.disabled = false;
                showToast("Error", err.message, "error");
            }
        });
    }

    // Paso 3: Confirmar Nueva Contraseña
    if (formConfirmarReset) {
        formConfirmarReset.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nueva = document.getElementById("reset-nueva-password").value;
            const confirmar = document.getElementById("reset-confirmar-password").value;

            if (nueva !== confirmar) {
                showToast("Error", "Las contraseñas no coinciden", "error");
                return;
            }
            if (nueva.trim().length < 6) {
                showToast("Error", "La contraseña debe tener al menos 6 caracteres", "error");
                return;
            }

            try {
                const btnConfirm = document.getElementById("btn-confirmar-reset");
                if (btnConfirm) btnConfirm.disabled = true;

                const resp = await fetch("/api/auth/recuperar-password/confirmar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        token: resetTokenTemp,
                        nueva_password: nueva,
                        confirmar_password: confirmar
                    })
                });
                const data = await resp.json();
                if (btnConfirm) btnConfirm.disabled = false;

                if (!resp.ok) throw new Error(data.detail || "Error al restablecer contraseña");

                showToast("¡Restablecida!", data.message, "success");
                modalRecuperar.classList.remove("active");
                resetRecuperarModalState();
            } catch (err) {
                const btnConfirm = document.getElementById("btn-confirmar-reset");
                if (btnConfirm) btnConfirm.disabled = false;
                showToast("Error", err.message, "error");
            }
        });
    }

    // --- INICIALIZACIÓN INMEDIATA ---
    initAuth();
});

