#!/usr/bin/env python3
"""
Generador determinístico de datos iniciales (Seed) para SOMA Gym (GimnasioDB).
Genera:
- 4 usuarios de personal (Admin, Recepcionista, 2 Entrenadores)
- 4 planes de membresía
- 15 ejercicios en catálogo + 4 plantillas de rutina prediseñadas
- 42 socios (40 activos + 2 dados de baja lógica), preservando intacto el usuario DNI 37016902
- 12 meses de historial para cada socio activo:
  * 12 pagos mensuales y membresías (con estados Al día, Por vencer y Vencido)
  * 12 rutinas mensuales (cambios de objetivo cada 4 meses y progresión de cargas para gráficos y PR 3M)
  * 12 mediciones de evolución física (peso y % grasa corporal)
  * Historial de asistencias (incluyendo asistencias hoy, últimos 30 días y socios con >15 días de inactividad)
  * Muro de noticias (incluyendo noticias permanentes y generales)

Exporta todos los INSERTs a `Documentos/carga_de_datos_v1.1.sql` y opcionalmente los aplica en MySQL.
"""

import os
import sys
import random
import subprocess
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SQL_SCHEMA_PATH = os.path.join(ROOT_DIR, "Documentos", "Creacion_de_BD_v1.1.sql")
SQL_SEED_PATH = os.path.join(ROOT_DIR, "Documentos", "carga_de_datos_v1.1.sql")

# Hash SHA-256 usado en los usuarios de prueba existentes (clave '123456' / estándar del repo)
DEFAULT_CLIENT_HASH = "86b4d07558aaafc1d468cb56efeb860cc1f994d9265feb03cda1653817585f8d"


def sql_val(val) -> str:
    """Convierte un valor de Python a su representación literal segura en SQL."""
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, datetime):
        return f"'{val.strftime('%Y-%m-%d %H:%M:%S')}'"
    if isinstance(val, date):
        return f"'{val.strftime('%Y-%m-%d')}'"
    escaped = str(val).replace("\\", "\\\\").replace("'", "''")
    return f"'{escaped}'"


