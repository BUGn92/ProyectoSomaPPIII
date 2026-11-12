from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.config import database
from app.crud import crud
from app.schemas import schemas
from app.models import models
from app.routes.auth import get_current_user, require_roles
from app.routes.cliente import check_client_data_access

router = APIRouter(prefix="/api/asistencias", tags=["Asistencias"])


@router.post("/checkin", response_model=schemas.CheckinResponse, status_code=status.HTTP_201_CREATED)
def registrar_checkin(
    checkin_data: schemas.CheckinRequest,
    db: Session = Depends(database.get_db)
):
    """
    Registra el ingreso (check-in) de un socio en el gimnasio desde la tablet de entrada.
    Valida el DNI, registra la fecha/hora y devuelve el estado de la cuota y del apto médico.
    """
    try:
        return crud.registrar_asistencia_checkin(db, checkin_data.dni)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/hoy", response_model=List[schemas.AsistenciaDetalladaResponse])
def get_asistencias_de_hoy(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(require_roles(["Admin", "Recepcionista", "Entrenador"]))
):
    """Retorna las asistencias registradas en el día de la fecha."""
    return crud.get_asistencias_hoy(db, limit=limit)


@router.get("/cliente/{dni}", response_model=List[schemas.AsistenciaResponse])
def get_asistencias_por_cliente(
    dni: str,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Retorna el historial de asistencias de un cliente.
    Accesible para staff o para el propio cliente sobre sus datos.
    """
    check_client_data_access(dni, current_user)
    return crud.get_asistencias_cliente(db, dni, limit=limit)


@router.get("/inactivos", response_model=List[schemas.ClienteInactivoResponse])
def get_socios_inactivos(
    dias: int = Query(15, ge=1, le=180),
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(require_roles(["Admin", "Recepcionista"]))
):
    """
    Retorna la lista de socios activos que no registran asistencia hace `dias` días (por defecto 15).
    Permite al personal contactarlos para fidelización y seguimiento de abandono.
    """
    return crud.get_clientes_inactivos(db, dias_umbral=dias)


@router.get("/estadisticas", response_model=schemas.EstadisticasAsistenciasResponse)
def get_metricas_asistencias(
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(require_roles(["Admin", "Recepcionista", "Entrenador"]))
):
    """Retorna métricas de concurrencia diaria, semanal y mensual, junto al total de inactivos."""
    return crud.get_estadisticas_asistencias(db)
