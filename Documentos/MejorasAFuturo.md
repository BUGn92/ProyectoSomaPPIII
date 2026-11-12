# Mejoras a Futuro y Hoja de Ruta Evolutiva (Roadmap v2.0) - SOMA Gym

Este documento detalla las funcionalidades proyectadas para la **Fase 2 (Versión 2.0)** del sistema de gestión del **Gimnasio SOMA**, surgidas a partir del relevamiento inicial con la gerencia (Ricardo) y de las decisiones arquitectónicas tomadas durante el desarrollo de la **Versión 1.1**.

Cabe destacar que el modelo de datos relacional definitivo ([Creacion_de_BD_v1.1.sql](file:///home/agustin/Practicas%20profesionalizantes%20III/2_%20Zarate,%20Bugnoni%20Agustin-20260824T221128Z-1-001/Soma/Documentos/Creacion_de_BD_v1.1.sql)) **ya incluye las tablas preparadas** para dar soporte inmediato a varios de estos módulos sin requerir reestructuraciones profundas de base de datos.

---

## 1. Módulo Financiero: Registro de Egresos y Estado de Resultados (`CU-10` / `RF-F3`)

### Contexto y Objetivo
Actualmente, el sistema registra la totalidad de los **ingresos** provenientes del cobro de cuotas de socios en la tabla `Pago`, permitiendo discriminar por medio de pago (Efectivo, Transferencia, Mercado Pago, Débito, Tarjeta de Crédito) y cantidad de meses abonados. Para completar el cálculo de rentabilidad neta solicitado por la gerencia, se proyecta incorporar la gestión de **costos fijos y variables**.

### Propuesta de Implementación
1. **Base de Datos**:
   - Incorporar la entidad `Gasto` (`id_gasto`, `fecha_gasto`, `categoria`, `monto`, `descripcion`, `id_usuario_registro`) con categorías predefinidas: *Alquiler, Sueldos Profesores/Staff, Servicios (Luz/Agua/Internet), Mantenimiento de Maquinaria, Insumos y Limpieza*.
2. **Backend (FastAPI)**:
   - Endpoints `GET /api/finanzas/gastos`, `POST /api/finanzas/gastos` y `GET /api/finanzas/estado-resultados?anio=YYYY&mes=MM` reservados exclusivamente al rol **Admin**.
3. **Frontend (Panel Administrador)**:
   - Nueva pestaña **"Balance y Rentabilidad"** con tarjetas de resumen mensual (*Ingresos Brutos*, *Costos Totales*, *Resultado Neto / Punto de Equilibrio*) y gráfico comparativo de barras mensuales Ingresos vs. Egresos.

---

## 2. ABM Dinámico de Planes de Membresía y Convenios (`CU-08` / `RF-F1`)

### Contexto y Objetivo
La tabla `Membresia` ya se encuentra creada y sembrada en la base de datos con los planes *Mensual, Trimestral Premium, Anual VIP y Pase Diario*. En la versión actual, el cobro de cuotas se realiza imputando la cantidad de meses y el monto sobre el plan base, permitiendo ajustes manuales de importe en recepción.

### Propuesta de Implementación
1. **Gestión de Planes desde el Panel Admin**:
   - Interfaz ABM para crear, editar precios y activar/desactivar categorías tarifarias especiales: *Plan Parejas / Grupo Familiar, Jubilados, Promoción Franja Horaria (Off-Peak) y Convenios Corporativos*.
2. **Selector de Plan en el Modal de Pagos**:
   - Al registrar el alta de un socio o una nueva cuota, el selector de membresía autocompletará automáticamente el precio vigente y la duración en días/meses según el plan elegido, manteniendo la posibilidad de aplicar un descuento o recargo manual autorizado.

---

## 3. Agenda de Turnos Nutricionales y Portal de Nutricionista (`CU-04`, `CU-05` / `RF-T1`)

### Contexto y Objetivo
El seguimiento antropométrico (peso en kg, porcentaje de grasa corporal y observaciones clínicas) ya se encuentra operativo dentro de la pestaña **Evolución Física**. Sin embargo, la gestión de citas en agenda con el profesional de nutrición quedó proyectada para la Fase 2.

### Estado en Base de Datos Actual
La tabla `Turno_Nutricional` **ya existe** en [Creacion_de_BD_v1.1.sql](file:///home/agustin/Practicas%20profesionalizantes%20III/2_%20Zarate,%20Bugnoni%20Agustin-20260824T221128Z-1-001/Soma/Documentos/Creacion_de_BD_v1.1.sql):
- Campos: `id_turno`, `dni_cliente`, `id_usuario_nutricionista`, `fecha_turno`, `hora_turno`, `estado` (*Pendiente, Completado, Cancelado, Ausente*) y `observaciones`.

### Propuesta de Implementación
1. **Rol `Nutricionista`**:
   - Habilitar la vista específica para profesionales de nutrición, con acceso a la ficha de **Evolución Física** y a su agenda de turnos, restringiendo el acceso a la edición de rutinas de musculación y finanzas.
2. **Calendario de Reserva de Turnos**:
   - Vista de grilla semanal en Recepción y en el Portal del Socio para reservar bloques de atención disponibles, validando que no existan solapamientos de horario para el mismo profesional.

---

## 4. Calendario y Reserva de Clases Grupales con Control de Cupo (`CU-09` / `RF-T2`, `RF-T3`)

### Contexto y Objetivo
Permitir la planificación de actividades grupales (*Funcional, Calistenia, Zumba, Spinning*) asignando un profesor responsable, días y horarios de dictado, y controlando el cupo máximo del salón.

### Estado en Base de Datos Actual
Las tres tablas relacionales necesarias **ya están definidas** en [Creacion_de_BD_v1.1.sql](file:///home/agustin/Practicas%20profesionalizantes%20III/2_%20Zarate,%20Bugnoni%20Agustin-20260824T221128Z-1-001/Soma/Documentos/Creacion_de_BD_v1.1.sql):
- `Clase` (`id_clase`, `nombre_clase`, `id_usuario_profesor`, `cupo_maximo`, `activo`).
- `Horario_Clase` (`id_horario`, `id_clase`, `dia_semana`, `hora_inicio`, `hora_fin`).
- `Inscripcion_Clase` (`id_inscripcion`, `dni_cliente`, `id_horario`, `fecha`, `asistio`).

### Propuesta de Implementación
1. **Validación de Cupos en Backend**:
   - Al inscribir a un socio en una fecha y horario determinado, contabilizar las inscripciones activas (`COUNT(*)`) y bloquear nuevas reservas cuando se alcance `Clase.cupo_maximo`, además de verificar que el socio tenga la cuota y el apto médico al día.
2. **Inscripción desde el Portal Socio y Recepción**:
   - Cartelera semanal de clases con indicador visual de lugares disponibles (ej. `14/20 cupos ocupados`) y botón de inscripción/cancelación rápida.

---

## 5. Impresión de Rutinas en Formato Ficha Física (`RNF-OH1` - Convivencia Analógica)

### Contexto y Objetivo
Para acompañar la transición gradual de los socios acostumbrados a las fichas de cartulina tradicionales en el salón de musculación, se prevé incorporar una función de impresión directa desde la vista de planilla de rutina.

### Propuesta de Implementación
- Agregar el botón **"Imprimir Ficha"** en el detalle de rutina del Portal Entrenador y Portal Socio, aplicando una hoja de estilos `@media print` que oculte la barra lateral y cabeceras del sistema, formateando los días, ejercicios, series, repeticiones, cargas sugeridas y casilleros de control en una página A4/A5 limpia de alto contraste.

---

## 6. Herramienta de Depuración Administrativa (Hard Delete Controlado)

### Contexto y Objetivo
El sistema utiliza **Borrado Lógico (`activo = False`)** por diseño para preservar la integridad contable de la caja y permitir la re-alta inmediata de ex-socios sin pérdida de historial. Como mejora administrativa documentada en [posibles_implementaciones.md](file:///home/agustin/Practicas%20profesionalizantes%20III/2_%20Zarate,%20Bugnoni%20Agustin-20260824T221128Z-1-001/Soma/Documentos/posibles_implementaciones.md), se contempla habilitar una opción de **Eliminación Definitiva (Hard Delete)** exclusiva para el rol **Admin** con doble confirmación, pensada únicamente para purgar registros cargados por error humano en el mismo día sin impacto contable.
