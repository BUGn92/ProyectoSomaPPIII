from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import database
from app.crud import crud
from app.schemas import schemas
from app.models import models
from app.routes.auth import get_current_user

ROLES_STAFF = {"admin", "secretaria", "recepcionista", "entrenador"}

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])

# Dependencia para verificar si es Admin
def require_admin(current_user: models.Usuario = Depends(get_current_user)):
    if current_user.rol.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación restringida únicamente a administradores"
        )
    return current_user

@router.get("/", response_model=List[schemas.UsuarioResponse])
def read_users(
    skip: int = 0,
    limit: int = 100,
    incluir_inactivos: bool = False,
    db: Session = Depends(database.get_db),
    admin_user: models.Usuario = Depends(require_admin)
):
    if incluir_inactivos:
        return crud.get_all_users(db, skip=skip, limit=limit)
    return crud.get_users(db, skip=skip, limit=limit)

@router.get("/con-pago", response_model=List[schemas.UsuarioConPagoResponse])
def read_users_con_pago(
    skip: int = 0,
    limit: int = 100,
    incluir_inactivos: bool = False,
    db: Session = Depends(database.get_db),
    admin_user: models.Usuario = Depends(require_admin)
):
    """Retorna la lista de usuarios con estado de pago/membersía para los de rol Cliente."""
    return crud.get_users_con_estado_pago(db, skip=skip, limit=limit, incluir_inactivos=incluir_inactivos)

@router.get("/{user_id}", response_model=schemas.UsuarioResponse)
def read_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    admin_user: models.Usuario = Depends(require_admin)
):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return db_user

@router.post("/", response_model=schemas.UsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_new_user(
    user: schemas.UsuarioCreate,
    db: Session = Depends(database.get_db),
    admin_user: models.Usuario = Depends(require_admin)
):
    db_user = crud.get_user_by_login(db, username=user.usuario_login)
    if db_user:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está registrado")
    return crud.create_user(db=db, user=user)

@router.put("/{user_id}", response_model=schemas.UsuarioResponse)
def update_existing_user(
    user_id: int,
    user_update: schemas.UsuarioUpdate,
    db: Session = Depends(database.get_db),
    admin_user: models.Usuario = Depends(require_admin)
):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # Validar unicidad del login si se intenta cambiar
    if user_update.usuario_login and user_update.usuario_login != db_user.usuario_login:
        check_user = crud.get_user_by_login(db, username=user_update.usuario_login)
        if check_user:
            raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")
            
    updated_user = crud.update_user(db=db, user_id=user_id, user_update=user_update)
    return updated_user

@router.delete("/{user_id}", response_model=schemas.UsuarioResponse)
def delete_existing_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    admin_user: models.Usuario = Depends(require_admin)
):
    # Impedir que un admin se elimine a sí mismo
    if user_id == admin_user.id_usuario:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario administrador")
        
    deleted_user = crud.delete_user(db=db, user_id=user_id)
    if deleted_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return deleted_user

@router.post("/{user_id}/reactivar", response_model=schemas.UsuarioResponse)
def reactivate_existing_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    admin_user: models.Usuario = Depends(require_admin)
):
    reactivated = crud.reactivate_user(db=db, user_id=user_id)
    if reactivated is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return reactivated
