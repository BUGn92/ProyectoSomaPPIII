/* ==========================================================================
   MÓDULO DE NOVEDADES / MURO DE NOTICIAS (STAFF & SOCIO)
   ========================================================================== */

import { state } from "../state.js";
import { NoticiasService } from "../services/noticias.service.js";
import { showToast } from "../utils/toast.js";
import { escapeHtml } from "../utils/sanitizer.js";

const adminNoticiasFeed = document.getElementById("admin-noticias-feed");
const modalNoticia = document.getElementById("modal-noticia");
const formNoticia = document.getElementById("form-noticia");
const nTitulo = document.getElementById("n-titulo");
const nCategoria = document.getElementById("n-categoria");
const nContenido = document.getElementById("n-contenido");
const nImagenUrl = document.getElementById("n-imagen-url");
const nImgPreviewContainer = document.getElementById("noticia-img-preview-container");
const nImgPreview = document.getElementById("noticia-img-preview");

export async function fetchNoticias() {
    const res = await NoticiasService.getNoticias();
    if (res.ok) {
        state.noticiasData = res.data || [];
        if (adminNoticiasFeed) {
            renderNoticiasFeed(adminNoticiasFeed, true);
        }
    } else {
        console.error("Error al cargar noticias:", res.detail);
    }
}

/**
 * Abre la imagen en un visor modal (Lightbox) interactivo.
 * @param {string} src 
 */
function openLightbox(src) {
    let lightbox = document.getElementById("lightbox-modal");
    if (!lightbox) {
        lightbox = document.createElement("div");
        lightbox.id = "lightbox-modal";
        lightbox.className = "lightbox-modal";
        lightbox.innerHTML = `
            <span class="lightbox-close" title="Cerrar">&times;</span>
            <img id="lightbox-img" class="lightbox-content" src="" alt="Novedad ampliada">
        `;
        document.body.appendChild(lightbox);

        lightbox.addEventListener("click", (e) => {
            if (e.target === lightbox || e.target.classList.contains("lightbox-close")) {
                lightbox.classList.remove("active");
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && lightbox.classList.contains("active")) {
                lightbox.classList.remove("active");
            }
        });
    }

    const img = lightbox.querySelector("#lightbox-img");
    if (img) img.src = src;
    lightbox.classList.add("active");
}

/**
 * Renderiza tarjetas de noticias sanitizando todas las entradas para evitar inyección XSS.
 * @param {HTMLElement} container 
 * @param {boolean} canDelete 
 */
export function renderNoticiasFeed(container, canDelete = false) {
    if (!container) return;
    container.innerHTML = "";

    if (!state.noticiasData || state.noticiasData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-bullhorn"></i>
                <h3>No hay comunicados publicados</h3>
                <p>Las noticias y avisos del gimnasio aparecerán en este muro.</p>
            </div>
        `;
        return;
    }

    const role = (state.currentUser?.rol || "").toLowerCase();
    const canDeleteRole = canDelete && role === "admin";

    state.noticiasData.forEach(n => {
        const card = document.createElement("div");
        card.className = "news-card";

        const deleteBtn = canDeleteRole
            ? `<button class="btn-delete-news" data-id="${n.id_noticia}"><i class="fa-solid fa-trash"></i> Eliminar</button>`
            : "";

        const autorNombre = n.autor ? n.autor.nombre : "Administración";

        // Renderizado de imagen ilustrativa en formato 16:9 con efecto zoom si está presente
        const imageHtml = n.imagen_url ? `
            <div class="news-image-container" data-img="${escapeHtml(n.imagen_url)}" title="Clic para ampliar imagen">
                <img src="${escapeHtml(n.imagen_url)}" alt="${escapeHtml(n.titulo)}" class="news-image" loading="lazy" onerror="this.parentElement.style.display='none'">
                <div class="news-image-overlay">
                    <i class="fa-solid fa-magnifying-glass-plus"></i> Ampliar
                </div>
            </div>
        ` : "";

        card.innerHTML = `
            <div class="news-header">
                <span class="news-badge"><i class="fa-solid fa-tag"></i> ${escapeHtml(n.categoria)}</span>
                ${deleteBtn}
            </div>
            ${imageHtml}
            <h3 class="news-title">${escapeHtml(n.titulo)}</h3>
            <div class="news-body">${escapeHtml(n.contenido)}</div>
            <div class="news-footer">
                <div class="news-meta">
                    <span><i class="fa-solid fa-user-pen"></i> ${escapeHtml(autorNombre)}</span>
                    <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(n.fecha_publicacion)}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    // Eventos para el Lightbox de fotos
    container.querySelectorAll(".news-image-container").forEach(el => {
        el.addEventListener("click", () => {
            const src = el.getAttribute("data-img");
            if (src) openLightbox(src);
        });
    });

    if (canDeleteRole) {
        container.querySelectorAll(".btn-delete-news").forEach(btn => {
            btn.addEventListener("click", () => deleteNoticia(parseInt(btn.getAttribute("data-id"))));
        });
    }
}

export function openNoticiaModal() {
    if (formNoticia) formNoticia.reset();
    if (nImgPreviewContainer) nImgPreviewContainer.style.display = "none";
    if (nImgPreview) nImgPreview.src = "";
    if (modalNoticia) modalNoticia.classList.add("active", "open");
}

async function deleteNoticia(id) {
    if (!confirm("¿Deseas eliminar este comunicado del muro de novedades?")) return;
    const res = await NoticiasService.deleteNoticia(id);
    if (res.ok) {
        showToast("Eliminada", "Noticia eliminada correctamente.");
        fetchNoticias();
    } else {
        showToast("Error", res.detail || "No se pudo eliminar la noticia.", "error");
    }
}

export function initNoticiasModule() {
    // Vista previa interactiva de URL de imagen
    if (nImagenUrl && nImgPreview && nImgPreviewContainer) {
        const updatePreview = () => {
            const url = nImagenUrl.value.trim();
            if (url) {
                nImgPreview.src = url;
                nImgPreviewContainer.style.display = "block";
            } else {
                nImgPreviewContainer.style.display = "none";
                nImgPreview.src = "";
            }
        };

        nImagenUrl.addEventListener("input", updatePreview);
        nImagenUrl.addEventListener("change", updatePreview);
        nImgPreview.addEventListener("error", () => {
            // Si la imagen falla al cargar en la preview, oculta la caja
            nImgPreviewContainer.style.display = "none";
        });
    }

    if (formNoticia) {
        formNoticia.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
                titulo: nTitulo.value.trim(),
                categoria: nCategoria.value,
                contenido: nContenido.value.trim(),
                imagen_url: nImagenUrl && nImagenUrl.value.trim() ? nImagenUrl.value.trim() : null
            };

            const res = await NoticiasService.crearNoticia(payload);
            if (res.ok) {
                showToast("Publicado", "La novedad fue publicada en el muro.");
                if (modalNoticia) modalNoticia.classList.remove("active", "open");
                fetchNoticias();
            } else {
                showToast("Error", res.detail || "No se pudo publicar la novedad", "error");
            }
        });
    }
}
