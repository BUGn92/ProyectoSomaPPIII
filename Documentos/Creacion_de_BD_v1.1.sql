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

-- 5. Tabla de evolucion fisica 
-- Esta tabla te permitirá registrar el estado físico del cliente a lo largo del tiempo

CREATE TABLE Evolucion_Fisica (
    id_medicion INT PRIMARY KEY AUTO_INCREMENT,
    dni_cliente VARCHAR(20) NOT NULL,
    fecha_medicion DATE NOT NULL,
    peso_kg DECIMAL(5, 2),
    porcentaje_grasa DECIMAL(4, 2),
    observaciones TEXT,
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni)
);

-- 6 Tabla para la evolucion deportiva 
-- Esta tabla se utilizaría para que el cliente (o el entrenador) anote cuánto peso 
-- levantó realmente en una fecha específica, permitiendo ver su progreso temporal respecto a 
-- la rutina original. 

CREATE TABLE Registro_Entrenamiento (
    id_registro INT PRIMARY KEY AUTO_INCREMENT,
    dni_cliente VARCHAR(20) NOT NULL,
    id_ejercicio INT NOT NULL,
    fecha_entrenamiento DATE NOT NULL,
    carga_real DECIMAL(5, 2), -- El peso que realmente logró levantar ese día
    repeticiones_logradas INT,
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni),
    FOREIGN KEY (id_ejercicio) REFERENCES Ejercicio(id_ejercicio)
);