def build_seed_sql() -> str:
    rng = random.Random(20261112)
    today = date.today()
    now_dt = datetime.now().replace(second=0, microsecond=0)

    lines = [
        "-- ==============================================================================",
        "-- SOMA Gym - Script Único de Carga Inicial de Datos (Seed Completo)",
        f"-- Generado automáticamente con 42 socios y 12 meses de historial (Base: {today.isoformat()})",
        "-- ==============================================================================",
        "",
        "USE GimnasioDB;",
        "SET FOREIGN_KEY_CHECKS = 0;",
        "START TRANSACTION;",
        "",
    ]

    # -------------------------------------------------------------------------
    # 1. Membresías
    # -------------------------------------------------------------------------
    lines.append("-- 1. Catálogo de Membresías")
    lines.append("INSERT INTO Membresia (id_membresia, tipo, precio, duracion_dias) VALUES")
    membresias = [
        (1, "Mensual", 15000.00, 30),
        (2, "Trimestral Premium", 40000.00, 90),
        (3, "Anual VIP", 130000.00, 365),
        (4, "Pase Diario", 1500.00, 1),
    ]
    lines.append(",\n".join(
        f"({m[0]}, {sql_val(m[1])}, {m[2]:.2f}, {m[3]})" for m in membresias
    ) + ";\n")

    # -------------------------------------------------------------------------
    # 2. Ejercicios (7 originales + 8 adicionales)
    # -------------------------------------------------------------------------
    lines.append("-- 2. Catálogo de Ejercicios")
    lines.append("INSERT INTO Ejercicio (id_ejercicio, nombre_ejercicio, grupo_muscular, activo) VALUES")
    ejercicios = [
        (1, "Press de Banca Plano", "Pecho", True),
        (2, "Sentadilla Libre con Barra", "Piernas", True),
        (3, "Dominadas", "Espalda", True),
        (4, "Press Militar", "Hombros", True),
        (5, "Curl con barra", "Bíceps", True),
        (6, "Extensiones en polea", "Tríceps", True),
        (7, "Peso Muerto", "Piernas/Espalda", True),
        (8, "Remo con Barra Prono", "Espalda", True),
        (9, "Prensa de Piernas 45°", "Piernas", True),
        (10, "Press Inclinado con Mancuernas", "Pecho", True),
        (11, "Elevaciones Laterales", "Hombros", True),
        (12, "Hip Thrust con Barra", "Glúteos/Piernas", True),
        (13, "Jalón al Pecho en Polea", "Espalda", True),
        (14, "Curl Femoral Acostado", "Piernas", True),
        (15, "Fondos en Paralelas", "Pecho/Tríceps", True),
    ]
    lines.append(",\n".join(
        f"({e[0]}, {sql_val(e[1])}, {sql_val(e[2])}, {sql_val(e[3])})" for e in ejercicios
    ) + ";\n")

    # -------------------------------------------------------------------------
    # 3. Plantillas de Rutina Prediseñadas
    # -------------------------------------------------------------------------
    lines.append("-- 3. Plantillas de Rutina Prediseñadas")
    lines.append(
        "INSERT INTO Plantilla_Rutina (id_plantilla, nombre, objetivo, nivel, dias_semana, duracion_estimada_min, observaciones, activo) VALUES"
    )
    plantillas = [
        (
            1,
            "Iniciación y Acondicionamiento (3 Días)",
            "Iniciación / Acondicionamiento Físico General",
            "Principiante",
            3,
            50,
            "Rutina full-body de 3 días para adaptación anatómica y técnica. Calentamiento previo de 8-10 min y vuelta a la calma de 5 min. Cargas moderadas (RPE 6-7).",
            True,
        ),
        (
            2,
            "Pérdida de Peso y Tonificación (3 Días)",
            "Pérdida de Peso / Tonificación",
            "Principiante / Intermedio",
            3,
            45,
            "Rutina dinámica de alta densidad metabólica para optimizar gasto calórico. Respetar descansos cortos de 45 a 60 segundos.",
            True,
        ),
        (
            3,
            "Musculación e Hipertrofia (4 Días)",
            "Hipertrofia Muscular",
            "Intermedio",
            4,
            55,
            "Distribución torso/pierna para sobrecarga progresiva y volumen efectivo. Descansos controlados de 90 segundos.",
            True,
        ),
        (
            4,
            "Fuerza y Halterofilia (3 Días)",
            "Fuerza / Halterofilia",
            "Avanzado",
            3,
            60,
            "Enfoque en levantamientos básicos pesados multiarticulares. Descansos completos de 2 minutos para reposición energética.",
            True,
        ),
    ]
    lines.append(",\n".join(
        f"({p[0]}, {sql_val(p[1])}, {sql_val(p[2])}, {sql_val(p[3])}, {p[4]}, {p[5]}, {sql_val(p[6])}, {sql_val(p[7])})"
        for p in plantillas
    ) + ";\n")

    detalles_plantilla = [
        # Plantilla 1: Iniciación (3 Días)
        (1, 2, 1, "Día 1 - Full Body A", 3, 10, 20.00, "90 seg"),
        (1, 1, 1, "Día 1 - Full Body A", 3, 10, 25.00, "90 seg"),
        (1, 3, 1, "Día 1 - Full Body A", 3, 10, 0.00, "60 seg"),
        (1, 4, 1, "Día 1 - Full Body A", 3, 10, 15.00, "60 seg"),
        (1, 6, 1, "Día 1 - Full Body A", 3, 12, 15.00, "60 seg"),
        (1, 7, 2, "Día 2 - Full Body B", 3, 10, 30.00, "90 seg"),
        (1, 3, 2, "Día 2 - Full Body B", 3, 8, 0.00, "90 seg"),
        (1, 1, 2, "Día 2 - Full Body B", 3, 12, 20.00, "60 seg"),
        (1, 4, 2, "Día 2 - Full Body B", 3, 10, 15.00, "60 seg"),
        (1, 5, 2, "Día 2 - Full Body B", 3, 12, 15.00, "60 seg"),
        (1, 2, 3, "Día 3 - Full Body C", 3, 12, 20.00, "90 seg"),
        (1, 1, 3, "Día 3 - Full Body C", 3, 10, 25.00, "90 seg"),
        (1, 3, 3, "Día 3 - Full Body C", 3, 10, 0.00, "90 seg"),
        (1, 5, 3, "Día 3 - Full Body C", 3, 12, 15.00, "60 seg"),
        (1, 6, 3, "Día 3 - Full Body C", 3, 12, 15.00, "60 seg"),
        # Plantilla 2: Pérdida de Peso (3 Días)
        (2, 2, 1, "Día 1 - Circuito Metabólico A", 4, 15, 20.00, "45 seg"),
        (2, 1, 1, "Día 1 - Circuito Metabólico A", 3, 12, 20.00, "45 seg"),
        (2, 3, 1, "Día 1 - Circuito Metabólico A", 3, 10, 0.00, "45 seg"),
        (2, 6, 1, "Día 1 - Circuito Metabólico A", 3, 15, 10.00, "45 seg"),
        (2, 7, 2, "Día 2 - Circuito Metabólico B", 4, 12, 30.00, "60 seg"),
        (2, 4, 2, "Día 2 - Circuito Metabólico B", 3, 12, 15.00, "45 seg"),
        (2, 5, 2, "Día 2 - Circuito Metabólico B", 3, 15, 10.00, "45 seg"),
        (2, 6, 2, "Día 2 - Circuito Metabólico B", 3, 15, 10.00, "45 seg"),
        (2, 2, 3, "Día 3 - Circuito Metabólico C", 3, 15, 25.00, "45 seg"),
        (2, 3, 3, "Día 3 - Circuito Metabólico C", 3, 12, 0.00, "45 seg"),
        (2, 1, 3, "Día 3 - Circuito Metabólico C", 3, 12, 20.00, "45 seg"),
        (2, 5, 3, "Día 3 - Circuito Metabólico C", 3, 15, 10.00, "45 seg"),
        # Plantilla 3: Hipertrofia (4 Días)
        (3, 1, 1, "Día 1 - Torso Fuerza", 4, 8, 50.00, "90 seg"),
        (3, 3, 1, "Día 1 - Torso Fuerza", 4, 8, 0.00, "90 seg"),
        (3, 4, 1, "Día 1 - Torso Fuerza", 3, 10, 25.00, "90 seg"),
        (3, 5, 1, "Día 1 - Torso Fuerza", 3, 10, 20.00, "60 seg"),
        (3, 2, 2, "Día 2 - Pierna Completa", 4, 8, 60.00, "90 seg"),
        (3, 7, 2, "Día 2 - Pierna Completa", 3, 8, 60.00, "90 seg"),
        (3, 6, 2, "Día 2 - Pierna Completa", 3, 12, 20.00, "60 seg"),
        (3, 3, 3, "Día 3 - Torso Hipertrofia", 4, 10, 0.00, "90 seg"),
        (3, 1, 3, "Día 3 - Torso Hipertrofia", 4, 10, 45.00, "90 seg"),
        (3, 4, 3, "Día 3 - Torso Hipertrofia", 3, 8, 30.00, "90 seg"),
        (3, 6, 3, "Día 3 - Torso Hipertrofia", 3, 10, 25.00, "60 seg"),
        (3, 7, 4, "Día 4 - Pierna Posterior", 4, 6, 70.00, "90 seg"),
        (3, 2, 4, "Día 4 - Pierna Posterior", 4, 10, 50.00, "90 seg"),
        (3, 5, 4, "Día 4 - Pierna Posterior", 3, 10, 20.00, "60 seg"),
        # Plantilla 4: Fuerza (3 Días)
        (4, 2, 1, "Día 1 - Sentadilla + Empuje", 5, 5, 75.00, "120 seg"),
        (4, 1, 1, "Día 1 - Sentadilla + Empuje", 5, 5, 65.00, "120 seg"),
        (4, 3, 1, "Día 1 - Sentadilla + Empuje", 3, 6, 0.00, "90 seg"),
        (4, 7, 2, "Día 2 - Peso Muerto + Hombro", 5, 5, 85.00, "120 seg"),
        (4, 4, 2, "Día 2 - Peso Muerto + Hombro", 5, 5, 40.00, "120 seg"),
        (4, 5, 2, "Día 2 - Peso Muerto + Hombro", 3, 8, 25.00, "90 seg"),
        (4, 2, 3, "Día 3 - Básicos Pesados", 4, 4, 80.00, "120 seg"),
        (4, 1, 3, "Día 3 - Básicos Pesados", 4, 4, 70.00, "120 seg"),
        (4, 7, 3, "Día 3 - Básicos Pesados", 3, 4, 90.00, "120 seg"),
    ]
    lines.append(
        "INSERT INTO Detalle_Plantilla_Rutina (id_detalle_plantilla, id_plantilla, id_ejercicio, dia, nombre_dia, series, repeticiones, carga_sugerida, descanso) VALUES"
    )
    lines.append(",\n".join(
        f"({idx}, {d[0]}, {d[1]}, {d[2]}, {sql_val(d[3])}, {d[4]}, {d[5]}, {d[6]:.2f}, {sql_val(d[7])})"
        for idx, d in enumerate(detalles_plantilla, start=1)
    ) + ";\n")

    # -------------------------------------------------------------------------
    # 4. Definición de los 42 Socios (40 activos + 2 inactivos)
    # -------------------------------------------------------------------------
    # El primero es exactamente el socio DNI 37016902 solicitado por el usuario
    socios_raw = [
        # (dni, nombre, apellido, edad, email, telefono, calle, numero, ciudad, password_hash, foto_url, activo)
        (
            "37016902",
            "Agustin",
            "Bugnoni",
            34,
            "agustin.j.bugnoni@gmail.com",
            "01149140450",
            "tucuman",
            "5545",
            "1452",
            "86b4d07558aaafc1d468cb56efeb860cc1f994d9265feb03cda1653817585f8d",
            "/uploads/perfiles/d9f74040a9f84c8b978db7e8deccad9f.jpeg",
            True,
        ),
        ("30111222", "Juan", "Pérez", 34, "juan.perez@email.com", "1122334455", "Av. Corrientes", "1234", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("32333444", "María", "Gómez", 28, "maria.g@email.com", "3415556677", "San Martín", "450", "Rosario", DEFAULT_CLIENT_HASH, None, True),
        ("40777888", "Sofía", "Martínez", 22, "sofi.martinez@email.com", "2613332211", "Sarmiento", "210", "Mendoza", DEFAULT_CLIENT_HASH, None, True),
        ("44143415", "Lolo", "Zarate", 24, "lolo.zarate@email.com", "1144556677", "Av. Santa Fe", "3210", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("17895937", "Silvia", "Rocchi", 52, "silvia.rocchi@email.com", "1155667788", "Av. Cabildo", "2150", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("35100201", "Lucas", "Fernández", 31, "lucas.fernandez@email.com", "1160011001", "Av. Rivadavia", "4520", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("36200302", "Camila", "López", 27, "camila.lopez@email.com", "1160011002", "Callao", "890", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("38300403", "Mateo", "González", 25, "mateo.gonzalez@email.com", "1160011003", "Av. Córdoba", "1950", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("39400504", "Valentina", "Díaz", 24, "valentina.diaz@email.com", "1160011004", "Scalabrini Ortiz", "1120", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("33500605", "Nicolás", "Sánchez", 36, "nicolas.sanchez@email.com", "1160011005", "Av. Belgrano", "1420", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("41600706", "Martina", "Romero", 21, "martina.romero@email.com", "1160011006", "Thames", "1740", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("34700807", "Santiago", "Sosa", 33, "santiago.sosa@email.com", "1160011007", "Gurruchaga", "940", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("37800908", "Julieta", "Torres", 29, "julieta.torres@email.com", "1160011008", "Malabia", "1630", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("31901009", "Facundo", "Álvarez", 38, "facundo.alvarez@email.com", "1160011009", "Av. Las Heras", "2890", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("42011110", "Agustina", "Ruiz", 23, "agustina.ruiz@email.com", "1160011010", "Av. Pueyrredón", "1340", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("36121211", "Tomás", "Ramírez", 30, "tomas.ramirez@email.com", "1160011011", "Juncal", "2110", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("39231312", "Florencia", "Flores", 26, "florencia.flores@email.com", "1160011012", "Arenales", "1870", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("33341413", "Joaquín", "Acosta", 35, "joaquin.acosta@email.com", "1160011013", "Billinghurst", "1290", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("40451514", "Micaela", "Benítez", 24, "micaela.benitez@email.com", "1160011014", "Bulnes", "1560", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("35561615", "Lautaro", "Medina", 32, "lautaro.medina@email.com", "1160011015", "Vidt", "2010", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("38671716", "Antonella", "Suárez", 27, "antonella.suarez@email.com", "1160011016", "Jerónimo Salguero", "1780", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("32781817", "Franco", "Herrera", 37, "franco.herrera@email.com", "1160011017", "Medrano", "920", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("41891918", "Bautista", "Aguirre", 22, "bautista.aguirre@email.com", "1160011018", "Acoyte", "640", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("34902019", "Carolina", "Pereyra", 33, "carolina.pereyra@email.com", "1160011019", "Av. La Plata", "810", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("37012120", "Ignacio", "Gutiérrez", 29, "ignacio.gutierrez@email.com", "1160011020", "Av. Boedo", "1120", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("43122221", "Milagros", "Giménez", 20, "milagros.gimenez@email.com", "1160011021", "Av. Independencia", "2340", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("31232322", "Ramiro", "Molina", 39, "ramiro.molina@email.com", "1160011022", "Av. San Juan", "1980", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("36342423", "Rocío", "Silva", 30, "rocio.silva@email.com", "1160011023", "Defensa", "750", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("39452524", "Ezequiel", "Castro", 26, "ezequiel.castro@email.com", "1160011024", "Perú", "610", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("33562625", "Luciana", "Rojas", 35, "luciana.rojas@email.com", "1160011025", "Chacabuco", "490", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("40672726", "Gonzalo", "Ortiz", 25, "gonzalo.ortiz@email.com", "1160011026", "Piedras", "830", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("35782827", "Brenda", "Núñez", 31, "brenda.nunez@email.com", "1160011027", "Tacuarí", "1050", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("38892928", "Federico", "Luna", 28, "federico.luna@email.com", "1160011028", "Bernardo de Irigoyen", "720", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("32903029", "Paula", "Juárez", 36, "paula.juarez@email.com", "1160011029", "Lima", "540", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("41013130", "Sebastián", "Cabrera", 23, "sebastian.cabrera@email.com", "1160011030", "Cerrito", "980", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("34123231", "Daniela", "Ríos", 34, "daniela.rios@email.com", "1160011031", "Libertad", "1120", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("37233332", "Maximiliano", "Morales", 29, "maximiliano.morales@email.com", "1160011032", "Talcahuano", "860", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("42343433", "Candela", "Domínguez", 21, "candela.dominguez@email.com", "1160011033", "Uruguay", "740", "CABA", DEFAULT_CLIENT_HASH, None, True),
        ("30453534", "Hernán", "Vega", 40, "hernan.vega@email.com", "1160011034", "Paraná", "910", "CABA", DEFAULT_CLIENT_HASH, None, True),
        # 2 socios dados de baja lógica (activo = False) para pruebas de filtros y re-alta
        ("28555666", "Pedro", "Rodríguez", 42, "pedro.rod@email.com", "3514448899", "Belgrano", "890", "Córdoba", DEFAULT_CLIENT_HASH, None, False),
        ("29666777", "Valeria", "Paz", 41, "valeria.paz@email.com", "1160011040", "Montevideo", "670", "CABA", DEFAULT_CLIENT_HASH, None, False),
    ]

    # -------------------------------------------------------------------------
    # 5. Direcciones
    # -------------------------------------------------------------------------
    lines.append("-- 4. Direcciones de Socios")
    lines.append("INSERT INTO Direccion (id_direccion, calle, numero, ciudad) VALUES")
    lines.append(",\n".join(
        f"({idx}, {sql_val(s[6])}, {sql_val(s[7])}, {sql_val(s[8])})"
        for idx, s in enumerate(socios_raw, start=1)
    ) + ";\n")

    # -------------------------------------------------------------------------
    # 6. Usuarios (4 Staff + 42 Socios)
    # -------------------------------------------------------------------------
    lines.append("-- 5. Usuarios del Sistema (Staff y Socios)")
    lines.append(
        "INSERT INTO Usuario (id_usuario, nombre, usuario_login, password, debe_cambiar_password, rol, activo) VALUES"
    )
    usuarios_rows = [
        f"(1, 'Carlos Admin', 'cadmin', 'hash_falso_123', FALSE, 'Admin', TRUE)",
        f"(2, 'Ana López', 'alopez', 'hash_falso_456', FALSE, 'Recepcionista', TRUE)",
        f"(3, 'Marcos Fuerte', 'mfuerte', 'hash_falso_789', FALSE, 'Entrenador', TRUE)",
        f"(4, 'Lucía Fit', 'lfit', 'hash_falso_101', FALSE, 'Entrenador', TRUE)",
    ]
    for idx, s in enumerate(socios_raw, start=5):
        dni, nombre, apellido, _, _, _, _, _, _, pwd_hash, _, activo = s
        full_name = f"{nombre} {apellido}"
        usuarios_rows.append(
            f"({idx}, {sql_val(full_name)}, {sql_val(dni)}, {sql_val(pwd_hash)}, FALSE, 'Cliente', {sql_val(activo)})"
        )
    lines.append(",\n".join(usuarios_rows) + ";\n")

    # -------------------------------------------------------------------------
    # 7. Clientes
    # -------------------------------------------------------------------------
    lines.append("-- 6. Clientes (Socios)")
    lines.append(
        "INSERT INTO Cliente (dni, nombre, apellido, edad, id_direccion, email, telefono, fecha_alta, activo, apto_medico_vigente, fecha_vencimiento_apto, foto_url) VALUES"
    )
    clientes_rows = []
    fecha_alta_base = today - relativedelta(months=12)
    for idx, s in enumerate(socios_raw, start=1):
        dni, nombre, apellido, edad, email, telefono, _, _, _, _, foto_url, activo = s
        # Los primeros 36 activos tienen apto médico vigente; 4 activos tienen apto vencido para probar alertas
        apto_vigente = True if (idx <= 36 and activo) else False
        venc_apto = (today + relativedelta(months=8) + timedelta(days=idx % 20)) if apto_vigente else (today - timedelta(days=15 + idx))
        fecha_alta = fecha_alta_base - timedelta(days=idx % 10)
        clientes_rows.append(
            f"({sql_val(dni)}, {sql_val(nombre)}, {sql_val(apellido)}, {edad}, {idx}, {sql_val(email)}, "
            f"{sql_val(telefono)}, {sql_val(fecha_alta)}, {sql_val(activo)}, {sql_val(apto_vigente)}, "
            f"{sql_val(venc_apto)}, {sql_val(foto_url)})"
        )
    lines.append(",\n".join(clientes_rows) + ";\n")

    # -------------------------------------------------------------------------
    # 8. Historial de 12 Meses: Pagos, Membresías, Rutinas, Detalle_Rutina,
    #    Registro_Entrenamiento, Evolución Física y Asistencias
    # -------------------------------------------------------------------------
    pagos_rows = []
    membresias_cliente_rows = []
    rutinas_rows = []
    detalles_rutina_rows = []
    registros_entrenamiento_rows = []
    evolucion_fisica_rows = []
    asistencias_rows = []

    pago_id = 1
    cm_id = 1
    rutina_id = 1
    detalle_id = 1
    registro_id = 1
    medicion_id = 1
    asistencia_id = 1

    metodos_pago = ["Efectivo", "Transferencia", "Mercado Pago", "Débito", "Tarjeta de Crédito"]

    # Bloques de objetivos y ejercicios para simular progresión a lo largo de 12 meses
    fases_rutina = [
        (
            "Iniciación y Adaptación Anatómica",
            [
                (1, "Día 1 - Cuerpo Completo A", [(2, 3, 12, 30.0), (1, 3, 12, 25.0), (13, 3, 12, 30.0), (4, 3, 12, 15.0)]),
                (2, "Día 2 - Cuerpo Completo B", [(7, 3, 10, 35.0), (10, 3, 12, 12.5), (8, 3, 12, 25.0), (5, 3, 12, 12.5)]),
                (3, "Día 3 - Cuerpo Completo C", [(9, 3, 15, 60.0), (1, 3, 10, 27.5), (3, 3, 8, 0.0), (6, 3, 12, 15.0)]),
            ],
        ),
        (
            "Hipertrofia Muscular Progresiva",
            [
                (1, "Día 1 - Torso Empuje/Tracción", [(1, 4, 10, 35.0), (8, 4, 10, 35.0), (4, 4, 10, 20.0), (5, 3, 12, 15.0)]),
                (2, "Día 2 - Pierna Cuádriceps/Glúteo", [(2, 4, 10, 45.0), (9, 4, 12, 90.0), (12, 4, 12, 50.0), (14, 3, 12, 30.0)]),
                (3, "Día 3 - Torso Volumen", [(10, 4, 10, 17.5), (3, 4, 8, 5.0), (11, 4, 15, 8.0), (6, 3, 12, 20.0)]),
                (4, "Día 4 - Pierna Cadena Posterior", [(7, 4, 8, 55.0), (2, 3, 10, 42.5), (12, 4, 10, 55.0), (14, 3, 12, 32.5)]),
            ],
        ),
        (
            "Fuerza e Hipertrofia Avanzada",
            [
                (1, "Día 1 - Fuerza Tren Superior", [(1, 5, 6, 45.0), (8, 4, 8, 45.0), (4, 4, 8, 25.0), (15, 3, 10, 10.0)]),
                (2, "Día 2 - Fuerza Tren Inferior", [(2, 5, 6, 60.0), (7, 4, 6, 70.0), (9, 4, 10, 120.0), (14, 3, 10, 37.5)]),
                (3, "Día 3 - Hipertrofia Complementaria", [(10, 4, 8, 22.5), (3, 4, 8, 10.0), (12, 4, 10, 70.0), (5, 3, 10, 20.0)]),
            ],
        ),
    ]

    for idx, s in enumerate(socios_raw, start=1):
        dni, nombre, apellido, edad, _, _, _, _, _, _, _, activo = s

        if not activo:
            # Socio inactivo: 1 pago antiguo y membresía cancelada
            fecha_antigua = today - relativedelta(months=14)
            venc_antiguo = fecha_antigua + timedelta(days=30)
            pagos_rows.append(
                f"({pago_id}, {sql_val(dni)}, {sql_val(fecha_antigua)}, 15000.00, 'Efectivo', 'Cuota inicial (dado de baja)', 1, {sql_val(venc_antiguo)})"
            )
            pago_id += 1
            membresias_cliente_rows.append(
                f"({cm_id}, {sql_val(dni)}, 1, {sql_val(fecha_antigua)}, {sql_val(venc_antiguo)}, 'Cancelado')"
            )
            cm_id += 1
            continue

        # Determinar perfil de vencimiento del último pago para cubrir todos los estados de cuota:
        # idx 1..32 -> Al día (vence entre +10 y +28 días)
        # idx 33..36 -> Por vencer (vence en +1 a +4 días)
        # idx 37..40 -> Vencido (venció hace 4 a 12 días)
        if idx <= 32:
            dias_offset_ultimo_venc = 12 + (idx % 16)
            estado_cm_actual = "Activa"
            estado_cuota_texto = "Al día"
        elif idx <= 36:
            dias_offset_ultimo_venc = idx - 32  # 1, 2, 3, 4 días
            estado_cm_actual = "Activa"
            estado_cuota_texto = "Por vencer"
        else:
            dias_offset_ultimo_venc = -(idx - 33)  # -4 a -7 días (vencido)
            estado_cm_actual = "Vencido"
            estado_cuota_texto = "Vencida"

        ultimo_vencimiento = today + timedelta(days=dias_offset_ultimo_venc)
        metodo = metodos_pago[idx % len(metodos_pago)]
        entrenador_id = 3 if (idx % 2 == 1) else 4

        # Base de peso y grasa inicial según el socio
        peso_base = 62.0 + (idx % 28) * 1.1
        grasa_base = 24.0 - (idx % 8) * 0.7
        factor_fuerza = 0.85 + (idx % 10) * 0.06

        # Generar los 12 meses (m = 11 hacia atrás hasta m = 0 mes actual)
        for m in range(11, -1, -1):
            mes_num = 12 - m  # 1..12
            fecha_venc_mes = ultimo_vencimiento - relativedelta(months=m)
            fecha_pago_mes = fecha_venc_mes - relativedelta(months=1)
            if fecha_pago_mes > today:
                fecha_pago_mes = today - timedelta(days=m * 28)

            # 8.1 Pago mensual
            pagos_rows.append(
                f"({pago_id}, {sql_val(dni)}, {sql_val(fecha_pago_mes)}, 15000.00, {sql_val(metodo)}, "
                f"{sql_val(f'Cuota mensual #{mes_num}/12')}, 1, {sql_val(fecha_venc_mes)})"
            )
            pago_id += 1

            # 8.2 Cliente_Membresia
            es_ultimo_mes = (m == 0)
            estado_mes = estado_cm_actual if es_ultimo_mes else "Vencido"
            membresias_cliente_rows.append(
                f"({cm_id}, {sql_val(dni)}, 1, {sql_val(fecha_pago_mes)}, {sql_val(fecha_venc_mes)}, {sql_val(estado_mes)})"
            )
            cm_id += 1

            # 8.3 Rutina mensual (1 por mes para alimentar el historial de 12 meses de Mi Progreso / Cargas Deportivas)
            fase_idx = 0 if mes_num <= 4 else (1 if mes_num <= 8 else 2)
            objetivo_fase, dias_definicion = fases_rutina[fase_idx]
            fecha_rutina_mes = (today.replace(day=5) - relativedelta(months=m))
            if fecha_rutina_mes > today:
                fecha_rutina_mes = today

            activa_flag = True if es_ultimo_mes else False
            obs_rutina = (
                f"Plan mensual {mes_num}/12 ({fecha_rutina_mes.strftime('%Y-%m')}) - Fase: {objetivo_fase}. "
                f"Control de sobrecarga progresiva."
            )
            rutinas_rows.append(
                f"({rutina_id}, {sql_val(dni)}, {sql_val(fecha_rutina_mes)}, 4, {sql_val(objetivo_fase)}, "
                f"{sql_val(activa_flag)}, {sql_val(obs_rutina)})"
            )

            # Curva de progresión de carga a lo largo de los 12 meses:
            # Sube progresivamente del mes 1 al 9, alcanza un pico en el mes 10, descarga leve en mes 11 y sube en mes 12
            if mes_num <= 9:
                incremento_kg = (mes_num - 1) * 2.5
            elif mes_num == 10:
                incremento_kg = 25.0  # Pico PR dentro de la ventana de los últimos 3 meses (meses 10, 11, 12)
            elif mes_num == 11:
                incremento_kg = 20.0  # Descarga controlada
            else:
                incremento_kg = 22.5  # Mes actual

            for dia_num, nombre_dia, lista_ej in dias_definicion:
                for ej_id, series, reps, carga_base_ej in lista_ej:
                    carga_mes = round((carga_base_ej * factor_fuerza) + incremento_kg, 1) if carga_base_ej > 0 else 0.0
                    detalles_rutina_rows.append(
                        f"({detalle_id}, {rutina_id}, {entrenador_id}, {ej_id}, {dia_num}, {sql_val(nombre_dia)}, "
                        f"{series}, {reps}, {carga_mes:.2f}, '90 seg')"
                    )
                    detalle_id += 1

                    # Guardar registro de entrenamiento de los 2 ejercicios principales en cada mes
                    if ej_id in (1, 2, 7):
                        registros_entrenamiento_rows.append(
                            f"({registro_id}, {sql_val(dni)}, {ej_id}, {sql_val(fecha_rutina_mes)}, {carga_mes:.2f}, {reps})"
                        )
                        registro_id += 1

            rutina_id += 1

            # 8.4 Evolución Física mensual (12 mediciones por socio)
            peso_mes = round(peso_base - (mes_num * 0.25 if idx % 2 == 0 else -mes_num * 0.20), 2)
            grasa_mes = round(max(10.5, grasa_base - (mes_num * 0.30)), 2)
            evolucion_fisica_rows.append(
                f"({medicion_id}, {sql_val(dni)}, {sql_val(fecha_rutina_mes)}, {peso_mes:.2f}, {grasa_mes:.2f}, "
                f"{sql_val(f'Control antropométrico mes {mes_num}/12 - Evolución favorable.')})"
            )
            medicion_id += 1

        # 8.5 Asistencias por socio
        # - Socios idx 27..32 (6 socios activos): última asistencia hace entre 18 y 35 días (para poblar Alerta de Inactividad +15 días)
        # - Resto de los socios activos (incluyendo 37016902): asistencias constantes durante los últimos meses y la última semana
        apto_socio = True if idx <= 36 else False
        if 27 <= idx <= 32:
            # Asistieron meses atrás pero su última asistencia fue hace > 15 días
            for d_ago in (90, 75, 60, 45, 32, 18 + (idx - 27) * 3):
                dt_asist = (now_dt - timedelta(days=d_ago)).replace(hour=9 + (idx % 10), minute=(idx * 7) % 60)
                asistencias_rows.append(
                    f"({asistencia_id}, {sql_val(dni)}, {sql_val(dt_asist)}, 'Al día', {sql_val(apto_socio)})"
                )
                asistencia_id += 1
        else:
            # Asistencias distribuidas en los últimos meses + últimos 14 días
            dias_asistencia = [150, 120, 90, 60, 40, 28, 21, 14, 11, 8, 6, 4, 2]
            for d_ago in dias_asistencia:
                hora_ingreso = 8 + ((idx + d_ago) % 13)  # Entre las 08:00 y las 20:00
                min_ingreso = (idx * 11 + d_ago) % 60
                dt_asist = (now_dt - timedelta(days=d_ago)).replace(hour=hora_ingreso, minute=min_ingreso)
                asistencias_rows.append(
                    f"({asistencia_id}, {sql_val(dni)}, {sql_val(dt_asist)}, {sql_val(estado_cuota_texto)}, {sql_val(apto_socio)})"
                )
                asistencia_id += 1

            # Además, los primeros 14 socios (incluyendo 37016902) registran asistencia en el día de HOY
            if idx <= 14:
                hora_hoy = max(7, min(now_dt.hour, 7 + (idx % 12)))
                min_hoy = (idx * 3) % 50
                dt_hoy = now_dt.replace(hour=hora_hoy, minute=min_hoy)
                if dt_hoy > now_dt:
                    dt_hoy = now_dt - timedelta(minutes=idx * 2)
                asistencias_rows.append(
                    f"({asistencia_id}, {sql_val(dni)}, {sql_val(dt_hoy)}, {sql_val(estado_cuota_texto)}, {sql_val(apto_socio)})"
                )
                asistencia_id += 1

    # Escribir bloques masivos en el SQL
    lines.append("-- 7. Historial de Membresías por Socio (12 meses)")
    lines.append(
        "INSERT INTO Cliente_Membresia (id_cliente_membresia, dni_cliente, id_membresia, fecha_inicio, fecha_fin, estado) VALUES"
    )
    lines.append(",\n".join(membresias_cliente_rows) + ";\n")

    lines.append("-- 8. Historial de Pagos (12 meses por socio activo)")
    lines.append(
        "INSERT INTO Pago (id_pago, dni_cliente, fecha_pago, monto, metodo_pago, descripcion, meses_abonados, fecha_vencimiento_cuota) VALUES"
    )
    lines.append(",\n".join(pagos_rows) + ";\n")

    lines.append("-- 9. Historial de Rutinas Mensuales (12 meses por socio activo)")
    lines.append(
        "INSERT INTO Rutina (id_rutina, dni_cliente, fecha_inicio, periodo, objetivo, activa, observaciones) VALUES"
    )
    lines.append(",\n".join(rutinas_rows) + ";\n")

    lines.append("-- 10. Detalle de Ejercicios por Rutina Mensual")
    # Dividir en bloques de 500 para máxima velocidad y compatibilidad en MySQL
    chunk_size = 500
    for i in range(0, len(detalles_rutina_rows), chunk_size):
        chunk = detalles_rutina_rows[i:i + chunk_size]
        lines.append(
            "INSERT INTO Detalle_Rutina (id_detalle, id_rutina, id_usuario, id_ejercicio, dia, nombre_dia, series, repeticiones, carga, descanso) VALUES"
        )
        lines.append(",\n".join(chunk) + ";\n")

    lines.append("-- 11. Evolución Física (12 mediciones mensuales por socio activo)")
    lines.append(
        "INSERT INTO Evolucion_Fisica (id_medicion, dni_cliente, fecha_medicion, peso_kg, porcentaje_grasa, observaciones) VALUES"
    )
    lines.append(",\n".join(evolucion_fisica_rows) + ";\n")

    lines.append("-- 12. Registro Histórico de Entrenamiento")
    for i in range(0, len(registros_entrenamiento_rows), chunk_size):
        chunk = registros_entrenamiento_rows[i:i + chunk_size]
        lines.append(
            "INSERT INTO Registro_Entrenamiento (id_registro, dni_cliente, id_ejercicio, fecha_entrenamiento, carga_real, repeticiones_logradas) VALUES"
        )
        lines.append(",\n".join(chunk) + ";\n")

    lines.append("-- 13. Check-in Digital y Registro de Asistencias")
    lines.append(
        "INSERT INTO Asistencia (id_asistencia, dni_cliente, fecha_hora, estado_cuota, apto_medico_vigente) VALUES"
    )
    lines.append(",\n".join(asistencias_rows) + ";\n")

    # -------------------------------------------------------------------------
    # 9. Noticias del Muro (Permanentes y Generales)
    # -------------------------------------------------------------------------
    lines.append("-- 14. Novedades y Comunicados del Gimnasio (Muro de Noticias)")
    lines.append(
        "INSERT INTO Noticia (id_noticia, titulo, contenido, categoria, imagen_url, permanente, fecha_publicacion, id_usuario_autor) VALUES"
    )
    noticias_rows = [
        (
            1,
            "Reglamento de Convivencia y Uso de Instalaciones SOMA",
            "Recordamos a todos los socios que es obligatorio el uso de toalla personal, la descarga de barras y mancuernas luego de cada serie y mantener el apto médico al día.",
            "Institucional",
            None,
            True,
            today - timedelta(days=90),
            1,
        ),
        (
            2,
            "Horarios de Atención y Feriados 2026",
            "Lunes a Viernes de 07:00 a 22:00 hs. Sábados de 09:00 a 18:00 hs. Los días feriados nacionales el gimnasio permanece abierto en horario especial de 10:00 a 16:00 hs.",
            "Horarios",
            None,
            True,
            today - timedelta(days=75),
            1,
        ),
        (
            3,
            "Nuevas Plataformas de Peso Muerto y Racks Olímpicos",
            "Ya se encuentran habilitadas en el sector de Peso Libre las 3 nuevas plataformas amortiguadas y barras olímpicas calibradas para entrenamientos de fuerza.",
            "Equipamiento",
            None,
            False,
            today - timedelta(days=5),
            3,
        ),
        (
            4,
            "Seminario de Técnica en Básicos y Prevención de Lesiones",
            "Este sábado a las 11:00 hs dictaremos un taller práctico sobre configuración de Press de Banca, Sentadilla y Peso Muerto a cargo de los entrenadores Marcos y Lucía.",
            "Eventos",
            None,
            False,
            today - timedelta(days=2),
            4,
        ),
    ]
    lines.append(",\n".join(
        f"({n[0]}, {sql_val(n[1])}, {sql_val(n[2])}, {sql_val(n[3])}, {sql_val(n[4])}, {sql_val(n[5])}, {sql_val(n[6])}, {n[7]})"
        for n in noticias_rows
    ) + ";\n")

    lines.append("COMMIT;")
    lines.append("SET FOREIGN_KEY_CHECKS = 1;")
    lines.append("")
    return "\n".join(lines)


def main():
    print("-> Generando archivo SQL consolidado de semillas en Documentos/carga_de_datos_v1.1.sql ...")
    sql_content = build_seed_sql()
    with open(SQL_SEED_PATH, "w", encoding="utf-8") as f:
        f.write(sql_content)
    print(f"-> Archivo generado con éxito ({len(sql_content.splitlines())} líneas).")

    if "--apply" in sys.argv:
        db_user = os.getenv("DB_USER", "root")
        db_name = os.getenv("DB_NAME", "GimnasioDB")
        print(f"-> Recreando esquema desde {SQL_SCHEMA_PATH} ...")
        with open(SQL_SCHEMA_PATH, "rb") as schema_f:
            subprocess.run(["mysql", "-u", db_user], stdin=schema_f, check=True)
        print(f"-> Cargando datos iniciales en {db_name} desde {SQL_SEED_PATH} ...")
        with open(SQL_SEED_PATH, "rb") as seed_f:
            subprocess.run(["mysql", "-u", db_user, db_name], stdin=seed_f, check=True)
        print("-> Base de datos GimnasioDB inicializada y sembrada con éxito.")


if __name__ == "__main__":
    main()
