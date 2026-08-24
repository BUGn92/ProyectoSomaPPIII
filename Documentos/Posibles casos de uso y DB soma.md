
## Casos de uso


| ID | Caso de Uso | Actor Principal | Objetivo / Descripción |
| --- | --- | --- | --- |
| CU-01 | Registrarse | Cliente / Socio | Permitir que un nuevo cliente ingrese sus datos por primera vez en la base de datos. Incluye de forma obligatoria la actualización en la base de datos. |
| CU-02 | Actualizar Base de Datos | Sistema / Admin | (Caso incluido) Garantizar que cualquier registro o modificación impacte en la base de datos central. |
| CU-03 | Check-in Digital | Cliente / Socio | Permitir al socio registrar su ingreso diario de manera electrónica en la entrada del gimnasio. |
| CU-04 | Pago de Membresía | Cliente / Socio | Registrar el pago de la cuota del cliente a  mano mediante los distintos canales disponibles. |
| CU-05 | Agendar Turno Nutricionista | Cliente / Socio | Permitir al cliente reservar una cita para el control nutricional. Incluye la creación del turno correspondiente. |
| CU-06 | Crear Turno Nutricional | Sistema / Admin | (Caso incluido) Generar y bloquear el espacio de la cita en la agenda de la nutricionista. |
| CU-07 | Consultar Ficha / Rutina | Profesor | Permitir al profesor visualizar la rutina del alumno (que en este caso, se complementa con el fichero físico). |
| CU-08 | Actualizar Evolución de Rutina | Profesor | Registrar los cambios, avances o modificaciones en los ejercicios asignados al socio. |
| CU-09 | Registrar Evolución Nutricional | Nutricionista | Permitir a la especialista cargar las mediciones, avances y el plan alimentario de cada paciente. |
| CU-10 | Configurar Planes Especiales | Administrador | Definir las membresías personalizadas (parejas, jubilados, franjas horarias o casos particulares). |
| CU-11 | Generar Estado de Resultados | Administrador | Balancear y procesar los ingresos frente a los costos fijos/variables para calcular el punto de equilibrio económico. |



## Base de datos script


CREATE SCHEMA IF NOT EXISTS GimnasioDB

DEFAULT CHARACTER SET utf8mb4

COLLATE utf8mb4_unicode_ci;


USE GimnasioDB;


CREATE TABLE Direccion (

id_direccion INT PRIMARY KEY,

calle VARCHAR(100),

numero VARCHAR(20),

ciudad VARCHAR(50)

);


CREATE TABLE Membresia (

id_membresia INT PRIMARY KEY,

tipo VARCHAR(50) NOT NULL, -- Ej: Mensual, Premium, Fundador

precio DECIMAL(10, 2) NOT NULL,

duracion_dias INT NOT NULL

);


CREATE TABLE Usuario (

id_usuario INT PRIMARY KEY,

nombre VARCHAR(50) NOT NULL,

usuario_login VARCHAR(50) UNIQUE NOT NULL,

password VARCHAR(255) NOT NULL,

rol VARCHAR(50) NOT NULL -- Ej: Admin, Recepcionista, Entrenador

);


CREATE TABLE Ejercicio (

id_ejercicio INT PRIMARY KEY,

nombre_ejercicio VARCHAR(100) NOT NULL,

grupo_muscular VARCHAR(50) NOT NULL,

activo BOOLEAN DEFAULT TRUE

);


-- 2. Tabla Cliente (Depende de Dirección)


CREATE TABLE Cliente (

dni VARCHAR(20) PRIMARY KEY, -- Se usa VARCHAR para permitir documentos con letras o ceros a la izquierda

nombre VARCHAR(50) NOT NULL,

apellido VARCHAR(50) NOT NULL,

edad INT,

id_direccion INT,

email VARCHAR(100),

telefono VARCHAR(20),

fecha_alta DATE NOT NULL,

activo BOOLEAN DEFAULT TRUE,

FOREIGN KEY (id_direccion) REFERENCES Direccion(id_direccion)

);


-- 3. Tablas transaccionales y de relaciones (Dependen de Cliente, Membresía y Usuario)


CREATE TABLE Cliente_Membresia (

id_cliente_membresia INT PRIMARY KEY,

dni_cliente VARCHAR(20) NOT NULL,

id_membresia INT NOT NULL,

fecha_inicio DATE NOT NULL,

fecha_fin DATE NOT NULL,

estado VARCHAR(20) NOT NULL, -- Ej: Activa, Vencido, Cancelado

FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni),

