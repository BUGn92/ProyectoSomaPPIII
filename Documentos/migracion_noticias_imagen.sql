-- ============================================================
-- Migración: SOMA-05 Soporte de Imágenes en Noticias
-- Fecha: 2026-10-19
-- Descripción: Agrega el campo `imagen_url` a la tabla Noticia
--              para permitir adjuntar imágenes mediante URL.
-- ============================================================

USE GimnasioDB;

ALTER TABLE Noticia 
    ADD COLUMN imagen_url VARCHAR(255) NULL AFTER categoria;
