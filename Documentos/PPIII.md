# Especificación de Requerimientos de Software (ERS)

**Proyecto:** Sistema de gestión Gimnasio SOMA  
**Materia:** Prácticas profesionalizantes III  
**Profesor:** Gustavo Gómez  
**Integrantes:** Bugnoni Agustín; Zárate Lorenzo  
**Año:** 2026  

---

# 1. Introducción

## 1.1 Propósito
El Gimnasio SOMA gestiona la administración de sus clientes, pagos de membresías, asignación de rutinas y citas con profesionales de forma mayormente analógica o con herramientas aisladas. Esto genera demoras en la recepción al ingresar, falta de seguimiento a clientes que dejan de asistir, dificultad para proyectar la rentabilidad del negocio y poca agilidad al agendar turnos de nutrición o controlar el cupo de clases grupales. 

Se propone el desarrollo de un sistema web de gestión híbrida que actúe como una herramienta administrativa y de fidelización, optimizando los tiempos del personal y mejorando la experiencia del cliente, sin perder el trato humano y personalizado característico de SOMA.

## 1.2 Descripción General
El proyecto del Gimnasio SOMA es una plataforma que integra la administración en recepción/backoffice con terminales de autoservicio (check-in en tablet). El sistema permite gestionar los datos de los socios, registrar pagos mediante múltiples métodos, controlar la vigencia del apto médico y las cuotas al ingresar, automatizar alertas de inactividad, planificar clases grupales con límite de cupos y coordinar la agenda del nutricionista del staff.

## 1.3 Objetivos
*   **Agilizar el ingreso:** Permitir al socio registrar su ingreso por sí mismo en una tablet mediante su DNI.
*   **Visualización inmediata:** Mostrar al administrador y al socio el estado de su cuota y la vigencia de su apto médico al ingresar.
*   **Seguimiento y fidelización:** Detectar inactividad (15 días sin asistir) para contactar al cliente de forma personalizada.
*   **Administración comercial:** Facilitar el registro de ingresos (pagos por diversos medios) y costos (alquiler, sueldos, servicios) para obtener balances de rentabilidad en tiempo real.
*   **Gestión de servicios adicionales:** Administrar turnos para la nutricionista y reservas para clases grupales (funcional, Zumba, etc.).

## 1.4 Alcance
El sistema incluirá:
*   Un panel de administración para la gestión de clientes, cobros, planes, costos y balances.
*   Un panel para profesores que les permita visualizar el historial deportivo del cliente y actualizar sus rutinas.
*   Un panel para la nutricionista que le permita registrar la evolución de peso, grasa y planes alimenticios de los socios.
*   Una interfaz de Check-in optimizada para pantallas táctiles (tablet) en la entrada del gimnasio.
*   Una base de datos central relacional para mantener seguros y actualizados los registros de socios, pagos, asistencias, historial médico y rutinas.

## 1.5 Fuera de Alcance
*   Integración con barreras físicas automáticas (molinetes o portones electrónicos). El check-in es netamente informativo.
*   Aplicaciones móviles nativas publicadas en App Store o Google Play Store (se opta por una Web App Responsive accesible desde celulares).
*   Pasarelas de pago automatizado recurrente internacional (se cargan los pagos manualmente en el sistema).

## 1.6 Restricciones
*   **Técnicas:** Debe ejecutarse en navegadores web estándar de escritorio y pantallas táctiles (tablets de gama media).
*   **Operativas:** Interfaz sencilla y libre de fricciones para evitar que el personal o los clientes requieran capacitaciones complejas.
*   **Legales:** Cumplimiento de la protección de datos personales de salud (físicos y nutricionales) de los clientes.

## 1.7 Responsables
*   **Gerencia (Ricardo):** Administrador general del sistema, responsable del control de caja y configuraciones de planes.
*   **Profesores de SOMA:** Usuarios del panel deportivo, encargados de la creación y actualización de rutinas.
*   **Nutricionista:** Responsable del registro de la evolución física y dietas de los clientes.
*   **Equipo de Desarrollo:** Bugnoni Agustín y Zárate Lorenzo.

## 1.8 Riesgos
*   Resistencia al cambio por parte de clientes acostumbrados a dinámicas puramente analógicas.
*   Carga inicial errónea de datos históricos de los clientes.
*   Cortes de conexión a internet en el gimnasio que afecten temporalmente el check-in digital.

---

# 2. Casos de Uso

