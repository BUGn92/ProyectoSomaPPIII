# SOMA Gym - Sistema de Gestión Híbrida y Fidelización

Sistema integral para la administración, control de accesos, seguimiento de salud y fidelización de socios del **Gimnasio SOMA**, desarrollado como parte de las **Prácticas Profesionalizantes III**.

---

## 🛠️ Tecnologías Utilizadas

* **Backend**: Python 3.11+, [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy](https://www.sqlalchemy.org/) (ORM), [Pydantic](https://docs.pydantic.dev/) v2, [PyJWT](https://pyjwt.readthedocs.io/) (Autenticación JWT).
* **Base de Datos**: MySQL 8.0+ relacional con driver `PyMySQL` y `Cryptography`.
* **Frontend**: Single Page Application (SPA) en Vanilla HTML5, CSS3 moderno (paleta oscura premium, CSS Grid/Flexbox, Glassmorphism) y JavaScript nativo modular ES6 (`fetch` API).
* **Documentación Interactiva**: [Swagger UI / OpenAPI](http://localhost:8000/docs).

---

## 📋 Requisitos Previos

Asegúrate de contar con los siguientes programas instalados en tu sistema local:
1. **Python 3.10 o superior** (con soporte para `venv` y `pip`).
2. **Servidor MySQL** (MySQL Server 8.0+, MariaDB o XAMPP/WampServer) corriendo localmente en el puerto `3306`.
3. **GNU Make** (`make`) para utilizar los comandos simplificados de instalación, ejecución y pruebas.
4. *(Opcional)* Un cliente visual de base de datos como **DBeaver**, **MySQL Workbench** o **TablePlus**.

---

## ⚡ Inicio Rápido con Makefile (Recomendado)

Desde la raíz del repositorio puedes configurar todo el entorno, inicializar la base de datos, levantar el servidor y correr los tests usando `make`:

```bash
# 1. Crear entorno virtual (.venv), instalar dependencias y generar backend/.env
make install

# 2. Crear la base de datos GimnasioDB y cargar los datos iniciales en MySQL
make db

# 3. Iniciar el servidor de desarrollo en http://localhost:8000
make run
```

Otros comandos disponibles en el `Makefile`:
* `make help`: Muestra el listado de comandos disponibles.
* `make test`: Ejecuta toda la suite de pruebas automatizadas (`pytest`).
* `make clean`: Elimina archivos temporales (`__pycache__`, `.pytest_cache`).

---

## 🚀 Guía de Instalación y Ejecución Manual

Si prefieres ejecutar cada paso de forma manual sin utilizar `make`:

### Paso 1: Configurar la Base de Datos en MySQL

1. Abre tu terminal o cliente SQL (DBeaver / MySQL Workbench / Consola MySQL).
2. Ejecuta el script de creación del esquema y las tablas ubicado en:
   ```bash
   mysql -u root < "Documentos/Creacion_de_BD_v1.1.sql"
   ```
3. Ejecuta el script de siembra de datos de prueba iniciales:
   ```bash
   mysql -u root GimnasioDB < "Documentos/carga_de_datos_v1.1.sql"
   ```
   *(Esto creará la base de datos `GimnasioDB` con los usuarios, ejercicios, clientes y membresías de prueba. Si MySQL requiere contraseña, agrega `-p` al comando).*

---

### Paso 2: Configurar el Entorno Virtual de Python

1. Abre una terminal y navega hasta la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Crea un entorno virtual de Python:
   ```bash
   python3 -m venv .venv
   ```
3. Activa el entorno virtual:
   * **En Linux / macOS**:
     ```bash
     source .venv/bin/activate
     ```
   * **En Windows (CMD o PowerShell)**:
     ```powershell
     .venv\Scripts\activate
     ```
4. Instala todas las dependencias del proyecto:
   ```bash
   pip install -r requirements.txt
   ```

---

### Paso 3: Configurar las Variables de Entorno

1. Verifica que exista el archivo `.env` dentro de la carpeta `backend/`. Si no existe, créalo copiando `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Asegúrate de que la variable `DATABASE_URL` apunte a tu base de datos local de MySQL:
   ```env
   # Formato: mysql+pymysql://<usuario>:<password>@<host>:<puerto>/<base_de_datos>
   DATABASE_URL=mysql+pymysql://root@localhost:3306/GimnasioDB
   SECRET_KEY=soma_gym_super_secret_jwt_key_2026_ppiii
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=480
   ```
   *(Si tu usuario `root` tiene contraseña en MySQL, especifícala como `root:tu_password@localhost:3306/GimnasioDB`).*

---

### Paso 4: Iniciar el Servidor de Desarrollo

Con el comando rápido desde la raíz:
```bash
make run
```
O manualmente dentro del directorio `backend` con el entorno virtual activado:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🌐 Acceso al Sistema y Credenciales

Una vez que el servidor esté en ejecución, puedes acceder desde tu navegador a los siguientes enlaces:

| Servicio | URL | Descripción |
| :--- | :--- | :--- |
| **Aplicación Web (SPA)** | [http://localhost:8000](http://localhost:8000) | Pantalla de Login interactiva y Dashboard de gestión |
| **Documentación Swagger UI** | [http://localhost:8000/docs](http://localhost:8000/docs) | Consola interactiva para probar los endpoints de la API |
| **Documentación ReDoc** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Especificación técnica detallada de la API |

### 🔑 Usuarios y Credenciales de Prueba

La base de datos viene precargada con los siguientes usuarios para probar los diferentes niveles de acceso:

| Usuario (Login) | Contraseña | Rol | Permisos |
| :--- | :--- | :--- | :--- |
| **`cadmin`** | `hash_falso_123` | **Admin** | CRUD completo de Clientes, Rutinas, Plantillas, Evolución, Noticias y Usuarios |
| **`alopez`** | `hash_falso_456` | **Recepcionista** | Gestión de fichas de clientes, cobro de cuotas, altas de personal y check-in |
| **`mfuerte`** | `hash_falso_789` | **Entrenador** | Asignación de rutinas, plantillas, evolución física/deportiva y noticias |
| **`lfit`** | `hash_falso_101` | **Entrenador** | Asignación de rutinas, plantillas, evolución física/deportiva y noticias |

---

## 📂 Estructura del Proyecto

```text
Soma/
├── Makefile                    # Comandos automatizados (install, db, run, test, clean)
├── backend/
│   ├── .env                    # Configuración de base de datos y JWT (Ignorado en Git)
│   ├── .env.example            # Plantilla base de variables de entorno
│   ├── requirements.txt        # Dependencias de Python
│   ├── tests/                  # Suite de pruebas automatizadas con Pytest
│   └── app/
│       ├── main.py             # Punto de entrada de FastAPI y montaje estático
│       ├── config/             # Conexión SQLAlchemy (database.py)
│       ├── models/             # Modelos relacionales ORM (models.py)
│       ├── schemas/            # Validación de datos Pydantic (schemas.py)
│       ├── crud/               # Lógica de persistencia en base de datos (crud.py)
│       ├── routes/             # Endpoints API
│       └── static/             # Frontend integrado SPA (HTML, CSS, JS modular ES6)
├── Documentos/                 # Documentación de la materia y scripts SQL
│   ├── Creacion_de_BD_v1.1.sql # DDL de la base de datos GimnasioDB
│   ├── carga_de_datos_v1.1.sql # Script de siembra (seed) de datos iniciales
│   └── Consultas_v1.1.sql      # Consultas SQL analíticas
└── README.md                   # Esta guía de instalación y uso
```

---

## 🧪 Ejecución de Pruebas Automatizadas

Para ejecutar toda la suite de pruebas automatizadas con `pytest`:

```bash
make test
```

O ejecutando `pytest` directamente sobre el archivo de pruebas de integración:

```bash
./backend/.venv/bin/pytest backend/tests/test_integration_backlog.py
```
