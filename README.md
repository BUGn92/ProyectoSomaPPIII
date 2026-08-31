# SOMA Gym - Sistema de Gestión Híbrida y Fidelización

Sistema integral para la administración, control de accesos, seguimiento de salud y fidelización de socios del **Gimnasio SOMA**, desarrollado como parte de las **Prácticas Profesionalizantes III**.

---

## 🛠️ Tecnologías Utilizadas

* **Backend**: Python 3.11+, [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy](https://www.sqlalchemy.org/) (ORM), [Pydantic](https://docs.pydantic.dev/) v2, [PyJWT](https://pyjwt.readthedocs.io/) (Autenticación JWT).
* **Base de Datos**: MySQL 8.0+ relacional con driver `PyMySQL` y `Cryptography`.
* **Frontend**: Single Page Application (SPA) en Vanilla HTML5, CSS3 moderno (paleta oscura premium, CSS Grid/Flexbox, Glassmorphism) y JavaScript nativo asíncrono (`fetch` API).
* **Documentación Interactiva**: [Swagger UI / OpenAPI](http://localhost:8000/docs).

---

## 📋 Requisitos Previos

Asegúrate de contar con los siguientes programas instalados en tu sistema local:
1. **Python 3.10 o superior** (con soporte para `venv` y `pip`).
2. **Servidor MySQL** (MySQL Server 8.0+, MariaDB o XAMPP/WampServer) corriendo localmente en el puerto `3306`.
3. *(Opcional)* Un cliente visual de base de datos como **DBeaver**, **MySQL Workbench** o **TablePlus**.

---

## 🚀 Guía de Instalación y Ejecución Local

Sigue estos pasos ordenados para levantar el entorno de desarrollo localmente:

### Paso 1: Configurar la Base de Datos en MySQL

1. Abre tu terminal o cliente SQL (DBeaver / MySQL Workbench / Consola MySQL).
2. Ejecuta el script de creación del esquema y las tablas ubicado en:
   ```bash
   # Desde la consola de MySQL:
   mysql -u root < "Documentos/Creacion_de_BD_v1.1.sql"
   ```
3. Ejecuta el script de siembra de datos de prueba iniciales:
   ```bash
   mysql -u root < "Documentos/carga_de_datos_v1.1.sql"
   ```
   *(Esto creará la base de datos `GimnasioDB` con los usuarios, ejercicios, clientes y membresías de prueba).*

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
   pip install pyjwt email-validator httpx
   ```

---

### Paso 3: Configurar las Variables de Entorno

1. Verifica que exista el archivo `.env` dentro de la carpeta `backend/`. Si no existe, puedes crearlo copiando `.env.example`:
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

Estando dentro del directorio `backend` y con el entorno virtual activado, ejecuta el servidor:

```bash
python3 -m app.main
```
o alternativamente con Uvicorn en modo recarga activa (*hot-reload*):
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
| **`cadmin`** | `hash_falso_123` | **Admin** | Acceso total: CRUD de Clientes, Evolución y CRUD de Usuarios |
| **`alopez`** | `hash_falso_456` | **Recepcionista** | Gestión de clientes, cuotas y check-in |
| **`mfuerte`** | `hash_falso_789` | **Entrenador** | Consulta de rutinas y registro de cargas |
| **`lfit`** | `hash_falso_101` | **Entrenador** | Consulta de rutinas y registro de cargas |

---

## 📂 Estructura del Proyecto

```text
Soma/
├── backend/
│   ├── .env                    # Configuración de base de datos y JWT (Ignorado en Git)
│   ├── requirements.txt        # Dependencias de Python
│   ├── app/
│   │   ├── main.py             # Punto de entrada de FastAPI y montaje estático
│   │   ├── config/             # Conexión SQLAlchemy (database.py)
│   │   ├── models/             # Modelos relacionales ORM (models.py)
│   │   ├── schemas/            # Validación de datos Pydantic (schemas.py)
│   │   ├── crud/               # Lógica de persistencia en base de datos (crud.py)
│   │   ├── routes/             # Endpoints API (auth.py, cliente.py, usuario.py)
│   │   └── static/             # Frontend integrado SPA (index.html, css/, js/)
├── Documentos/                 # Documentación de la materia, casos de uso y scripts SQL
│   ├── Creacion_de_BD_v1.1.sql # DDL de la base de datos GimnasioDB
│   ├── carga_de_datos_v1.1.sql # Script de siembra (seed) de datos iniciales
│   └── Consultas_v1.1.sql     # Consultas SQL analíticas
└── README.md                   # Esta guía de instalación y uso
```

---

## 🧪 Ejecución de Pruebas Automatizadas

El proyecto incluye un script de prueba de integración de API que valida el flujo completo (Login JWT, CRUD de clientes, control de apto médico, registro de evolución física y registro de cargas deportivas):

```bash
# Estando en la carpeta backend y con el entorno virtual activo:
python3 "/home/agustin/.gemini/antigravity-ide/brain/f172e223-2063-49d6-a484-75d8a5d4e74b/scratch/verify_api.py"
```
