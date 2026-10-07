from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, time
from decimal import Decimal

# --- Dirección ---
class DireccionBase(BaseModel):
    calle: Optional[str] = None
    numero: Optional[str] = None
    ciudad: Optional[str] = None

class DireccionCreate(DireccionBase):
    pass

class DireccionResponse(DireccionBase):
    id_direccion: int

    class Config:
        from_attributes = True

# --- Membresia ---
class MembresiaResponse(BaseModel):
    id_membresia: int
    tipo: str
    precio: Decimal
    duracion_dias: int

    class Config:
        from_attributes = True

# --- Usuario ---
class UsuarioBase(BaseModel):
    nombre: str
    usuario_login: str
    rol: str # Admin, Recepcionista, Entrenador

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    usuario_login: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[str] = None

class UsuarioResponse(UsuarioBase):
    id_usuario: int
    debe_cambiar_password: Optional[bool] = False
    activo: Optional[bool] = True

    class Config:
        from_attributes = True

class UsuarioConPagoResponse(UsuarioResponse):
    """Extiende UsuarioResponse con información de estado de pago para socios (rol Cliente)."""
    estado_pago: Optional[str] = None          # "Al día", "Vencido", "Sin membresía"
    fecha_vencimiento_cuota: Optional[date] = None

class UsuarioLogin(BaseModel):
    usuario_login: str
    password: str

class CambioPasswordRequest(BaseModel):
    password_actual: str
    password_nueva: str

# --- Cliente ---
class ClienteBase(BaseModel):
    dni: str
    nombre: str
    apellido: str
    edad: Optional[int] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    activo: Optional[bool] = True
    apto_medico_vigente: Optional[bool] = False
    fecha_vencimiento_apto: Optional[date] = None

class ClienteCreate(ClienteBase):
    calle: Optional[str] = None
    numero: Optional[str] = None
    ciudad: Optional[str] = None

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    edad: Optional[int] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    activo: Optional[bool] = None
    apto_medico_vigente: Optional[bool] = None
    fecha_vencimiento_apto: Optional[date] = None
    calle: Optional[str] = None
    numero: Optional[str] = None
    ciudad: Optional[str] = None

class ClienteResponse(ClienteBase):
    fecha_alta: date
    fecha_vencimiento_cuota: Optional[date] = None
    id_direccion: Optional[int] = None
    direccion: Optional[DireccionResponse] = None

    class Config:
        from_attributes = True

# --- Autenticación / Token ---
class Token(BaseModel):
    access_token: str
    token_type: str
    usuario: UsuarioResponse

class TokenData(BaseModel):
    usuario_login: Optional[str] = None

# --- Recuperación de Contraseña ---
class SolicitudRecuperacionRequest(BaseModel):
    """Recibe el identificador del usuario (usuario_login, DNI o email)."""
    identificador: str

class SolicitudRecuperacionResponse(BaseModel):
    """Respuesta a la solicitud de recuperación por OTP."""
    message: str
    usuario_login: str
    email_enviado: str
    reset_token: Optional[str] = None  # Mantenido para retrocompatibilidad/pruebas

class VerificarOTPRequest(BaseModel):
    """Recibe el usuario_login y el código OTP de 6 dígitos."""
    usuario_login: str
    otp: str

class VerificarOTPResponse(BaseModel):
    """Respuesta tras verificar correctamente el código OTP."""
    message: str
    token_recuperacion: str


class ConfirmarReseteoRequest(BaseModel):
    """Recibe el token de reseteo y la nueva contraseña."""
    token: str
    nueva_password: str
    confirmar_password: str

# --- Ejercicio ---
class EjercicioResponse(BaseModel):
    id_ejercicio: int
    nombre_ejercicio: str
    grupo_muscular: str
    activo: bool

    class Config:
        from_attributes = True

# --- Evolución Física ---
class EvolucionFisicaBase(BaseModel):
    fecha_medicion: date
    peso_kg: Optional[Decimal] = None
    porcentaje_grasa: Optional[Decimal] = None
    observaciones: Optional[str] = None

class EvolucionFisicaCreate(EvolucionFisicaBase):
    pass