| ID | Caso de Uso | Actor Principal | Objetivo / Descripción |
| --- | --- | --- | --- |
| **CU-01** | Registrar Socio (CRUD) | Recepcionista / Admin | Permitir dar de alta, modificar o dar de baja temporal a un cliente en el sistema. |
| **CU-02** | Check-in Digital | Cliente / Socio | El cliente ingresa su DNI en la tablet de recepción al entrar. El sistema registra la asistencia y muestra el estado de su cuota y apto médico. |
| **CU-03** | Registrar Pago | Recepcionista / Admin | Registrar los cobros de membresías especificando el método de pago (efectivo, transferencia, QR, etc.). |
| **CU-04** | Agendar Turno Nutricionista | Cliente / Recepcionista | Reservar un espacio de consulta nutricional libre en la agenda del profesional. |
| **CU-05** | Registrar Evolución Física | Nutricionista | Cargar mediciones antropométricas (peso, grasa, observaciones) del cliente. |
| **CU-06** | Asignar / Consultar Rutina | Profesor | Consultar la rutina del socio y registrar modificaciones o avances. |
| **CU-07** | Registrar Progreso Diario | Cliente / Profesor | Guardar los pesos reales y repeticiones logradas por el cliente en un ejercicio específico. |
| **CU-08** | Configurar Planes de Pago | Administrador | Modificar o añadir promociones, planes especiales (parejas, jubilados) o precios de membresías. |
| **CU-09** | Reservar Clase Grupal | Cliente / Recepcionista | Registrar a un cliente en una clase específica (funcional, calistenia) respetando el cupo máximo. |
| **CU-10** | Generar Estado de Resultados | Administrador | Calcular la rentabilidad mensual restando costos fijos/variables de los ingresos totales. |
| **CU-11** | Alertas de Inactividad | Sistema | Disparar avisos en el panel del administrador sobre socios activos que no asisten desde hace 15 días. |

---

# 3. Requerimientos Funcionales

## 3.1 Módulo: Socios y Asistencia
*   **RF-S1 (CRUD de Clientes):** Permite el registro de datos personales (Nombre, Apellido, DNI, Email, Teléfono, Dirección) y asignación de estado (Activo/Inactivo).
*   **RF-S2 (Estado de Salud y Apto):** El perfil del cliente debe contener la fecha de emisión del apto médico y un indicador visual de si se encuentra vigente (vigencia de 1 año).
*   **RF-S3 (Check-in Digital):** Interfaz para tablet de recepción donde el socio ingresa su DNI. Al hacerlo, el sistema valida la membresía y el apto médico, emitiendo una alerta visual si la cuota está vencida o el apto médico caduco.
*   **RF-S4 (Seguimiento de Inactividad):** El sistema debe marcar automáticamente a un socio como "Inactivo por Ausencia" si no registra asistencias (check-in) por más de 15 días consecutivos, notificando al administrador.

## 3.2 Módulo: Administración y Finanzas
*   **RF-F1 (Membresías Flexibles):** El sistema debe permitir configurar diversos planes (Mensual, Trimestral, Anual) con precios adaptables según convenios (parejas, jubilados, franjas horarias específicas).
*   **RF-F2 (Registro de Pagos):** Permite imputar pagos asociados a un socio, registrando la fecha del pago, el monto, el método (Efectivo, Tarjeta, Transferencia, QR) y la membresía adquirida.
*   **RF-F3 (Cálculo de Rentabilidad):** Módulo financiero donde el administrador registra gastos del gimnasio (alquiler, sueldos, servicios). El sistema debe restar automáticamente estos gastos de la recaudación de membresías para calcular la ganancia neta.

## 3.3 Módulo: Clases y Turnos
*   **RF-T1 (Agenda de Nutricionista):** Calendario interactivo donde se visualizan los bloques de horarios de la nutricionista. Permite reservar y cancelar turnos para controles de socios.
*   **RF-T2 (Calendario de Clases Grupales):** Definición de clases (Zumba, funcional, calistenia) con día, horario, profesor a cargo y cupo máximo.
*   **RF-T3 (Reservas de Clases):** Permite registrar a un socio en una clase. El sistema debe bloquear la inscripción una vez alcanzado el cupo máximo definido.

## 3.4 Módulo: Entrenamiento y Rutinas
*   **RF-E1 (Asignación de Rutinas):** Los profesores pueden asignar y editar rutinas digitales detallando ejercicios, series, repeticiones, cargas de referencia y descansos.
*   **RF-E2 (Registro de Carga Real):** El socio o el profesor pueden registrar las cargas reales levantadas y repeticiones logradas en cada jornada de entrenamiento.

---

# 4. Requerimientos No Funcionales

## 4.1 Usabilidad y UX
*   **RNF-UX1 (Interfaz Check-in):** La pantalla de check-in debe ser legible, con botones grandes y teclado numérico adaptado para tablets de ingreso rápido.
*   **RNF-UX2 (Diseño No Intrusivo):** El check-in debe tardar menos de 3 segundos por cliente para evitar cuellos de botella en la entrada.

## 4.2 Rendimiento y Concurrencia
*   **RNF-RC1 (Capacidad):** El sistema debe responder de forma fluida con una concurrencia estimada de 300 clientes activos diarios y mantener historiales de más de 700 personas sin degradación del rendimiento.

## 4.3 Operatividad y Convivencia Híbrida
*   **RNF-OH1 (Formato Híbrido):** El sistema debe permitir la impresión de rutinas en formato simple para convivir con el uso tradicional de fichas físicas de papel en el salón.

## 4.4 Seguridad y Privacidad
*   **RNF-SP1 (Roles y Permisos):** Restringir accesos: los entrenadores no pueden ver el módulo financiero ni registros médicos de la nutricionista. La nutricionista no puede modificar rutinas.
*   **RNF-SP2 (Resguardo de Datos):** Los datos financieros e históricos de salud de los clientes deben guardarse de forma cifrada y segura.
