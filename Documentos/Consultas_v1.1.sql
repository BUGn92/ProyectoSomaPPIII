-- 1. Clientes con membresías vencidas (Atrasados con los pagos)
-- Esta consulta cruza los datos del cliente con su historial de 
-- membresías para filtrar aquellos cuyo estado sea "Vencido" o cuya fecha de fin ya haya pasado.
SELECT 
    c.dni, 
    c.nombre, 
    c.apellido, 
    cm.fecha_inicio, 
    cm.fecha_fin, 
    cm.estado
FROM Cliente c
INNER JOIN Cliente_Membresia cm ON c.dni = cm.dni_cliente
WHERE cm.estado = 'Vencido' OR cm.fecha_fin < CURRENT_DATE;

-- 2. Historial de pagos de un cliente específico
-- Si un cliente (por ejemplo, el del DNI '30111222') viene a recepción 
-- a reclamar o consultar sus pagos, puedes usar esta consulta para ver todo su 
-- historial ordenado por fecha, desde el más reciente al más antiguo.
SELECT 
    p.id_pago, 
    p.fecha_pago, 
    p.monto, 
    p.metodo_pago, 
    p.descripcion
FROM Pago p
WHERE p.dni_cliente = '30111222' -- Puedes cambiar este DNI para probar con otros
ORDER BY p.fecha_pago DESC;

-- 3. Rutina activa de los clientes con el detalle de sus ejercicios
-- Esta es una consulta un poco más compleja (usa varios JOIN) que te permite ver 
-- exactamente qué tiene que hacer un cliente en el gimnasio el día de hoy, cruzando 
-- la rutina, el detalle y el catálogo de ejercicios
SELECT 
    c.nombre AS nombre_cliente, 
    c.apellido,
    r.objetivo, 
    e.nombre_ejercicio, 
    dr.series, 
    dr.repeticiones, 
    dr.carga, 
    dr.descanso
FROM Cliente c
INNER JOIN Rutina r ON c.dni = r.dni_cliente
INNER JOIN Detalle_Rutina dr ON r.id_rutina = dr.id_rutina
INNER JOIN Ejercicio e ON dr.id_ejercicio = e.id_ejercicio
WHERE r.activa = TRUE;

-- 4. Recaudación total agrupada por método de pago
-- Ideal para el cierre de caja o balances mensuales. Esta consulta suma todos 
-- los pagos y los agrupa para saber cuánto entró por efectivo, cuánto por tarjeta, etc..
SELECT 
    metodo_pago, 
    SUM(monto) AS recaudacion_total,
    COUNT(id_pago) AS cantidad_de_pagos
FROM Pago
GROUP BY metodo_pago
ORDER BY recaudacion_total DESC;

-- 5. Clientes activos que NO tienen una membresía asignada actualmente.
-- A veces en los sistemas quedan clientes dados de alta ("activos" en el sistema) 
-- pero que por algún error humano no se les vinculó ninguna membresía. Esta consulta 
-- usa una subconsulta para encontrar esos casos aislados.
SELECT 
    dni, 
    nombre, 
    apellido, 
    telefono, 
    fecha_alta
FROM Cliente
WHERE activo = TRUE 
  AND dni NOT IN (
      SELECT dni_cliente 
      FROM Cliente_Membresia 
      WHERE estado = 'Activa'
  );

-- Evolución de pagos por cliente en el ejercicio 2023
SELECT 
    c.dni,
    c.nombre, 
    c.apellido, 
    MONTH(p.fecha_pago) AS mes,
    SUM(p.monto) AS total_invertido
FROM Cliente c
INNER JOIN Pago p ON c.dni = p.dni_cliente
WHERE YEAR(p.fecha_pago) = 2023 -- Aquí defines el ejercicio
GROUP BY c.dni, c.nombre, c.apellido, MONTH(p.fecha_pago)
ORDER BY c.nombre, mes;

-- 6. Evolución de la composición corporal de un cliente
-- Permite visualizar el progreso de peso y grasa a lo largo del tiempo.
-- Ideal para integrarlo en un gráfico de líneas en tu aplicación.
SELECT 
    c.nombre,
    c.apellido,
    ef.fecha_medicion,
    ef.peso_kg,
    ef.porcentaje_grasa,
    ef.observaciones
FROM Cliente c
INNER JOIN Evolucion_Fisica ef ON c.dni = ef.dni_cliente
WHERE c.dni = '30111222' -- Reemplazar por la variable del cliente en el código de tu proyecto
ORDER BY ef.fecha_medicion ASC;

-- 7. Progreso mensual del volumen total levantado por cliente y ejercicio
-- Útil para evaluar la "sobrecarga progresiva" a lo largo de los meses.
-- Volumen total = (Carga levantada * Repeticiones)
SELECT 
    c.nombre,
    e.nombre_ejercicio,
    YEAR(re.fecha_entrenamiento) AS anio,
    MONTH(re.fecha_entrenamiento) AS mes,
    MAX(re.carga_real) AS carga_maxima_del_mes,
    SUM(re.carga_real * re.repeticiones_logradas) AS volumen_total_mes
FROM Registro_Entrenamiento re
INNER JOIN Cliente c ON re.dni_cliente = c.dni
INNER JOIN Ejercicio e ON re.id_ejercicio = e.id_ejercicio
WHERE c.dni = '30111222'
GROUP BY c.nombre, e.nombre_ejercicio, YEAR(re.fecha_entrenamiento), MONTH(re.fecha_entrenamiento)
ORDER BY anio, mes;

-- 8. Progresión de cargas (fuerza) en un ejercicio usando LAG()
-- Compara el peso levantado en distintas fechas por un mismo cliente.
-- La función LAG() permite restar el peso levantado en el entrenamiento actual 
-- menos el del entrenamiento inmediatamente anterior.
SELECT 
    e.nombre_ejercicio,
    re.fecha_entrenamiento,
    re.carga_real AS kg_levantados,
    re.repeticiones_logradas,
    (re.carga_real - LAG(re.carga_real) OVER (ORDER BY re.fecha_entrenamiento)) AS progreso_vs_sesion_anterior
FROM Registro_Entrenamiento re
INNER JOIN Ejercicio e ON re.id_ejercicio = e.id_ejercicio
WHERE re.dni_cliente = '32333444' AND e.id_ejercicio = 2 -- María / Sentadilla
ORDER BY re.fecha_entrenamiento ASC;
