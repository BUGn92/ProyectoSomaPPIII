Basado en la entrevista con Ricardo, el dueño del “Gimnasio Soma”, se presentan los requerimientos para el desarrollo de su sistema de gestión.

La visión del dueño es clara: el software debe ser una herramienta administrativa y de fidelización que no elimine el trato humano y personalizado que caracteriza al gimnasio.


# Requerimientos Funcionales

Los requerimientos funcionales definen las acciones específicas que el sistema debe ser capaz de realizar.


## 1. Gestión de Clientes y Asistencia


### Registro de Usuarios

El sistema debe permitir el alta, baja y modificación de datos de clientes (CRUD)


### Check-in Digital

Implementación de una interfaz para tablet donde el cliente se identifique al ingresar. Esto estará vinculado a una pantalla donde se presentan los datos del cliente y el estado de la cuota al día de la fecha.


### Estado de Salud

El sistema debe mostrar visualmente si el cliente tiene el apto médico vigente.


### Control de Actividad

Registro de ingresos para determinar quiénes son clientes activos y quiénes han dejado de asistir.


### Alertas de Inactividad

Disparar notificaciones automáticas o avisos al administrador cuando un cliente no asiste por un periodo determinado (ej. 15 días). Esto sirve como seguimiento de los clientes y para poder establecer una via de comunicación y conocer el caso particular de cada uno según amerite.


## 2. Gestión Administrativa y Comercial


### Múltiples Planes de Membresía

Soporte para diferentes categorías de precios: general, parejas, franjas horarias específicas (promociones), jubilados y casos especiales manuales.


### Control de Pagos

Registro de pagos por diversos medios (efectivo, transferencia, tarjeta, QR).


### Cálculo de Rentabilidad

Generar estados de resultados que contemplen costos (alquiler, sueldos, servicios) versus ingresos totales.


## 3. Gestión de Personal y Turnos


### Roles de Usuario

Diferenciar permisos entre administradores y profesores.


### Agenda de Nutricionista

Módulo para gestionar turnos y citas con la nutricionista del staff.


### Gestión de Clases

Calendario para futuras clases grupales (Zumba, funcional, calistenia) con control de cupos.


## 4. Comunicación y App Móvil


### Portal del Cliente

Aplicación donde el socio pueda consultar la fecha de vencimiento de su cuota y horarios.


### Muro de Noticias

Espacio para publicar información sobre salud, importancia de la fuerza e hipertrofia, y novedades institucionales.


# Requerimientos No Funcionales

Estos requerimientos definen las propiedades y restricciones del sistema.


## 1. Usabilidad y Experiencia de Usuario (UX)


### Interfaz Amigable

El sistema de check-in debe ser intuitivo para que el cliente lo use sin asistencia.


### No Intrusivo

El software no debe actuar como una barrera física (como un molinete); debe fomentar la familiaridad.


## 2. Escalabilidad y Rendimiento


### Capacidad de Crecimiento

El sistema debe soportar una base de datos proyectada de al menos **250 a 300 clientes activos**.


### Gestión de Históricos

Capacidad para almacenar y consultar datos de los cientos de clientes que han pasado por el gimnasio (historial de más de 700 personas).


## 3. Operatividad Híbrida


### Compatibilidad Analógica

El sistema debe coexistir con el uso de fichas físicas de papel para las rutinas, funcionando como un complemento informativo para el profesor.


## 4. Disponibilidad y Seguridad


### Acceso Multi-dispositivo

El administrador debe poder visualizar los estados de cuenta y alertas desde su pantalla mientras el cliente usa la tablet en la entrada.


### Privacidad de Datos

Manejo seguro de la información sensible, especialmente la relacionada con la contabilidad interna y datos de salud.

