from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import database
from app.crud import crud
from app.schemas import schemas
from app.models import models
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/clientes", tags=["Clientes"])

@router.get("/", response_model=List[schemas.ClienteResponse])
def read_clients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    return crud.get_clients(db, skip=skip, limit=limit)

@router.get("/{dni}", response_model=schemas.ClienteResponse)
def read_client(
    dni: str,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    db_client = crud.get_client(db, dni=dni)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_client

@router.post("/", response_model=schemas.ClienteResponse, status_code=status.HTTP_201_CREATED)
def create_new_client(
    client: schemas.ClienteCreate,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    db_client = crud.get_client(db, dni=client.dni)
    if db_client:
        raise HTTPException(status_code=400, detail="Ya existe un cliente registrado con ese DNI")
    return crud.create_client(db=db, client=client)

@router.put("/{dni}", response_model=schemas.ClienteResponse)
def update_existing_client(
    dni: str,
    client_update: schemas.ClienteUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    db_client = crud.get_client(db, dni=dni)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return crud.update_client(db=db, dni=dni, client_update=client_update)

@router.delete("/{dni}", response_model=schemas.ClienteResponse)
def delete_existing_client(
    dni: str,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    db_client = crud.get_client(db, dni=dni)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return crud.delete_client(db=db, dni=dni)

# --- Endpoints de Evolución Física ---
@router.get("/{dni}/evolucion-fisica", response_model=List[schemas.EvolucionFisicaResponse])
def read_client_evolucion_fisica(
    dni: str,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    db_client = crud.get_client(db, dni=dni)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return crud.get_client_evolucion_fisica(db, dni_cliente=dni)

@router.post("/{dni}/evolucion-fisica", response_model=schemas.EvolucionFisicaResponse, status_code=status.HTTP_201_CREATED)
def create_client_evolucion_fisica(
    dni: str,
    evolucion: schemas.EvolucionFisicaCreate,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    db_client = crud.get_client(db, dni=dni)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return crud.create_client_evolucion_fisica(db, dni_cliente=dni, evolucion=evolucion)

# --- Endpoints de Registro de Entrenamiento ---
@router.get("/{dni}/registro-entrenamiento", response_model=List[schemas.RegistroEntrenamientoResponse])
def read_client_registro_entrenamiento(
    dni: str,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    db_client = crud.get_client(db, dni=dni)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return crud.get_client_registro_entrenamiento(db, dni_cliente=dni)

@router.post("/{dni}/registro-entrenamiento", response_model=schemas.RegistroEntrenamientoResponse, status_code=status.HTTP_201_CREATED)
def create_client_registro_entrenamiento(
    dni: str,
    registro: schemas.RegistroEntrenamientoCreate,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    db_client = crud.get_client(db, dni=dni)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return crud.create_client_registro_entrenamiento(db, dni_cliente=dni, registro=registro)

# --- Endpoints auxiliares: Catálogo de Ejercicios ---
@router.get("/aux/ejercicios", response_model=List[schemas.EjercicioResponse])
def read_ejercicios(
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    return crud.get_ejercicios(db)

