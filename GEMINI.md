# Directrices de Desarrollo y Memoria del Proyecto SOMA

## 1. Principio Fundamental de No Regresión
- **Compatibilidad y no conflicto:** Toda nueva funcionalidad (feature), refactorización o corrección de bugs debe integrarse sin alterar, degradar ni entrar en conflicto con las características que ya están en funcionamiento y probadas.
- **Verificación obligatoria:** Antes de dar por concluida cualquier modificación, se debe ejecutar la suite de pruebas automatizadas:
  ```bash
  ./backend/.venv/bin/pytest backend/tests/test_integration_backlog.py
  ```
  Todas las pruebas existentes (SOMA-01 a SOMA-09 y complementarias) deben pasar en su totalidad (14/14).

## 2. Reglas del Módulo de Clientes, Usuarios y DNI
- **Unicidad e Identidad de DNI:**
  - El DNI de los socios actúa como clave primaria en la entidad `Cliente` y como `usuario_login` en la tabla `Usuario`.
  - No se deben permitir registros duplicados con el mismo DNI ni crear incongruencias entre `Cliente` y `Usuario`.
  - **Validación Estricta de DNI:** Formato estrictamente numérico de 7 u 8 dígitos (`^\d{7,8}$`), validado tanto en frontend (`pattern`, sanitizado a dígitos en input) como en backend con `@field_validator` en Pydantic (`ClienteBase` y `PagoBase`).
- **Permisos de Gestión de Personal / Usuarios:**
  - El rol **Recepcionista** (además de **Admin**) tiene permisos operativos para consultar (`GET /api/usuarios/`) y dar de alta (`POST /api/usuarios/`) usuarios del personal.
  - La eliminación física/lógica y la reactivación de usuarios del personal permanecen reservadas de forma exclusiva al rol **Admin**.
- **Borrado Lógico y Re-alta (SOMA-06):**
  - La baja de un socio o usuario debe marcarse mediante `activo = False` (soft delete), preservando el histórico (pagos, rutinas, evolución física).
  - La re-alta debe reactivar la ficha existente sin provocar colisiones de clave primaria.
- **Membresías y Pagos (SOMA-07 y SOMA-08):**
  - El alta de cliente requiere siempre su pago inicial asociado (`primer_pago`).
  - La renovación o adelanto de cuotas acumula meses sobre la fecha de vigencia activa si el socio está al día, o desde hoy si está vencido.

## 3. Arquitectura Frontend Modular (ES6)
- El frontend está desacoplado por módulos bajo `backend/app/static/js/modules/` y servicios en `backend/app/static/js/services/`.
- Mantener la separación de responsabilidades: los eventos del DOM pertenecen a los módulos (`*.module.js`) y las llamadas HTTP al servicio correspondiente (`*.service.js`) utilizando `apiFetch`.

## 4. Consolidación de Migraciones y Base de Datos
- **Integración Final de Scripts SQL:** Al finalizar el proyecto, todas las migraciones incrementales de SQL (como `migracion_foto_perfil.sql`, `migracion_dias_rutina.sql`, futuras migraciones de plantillas de rutinas, etc.) deben integrarse y consolidarse en exactamente dos archivos finales:
  1. **Archivo único de creación de base de datos:** Esquema DDL completo y definitivo con todas las tablas, columnas, índices y foreign keys finales.
  2. **Archivo único de carga inicial de datos:** Semillas (seeds), usuarios iniciales, catálogos (ejercicios, membresías, etc.) y datos de prueba listos para inicializar el sistema desde cero sin necesidad de correr scripts de migración intermedios.

