-- ==============================================================================
-- Migración: Tablas y Semillas de Plantillas de Rutinas (Iniciación y Objetivos)
-- Fecha: 2026-10-30
-- Descripción:
--   1. Crea las tablas `Plantilla_Rutina` y `Detalle_Plantilla_Rutina` para desacoplar
--      las rutinas prediseñadas de los clientes y permitir que los entrenadores
--      apliquen rutinas base en un solo clic.
--   2. Carga las 4 plantillas típicas para objetivos principales:
--      - Iniciación y Acondicionamiento (3 Días, <= 50 min)
--      - Pérdida de Peso y Tonificación (3 Días, <= 45 min)
--      - Musculación e Hipertrofia (4 Días, <= 55 min)
--      - Fuerza y Halterofilia (3 Días, <= 60 min)
-- ==============================================================================

USE GimnasioDB;

-- 1. Tabla Plantilla_Rutina
CREATE TABLE IF NOT EXISTS `Plantilla_Rutina` (
    `id_plantilla` INT PRIMARY KEY AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `objetivo` VARCHAR(100) NOT NULL,
    `nivel` VARCHAR(50) NOT NULL DEFAULT 'Principiante',
    `dias_semana` INT NOT NULL DEFAULT 3,
    `duracion_estimada_min` INT NOT NULL DEFAULT 50,
    `observaciones` TEXT NULL,
    `activo` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabla Detalle_Plantilla_Rutina
CREATE TABLE IF NOT EXISTS `Detalle_Plantilla_Rutina` (
    `id_detalle_plantilla` INT PRIMARY KEY AUTO_INCREMENT,
    `id_plantilla` INT NOT NULL,
    `id_ejercicio` INT NOT NULL,
    `dia` INT NOT NULL DEFAULT 1,
    `series` INT NOT NULL,
    `repeticiones` INT NOT NULL,
    `carga_sugerida` DECIMAL(5, 2) NULL,
    `descanso` VARCHAR(50) NULL,
    FOREIGN KEY (`id_plantilla`) REFERENCES `Plantilla_Rutina`(`id_plantilla`) ON DELETE CASCADE,
    FOREIGN KEY (`id_ejercicio`) REFERENCES `Ejercicio`(`id_ejercicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Carga Semilla de las 4 Plantillas Base (si no existen)
INSERT IGNORE INTO `Plantilla_Rutina` (`id_plantilla`, `nombre`, `objetivo`, `nivel`, `dias_semana`, `duracion_estimada_min`, `observaciones`, `activo`) VALUES
(1, 'Iniciación y Acondicionamiento (3 Días)', 'Iniciación / Acondicionamiento Físico General', 'Principiante', 3, 50, 'Rutina full-body de 3 días para adaptación anatómica y técnica. Calentamiento previo de 8-10 min y vuelta a la calma de 5 min. Cargas moderadas (RPE 6-7).', 1),
(2, 'Pérdida de Peso y Tonificación (3 Días)', 'Pérdida de Peso / Tonificación', 'Principiante / Intermedio', 3, 45, 'Rutina dinámica de alta densidad metabólica para optimizar gasto calórico. Respetar descansos cortos de 45 a 60 segundos.', 1),
(3, 'Musculación e Hipertrofia (4 Días)', 'Hipertrofia Muscular', 'Intermedio', 4, 55, 'Distribución torso/pierna para sobrecarga progresiva y volumen efectivo. Descansos controlados de 90 segundos.', 1),
(4, 'Fuerza y Halterofilia (3 Días)', 'Fuerza / Halterofilia', 'Avanzado', 3, 60, 'Enfoque en levantamientos básicos pesados multiarticulares. Descansos completos de 2 minutos para reposición energética.', 1);

-- 4. Detalle de Ejercicios por Día para cada Plantilla
-- Plantilla 1: Iniciación (3 Días)
INSERT IGNORE INTO `Detalle_Plantilla_Rutina` (`id_plantilla`, `id_ejercicio`, `dia`, `series`, `repeticiones`, `carga_sugerida`, `descanso`) VALUES
-- Día 1
(1, 2, 1, 3, 10, 20.00, '90 seg'),
(1, 1, 1, 3, 10, 25.00, '90 seg'),
(1, 3, 1, 3, 10, 0.00, '60 seg'),
(1, 4, 1, 3, 10, 15.00, '60 seg'),
(1, 6, 1, 3, 12, 15.00, '60 seg'),
-- Día 2
(1, 7, 2, 3, 10, 30.00, '90 seg'),
(1, 3, 2, 3, 8, 0.00, '90 seg'),
(1, 1, 2, 3, 12, 20.00, '60 seg'),
(1, 4, 2, 3, 10, 15.00, '60 seg'),
(1, 5, 2, 3, 12, 15.00, '60 seg'),
-- Día 3
(1, 2, 3, 3, 12, 20.00, '90 seg'),
(1, 1, 3, 3, 10, 25.00, '90 seg'),
(1, 3, 3, 3, 10, 0.00, '90 seg'),
(1, 5, 3, 3, 12, 15.00, '60 seg'),
(1, 6, 3, 3, 12, 15.00, '60 seg');

-- Plantilla 2: Pérdida de Peso y Tonificación (3 Días)
INSERT IGNORE INTO `Detalle_Plantilla_Rutina` (`id_plantilla`, `id_ejercicio`, `dia`, `series`, `repeticiones`, `carga_sugerida`, `descanso`) VALUES
-- Día 1
(2, 2, 1, 4, 15, 20.00, '45 seg'),
(2, 1, 1, 3, 12, 20.00, '45 seg'),
(2, 3, 1, 3, 10, 0.00, '45 seg'),
(2, 6, 1, 3, 15, 10.00, '45 seg'),
-- Día 2
(2, 7, 2, 4, 12, 30.00, '60 seg'),
(2, 4, 2, 3, 12, 15.00, '45 seg'),
(2, 5, 2, 3, 15, 10.00, '45 seg'),
(2, 6, 2, 3, 15, 10.00, '45 seg'),
-- Día 3
(2, 2, 3, 3, 15, 25.00, '45 seg'),
(2, 3, 3, 3, 12, 0.00, '45 seg'),
(2, 1, 3, 3, 12, 20.00, '45 seg'),
(2, 5, 3, 3, 15, 10.00, '45 seg');

-- Plantilla 3: Musculación e Hipertrofia (4 Días)
INSERT IGNORE INTO `Detalle_Plantilla_Rutina` (`id_plantilla`, `id_ejercicio`, `dia`, `series`, `repeticiones`, `carga_sugerida`, `descanso`) VALUES
-- Día 1 (Torso A)
(3, 1, 1, 4, 8, 50.00, '90 seg'),
(3, 3, 1, 4, 8, 0.00, '90 seg'),
(3, 4, 1, 3, 10, 25.00, '90 seg'),
(3, 5, 1, 3, 10, 20.00, '60 seg'),
-- Día 2 (Pierna A)
(3, 2, 2, 4, 8, 60.00, '90 seg'),
(3, 7, 2, 3, 8, 60.00, '90 seg'),
(3, 6, 2, 3, 12, 20.00, '60 seg'),
-- Día 3 (Torso B)
(3, 3, 3, 4, 10, 0.00, '90 seg'),
(3, 1, 3, 4, 10, 45.00, '90 seg'),
(3, 4, 3, 3, 8, 30.00, '90 seg'),
(3, 6, 3, 3, 10, 25.00, '60 seg'),
-- Día 4 (Pierna B)
(3, 7, 4, 4, 6, 70.00, '90 seg'),
(3, 2, 4, 4, 10, 50.00, '90 seg'),
(3, 5, 4, 3, 10, 20.00, '60 seg');

-- Plantilla 4: Fuerza y Halterofilia (3 Días)
INSERT IGNORE INTO `Detalle_Plantilla_Rutina` (`id_plantilla`, `id_ejercicio`, `dia`, `series`, `repeticiones`, `carga_sugerida`, `descanso`) VALUES
-- Día 1
(4, 2, 1, 5, 5, 75.00, '120 seg'),
(4, 1, 1, 5, 5, 65.00, '120 seg'),
(4, 3, 1, 3, 6, 0.00, '90 seg'),
-- Día 2
(4, 7, 2, 5, 5, 85.00, '120 seg'),
(4, 4, 2, 5, 5, 40.00, '120 seg'),
(4, 5, 2, 3, 8, 25.00, '90 seg'),
-- Día 3
(4, 2, 3, 4, 4, 80.00, '120 seg'),
(4, 1, 3, 4, 4, 70.00, '120 seg'),
(4, 7, 3, 3, 4, 90.00, '120 seg');
