Especificación de Requerimientos de Software (ERS)






Proyecto: Sistema de gestión Gimnasio SOMA

Materia: Practicas profesionalizantes III

Profesor: Gustavo Gomez

Integrantes: Bugnoni Agustin; Zarate Lorenzo

2026






# Introducción


## 1.1 Propósito

Actualmente, la veterinaria gestiona los turnos médicos y el control de stock de forma manual, utilizando una agenda en papel o planillas de Excel, lo que genera inconvenientes como doble reserva de turnos, falta de recordatorios automáticos, control de stock ineficiente y pérdida de tiempo administrativo en la confirmación de citas y verificación de existencias. Ante estas dificultades, se propone el desarrollo de una página web que permita registrar y consultar turnos en línea en tiempo real, enviar recordatorios automáticos a los clientes, mantener un control actualizado del stock de medicamentos e insumos, reducir errores humanos, mejorar la organización interna y optimizar el tiempo del personal.


## 1.2 Descripción General

El proyecto “VetAmigos” busca crear un sistema para ayudar a la veterinaria a organizar sus tareas diarias. La idea es gestionar fácilmente los turnos, guardar las fichas clínicas de las mascotas, controlar el Stock de medicamentos, enviar recordatorios de vacunas y administrar los cobros de las consultas.


## 1.3 Objetivos

El sistema deberá permitir agregar, borrar o modificar la información de los clientes y sus mascotas. También va a controlar el inventario de remedios e insumos, maneja la agenda de turnos.


## 1.4 Alcance

El proyecto se centra en crear una base de datos para guardar la información de los clientes y sus mascotas. Incluirá las funciones básicas para manejar el calendario de citas, el stock de medicamentos y los recordatorios de vacunación.


## 1.5 Fuera de alcance

Es importante aclarar que este proyecto no va a incluir el desarrollo de una aplicación móvil para clientes. Tampoco se conectará con laboratorios externos ni utilizará inteligencia artificial para hacer diagnósticos.


## 1.6 Restricciones internas y externas

**Técnicas**

El sistema debe ser compatible con los dispositivos existentes(PCs, tablets o celulares).

Disponibilidad de equipo médico en la veterinaria.

Limitaciones técnicas para la integración con otros sistemas ( WhatsApp, email).

**Operativas**

Presupuesto limitado para el desarrollo e implementación.

Capacitación del personal.

Poca disponibilidad del personal para realizar reuniones de relevamiento o validaciones frecuentes.

**Legales**

Uso de software con licencias válidas.

-Restricciones legales asociadas a la integración con sistemas externos

(cumplimiento de normativas fiscales o de protección de datos).




## 1.7 Responsables

Los involucrados son la gerencia de la clínica Veterinary Clinic Management, el equipo de desarrollo (TBC) y los usuarios finales, personal de la veterinaria y los clientes.


## 1.8 Riesgos

Proteger adecuadamente la información privada de los clientes y mascotas.

Cometer errores al cargar los datos viejos de forma manual.

Tiempo de adaptación del personal a la implementación del sistema.

Problemas con la conexión a internet o equipos de la veterinaria.




# Casos de uso




## 2.1 Actor: Cliente

**1 Registrarse y crear mascota**

Que hace: El cliente crea su cuenta en el sistema e ingresa los datos de su(s) mascota(s)

¿Cómo se realiza?

A: El usuario entra a la opción registrarse

B: Completa sus datos personales (nombre, DNI, dirección, teléfono, etc.)

C: Luego puede cargar la información de su mascota: nombre, especie, raza, edad, peso, etc.

D: El sistema guarda esta información en la base de datos (por eso incluye el caso actualizar base de datos)


**2 Iniciar sesión**

Qué hace: Permite al cliente acceder al sistema usando su usuario y contraseña

Como se realiza:

A: Ingresa sus credenciales.

B: El sistema valida que existan en la base de datos.

C: Si son correctas, accede a su panel (para ver turnos, historial, etc.)


**3 Consultar/solicitar turno**

Que hace: El cliente revisa los turnos disponibles y reserva uno

Como se realiza:

A: Accede a la sección de turnos.

B: El sistema muestra los turnos disponibles (disponer oferta de turnos)

C: El cliente elige día, hora y veterinario.