class EvolucionFisicaResponse(EvolucionFisicaBase):
    id_medicion: int
    dni_cliente: str

    class Config:
        from_attributes = True

# --- Registro de Entrenamiento ---
class RegistroEntrenamientoBase(BaseModel):
    id_ejercicio: int
    fecha_entrenamiento: date
    carga_real: Optional[Decimal] = None
    repeticiones_logradas: Optional[int] = None

class RegistroEntrenamientoCreate(RegistroEntrenamientoBase):
    pass

class RegistroEntrenamientoResponse(RegistroEntrenamientoBase):
    id_registro: int
    dni_cliente: str
    ejercicio: Optional[EjercicioResponse] = None

    class Config:
        from_attributes = True

# --- Novedades / Noticias ---
class NoticiaBase(BaseModel):
    titulo: str
    contenido: str
    categoria: Optional[str] = "General"

class NoticiaCreate(NoticiaBase):
    pass

class NoticiaResponse(NoticiaBase):
    id_noticia: int
    fecha_publicacion: date
    id_usuario_autor: int
    autor: Optional[UsuarioResponse] = None

    class Config:
        from_attributes = True

# --- Rutina y Detalle de Rutina ---
class DetalleRutinaBase(BaseModel):
    id_ejercicio: int
    series: int
    repeticiones: int
    carga: Optional[Decimal] = None
    descanso: Optional[str] = None

class DetalleRutinaCreate(DetalleRutinaBase):
    pass

class DetalleRutinaResponse(DetalleRutinaBase):
    id_detalle: int
    id_rutina: int
    id_usuario: int
    dia: int
    ejercicio: Optional[EjercicioResponse] = None
    usuario: Optional[UsuarioResponse] = None

    class Config:
        from_attributes = True

class RutinaBase(BaseModel):
    fecha_inicio: date
    periodo: Optional[int] = None
    objetivo: Optional[str] = None
    observaciones: Optional[str] = None
    activa: Optional[bool] = True

class DiaRutinaCreate(BaseModel):
    detalles: List[DetalleRutinaCreate] = Field(min_length=1)

class RutinaCreate(RutinaBase):
    detalles: List[DetalleRutinaCreate] = Field(default_factory=list)
    dias: Optional[List[DiaRutinaCreate]] = Field(default=None, min_length=1, max_length=7)

class DiaRutinaResponse(BaseModel):
    numero: int
    detalles: List[DetalleRutinaResponse]

class RutinaResponse(RutinaBase):
    id_rutina: int
    dni_cliente: str
    detalles: List[DetalleRutinaResponse] = Field(default_factory=list)
    dias: List[DiaRutinaResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


# --- Pagos ---
class PagoInicialCreate(BaseModel):
    """Datos del primer pago a registrar al dar de alta un socio."""
    monto: Decimal
    metodo_pago: str  # Efectivo, Transferencia, Débito, Crédito
    meses_abonados: int = 1
    descripcion: Optional[str] = None

class PagoCreate(BaseModel):
    dni_cliente: str
    monto: Decimal
    metodo_pago: str  # Efectivo, Transferencia, Débito, Crédito
    meses_abonados: int = 1
    descripcion: Optional[str] = None

class PagoResponse(BaseModel):
    id_pago: int
    dni_cliente: str
    fecha_pago: date
    monto: Decimal
    metodo_pago: Optional[str]
    meses_abonados: int
    fecha_vencimiento_cuota: Optional[date]
    descripcion: Optional[str]

    class Config:
        from_attributes = True

class ResumenMensualResponse(BaseModel):
    anio: int
    mes: int
    total_recaudado: Decimal
    cantidad_cuotas: int

# --- Schema compuesto: Alta de Socio con Pago Inicial obligatorio ---
class ClienteConPagoCreate(ClienteCreate):
    """Extiende ClienteCreate con el pago inicial obligatorio."""
    primer_pago: PagoInicialCreate

# --- Membresía activa (para preview de vencimiento en frontend) ---
class ClienteMembresiaResponse(BaseModel):
    id_cliente_membresia: int
    dni_cliente: str
    fecha_inicio: date
    fecha_fin: date
    estado: str

    class Config:
        from_attributes = True
