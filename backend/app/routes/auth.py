import os
from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import database
from app.crud import crud
from app.schemas import schemas
from app.models import models

# Configuración JWT
SECRET_KEY = os.getenv("SECRET_KEY", "8f39b1a511394c8b746864d36ef55fa87955fa980a373b98457c12658db4121e")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(database.get_db)) -> models.Usuario:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_login: str = payload.get("sub")
        if usuario_login is None:
            raise credentials_exception
        token_data = schemas.TokenData(usuario_login=usuario_login)
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = crud.get_user_by_login(db, username=token_data.usuario_login)
    if user is None:
        raise credentials_exception
    return user

def require_roles(allowed_roles: list):
    def role_checker(current_user: models.Usuario = Depends(get_current_user)):
        if current_user.rol not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere uno de los siguientes roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.UsuarioLogin, db: Session = Depends(database.get_db)):
    user = crud.get_user_by_login(db, username=login_data.usuario_login)
    if not user or not crud.verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.usuario_login, "rol": user.rol},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "usuario": user
    }

@router.post("/cambiar-password", response_model=schemas.UsuarioResponse)
def cambiar_password(
    data: schemas.CambioPasswordRequest,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    if not crud.verify_password(data.password_actual, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual ingresada es incorrecta"
        )
    if len(data.password_nueva.strip()) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 4 caracteres"
        )
    user_updated = crud.cambiar_password_usuario(db, current_user, data.password_nueva)
    return user_updated


# --- Recuperación de Contraseña ---
RESET_TOKEN_EXPIRE_MINUTES = 15

@router.post("/recuperar-password/solicitar", response_model=schemas.SolicitudRecuperacionResponse)
def solicitar_recuperacion_password(
    data: schemas.SolicitudRecuperacionRequest,
    db: Session = Depends(database.get_db)
):
    user = crud.get_user_by_identifier(db, identificador=data.identificador)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró un usuario con ese identificador"
        )

    reset_token = jwt.encode(
        {
            "sub": user.usuario_login,
            "purpose": "password_reset",
            "exp": datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "message": f"Token de recuperación generado para '{user.usuario_login}'. Válido por {RESET_TOKEN_EXPIRE_MINUTES} minutos.",
        "reset_token": reset_token
    }


@router.post("/recuperar-password/confirmar")
def confirmar_reseteo_password(
    data: schemas.ConfirmarReseteoRequest,
    db: Session = Depends(database.get_db)
):
    # 1. Validar coincidencia de contraseñas
    if data.nueva_password != data.confirmar_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña y su confirmación no coinciden"
        )

    # 2. Validar longitud mínima
    if len(data.nueva_password.strip()) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 6 caracteres"
        )

    # 3. Decodificar y validar el token
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de recuperación ha expirado. Solicitá uno nuevo."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de recuperación inválido o alterado"
        )

    # 4. Validar purpose
    if payload.get("purpose") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de recuperación inválido (propósito incorrecto)"
        )

    # 5. Obtener usuario y actualizar clave
    usuario_login = payload.get("sub")
    user = crud.get_user_by_login(db, username=usuario_login)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    crud.cambiar_password_usuario(db, user, data.nueva_password)

    return {"message": "Contraseña restablecida exitosamente. Ya podés iniciar sesión con tu nueva clave."}

