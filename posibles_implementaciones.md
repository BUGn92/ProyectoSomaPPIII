# Posibles Implementaciones y Mejoras Arquitectónicas

## 1. Automatización de Hard Delete (Borrado Físico) vs. Soft Delete (Borrado Lógico)

### Contexto y Planteo del Problema
Actualmente, el sistema SOMA implementa **Soft Delete (Borrado Lógico)** mediante la bandera `activo = False` (regla de negocio SOMA-06). Cuando un socio es dado de baja, se oculta de la interfaz operativa pero sus registros históricos (pagos, rutinas, evoluciones antropométricas) se preservan intactos en la base de datos relacional.

Si se intenta eliminar un socio de forma manual o física (`DELETE FROM Cliente WHERE dni = '...'`), el motor MySQL bloquea la operación arrojando un error de violación de clave foránea (`FOREIGN KEY constraint fails`), debido a que tablas dependientes como `Pago` y `Cliente_Membresia` hacen referencia al `dni` del cliente.

Surge la pregunta: **¿Existe una manera de dejar automatizado el borrado físico (Hard Delete)? ¿Es conveniente adoptarlo?**

---

### ¿Cómo se puede automatizar técnicamente?

Existen dos mecanismos principales para automatizar la eliminación en cascada:

#### Opción A: A nivel de Base de Datos (MySQL - `ON DELETE CASCADE`)
Consiste en actualizar la definición de las claves foráneas en todas las tablas hijas dependientes de `Cliente`:

```sql
-- Ejemplo de configuración en MySQL:
ALTER TABLE Pago DROP FOREIGN KEY Pago_ibfk_1;
ALTER TABLE Pago 
    ADD CONSTRAINT fk_pago_cliente 
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni) ON DELETE CASCADE;

ALTER TABLE Cliente_Membresia DROP FOREIGN KEY Cliente_Membresia_ibfk_1;
ALTER TABLE Cliente_Membresia 
    ADD CONSTRAINT fk_membresia_cliente 
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni) ON DELETE CASCADE;

ALTER TABLE Solicitud_Foto_Perfil 
    ADD CONSTRAINT fk_foto_cliente 
    FOREIGN KEY (dni_cliente) REFERENCES Cliente(dni) ON DELETE CASCADE;
```

*Resultado:* Al ejecutar `DELETE FROM Cliente WHERE dni = 'X';`, MySQL elimina de forma instantánea y automática todos los pagos, membresías, evoluciones físicas y solicitudes vinculadas a dicho DNI.

#### Opción B: A nivel de Backend (FastAPI / SQLAlchemy)
Se implementa un endpoint transaccional reservado exclusivamente para el Administrador:

```python
@router.delete("/api/clientes/{dni}/hard-delete", status_code=204)
def hard_delete_cliente(
    dni: str,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_roles(["Admin"]))
):
    # Eliminar en orden estricto de dependencias dentro de una transacción atómica:
    db.query(models.SolicitudFotoPerfil).filter_by(dni_cliente=dni).delete()
    db.query(models.Pago).filter_by(dni_cliente=dni).delete()
    db.query(models.ClienteMembresia).filter_by(dni_cliente=dni).delete()
    db.query(models.RegistroEntrenamiento).filter_by(dni_cliente=dni).delete()
    db.query(models.EvolucionFisica).filter_by(dni_cliente=dni).delete()
    db.query(models.Rutina).filter_by(dni_cliente=dni).delete()
    db.query(models.Cliente).filter_by(dni=dni).delete()
    db.query(models.Usuario).filter_by(usuario_login=dni).delete()
    db.commit()
```

---

### Análisis de Conveniencia: ¿Es conveniente para SOMA?

| Dimensión de Negocio | Hard Delete (Borrado Físico) | Soft Delete (Borrado Lógico `activo = False`) |
| :--- | :--- | :--- |
| **Balance de Caja y Contabilidad** | ❌ **Riesgo crítico:** Al borrarse los registros de `Pago`, se destruye la trazabilidad contable y el balance financiero de ingresos mensuales/anuales se descuadra. |  **Totalmente seguro:** El socio no tiene acceso activo, pero los ingresos percibidos en caja permanecen en los reportes financieros. |
| **Re-alta de Socios (SOMA-06)** | ❌ Si un socio vuelve tras 6 meses, su ficha, histórico médico y rutinas deben cargarse de nuevo desde cero. |  El socio se reactiva con un solo clic conservando todo su histórico. |
| **Protección ante Error Humano** | ❌ Un clic equivocado en recepción destruye datos médicos y contables irrecuperables. |  Reversible de inmediato. |
| **Limpieza de Datos de Prueba** |  Excelente para eliminar registros falsos o de prueba durante desarrollo. | ⚠️ Los registros de prueba quedan archivados como inactivos. |

---

### Estrategia Recomendada para el Proyecto SOMA

Se recomienda adoptar un **enfoque híbrido**:

1. **Uso Operativo Cotidiano (Recepción / Administrador):**
   - Mantener el **Soft Delete** (`DELETE /api/clientes/{dni}` marca `activo = False`).
   - Evita desfasajes de caja y resguarda el historial del socio.

2. **Herramienta Administrativa / Depuración (Solo Admin):**
   - Configurar `ON DELETE CASCADE` en la base de datos o proveer una acción en el panel de control: `"Eliminar Definitivamente (Acción Destructiva)"` accesible únicamente para el rol `Admin` y con ventana de confirmación explícita.
   - De esta manera, si se detecta un socio erróneo o cargado de prueba sin valor contable, el Administrador puede purgarlo completamente sin necesidad de scripts manuales.
