-- 1. Tablas principales (Sin dependencias)

INSERT INTO Direccion (id_direccion, calle, numero, ciudad) VALUES
(1, 'Av. Corrientes', '1234', 'Ciudad Autónoma de Buenos Aires'),
(2, 'San Martín', '450', 'Rosario'),
(3, 'Belgrano', '890', 'Córdoba'),
(4, 'Sarmiento', '210', 'Mendoza');

INSERT INTO Membresia (id_membresia, tipo, precio, duracion_dias) VALUES
(1, 'Mensual', 15000.00, 30),
(2, 'Trimestral Premium', 40000.00, 90),
(3, 'Anual VIP', 130000.00, 365),
(4, 'Pase Diario', 1500.00, 1);

INSERT INTO Usuario (id_usuario, nombre, usuario_login, password, rol) VALUES
(1, 'Carlos Admin', 'cadmin', 'hash_falso_123', 'Admin'),
(2, 'Ana López', 'alopez', 'hash_falso_456', 'Recepcionista'),
(3, 'Marcos Fuerte', 'mfuerte', 'hash_falso_789', 'Entrenador'),
(4, 'Lucía Fit', 'lfit', 'hash_falso_101', 'Entrenador');

INSERT INTO Ejercicio (id_ejercicio, nombre_ejercicio, grupo_muscular, activo) VALUES
(1, 'Press de Banca Plano', 'Pecho', TRUE),
(2, 'Sentadilla Libre con Barra', 'Piernas', TRUE),
(3, 'Dominadas', 'Espalda', TRUE),
(4, 'Press Militar', 'Hombros', TRUE),
(5, 'Curl con barra', 'Bíceps', TRUE),
(6, 'Extensiones en polea', 'Tríceps', TRUE),
(7, 'Peso Muerto', 'Piernas/Espalda', TRUE);


-- 2. Tabla Cliente (Depende de Dirección)

INSERT INTO Cliente (dni, nombre, apellido, edad, id_direccion, email, telefono, fecha_alta, activo) VALUES
('30111222', 'Juan', 'Pérez', 34, 1, 'juan.perez@email.com', '1122334455', '2023-05-10', TRUE),
('32333444', 'María', 'Gómez', 28, 2, 'maria.g@email.com', '3415556677', '2023-06-15', TRUE),
('28555666', 'Pedro', 'Rodríguez', 42, 3, 'pedro.rod@email.com', '3514448899', '2022-11-20', FALSE), -- Cliente inactivo
('40777888', 'Sofía', 'Martínez', 22, 4, 'sofi.martinez@email.com', '2613332211', '2023-10-01', TRUE);


-- 3. Tablas transaccionales (Dependen de Cliente, Membresía y Usuario)

INSERT INTO Cliente_Membresia (id_cliente_membresia, dni_cliente, id_membresia, fecha_inicio, fecha_fin, estado) VALUES
(1, '30111222', 1, '2023-05-10', '2023-06-09', 'Vencido'),
(2, '30111222', 2, '2023-06-10', '2023-09-08', 'Activa'),
(3, '32333444', 3, '2023-06-15', '2024-06-14', 'Activa'),
(4, '28555666', 1, '2022-11-20', '2022-12-20', 'Cancelado'),
(5, '40777888', 2, '2023-10-01', '2023-12-30', 'Activa');

INSERT INTO Pago (id_pago, dni_cliente, fecha_pago, monto, metodo_pago, descripcion) VALUES
(1, '30111222', '2023-05-10', 15000.00, 'Efectivo', 'Pago mes mayo'),
(2, '30111222', '2023-06-10', 40000.00, 'Tarjeta de Crédito', 'Pago trimestre premium'),
(3, '32333444', '2023-06-15', 130000.00, 'Transferencia', 'Pago anualidad'),
(4, '28555666', '2022-11-20', 15000.00, 'Mercado Pago', 'Primer mes - canceló luego'),
(5, '40777888', '2023-10-01', 40000.00, 'Débito', 'Inscripción trimestre');

