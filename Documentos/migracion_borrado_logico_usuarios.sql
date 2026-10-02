-- ============================================================
-- Migración: Borrado Lógico de Usuarios
-- Fecha: 2026-10-02
-- Descripción: Agrega el campo `activo` a la tabla Usuario
--              para soportar borrado lógico (soft delete).
--              Los usuarios existentes quedan marcados como activos.
-- ============================================================

ALTER TABLE `Usuario`
    ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1
        COMMENT '1 = activo, 0 = dado de baja (borrado lógico)';

-- Asegurarse de que todos los usuarios existentes queden activos
UPDATE `Usuario` SET `activo` = 1 WHERE `activo` IS NULL;
