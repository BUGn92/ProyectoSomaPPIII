from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.config import database
from app.crud import crud
from app.schemas import schemas
from app.models import models
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/plantillas-rutina", tags=["Plantillas de Rutina"])


def _plantilla_response_data(plantilla: models.PlantillaRutina) -> dict:
    detalles_por_dia = {}
    for detalle in plantilla.detalles:
        detalles_por_dia.setdefault(detalle.dia, []).append(detalle)

    return {
        "id_plantilla": plantilla.id_plantilla,
        "nombre": plantilla.nombre,
        "objetivo": plantilla.objetivo,
        "nivel": plantilla.nivel,
        "dias_semana": plantilla.dias_semana,
        "duracion_estimada_min": plantilla.duracion_estimada_min,
        "observaciones": plantilla.observaciones,
        "activo": plantilla.activo,
        "detalles": plantilla.detalles,
        "dias": [
            {"numero": numero_dia, "detalles": detalles}
            for numero_dia, detalles in sorted(detalles_por_dia.items())
        ],
    }


@router.get("/", response_model=List[schemas.PlantillaRutinaResponse])
def listar_plantillas_rutina(
    objetivo: Optional[str] = Query(None, description="Filtrar por objetivo (ej. Iniciación, Hipertrofia, Pérdida de Peso, Fuerza)"),
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Retorna el catálogo de plantillas de rutinas prediseñadas (iniciación, hipertrofia, etc.),
    organizadas por días y ejercicios.
    """
    plantillas = crud.get_plantillas_rutina(db, objetivo=objetivo)
    return [_plantilla_response_data(p) for p in plantillas]


@router.get("/{id_plantilla}", response_model=schemas.PlantillaRutinaResponse)
def obtener_plantilla_rutina(
    id_plantilla: int,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Obtiene los datos completos de una plantilla de rutina específica.
    """
    plantilla = crud.get_plantilla_rutina_by_id(db, id_plantilla=id_plantilla)
    if not plantilla:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró la plantilla de rutina con ID {id_plantilla}"
        )
    return _plantilla_response_data(plantilla)
