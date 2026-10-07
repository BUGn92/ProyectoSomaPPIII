import { escapeHtml } from "../utils/sanitizer.js";

export function renderRoutineView(rutina) {
    if (!rutina?.detalles?.length) {
        return `
            <div class="empty-state">
                <i class="fa-solid fa-clipboard-list"></i>
                <h3>Aún no tienes una rutina asignada</h3>
                <p>Tu entrenador asignará tu plan personalizado de entrenamiento a la brevedad.</p>
            </div>
        `;
    }

    const entrenador = rutina.detalles.find(det => det.usuario)?.usuario;
    const entrenadorNombre = entrenador ? entrenador.nombre : "No informado";
    const dias = rutina.dias?.length ? rutina.dias : [{ numero: 1, detalles: rutina.detalles }];
    const exercisesHtml = dias.map((dia, dayIndex) => {
        const rows = dia.detalles.map((det, index) => {
            const ejNombre = det.ejercicio ? det.ejercicio.nombre_ejercicio : `Ejercicio #${det.id_ejercicio}`;
            const ejGrupo = det.ejercicio ? det.ejercicio.grupo_muscular : "General";

            return `
                <tr>
                    <td class="routine-order" data-label="N°">${index + 1}</td>
                    <td data-label="Ejercicio">
                        <strong class="routine-exercise-name">${escapeHtml(ejNombre)}</strong>
                        <span class="routine-muscle-group">${escapeHtml(ejGrupo)}</span>
                    </td>
                    <td class="routine-number" data-label="Series">${det.series}</td>
                    <td class="routine-number" data-label="Repeticiones">${det.repeticiones}</td>
                    <td class="routine-value" data-label="Carga">${det.carga ? `${escapeHtml(det.carga)} kg` : "A criterio"}</td>
                    <td class="routine-value" data-label="Descanso">${escapeHtml(det.descanso || "90 seg")}</td>
                </tr>
            `;
        }).join("");

        return `
            <section class="routine-day-sheet">
                <h3>Día ${dia.numero || dayIndex + 1}</h3>
                <div class="routine-sheet-container">
                    <table class="routine-sheet">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Ejercicio</th>
                                <th>Series</th>
                                <th>Repeticiones</th>
                                <th>Carga</th>
                                <th>Descanso</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </section>
        `;
    }).join("");

    const obsBox = rutina.observaciones ? `
        <div class="routine-obs-box">
            <strong><i class="fa-solid fa-comment-dots"></i> Indicaciones del Entrenador:</strong><br>
            ${escapeHtml(rutina.observaciones)}
        </div>
    ` : "";

    return `
        <div class="routine-card">
            <div class="routine-header-banner">
                <div>
                    <div class="routine-goal-title">
                        <i class="fa-solid fa-bullseye" style="color: var(--primary);"></i>
                        <span>${escapeHtml(rutina.objetivo || "Plan de Entrenamiento")}</span>
                    </div>
                    <div class="routine-meta-pills">
                        <span class="meta-pill"><i class="fa-regular fa-calendar"></i> Inicio: ${escapeHtml(rutina.fecha_inicio)}</span>
                        <span class="meta-pill"><i class="fa-solid fa-clock"></i> Duración: ${rutina.periodo ? `${rutina.periodo} semanas` : "Mensual"}</span>
                        <span class="meta-pill"><i class="fa-solid fa-calendar-days"></i> ${dias.length} ${dias.length === 1 ? "día" : "días"}</span>
                        <span class="meta-pill"><i class="fa-solid fa-dumbbell"></i> ${rutina.detalles.length} ejercicios</span>
                        <span class="meta-pill routine-trainer"><i class="fa-solid fa-user-tie"></i> Entrenador: ${escapeHtml(entrenadorNombre)}</span>
                    </div>
                </div>
            </div>
            ${obsBox}
            ${exercisesHtml}
        </div>
    `;
}
