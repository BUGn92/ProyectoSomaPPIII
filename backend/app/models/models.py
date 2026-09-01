from sqlalchemy import Column, Integer, String, Boolean, Numeric, Date, Time, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.config.database import Base

class Direccion(Base):
    __tablename__ = "Direccion"

    id_direccion = Column(Integer, primary_key=True)
    calle = Column(String(100))
    numero = Column(String(20))
    ciudad = Column(String(50))

    clientes = relationship("Cliente", back_populates="direccion")


class Membresia(Base):
    __tablename__ = "Membresia"

    id_membresia = Column(Integer, primary_key=True)
    tipo = Column(String(50), nullable=False)
    precio = Column(Numeric(10, 2), nullable=False)
    duracion_dias = Column(Integer, nullable=False)

    cliente_membresias = relationship("ClienteMembresia", back_populates="membresia")


class Usuario(Base):
    __tablename__ = "Usuario"

    id_usuario = Column(Integer, primary_key=True)
    nombre = Column(String(50), nullable=False)
    usuario_login = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    rol = Column(String(50), nullable=False)
    debe_cambiar_password = Column(Boolean, default=False)


class Ejercicio(Base):
    __tablename__ = "Ejercicio"

    id_ejercicio = Column(Integer, primary_key=True)
    nombre_ejercicio = Column(String(100), nullable=False)
    grupo_muscular = Column(String(50), nullable=False)
    activo = Column(Boolean, default=True)


class Cliente(Base):
    __tablename__ = "Cliente"

    dni = Column(String(20), primary_key=True)
    nombre = Column(String(50), nullable=False)
    apellido = Column(String(50), nullable=False)
    edad = Column(Integer)
    id_direccion = Column(Integer, ForeignKey("Direccion.id_direccion"))
    email = Column(String(100))
    telefono = Column(String(20))
    fecha_alta = Column(Date, nullable=False)
    activo = Column(Boolean, default=True)
    apto_medico_vigente = Column(Boolean, default=False)
    fecha_vencimiento_apto = Column(Date)

    direccion = relationship("Direccion", back_populates="clientes")
    cliente_membresias = relationship("ClienteMembresia", back_populates="cliente")
    pagos = relationship("Pago", back_populates="cliente")
    rutinas = relationship("Rutina", back_populates="cliente")


class ClienteMembresia(Base):
    __tablename__ = "Cliente_Membresia"

    id_cliente_membresia = Column(Integer, primary_key=True)
    dni_cliente = Column(String(20), ForeignKey("Cliente.dni"), nullable=False)
    id_membresia = Column(Integer, ForeignKey("Membresia.id_membresia"), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    estado = Column(String(20), nullable=False)

    cliente = relationship("Cliente", back_populates="cliente_membresias")
    membresia = relationship("Membresia", back_populates="cliente_membresias")


class Pago(Base):
    __tablename__ = "Pago"

    id_pago = Column(Integer, primary_key=True)
    dni_cliente = Column(String(20), ForeignKey("Cliente.dni"), nullable=False)
    fecha_pago = Column(Date, nullable=False)
    monto = Column(Numeric(10, 2), nullable=False)
    metodo_pago = Column(String(50))
    descripcion = Column(String(255))

    cliente = relationship("Cliente", back_populates="pagos")


class Rutina(Base):
    __tablename__ = "Rutina"

    id_rutina = Column(Integer, primary_key=True)
    dni_cliente = Column(String(20), ForeignKey("Cliente.dni"), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    periodo = Column(Integer)
    objetivo = Column(String(100))
    activa = Column(Boolean, default=True)
    observaciones = Column(Text)

    cliente = relationship("Cliente", back_populates="rutinas")
    detalles = relationship("DetalleRutina", back_populates="rutina")


class DetalleRutina(Base):
    __tablename__ = "Detalle_Rutina"

    id_detalle = Column(Integer, primary_key=True)
    id_rutina = Column(Integer, ForeignKey("Rutina.id_rutina"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("Usuario.id_usuario"), nullable=False)
    id_ejercicio = Column(Integer, ForeignKey("Ejercicio.id_ejercicio"), nullable=False)
    series = Column(Integer, nullable=False)
    repeticiones = Column(Integer, nullable=False)
    carga = Column(Numeric(5, 2))
    descanso = Column(String(50))

    rutina = relationship("Rutina", back_populates="detalles")
    usuario = relationship("Usuario")
    ejercicio = relationship("Ejercicio")


class EvolucionFisica(Base):
    __tablename__ = "Evolucion_Fisica"

    id_medicion = Column(Integer, primary_key=True, autoincrement=True)
    dni_cliente = Column(String(20), ForeignKey("Cliente.dni"), nullable=False)
    fecha_medicion = Column(Date, nullable=False)
    peso_kg = Column(Numeric(5, 2))
    porcentaje_grasa = Column(Numeric(4, 2))
    observaciones = Column(Text)

    cliente = relationship("Cliente")


class RegistroEntrenamiento(Base):
    __tablename__ = "Registro_Entrenamiento"

    id_registro = Column(Integer, primary_key=True, autoincrement=True)
    dni_cliente = Column(String(20), ForeignKey("Cliente.dni"), nullable=False)
    id_ejercicio = Column(Integer, ForeignKey("Ejercicio.id_ejercicio"), nullable=False)
    fecha_entrenamiento = Column(Date, nullable=False)
    carga_real = Column(Numeric(5, 2))
    repeticiones_logradas = Column(Integer)

    cliente = relationship("Cliente")
    ejercicio = relationship("Ejercicio")


class Noticia(Base):
    __tablename__ = "Noticia"

    id_noticia = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String(150), nullable=False)
    contenido = Column(Text, nullable=False)
    categoria = Column(String(50), default="General")
    fecha_publicacion = Column(Date, nullable=False)
    id_usuario_autor = Column(Integer, ForeignKey("Usuario.id_usuario"), nullable=False)

    autor = relationship("Usuario")


