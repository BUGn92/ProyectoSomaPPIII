/* ==========================================================================
   MÓDULO DE CHECK-IN DIGITAL PARA TABLET (KIOSCO DE ACCESO)
   ========================================================================== */

import { realizarCheckin } from "../services/asistencia.service.js";

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

let countdownInterval = null;
let audioCtx = null;

/**
 * Emite un sonido sintetizado sutil de confirmación o alerta.
 * @param {'success'|'warning'|'error'} type 
 */
function playTone(type = "success") {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;
        if (type === "success") {
            // Tono doble ascendente agradable
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else {
            // Tono de atención
            osc.frequency.setValueAtTime(329.63, now); // E4
            osc.frequency.setValueAtTime(261.63, now + 0.18); // C4
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        }
    } catch {
        // Ignorar si el navegador restringe audio
    }
}

/**
 * Formatea una fecha ISO a DD/MM/AAAA
 * @param {string} fechaIso 
 */
function formatFecha(fechaIso) {
    if (!fechaIso) return "";
    const partes = fechaIso.split("T")[0].split("-");
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaIso;
}

/**
 * Actualiza el reloj digital en tiempo real en el encabezado.
 */
function startLiveClock() {
    const elClock = document.getElementById("live-clock");
    const elDate = document.getElementById("live-date");

    function update() {
        const now = new Date();
        if (elClock) {
            elClock.textContent = now.toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        }
        if (elDate) {
            elDate.textContent = now.toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            });
        }
    }
    update();
    setInterval(update, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
    startLiveClock();

    const dniInput = document.getElementById("kiosk-dni-input");
    const checkinForm = document.getElementById("checkin-form");
    const keypadBtns = document.querySelectorAll(".keypad-btn");
    const overlay = document.getElementById("checkin-result-overlay");
    const resultCard = document.getElementById("result-card");
    const resultAvatar = document.getElementById("result-avatar");
    const resultIconBadge = document.getElementById("result-icon-badge");
    const resultName = document.getElementById("result-name");
    const resultDni = document.getElementById("result-dni");
    const badgeCuota = document.getElementById("badge-cuota");
    const badgeCuotaText = document.getElementById("badge-cuota-text");
    const badgeApto = document.getElementById("badge-apto");
    const badgeAptoText = document.getElementById("badge-apto-text");
    const resultMessageBox = document.getElementById("result-message-box");
    const countdownText = document.getElementById("countdown-text");
    const btnCloseResult = document.getElementById("btn-close-result");

    function resetInput() {
        if (dniInput) {
            dniInput.value = "";
            dniInput.focus();
        }
    }

    function closeResultModal() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        if (overlay) {
            overlay.classList.remove("active");
        }
        resetInput();
    }

    if (btnCloseResult) {
        btnCloseResult.addEventListener("click", closeResultModal);
    }

    // Cerrar también si tocan fuera de la tarjeta
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                closeResultModal();
            }
        });
    }

    // Teclado numérico táctil
    keypadBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const key = btn.getAttribute("data-key");
            if (!dniInput) return;

            if (key === "clear") {
                dniInput.value = "";
            } else if (key === "backspace") {
                dniInput.value = dniInput.value.slice(0, -1);
            } else if (dniInput.value.length < 8) {
                dniInput.value += key;
            }
            dniInput.focus();
        });
    });

    // Sanitizar entrada de teclado físico
    if (dniInput) {
        dniInput.addEventListener("input", () => {
            dniInput.value = dniInput.value.replace(/\D/g, "").slice(0, 8);
        });
    }

    // Envío del Check-in
    if (checkinForm) {
        checkinForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const dni = dniInput ? dniInput.value.trim() : "";

            if (!/^\d{7,8}$/.test(dni)) {
                alert("Por favor ingresa un número de DNI válido (7 u 8 dígitos).");
                if (dniInput) dniInput.focus();
                return;
            }

            const btnSubmit = document.getElementById("btn-submit-checkin");
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Verificando...</span>`;
            }

            try {
                const res = await realizarCheckin(dni);
                if (res.ok && res.data) {
                    const data = res.data;

                    // Cargar datos en la tarjeta de resultado
                    if (resultName) resultName.textContent = data.nombre_completo || "Socio SOMA";
                    if (resultDni) resultDni.textContent = `DNI: ${data.dni}`;
                    if (resultAvatar) {
                        resultAvatar.src = data.foto_url ? data.foto_url : DEFAULT_AVATAR;
                    }
                    if (resultMessageBox) {
                        resultMessageBox.textContent = data.mensaje_bienvenida || "¡Bienvenido a SOMA!";
                    }

                    // Estado de Cuota
                    const cuotaVencida = data.alerta_cuota;
                    const vencCuota = formatFecha(data.fecha_vencimiento_cuota);
                    if (badgeCuota && badgeCuotaText) {
                        if (cuotaVencida) {
                            badgeCuota.className = "kiosk-badge badge-alert";
                            badgeCuotaText.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Cuota: Atrasada ${vencCuota ? `(${vencCuota})` : ""}`;
                        } else {
                            badgeCuota.className = "kiosk-badge badge-ok";
                            badgeCuotaText.innerHTML = `<i class="fa-solid fa-circle-check"></i> Cuota: Al día ${vencCuota ? `(${vencCuota})` : ""}`;
                        }
                    }

                    // Estado de Apto Médico
                    const aptoVencido = data.alerta_apto;
                    const vencApto = formatFecha(data.fecha_vencimiento_apto);
                    if (badgeApto && badgeAptoText) {
                        if (aptoVencido) {
                            badgeApto.className = "kiosk-badge badge-alert";
                            badgeAptoText.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Apto Médico: Vencido ${vencApto ? `(${vencApto})` : ""}`;
                        } else {
                            badgeApto.className = "kiosk-badge badge-ok";
                            badgeAptoText.innerHTML = `<i class="fa-solid fa-heart-pulse"></i> Apto Médico: Vigente ${vencApto ? `(${vencApto})` : ""}`;
                        }
                    }

                    // Estilo de tarjeta y sonido
                    if (resultCard && resultIconBadge) {
                        if (cuotaVencida) {
                            resultCard.className = "result-card status-danger";
                            resultIconBadge.style.background = "var(--danger)";
                            resultIconBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
                            playTone("error");
                        } else if (aptoVencido) {
                            resultCard.className = "result-card status-warning";
                            resultIconBadge.style.background = "var(--warning)";
                            resultIconBadge.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i>`;
                            playTone("warning");
                        } else {
                            resultCard.className = "result-card status-success";
                            resultIconBadge.style.background = "var(--success)";
                            resultIconBadge.innerHTML = `<i class="fa-solid fa-check"></i>`;
                            playTone("success");
                        }
                    }

                    // Mostrar modal con cuenta regresiva de 5 segundos
                    if (overlay) overlay.classList.add("active");
                    let secondsLeft = 5;
                    if (countdownText) countdownText.textContent = `Cerrando en ${secondsLeft} segundos...`;

                    countdownInterval = setInterval(() => {
                        secondsLeft--;
                        if (countdownText) {
                            countdownText.textContent = `Cerrando en ${secondsLeft} segundo${secondsLeft === 1 ? '' : 's'}...`;
                        }
                        if (secondsLeft <= 0) {
                            closeResultModal();
                        }
                    }, 1000);

                } else {
                    playTone("error");
                    const errDetail = res.detail || "No se pudo registrar el ingreso. Verifique el DNI.";
                    alert(`Atención: ${errDetail}`);
                    resetInput();
                }
            } catch (err) {
                playTone("error");
                alert("Ocurrió un error al conectar con el servidor. Intente nuevamente.");
                resetInput();
            } finally {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = `<i class="fa-solid fa-arrow-right-to-bracket"></i> <span>Registrar Ingreso</span>`;
                }
            }
        });
    }
});
