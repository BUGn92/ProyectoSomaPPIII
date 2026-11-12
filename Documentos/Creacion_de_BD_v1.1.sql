-- ==============================================================================
-- SOMA Gym - Script Único y Definitivo de Creación de Base de Datos (DDL)
-- Base de Datos: GimnasioDB (MySQL 8.0+)
-- Incluye todas las entidades del sistema y consolidación de migraciones.
-- ==============================================================================

DROP SCHEMA IF EXISTS GimnasioDB;
CREATE SCHEMA IF NOT EXISTS GimnasioDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE GimnasioDB;

-- 1. Tablas Principales y Catálogos (Sin dependencias)

CREATE TABLE Direccion (
    id_direccion INT PRIMARY KEY AUTO_INCREMENT,
    calle VARCHAR(100),
    numero VARCHAR(20),
    ciudad VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Membresia (
    id_membresia INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    duracion_dias INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    usuario_login VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE,
    rol VARCHAR(50) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Ejercicio (
    id_ejercicio INT PRIMARY KEY AUTO_INCREMENT,
    nombre_ejercicio VARCHAR(100) NOT NULL,
    grupo_muscular VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabla Cliente (Depende de Dirección)

CREATE TABLE Cliente (
    dni VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    edad INT,
    id_direccion INT,
    email VARCHAR(100),
    telefono VARCHAR(20),
    fecha_alta DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    apto_medico_vigente BOOLEAN DEFAULT FALSE,
    fecha_vencimiento_apto DATE NULL,
    foto_url VARCHAR(255) NULL,
    FOREIGN KEY (id_direccion) REFERENCES Direccion(id_direccion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tablas Transaccionales de Membresías, Pagos y Rutinas

CREATE TABLE Cliente_Membresia (
    id_cliente_membresia INT PRIMARY KEY AUTO_INCREMENT,
    dni_cliente VARCHAR(20) NOT NULL,
    id_membresia INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) NOT NULL,
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni) ON DELETE CASCADE,
    FOREIGN KEY (id_membresia) REFERENCES Membresia(id_membresia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Pago (
    id_pago INT PRIMARY KEY AUTO_INCREMENT,
    dni_cliente VARCHAR(20) NOT NULL,
    fecha_pago DATE NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    metodo_pago VARCHAR(50),
    descripcion VARCHAR(255),
    meses_abonados INT NOT NULL DEFAULT 1,
    fecha_vencimiento_cuota DATE NULL,
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Rutina (
    id_rutina INT PRIMARY KEY AUTO_INCREMENT,
    dni_cliente VARCHAR(20) NOT NULL,
    fecha_inicio DATE NOT NULL,
    periodo INT,
    objetivo VARCHAR(100),
    activa BOOLEAN DEFAULT TRUE,
    observaciones TEXT,
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabla de Detalle de Rutina (Depende de Rutina, Usuario y Ejercicio)

CREATE TABLE Detalle_Rutina (
    id_detalle INT PRIMARY KEY AUTO_INCREMENT,
    id_rutina INT NOT NULL,
    id_usuario INT NOT NULL,
    id_ejercicio INT NOT NULL,
    dia INT NOT NULL DEFAULT 1,
    nombre_dia VARCHAR(100) NULL,
    series INT NOT NULL,
    repeticiones INT NOT NULL,
    carga DECIMAL(5, 2),
    descanso VARCHAR(50),
    FOREIGN KEY (id_rutina) REFERENCES Rutina(id_rutina) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_ejercicio) REFERENCES Ejercicio(id_ejercicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tablas de Plantillas de Rutina Prediseñadas

CREATE TABLE Plantilla_Rutina (
    id_plantilla INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    objetivo VARCHAR(100) NOT NULL,
    nivel VARCHAR(50) NOT NULL DEFAULT 'Principiante',
    dias_semana INT NOT NULL DEFAULT 3,
    duracion_estimada_min INT NOT NULL DEFAULT 50,
    observaciones TEXT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Detalle_Plantilla_Rutina (
    id_detalle_plantilla INT PRIMARY KEY AUTO_INCREMENT,
    id_plantilla INT NOT NULL,
    id_ejercicio INT NOT NULL,
    dia INT NOT NULL DEFAULT 1,
    nombre_dia VARCHAR(100) NULL,
    series INT NOT NULL,
    repeticiones INT NOT NULL,
    carga_sugerida DECIMAL(5, 2) NULL,
    descanso VARCHAR(50) NULL,
    FOREIGN KEY (id_plantilla) REFERENCES Plantilla_Rutina(id_plantilla) ON DELETE CASCADE,
    FOREIGN KEY (id_ejercicio) REFERENCES Ejercicio(id_ejercicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabla de Evolución Física

CREATE TABLE Evolucion_Fisica (
    id_medicion INT PRIMARY KEY AUTO_INCREMENT,
    dni_cliente VARCHAR(20) NOT NULL,
    fecha_medicion DATE NOT NULL,
    peso_kg DECIMAL(5, 2),
    porcentaje_grasa DECIMAL(4, 2),
    observaciones TEXT,
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabla de Registro de Entrenamiento Histórico

CREATE TABLE Registro_Entrenamiento (
    id_registro INT PRIMARY KEY AUTO_INCREMENT,
    dni_cliente VARCHAR(20) NOT NULL,
    id_ejercicio INT NOT NULL,
    fecha_entrenamiento DATE NOT NULL,
    carga_real DECIMAL(5, 2),
    repeticiones_logradas INT,
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni) ON DELETE CASCADE,
    FOREIGN KEY (id_ejercicio) REFERENCES Ejercicio(id_ejercicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabla de Check-in Digital y Control de Asistencias

CREATE TABLE Asistencia (
    id_asistencia INT PRIMARY KEY AUTO_INCREMENT,
    dni_cliente VARCHAR(20) NOT NULL,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_cuota VARCHAR(50) NULL,
    apto_medico_vigente BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni) ON DELETE CASCADE,
    INDEX idx_asistencia_dni_fecha (dni_cliente, fecha_hora),
    INDEX idx_asistencia_fecha (fecha_hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Tabla de Solicitudes de Foto de Perfil (Moderación por Staff)

CREATE TABLE Solicitud_Foto_Perfil (
    id_solicitud INT PRIMARY KEY AUTO_INCREMENT,
    dni_cliente VARCHAR(20) NOT NULL,
    foto_propuesta_url VARCHAR(255) NOT NULL,
    fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    motivo_rechazo VARCHAR(255) NULL,
    id_usuario_revisor INT NULL,
    fecha_resolucion DATETIME NULL,
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_revisor) REFERENCES Usuario(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Tabla de Novedades / Noticias (Muro de Comunicados)

CREATE TABLE Noticia (
    id_noticia INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(150) NOT NULL,
    contenido TEXT NOT NULL,
    categoria VARCHAR(50) DEFAULT 'General',
    imagen_url VARCHAR(255) NULL,
    permanente BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_publicacion DATE NOT NULL,
    id_usuario_autor INT NOT NULL,
    FOREIGN KEY (id_usuario_autor) REFERENCES Usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Tablas Complementarias (Turnos Nutricionales y Clases Grupales)

CREATE TABLE Turno_Nutricional (
    id_turno INT PRIMARY KEY AUTO_INCREMENT,
    dni_cliente VARCHAR(20) NOT NULL,
    id_usuario_nutricionista INT NOT NULL,
    fecha_turno DATE NOT NULL,
    hora_turno TIME NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    observaciones TEXT,
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_nutricionista) REFERENCES Usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Clase (
    id_clase INT PRIMARY KEY AUTO_INCREMENT,
    nombre_clase VARCHAR(50) NOT NULL,
    id_usuario_profesor INT NOT NULL,
    cupo_maximo INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_usuario_profesor) REFERENCES Usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Horario_Clase (
    id_horario INT PRIMARY KEY AUTO_INCREMENT,
    id_clase INT NOT NULL,
    dia_semana VARCHAR(15) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    FOREIGN KEY (id_clase) REFERENCES Clase(id_clase)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Inscripcion_Clase (
    id_inscripcion INT PRIMARY KEY AUTO_INCREMENT,
    dni_cliente VARCHAR(20) NOT NULL,
    id_horario INT NOT NULL,
    fecha DATE NOT NULL,
    asistio BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni) ON DELETE CASCADE,
    FOREIGN KEY (id_horario) REFERENCES Horario_Clase(id_horario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