INSERT INTO Rutina (id_rutina, dni_cliente, fecha_inicio, periodo, objetivo, activa, observaciones) VALUES
(1, '30111222', '2023-06-12', 4, 'Hipertrofia Tren Superior', TRUE, 'Paciente con leve molestia en hombro izquierdo. Cuidar técnica en press.'),
(2, '32333444', '2023-06-20', 8, 'Fuerza General', TRUE, 'Rutina enfocada en levantamientos compuestos.'),
(3, '40777888', '2023-10-05', 4, 'Acondicionamiento / Pérdida de grasa', TRUE, 'Nivel principiante. Foco en adaptación anatómica.');


-- 4. Tabla de detalle (Depende de Rutina, Usuario y Ejercicio)

-- Detalle Rutina 1 (Juan Pérez - Hipertrofia Tren Superior - Asignada por Marcos)
INSERT INTO Detalle_Rutina (id_detalle, id_rutina, id_usuario, id_ejercicio, series, repeticiones, carga, descanso) VALUES
(1, 1, 3, 1, 4, 10, 60.00, '90 segundos'), -- Press de banca
(2, 1, 3, 3, 4, 8, 0.00, '90 segundos'),  -- Dominadas (peso corporal)
(3, 1, 3, 5, 3, 12, 15.00, '60 segundos'), -- Curl con barra

-- Detalle Rutina 2 (María Gómez - Fuerza General - Asignada por Lucía)
(4, 2, 4, 2, 5, 5, 80.00, '120 segundos'), -- Sentadilla
(5, 2, 4, 7, 5, 5, 90.00, '120 segundos'), -- Peso Muerto
(6, 2, 4, 4, 4, 6, 35.00, '90 segundos'),  -- Press Militar

-- Detalle Rutina 3 (Sofía Martínez - Acondicionamiento - Asignada por Marcos)
(7, 3, 3, 2, 3, 15, 20.00, '60 segundos'), -- Sentadilla (liviana)
(8, 3, 3, 6, 3, 15, 10.00, '45 segundos'); -- Polea tríceps

-- ==========================================
-- 5. Tabla Evolucion_Fisica (Depende de Cliente)
-- ==========================================

INSERT INTO Evolucion_Fisica (id_medicion, dni_cliente, fecha_medicion, peso_kg, porcentaje_grasa, observaciones) VALUES
-- Evolución física de Juan (Busca hipertrofia y pérdida de grasa)
(1, '30111222', '2023-05-10', 85.00, 22.50, 'Medición inicial. Objetivo: ganancia muscular y pérdida de grasa.'),
(2, '30111222', '2023-07-10', 83.50, 20.00, 'Buena progresión, bajó el porcentaje de grasa, se nota más tonificado.'),
(3, '30111222', '2023-10-10', 84.00, 18.50, 'Aumento de masa muscular evidente en tren superior.'),

-- Evolución física de Sofía (Busca acondicionamiento)
(4, '40777888', '2023-10-01', 65.00, 28.00, 'Medición inicial. Nivel principiante.'),
(5, '40777888', '2023-12-01', 62.50, 25.50, 'Excelente adaptación, buena reducción del tejido adiposo.');

-- ==========================================
-- 6. Tabla Registro_Entrenamiento (Depende de Cliente y Ejercicio)
-- ==========================================

INSERT INTO Registro_Entrenamiento (id_registro, dni_cliente, id_ejercicio, fecha_entrenamiento, carga_real, repeticiones_logradas) VALUES
-- Evolución de Juan (DNI 30111222) en Press de Banca (id_ejercicio = 1)
(1, '30111222', 1, '2023-06-15', 60.00, 10),
(2, '30111222', 1, '2023-07-20', 65.00, 8),
(3, '30111222', 1, '2023-09-05', 70.00, 8),
(4, '30111222', 1, '2023-11-10', 75.00, 6),

-- Evolución de María (DNI 32333444) en Sentadilla Libre (id_ejercicio = 2)
(5, '32333444', 2, '2023-06-25', 80.00, 5),
(6, '32333444', 2, '2023-08-10', 85.00, 5),
(7, '32333444', 2, '2023-10-15', 90.00, 4),
(8, '32333444', 2, '2023-12-05', 92.50, 3);
