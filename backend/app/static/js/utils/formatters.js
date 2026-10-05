/* ==========================================================================
   UTILIDADES DE FORMATEO (FECHAS, MONEDA, VENCIMIENTOS)
   ========================================================================== */

/**
 * Formatea un valor numérico como moneda en pesos argentinos (ARS).
 * @param {number|string} amount
 * @returns {string} Ej: "$15.000,00"
 */
export function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return `$${num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calcula la fecha de vencimiento proyectada al sumar meses a una fecha base.
 * Si la fechaFinActual ya venció respecto a hoy, la base pasa a ser hoy.
 * 
 * @param {string|null} fechaFinActual - Fecha ISO 'YYYY-MM-DD' o null
 * @param {number} meses - Cantidad de meses a abonar
 * @returns {string} Fecha ISO 'YYYY-MM-DD'
 */
export function calcularPreviewFecha(fechaFinActual, meses = 1) {
    const hoy = new Date();
    let base;
    if (fechaFinActual) {
        const fin = new Date(fechaFinActual + "T00:00:00");
        base = fin >= hoy ? fin : hoy;
    } else {
        base = hoy;
    }
    const resultado = new Date(base);
    resultado.setMonth(resultado.getMonth() + meses);
    return resultado.toISOString().split("T")[0];
}