D: El sistema registra el turno y lo asocia a su mascota.

E: Puede extenderse a “Actualizar disponibilidad de turnos” (Ya que al reservar uno, se marca como ocupado


**4 Pagar Consulta**

Que hace: El cliente abona el servicio al veterinario

¿Cómo se realiza?

A: el cliente selecciona método de pago

B: Puede ser mediante efectivo/transferencia

C: El sistema registra el pago en la base de datos y actualiza el estado de consulta como pagada


## 2.2 Actor: Veterinario

**5 Disponer oferta de turnos**

Que hace: El veterinario informa que horarios tienen disponibles

Como se realiza:

A: Ingresa a su panel profesional.

B: Carga los horarios en los que puede atender.

C: El sistema los guarda en la base de datos para que los clientes puedan seleccionarlos.


**6 Registrar consulta médica**

Que hace: El veterinario carga la información de la atención realizada a la mascota

Como se realiza:

A: Selecciona el turno correspondiente.

B: Registra síntomas, diagnóstico, tratamiento, medicamentos, vacunas aplicadas, etc.

C: El sistema incluye la acción actualizar historia clínica, guardando todo el registro médico.

D: Además se extiende a:

Actualizar stock de vacunas/insumos (si se usaron productos)

Recordatorio vacunas (si debe aplicarse otra lordosis luego)


**7 Actualizar disponibilidad de turnos **

Qué hace: permite modificar los horarios libres u ocupados

Cómo se realiza:

A: El veterinario o el sistema actualiza automáticamente los turnos según reservas o cancelaciones.

B: Se reflejan los cambios para los clientes.



## 2.3 Actor: Sistema de notificaciones

**8 Recordatorio de vacunas **

Que hace: Envía recordatorios automáticos a los dueños cuando se aproxima una vacuna o control.

Como se realiza:

A: El sistema verifica las flechas registradas en la historia clínica.

B: Si se acerca una fecha de vacunación, genera una notificación.

C: Se extiende por whatsapp, lo que indica que puede enviarse el recordatorio por ese medio.


**Casos secundarios (de soporte técnico del sistema)**


**9 Actualizar base de datos**

Que hace: Mantiene actualizada toda la información del sistema (clientes, turnos, mascotas, pagos, historia clínica, etc)

Cuando se ejecuta?: Cuando se realiza cualquier acción importante (registro, pago, consulta, etc)


**10 actualizar historia clínica **

Que hace: guarda los datos de la mascota después de cada consulta

Ejemplo: Nuevas vacunas, diagnósticos, cirugías, observaciones.


**11 actualizar stock de vacunas/insumos**

Que hace: Resta del inventario los productos usados en una consulta



## 2.4 Procesos interrumpidos


#### 1. Solicitud de turno interrumpida

Qué sucede: El cliente intenta reservar un turno, pero el procedimiento no se completa.

Por qué se interrumpe: No hay turnos disponibles o se genera una colisión de reserva.

**
** A: El cliente ingresa a la sección de turnos
 B: Selecciona fecha, hora y veterinario
 C: **El sistema detecta que ese turno ya fue tomado o no está disponible
** D: Se cancela el proceso y se muestra un mensaje al usuario
 E: *No se actualiza la base de datos* (no se registra turno)


#### 2. Pago de consulta interrumpido

Qué sucede: El cliente intenta pagar, pero el pago no se confirma.

Por qué se interrumpe: Error en el medio de pago, datos incompletos o pago rechazado.

**
** A: El cliente selecciona método de pago
 B: El sistema envía la solicitud a la pasarela / método elegido
 C: **La transacción falla o el cliente cancela
** D: El sistema deja la consulta en estado “pendiente de pago”
 E: *No se actualiza el estado de consulta como pagada*



#### 3. Registro de consulta médica interrumpido

Qué sucede: El veterinario comienza a cargar la consulta, pero no puede finalizarla.

Por qué se interrumpe: Faltan datos obligatorios, el sistema pierde conexión o se cierra la sesión.

**
** A: Se abre la ficha de la mascota
 B: Se ingresan datos parciales de la consulta
 C: **Se detecta ausencia de campos requeridos o se produce un error técnico
** D: El sistema no permite guardar el registro
 E: La historia clínica permanece **sin actualizar**


#### 4. Aplicación de vacuna o insumo interrumpida

Qué sucede: La consulta requiere usar una vacuna/medicamento pero no hay stock suficiente.

Por qué se interrumpe: Inventario insuficiente o lote vencido/bloqueado.

**
** A: El veterinario selecciona el insumo a utilizar
 B: El sistema verifica el stock y la validez del lote
 C: **Detecta stock insuficiente o fecha de vencimiento pasada
** D: Se impide la aplicación del insumo
 E: *No se actualiza historia clínica ni stock*



#### 5. Notificación de recordatorio interrumpida

Qué sucede: El sistema debe enviar un recordatorio, pero el envío no se completa.

Por qué se interrumpe: El usuario no tiene teléfono/email registrado o hay fallo temporal en el servicio de mensajería.

**
** A: El sistema identifica que corresponde enviar recordatorio
 B: Prepara el mensaje para envío
 C: **No encuentra un medio de contacto disponible o el envío falla
** D: Se marca el recordatorio como “no enviado”
 E: *No llega notificación al cliente*



# Requerimientos Funcionales (por módulo)

A continuación se presentan separan por módulo los registros funcionales. Se opta por este formato para un mejor entendimiento y presentación de los mismos. Así mismo se presenta una explicación de funcionalidad y descripción de cada uno.


## 3.1 Clientes

Este módulo permite gestionar la información básica de los dueños de las mascotas. Su función principal es registrar, consultar y mantener actualizados los datos personales de los clientes, garantizando su trazabilidad y el cumplimiento de la normativa de contacto.


**Identificación del requerimiento****: **RF-C1

**Nombre del requerimiento**: Crear/Editar/Buscar clientes por sus datos

**Características**: El sistema permitirá gestionar la información de los clientes ,posibilitando su creación,edición y búsqueda eficiente

**Descripción del requerimiento**:El usuario podrá registrar nuevos clientes ingresando datos como nombre,DNI,teléfono y correo electrónico

**Requerimiento no funcional**:RNF-CLI-01,RNF-CLI-03,RNF-CLI-06

**Prioridad del requerimiento**:Alta



**Identificación del requerimiento****: **RF-C2

**Nombre del requerimiento:** Validación de datos y consentimiento de contacto.

**Características**: El sistema validará los datos ingresados y gestionará la autorización de contacto de los clientes.

**Descripción del requerimiento**:Durante el registro, el sistema verificará que el correo electrónico tenga un formato válido y que el número telefónico contenga los dígitos requeridos. Además, ofrecerá una casilla (checkbox) para que el cliente otorgue consentimiento para recibir notificaciones.

**Requerimiento no funcional**: RNF-CLI-03,RNF-CLI-04

**Prioridad del requerimiento**: Media


**Identificación del requerimiento****: **RF-C3

**Nombre del requerimiento**:Visualización de mascotas asociadas.

**Características**: El sistema permitirá consultar las mascotas registradas de cada cliente.

**Descripción del requerimiento**: Desde el perfil del cliente, el usuario podrá visualizar la lista de mascotas asociadas junto con su estado sanitario, próximas vacunas y últimas visitas registradas.

**Requerimiento no funcional:** RNF-CLI-06,RNF-PET-05

**Prioridad del requerimiento**: Alta

**Dependencia**:Depende de RF-M1


**Identificación del requerimiento****: **RF-C4

**Nombre del requerimient**o: Inactivación de clientes con historial activo.Características: El sistema mantendrá la integridad referencial evitando eliminar clientes con registros asociados

**Característica**:El sistema mantendrá la integridad referencial evitando eliminar clientes con registros asociados

**Descripción del requerimiento**: No será posible eliminar clientes que posean mascotas o historias clínicas activas. En su lugar, podrán ser inactivados para conservar la trazabilidad y consistencia de datos

**Requerimiento no funcional:** RNF-PET-01, RNF-HIS-01

**Prioridad del requerimiento**: Alta

**Dependencia**:Depende de RF-M1 y RF-H1.




## 3.2 Mascotas

Este módulo gestiona la información individual de cada mascota, asociándose con su dueño. Permite registrar sus datos identificatorios, realizar transferencias de propiedad y almacenar documentación complementaria.


**Identificación de requerimiento****: **RF-M1

**Nombre del requerimiento**:RF-M1

**Características**: Permite registrar una nueva mascota con datos completos y validados

**Descripcion del requerimiento**: El sistema registrará especie, raza, sexo, color, fecha de nacimiento y número de microchip único. No se permitirán mascotas sin dueño asignado ni con identificadores duplicados.

**Requerimiento no funciona**l: RNF-PET-01, RNF-PET-03, RNF-PET-02

**Prioridad del requerimiento**: Alta

**Dependencia**:Depende de RF-C1 (debe existir un cliente).


**Identificación de requerimiento****:**** **RF-M3

**Nombre del requerimiento**:Adjuntar documentos e imágenes

**Características: **Permite asociar documentos clínicos o fotografías a la ficha de la mascota.

**Descripción del requerimiento: **Se podrán cargar archivos en formatos permitidos (PDF, JPG, PNG) con un tamaño máximo de 5 MB por archivo. El sistema deberá bloquear archivos maliciosos durante la carga

**Requerimiento no funcional**:RNF-PET-06, RNF-HIS-05

**Prioridad del requerimiento**:Media

**Dependencia**:Depende de RF-M1.


## 3.3 Historia clínica

Permite llevar un registro médico completo de cada mascota, documentando visitas, vacunas, tratamientos y procedimientos. Su objetivo es asegurar la trazabilidad y disponibilidad de la información clínica.


**Identificación de requerimiento****: **RF-H1

**Nombre del requerimiento:** Registro de visitas clínicas.

**Características: **Permite documentar cada consulta de la mascota de forma estructurada.

**Descripción del requerimiento:** Se registrarán fecha, profesional, motivo, diagnóstico y tratamiento. Cada entrada será inmutable y registrada

**Requerimiento no funcional: **RNF-HIS-01, RNF-HIS-02, RNF-HIS-03

**Prioridad del requerimiento: **Alta

**Dependencia**:Depende de RF-M1 (debe existir una mascota).


**Identificación del requerimiento****: **RF-H2

**Nombre del requerimiento: **Carga y programación de vacunas.

**Características: **Registra la aplicación de vacunas y calcula automáticamente la próxima dosis.

**Descripción del requerimiento: **Durante la consulta, se ingresará marca, lote, vencimiento y sitio de aplicación. El sistema determinará la próxima dosis según especie y edad, generando notificación automática

**Requerimiento no funcional:**RNF-HIS-04, RNF-AGE-04

**Prioridad del requerimiento:**Alta

**Dependencia**:Depende de RF-M1 y RF-I2 (lotes disponibles).


**Identificación del requerimiento****: **RF-H3

**Nombre del requerimiento:**Generación de recetas imprimibles

**Características:**Permite crear recetas médicas en formato digital.

**Descripción del requerimiento: **El veterinario podrá generar recetas con los datos del cliente y mascota, firmadas con su matrícula profesional . Las recetas deberán estar disponibles en menos de 2 s y podrán descargarse como PDF.

**Requerimiento no funcional:**RNF-HIS-05, RNF-HIS-06, RNF-HIS-07

**Prioridad del requerimiento:**Media

**Dependencia**:Depende de RF-H1.


**Identificación del requerimiento****:** RF-H4

**Nombre del requerimiento: **Registro de procedimientos e insumos utilizados.

**Características: **Actualiza el stock automáticamente al registrar un procedimiento.

**Descripción del requerimiento:** Al registrar una práctica (curación, cirugía, vacunación), el sistema descontará automáticamente los insumos utilizados, manteniendo la consistencia del inventario

**Requerimiento no funcional: **RNF-INS-01, RNF-INS-03

**Prioridad del requerimiento: **Alta

**Dependencia**:Depende de RF-I3 (movimientos de stock).



**Identificación del requerimiento****: **RF-H5

**Nombre del requerimiento: **Adjuntar resultados clínicos y registrar peso.

Características:Permite subir archivos y mantener un seguimiento histórico del peso.

**Descripción del requerimiento: **El veterinario podrá adjuntar resultados de estudios (PDF/imagen) y registrar el peso en cada visita, generando gráficos automáticos. Los archivos no podrán superar los 25 MB

**Requerimiento no funcional: **RNF-HIS-05, RNF-PET-04

**Prioridad del requerimiento: **Media

**Dependencia**:Depende de RF-H1.



## 3.4 Insumos

Administra los medicamentos e insumos utilizados por el veterinario. Controla su ingreso, egreso, vencimiento y disponibilidad, garantizando un uso eficiente y trazable de los recursos.


**Identificación de requerimientos****: **RF-I1

**Nombre de requerimiento:** Alta y gestión de productos

**Característica:** Permite registrar nuevos productos en el sistema

**Descripción de requerimiento:** El usuario podrá registrar nuevos productos en el sistema especificando nombre, categoría, unidad.

**Requerimiento no funcional:**** **RNF-INS-01,RNF-INS-0

**Prioridad de requerimiento: **Alta


**Identificación de requerimientos****: **RF-I2

**Nombre de requerimiento: **Gestión de lotes y trazabilidad.

**Características:**Permite registrar y controlar los lotes de cada producto

**Descripción del requerimiento:** Cada lote se registrará con número de lote, proveedor, costo, fecha de vencimiento y cantidad inicial. Esto garantiza trazabilidad y control del stock por lote.

**Requerimiento no funcional:** RNF-INS-02,RNF-INS-03,RNF-INS-05

**Prioridad de requerimiento:** Alta

**Dependencia**:Depende de RF-I1.




## 3.5 Turno

Permite organizar y visualizar los turnos disponibles del veterinario. Facilita la asignación, cancelación y control de asistencia de los turnos, optimizando la gestión del tiempo y evitando solapamientos.


**Identificación de requerimiento****: **RF-T1

**Nombre de Requerimiento: **Visualizar turnos disponibles por semana

**Característica: **El sistema muestra una interfaz de calendario para la gestión de turnos

**Descripción del requerimiento:** El usuario podrá ver una vista semanal con todos los turnos y horarios que el veterinario definió.

**Requerimiento no funcional: **TUR-01,TUR-02,TUR-03,TUR-07,TUR-08

**Prioridad del requerimiento: **Alta


**Identificación del requerimiento****: **RF-T2

**Nombre del requerimiento: **Gestionar tipos, duración y estado de turnos

**Características: **El sistema permitirá administrar el ciclo de vida completo de un turno.

**Descripción del requerimiento**:Cada turno tendrá un tipo (consulta, vacunación, tratamiento, etc.) con duración mínima de 15 minutos. Si el veterinario lo indica, se podrá reservar más de un turno consecutivo por la misma visita.

**Requerimiento no funcional: **RNF-TUR-01,RNF-TUR-02,RNF-TUR-03

**Prioridad del requerimiento: **Alta

**Dependencia**:Depende de RF-C1 (cliente) y RF-M1 (mascota)




## 3.6 Recordatorios de vacunas

Automatiza el cálculo y envío de recordatorios de vacunación. Se basa en los datos clínicos y en el consentimiento del cliente para generar notificaciones vía WhatsApp.


**Identificación de requerimiento:** RF-R1

**Nombre de requerimiento: **Calcular próxima dosis de vacuna automáticamente

**Características: **El sistema determina fecha de revacunación.

**Descripción del requerimiento:**

El sistema calculará automáticamente la próxima dosis de vacunación de cada mascota considerando especie, edad y esquema vacunatorio definido por la clínica. Permite ajustes por indicación veterinaria.

**Requerimiento no funcional: **RNF-TUR-02,RNF-TUR-04

**Prioridad del requerimiento: **Alta

**Dependencia**:Depende de RF-H2 (registro de vacunas).


**Identificación de requerimiento:**** **RF-R2

**Nombre de requerimiento:** Enviar recordatorios automáticamente de vacunas

**Características: **El sistema enviará notificaciones a los clientes sobre fechas próximas de vacunas

**Descripción del requerimiento:** El sistema programará y enviará automáticamente notificaciones al cliente para recordarle fechas próximas de vacunas

**Requerimiento no funcional: **RNF-TUR-04

**Prioridad del requerimiento:** Alta

**Dependencia**:Depende de RF-R1 y RF-C2.


# Requerimientos No Funcionales (por módulo)


## 4.1 Clientes (CLI)

**Identificación de requerimientos:**** **RNF-CLI-01

**Nombre del requerimiento: **Búsqueda rápida

**Características: **El sistema debe realizar una búsqueda de los clientes sin demorar para mejorar la experiencia de usuario

**Descripción del requerimiento: **consultas por nombre/teléfono/email ≤ **300 ms **con hasta 100.000 clientes


**Identificación de requerimientos:**** **RNF-CLI-02

**Nombre del requerimiento:** Duplicados

**Características:** El sistema debe detectar clientes potencialmente duplicados para mantener la integridad de la base de datos y evitar registros redundantes.

**Descripción del requerimiento:** El sistema debe sugerir posible duplicado cuando la similitud sea ≥ 85% considerando nombre y teléfono/email, obteniendo al menos ≥ 95% de aciertos en los casos evaluados durante las pruebas.

**Identificación de requerimientos****:** RNF-CLI-03**
**** Nombre del requerimiento: **Validación de datos**
 Características: **El sistema debe validar sintácticamente email y teléfono antes de guardar, evitando persistir información con formato inválido y brindando retroalimentación clara al usuario.**
 Descripción del requerimiento: **Los emails deben cumplir validación sintáctica básica conforme RFC (p.ej., RFC 5322 simplificada, sin verificación MX). Los teléfonos deben ingresarse en formato E.164 para Argentina (+54 seguido de código de área y número, solo dígitos). Criterio de calidad: 0 registros guardados con formato inválido. Las validaciones deben ejecutarse en frontend y backend con mensajes de error específicos.** **


## 4.2 Mascotas (PET)

**Identificación de requerimientos:** RNF-PET-01

**Nombre del requerimiento:** Integridad

**Características:** El sistema debe garantizar la correcta relación entre mascotas y clientes, evitando información huérfana que afecte la consistencia de los datos.

**Descripción del requerimiento:** cliente_id obligatorio como clave foránea (FK), asegurando **0 mascotas huérfanas** en la base de datos.


**Identificación de requerimientos:** RNF-PET-02

**Nombre del requerimiento:** Identificador único

**Características:** El sistema debe asegurar que cada mascota posea un identificador único para evitar duplicidades y facilitar su trazabilidad.

**Descripción del requerimiento:** El número de microchip o tatuaje debe ser único dentro de la base de datos. En operaciones de importación masiva debe mantenerse una colisión ≤ 0,1%, realizando verificación previa y alerta en caso de conflicto.


**Identificación de requerimientos:**** **RNF-PET-03

**Nombre del requerimiento:** Métricas físicas

**Características:** El sistema debe registrar valores físicos coherentes para cada mascota, evitando datos erróneos que afecten el historial clínico y los análisis posteriores.

**Descripción del requerimiento:** El peso debe registrarse en kilogramos (float) con rango permitido de **0 a 120 kg**. Debe garantizarse **0 valores negativos o fuera de rango** sin justificación documentada en el sistema.


**Identificación de requerimientos:**** **RNF-PET-05

**Nombre del requerimiento:** Búsqueda combinada

**Características:** El sistema debe permitir localizar mascotas de forma rápida mediante criterios combinados para mejorar la eficiencia operativa.

**Descripción del requerimiento:** El sistema debe realizar búsquedas por nombre de mascota y nombre de cliente con un tiempo de respuesta **≤ 300 ms.**


**Identificación de requerimientos:**** **RNF-PET-06

**Nombre del requerimiento:** Adjuntos seguros

**Características:** El sistema debe permitir adjuntar archivos de forma controlada, protegiendo la integridad del sistema y evitando la incorporación de contenido malicioso.

**Descripción del requerimiento:** Las fotos o archivos adjuntos deben tener un tamaño máximo de **≤ 5 MB**, limitarse solo a tipos permitidos y ser analizados con antivirus durante la carga, garantizando **0 malware aceptado en pruebas**.


## 4.3 Historia Clínica (HIS)

**Identificación de requerimientos:** RNF-HIS-01

**Nombre del requerimiento:** Trazabilidad 100%

**Características:** El sistema debe registrar de forma completa y auditable todas las acciones clínicas para garantizar trazabilidad y responsabilidad.

**Descripción del requerimiento:** Cada consulta, tratamiento u observación debe registrarse con usuario responsable, fecha y hora, dirección IP y operación realizada, alcanzando cobertura total (100%) de los eventos clínicos.


**Identificación de requerimientos:** RNF-HIS-02

**Nombre del requerimiento:** Performance de lectura

**Características:** El sistema debe abrir la historia clínica de forma ágil para no demorar la atención y la revisión de antecedentes.

**Descripción del requerimiento:** Abrir una historia clínica con **≤ 200 eventos** en **≤ 600 ms**.


**Identificación de requerimientos: **RNF-HIS-03

**Nombre del requerimiento: **Estructura estándar

**Características:** El sistema debe unificar la carga de diagnósticos y procedimientos mediante catálogos controlados, evitando inconsistencias y mejorando la estandarización clínica.

**Descripción del requerimiento:** Los diagnósticos y procedimientos deben seleccionarse desde un catálogo parametrizable y editable por el Veterinario, garantizando **0 códigos huérfanos** en la base de datos.


**Identificación de requerimientos:**** **RNF-HIS-04

**Nombre del requerimiento:** Adjuntos clínicos

**Características:** El sistema debe gestionar estudios e imágenes clínicas de forma eficiente, permitiendo su consulta rápida y manteniendo límites de tamaño para no degradar la performance ni el almacenamiento.

**Descripción del requerimiento:** Cada archivo adjunto de una visita clínica debe tener un tamaño máximo de **≤ 25 MB**, con un total por visita de **≤ 100 MB**. La vista previa de PDFs e imágenes debe generarse en **≤ 2 segundos**.


## 4.4 Insumos / Stock (INS)

**Identificación de requerimientos:**** **RNF-INS-01

**Nombre del requerimiento:** Consistencia de stock

**Características:** El sistema debe asegurar que las operaciones de inventario se registren de forma confiable, evitando inconsistencias derivadas de procesos concurrentes o errores de actualización.

**Descripción del requerimiento:** Las operaciones de stock deben ser atómicas para impedir desfasajes. La divergencia entre stock teórico y stock real en el arqueo mensual debe ser **≤ 1%**.


**Identificación de requerimientos:** RNF-INS-02

**Nombre del requerimiento:** Lotes y vencimiento

**Características:** El sistema debe asegurar la trazabilidad y control sanitario de los insumos mediante el registro obligatorio de información crítica en cada ingreso.

**Descripción del requerimiento:** Todo ingreso de insumos debe registrarse con **lote y fecha de vencimiento**, garantizando **0 registros sin dichos campos** en la base de datos.


**Identificación de requerimientos:** RNF-INS-03

**Nombre del requerimiento:** FEFO

**Características:** El sistema debe administrar el consumo de insumos priorizando los lotes con vencimiento más próximo, reduciendo pérdidas y garantizando el cumplimiento de normas sanitarias.

**Descripción del requerimiento:** La salida de insumos debe aplicar la lógica **First-Expired-First-Out (FEFO)**, utilizando el lote correcto en **≥ 98% de las transacciones auditadas**.


**Identificación de requerimientos****:** RNF-INS-04

**Nombre del requerimiento:** Bloqueo por vencido

**Características:** El sistema debe impedir el uso de insumos vencidos para garantizar la seguridad del paciente y el cumplimiento de normas sanitarias.

**Descripción del requerimiento:** No se debe permitir la dispensación, venta o consumo de insumos con fecha de vencimiento anterior a la fecha actual, garantizando **0 transacciones con fecha < hoy**.


## 4.5 Turno

**Identificación de requerimientos****:** RNF-TUR-01

**Nombre del requerimiento:** Evitar doble turno

**Características:** El sistema debe manejar la concurrencia en la reserva de turnos, evitando que dos usuarios obtengan el mismo horario con el mismo profesional.

**Descripción del requerimiento:** Ante dos intentos simultáneos de reserva para la misma franja y profesional, solo **una** debe confirmarse. En pruebas de estrés, la tasa de colisión debe ser **≤ 0,1%**.


**Identificación de requerimientos****: **RNF-TU-02

**Nombre del requerimiento: **Zona horaria

**Características: **El sistema debe unificar el manejo de fechas y horarios para evitar desfases en la agenda y garantizar coherencia en todas las visualizaciones y operaciones.

**Descripción del requerimiento: **Toda la agenda debe operar bajo la zona horaria America/Argentina/Buenos Aires, asegurando 0 turnos con zona horaria inconsistente en la base de datos o en la interfaz.




# Diagrama de Clases

