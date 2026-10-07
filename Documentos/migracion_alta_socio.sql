-- Actualiza bases existentes para que coincidan con los campos usados por el alta
-- de socios y pagos. Se puede ejecutar más de una vez sin duplicar columnas.
USE GimnasioDB;

SET @ddl = IF(
    EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'Usuario'
          AND COLUMN_NAME = 'debe_cambiar_password'
    ),
    'SELECT 1',
    'ALTER TABLE `Usuario` ADD COLUMN `debe_cambiar_password` TINYINT(1) NOT NULL DEFAULT 0'
);
PREPARE migracion_stmt FROM @ddl;
EXECUTE migracion_stmt;
DEALLOCATE PREPARE migracion_stmt;

SET @ddl = IF(
    EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'Pago'
          AND COLUMN_NAME = 'meses_abonados'
    ),
    'SELECT 1',
    'ALTER TABLE `Pago` ADD COLUMN `meses_abonados` INT NOT NULL DEFAULT 1'
);
PREPARE migracion_stmt FROM @ddl;
EXECUTE migracion_stmt;
DEALLOCATE PREPARE migracion_stmt;

SET @ddl = IF(
    EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'Pago'
          AND COLUMN_NAME = 'fecha_vencimiento_cuota'
    ),
    'SELECT 1',
    'ALTER TABLE `Pago` ADD COLUMN `fecha_vencimiento_cuota` DATE NULL'
);
PREPARE migracion_stmt FROM @ddl;
EXECUTE migracion_stmt;
DEALLOCATE PREPARE migracion_stmt;
