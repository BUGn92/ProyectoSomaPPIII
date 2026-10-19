-- Agrega el numero de dia a cada ejercicio y migra las rutinas guardadas con
-- el marcador temporal soma-rutina-dias:v1. Es seguro ejecutar el script mas
-- de una vez: el marcador se elimina solo despues de migrar cada rutina.
USE GimnasioDB;

SET @ddl = IF(
    EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'Detalle_Rutina'
          AND COLUMN_NAME = 'dia'
    ),
    'SELECT 1',
    'ALTER TABLE `Detalle_Rutina` ADD COLUMN `dia` INT NOT NULL DEFAULT 1'
);
PREPARE migracion_stmt FROM @ddl;
EXECUTE migracion_stmt;
DEALLOCATE PREPARE migracion_stmt;

DROP PROCEDURE IF EXISTS migrar_dias_rutina;
DELIMITER //
CREATE PROCEDURE migrar_dias_rutina()
BEGIN
    DECLARE finalizado BOOLEAN DEFAULT FALSE;
    DECLARE rutina_id INT;
    DECLARE observaciones_actuales LONGTEXT;
    DECLARE posicion_marcador INT;
    DECLARE texto_conteos LONGTEXT;
    DECLARE conteos LONGTEXT;
    DECLARE cantidad_dias INT;
    DECLARE cantidad_detalles INT;
    DECLARE total_conteos INT;
    DECLARE desplazamiento INT;
    DECLARE indice_dia INT;
    DECLARE indice_detalle INT;
    DECLARE cantidad_dia INT;
    DECLARE detalle_id INT;
    DECLARE valido BOOLEAN;
    DECLARE observaciones_limpias LONGTEXT;
    DECLARE largo_observaciones_limpias INT;

    DECLARE rutinas_marcadas CURSOR FOR
        SELECT id_rutina, observaciones
        FROM Rutina
        WHERE observaciones LIKE '%<!--soma-rutina-dias:v1:%';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finalizado = TRUE;

    OPEN rutinas_marcadas;

    rutina_loop: LOOP
        FETCH rutinas_marcadas INTO rutina_id, observaciones_actuales;
        IF finalizado THEN
            LEAVE rutina_loop;
        END IF;

        SET posicion_marcador = LOCATE('<!--soma-rutina-dias:v1:', observaciones_actuales);
        SET texto_conteos = SUBSTRING_INDEX(
            SUBSTRING(observaciones_actuales, posicion_marcador + CHAR_LENGTH('<!--soma-rutina-dias:v1:')),
            '-->',
            1
        );

        IF RIGHT(observaciones_actuales, 3) = '-->' AND JSON_VALID(texto_conteos) THEN
            SET conteos = texto_conteos;
            SET cantidad_dias = JSON_LENGTH(conteos);
            SET total_conteos = 0;
            SET valido = JSON_TYPE(conteos) = 'ARRAY'
                AND cantidad_dias BETWEEN 1 AND 7;
            SET indice_dia = 0;

            WHILE indice_dia < cantidad_dias AND valido DO
                IF JSON_TYPE(JSON_EXTRACT(conteos, CONCAT('$[', indice_dia, ']'))) <> 'INTEGER' THEN
                    SET valido = FALSE;
                ELSE
                    SET cantidad_dia = CAST(
                        JSON_UNQUOTE(JSON_EXTRACT(conteos, CONCAT('$[', indice_dia, ']')))
                        AS SIGNED
                    );
                    IF cantidad_dia < 1 THEN
                        SET valido = FALSE;
                    ELSE
                        SET total_conteos = total_conteos + cantidad_dia;
                    END IF;
                END IF;
                SET indice_dia = indice_dia + 1;
            END WHILE;

            SELECT COUNT(*) INTO cantidad_detalles
            FROM Detalle_Rutina
            WHERE id_rutina = rutina_id;

            IF valido AND total_conteos = cantidad_detalles THEN
                SET indice_dia = 0;
                SET desplazamiento = 0;

                WHILE indice_dia < cantidad_dias DO
                    SET cantidad_dia = CAST(
                        JSON_UNQUOTE(JSON_EXTRACT(conteos, CONCAT('$[', indice_dia, ']')))
                        AS UNSIGNED
                    );
                    SET indice_detalle = 0;

                    WHILE indice_detalle < cantidad_dia DO
                        SELECT id_detalle INTO detalle_id
                        FROM Detalle_Rutina
                        WHERE id_rutina = rutina_id
                        ORDER BY id_detalle
                        LIMIT desplazamiento, 1;

                        UPDATE Detalle_Rutina
                        SET dia = indice_dia + 1
                        WHERE id_detalle = detalle_id;

                        SET desplazamiento = desplazamiento + 1;
                        SET indice_detalle = indice_detalle + 1;
                    END WHILE;

                    SET indice_dia = indice_dia + 1;
                END WHILE;

                SET largo_observaciones_limpias = posicion_marcador - 1;
                IF largo_observaciones_limpias > 0
                   AND SUBSTRING(observaciones_actuales, largo_observaciones_limpias, 1) = CHAR(10) THEN
                    SET largo_observaciones_limpias = largo_observaciones_limpias - 1;
                END IF;
                SET observaciones_limpias = NULLIF(LEFT(observaciones_actuales, largo_observaciones_limpias), '');
                UPDATE Rutina
                SET observaciones = observaciones_limpias
                WHERE id_rutina = rutina_id;
            END IF;
        END IF;
    END LOOP;

    CLOSE rutinas_marcadas;
END//
DELIMITER ;

CALL migrar_dias_rutina();
DROP PROCEDURE migrar_dias_rutina;
