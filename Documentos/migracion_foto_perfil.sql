-- ============================================================
-- Migración: SOMA-09 Carga de Foto de Perfil y Aprobación
-- Fecha: 2026-10-23
-- Descripción: Agrega `foto_url` en la tabla Cliente y crea
--              la tabla `Solicitud_Foto_Perfil` para el flujo
--              de moderación y aprobación de fotos por el staff.
-- ============================================================

USE GimnasioDB;

-- 1. Agregar columna foto_url a Cliente si no existe
ALTER TABLE Cliente 
    ADD COLUMN foto_url VARCHAR(255) NULL AFTER apto_medico_vigente;

-- 2. Crear tabla para el flujo de solicitudes de fotos
CREATE TABLE IF NOT EXISTS Solicitud_Foto_Perfil (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    dni_cliente VARCHAR(20) NOT NULL,
    foto_propuesta_url VARCHAR(255) NOT NULL,
    fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    motivo_rechazo VARCHAR(255) NULL,
    id_usuario_revisor INT NULL,
    fecha_resolucion DATETIME NULL,
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_revisor) REFERENCES Usuario(id_usuario) ON DELETE SET NULL
);