FOREIGN KEY (id_membresia) REFERENCES Membresia(id_membresia)

);


CREATE TABLE Pago (

id_pago INT PRIMARY KEY,

dni_cliente VARCHAR(20) NOT NULL,

fecha_pago DATE NOT NULL,

monto DECIMAL(10, 2) NOT NULL,

metodo_pago VARCHAR(50),

descripcion VARCHAR(255),

FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni)

);


CREATE TABLE Rutina (

id_rutina INT PRIMARY KEY,

dni_cliente VARCHAR(20) NOT NULL,

fecha_inicio DATE NOT NULL,

periodo INT, -- Puede representar días o semanas

objetivo VARCHAR(100),

activa BOOLEAN DEFAULT TRUE,

observaciones TEXT,

FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni)

);


-- 4. Tabla de detalle (Depende de Rutina, Usuario y Ejercicio)


CREATE TABLE Detalle_Rutina (

id_detalle INT PRIMARY KEY,

id_rutina INT NOT NULL,

id_usuario INT NOT NULL, -- El entrenador que asignó el ejercicio

id_ejercicio INT NOT NULL,

series INT NOT NULL,

repeticiones INT NOT NULL,

carga DECIMAL(5, 2), -- Peso a levantar, si aplica

descanso VARCHAR(50), -- Ej: "60 segundos"

FOREIGN KEY (id_rutina) REFERENCES Rutina(id_rutina),

FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),

FOREIGN KEY (id_ejercicio) REFERENCES Ejercicio(id_ejercicio)

);



## Script INSERT datos


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










Consultas


### 1. Clientes con membresías vencidas (Atrasados con los pagos)

Esta consulta cruza los datos del cliente con su historial de membresías para filtrar aquellos cuyo estado sea "Vencido" o cuya fecha de fin ya haya pasado.

SELECT

c.dni,

c.nombre,

c.apellido,

cm.fecha_inicio,

cm.fecha_fin,

cm.estado

FROM Cliente c

INNER JOIN Cliente_Membresia cm ON c.dni = cm.dni_cliente

WHERE cm.estado = 'Vencido' OR cm.fecha_fin < CURRENT_DATE;



### 2. Historial de pagos de un cliente específico

Si un cliente (por ejemplo, el del DNI '30111222') viene a recepción a reclamar o consultar sus pagos, puedes usar esta consulta para ver todo su historial ordenado por fecha, desde el más reciente al más antiguo.

SELECT

p.id_pago,

p.fecha_pago,

p.monto,

p.metodo_pago,

p.descripcion

FROM Pago p

WHERE p.dni_cliente = '30111222' -- Puedes cambiar este DNI para probar con otros

ORDER BY p.fecha_pago DESC;



### 3. Rutina activa de los clientes con el detalle de sus ejercicios

Esta es una consulta un poco más compleja (usa varios JOIN) que te permite ver exactamente qué tiene que hacer un cliente en el gimnasio el día de hoy, cruzando la rutina, el detalle y el catálogo de ejercicios

SELECT

c.nombre AS nombre_cliente,

c.apellido,

r.objetivo,

e.nombre_ejercicio,

dr.series,

dr.repeticiones,

dr.carga,

dr.descanso

FROM Cliente c

INNER JOIN Rutina r ON c.dni = r.dni_cliente

INNER JOIN Detalle_Rutina dr ON r.id_rutina = dr.id_rutina

INNER JOIN Ejercicio e ON dr.id_ejercicio = e.id_ejercicio

WHERE r.activa = TRUE;



### 4. Recaudación total agrupada por método de pago

Ideal para el cierre de caja o balances mensuales. Esta consulta suma todos los pagos y los agrupa para saber cuánto entró por efectivo, cuánto por tarjeta, etc..

SELECT

metodo_pago,

SUM(monto) AS recaudacion_total,

COUNT(id_pago) AS cantidad_de_pagos

FROM Pago

GROUP BY metodo_pago

ORDER BY recaudacion_total DESC;



### 5. Clientes activos que NO tienen una membresía asignada actualmente

A veces en los sistemas quedan clientes dados de alta ("activos" en el sistema) pero que por algún error humano no se les vinculó ninguna membresía. Esta consulta usa una subconsulta para encontrar esos casos aislados.

SELECT

dni,

nombre,

apellido,

telefono,

fecha_alta

FROM Cliente

WHERE activo = TRUE

AND dni NOT IN (

SELECT dni_cliente

FROM Cliente_Membresia

WHERE estado = 'Activa'

);


