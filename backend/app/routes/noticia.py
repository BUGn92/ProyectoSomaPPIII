from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import database
from app.crud import crud
from app.schemas import schemas
from app.models import models
from app.routes.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/noticias", tags=["Novedades"])

@router.get("/", response_model=List[schemas.NoticiaResponse])
def listar_noticias(
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    return crud.get_noticias(db)

@router.post("/", response_model=schemas.NoticiaResponse, status_code=status.HTTP_201_CREATED)
def crear_noticia(
    noticia: schemas.NoticiaCreate,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(require_roles(["Admin", "Recepcionista"]))
):
    return crud.create_noticia(db, noticia, id_usuario_autor=current_user.id_usuario)

@router.delete("/{id_noticia}", response_model=schemas.NoticiaResponse)
def eliminar_noticia(
    id_noticia: int,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(require_roles(["Admin", "Recepcionista"]))
):
    noticia_borrada = crud.delete_noticia(db, id_noticia)
    if not noticia_borrada:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La noticia no existe o ya fue eliminada"
        )
    return noticia_borrada
