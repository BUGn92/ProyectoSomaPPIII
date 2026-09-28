from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.config import database
from app.crud import crud
from app.schemas import schemas
from app.models import models
from app.routes.auth import get_current_user, require_roles
from app.routes.cliente import check_client_data_access

router = APIRouter(prefix="/api/pagos", tags=["Pagos"])


@router.get("/resumen-mensual", response_model=schemas.ResumenMensualResponse)
def get_resumen_mensual(
    anio: int = Query(default=None, description="Año del resumen (default: año actual)"),
    mes: int = Query(default=None, ge=1, le=12, description="Mes del resumen (default: mes actual)"),
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(require_roles(["Admin"])),
):
    """Retorna el total recaudado y cantidad de cuotas cobradas en el mes indicado."""
    hoy = date.today()
    anio_consulta = anio if anio else hoy.year
    mes_consulta = mes if mes else hoy.month
    return crud.get_resumen_mensual_pagos(db, anio=anio_consulta, mes=mes_consulta)


@router.get("/cliente/{dni}", response_model=List[schemas.PagoResponse])
def get_historial_pagos_cliente(
    dni: str,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    """Retorna el historial cronológico de pagos del socio."""
    check_client_data_access(dni, current_user)
    db_client = crud.get_client(db, dni=dni)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return crud.get_pagos_cliente(db, dni_cliente=dni)


@router.post("/", response_model=schemas.PagoResponse, status_code=status.HTTP_201_CREATED)
def registrar_pago(
    pago: schemas.PagoCreate,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(require_roles(["Admin", "Recepcionista"])),
):
    """Registra un pago y actualiza la vigencia de la membresía del socio."""
    db_client = crud.get_client(db, dni=pago.dni_cliente)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return crud.registrar_pago(db, pago_data=pago)
