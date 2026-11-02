-- ============================================================
-- Migración: Check-in Digital, Control de Asistencias e Inactividad
-- Fecha: 2026-11-02
-- Descripción: Crea la tabla `Asistencia` para registrar el ingreso
--              de los socios por tablet o recepción, registrando fecha,
--              hora, estado de cuota y apto médico al ingresar.
-- ============================================================

USE GimnasioDB;

CREATE TABLE IF NOT EXISTS Asistencia (
    id_asistencia INT AUTO_INCREMENT PRIMARY KEY,
    dni_cliente VARCHAR(20) NOT NULL,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado_cuota VARCHAR(50) NULL,
    apto_medico_vigente BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni) ON DELETE CASCADE,
    INDEX idx_asistencia_dni_fecha (dni_cliente, fecha_hora),
    INDEX idx_asistencia_fecha (fecha_hora)
);
