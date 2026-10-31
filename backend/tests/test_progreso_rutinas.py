"""
Pruebas de Integración para la Visualización de Progreso de Ejercicios en Rutinas Históricas
Valida:
1. Consulta de ejercicios disponibles en el historial de rutinas del socio (GET /api/clientes/{dni}/progreso-rutinas/ejercicios).
2. Consulta de progresión mensual temporal por ejercicio (GET /api/clientes/{dni}/progreso-rutinas?id_ejercicio=X).
3. Guardado/Instantánea mensual automática cuando transcurren meses calendario desde el inicio de la rutina activa.
4. Control de acceso: el socio solo puede acceder a su propio progreso y staff (Admin, Entrenador) tiene acceso global.
5. Verificación de cálculo de métricas (cargas, volumen total = carga * series * repeticiones, orden cronológico).
"""

import pytest
from datetime import date, timedelta
from decimal import Decimal
import jwt
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.config.database import Base, get_db
from app.models import models
from app.crud import crud
from app.routes.auth import create_access_token, SECRET_KEY, ALGORITHM

TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        # Sembrar staff
        admin_user = models.Usuario(
            id_usuario=1,
            nombre="Administrador SOMA",
            usuario_login="cadmin",
            password=crud.hash_password("admin1234"),
            rol="Admin",
            debe_cambiar_password=False
        )
        trainer_user = models.Usuario(
            id_usuario=2,
            nombre="Entrenador Pro",
            usuario_login="entrenador1",
            password=crud.hash_password("trainer123"),
            rol="Entrenador",
            debe_cambiar_password=False
        )
        session.add_all([admin_user, trainer_user])

        # Sembrar ejercicios
        ej1 = models.Ejercicio(id_ejercicio=1, nombre_ejercicio="Press de Banca Plano", grupo_muscular="Pecho", activo=True)
        ej2 = models.Ejercicio(id_ejercicio=2, nombre_ejercicio="Sentadilla Libre con Barra", grupo_muscular="Piernas", activo=True)
        ej3 = models.Ejercicio(id_ejercicio=3, nombre_ejercicio="Remo con Barra", grupo_muscular="Espalda", activo=True)
        session.add_all([ej1, ej2, ej3])

        # Sembrar socio 1
        socio1 = models.Cliente(
            dni="40111222",
            nombre="Lucas",
            apellido="Progreso",
            email="lucas@test.com",
            telefono="11223344",
            edad=28,
            fecha_alta=date(2026, 6, 1),
            activo=True
        )
        user_socio1 = models.Usuario(
            id_usuario=10,
            nombre="Lucas Progreso",
            usuario_login="40111222",
            password=crud.hash_password("lucas123"),
            rol="Cliente",
            debe_cambiar_password=False
        )

        # Sembrar socio 2
        socio2 = models.Cliente(
            dni="40999888",
            nombre="Carla",
            apellido="Gomez",
            email="carla@test.com",
            telefono="11998877",
            edad=25,
            fecha_alta=date(2026, 8, 1),
            activo=True
        )
        user_socio2 = models.Usuario(
            id_usuario=11,
            nombre="Carla Gomez",
            usuario_login="40999888",
            password=crud.hash_password("carla123"),
            rol="Cliente",
            debe_cambiar_password=False
        )

        session.add_all([socio1, user_socio1, socio2, user_socio2])
        session.commit()
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def get_token(usuario_login: str, rol: str) -> str:
    return create_access_token(data={"sub": usuario_login, "rol": rol})


def test_obtener_ejercicios_historial_rutinas(client, db):
    """Verifica que se listen todos los ejercicios presentes en las rutinas del socio."""
    # Crear dos rutinas para el socio 40111222: una histórica y una activa
    r1 = models.Rutina(
        id_rutina=1,
        dni_cliente="40111222",
        fecha_inicio=date(2026, 8, 1),
        periodo=4,
        objetivo="Iniciación",
        activa=False
    )
    db.add(r1)
    db.flush()

    d1 = models.DetalleRutina(
        id_detalle=1,
        id_rutina=1,
        id_usuario=2,
        id_ejercicio=1, # Press banca
        dia=1,
        series=3,
        repeticiones=10,
        carga=Decimal("40.0")
    )
    db.add(d1)

    r2 = models.Rutina(
        id_rutina=2,
        dni_cliente="40111222",
        fecha_inicio=date(2026, 9, 1),
        periodo=4,
        objetivo="Hipertrofia",
        activa=True
    )
    db.add(r2)
    db.flush()

    d2 = models.DetalleRutina(
        id_detalle=2,
        id_rutina=2,
        id_usuario=2,
        id_ejercicio=1, # Press banca
        dia=1,
        series=4,
        repeticiones=8,
        carga=Decimal("47.5")
    )
    d3 = models.DetalleRutina(
        id_detalle=3,
        id_rutina=2,
        id_usuario=2,
        id_ejercicio=2, # Sentadilla
        dia=2,
        series=4,
        repeticiones=10,
        carga=Decimal("60.0")
    )
    db.add_all([d2, d3])
    db.commit()

    token_socio = get_token("40111222", "Cliente")
    res = client.get(
        "/api/clientes/40111222/progreso-rutinas/ejercicios",
        headers={"Authorization": f"Bearer {token_socio}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    nombres = [item["nombre_ejercicio"] for item in data]
    assert "Press de Banca Plano" in nombres
    assert "Sentadilla Libre con Barra" in nombres


def test_progresion_mensual_cargas_ejercicio(client, db):
    """Verifica que la serie temporal refleje el aumento de cargas y volumen a lo largo de los meses."""
    # Rutina Agosto
    r1 = models.Rutina(
        id_rutina=10,
        dni_cliente="40111222",
        fecha_inicio=date(2026, 8, 1),
        periodo=4,
        objetivo="Iniciación",
        activa=False
    )
    db.add(r1)
    db.flush()
    db.add(models.DetalleRutina(
        id_detalle=10,
        id_rutina=10,
        id_usuario=2,
        id_ejercicio=1,
        dia=1,
        series=3,
        repeticiones=10,
        carga=Decimal("40.00")
    ))

    # Rutina Septiembre
    r2 = models.Rutina(
        id_rutina=11,
        dni_cliente="40111222",
        fecha_inicio=date(2026, 9, 1),
        periodo=4,
        objetivo="Fuerza",
        activa=False
    )
    db.add(r2)
    db.flush()
    db.add(models.DetalleRutina(
        id_detalle=11,
        id_rutina=11,
        id_usuario=2,
        id_ejercicio=1,
        dia=1,
        series=3,
        repeticiones=10,
        carga=Decimal("45.00")
    ))

    # Rutina Octubre (Activa)
    r3 = models.Rutina(
        id_rutina=12,
        dni_cliente="40111222",
        fecha_inicio=date(2026, 10, 1),
        periodo=4,
        objetivo="Hipertrofia",
        activa=True
    )
    db.add(r3)
    db.flush()
    db.add(models.DetalleRutina(
        id_detalle=12,
        id_rutina=12,
        id_usuario=2,
        id_ejercicio=1,
        dia=1,
        series=4,
        repeticiones=8,
        carga=Decimal("50.00")
    ))
    db.commit()

    token_socio = get_token("40111222", "Cliente")
    res = client.get(
        "/api/clientes/40111222/progreso-rutinas?id_ejercicio=1",
        headers={"Authorization": f"Bearer {token_socio}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["id_ejercicio"] == 1
    assert data["nombre_ejercicio"] == "Press de Banca Plano"
    puntos = data["puntos"]
    assert len(puntos) == 3

    # Validar progresión cronológica de meses y cargas
    assert puntos[0]["periodo_mes"] == "2026-08"
    assert puntos[0]["carga"] == 40.0
    assert puntos[0]["volumen_total"] == 1200.0 # 40 * 3 * 10

    assert puntos[1]["periodo_mes"] == "2026-09"
    assert puntos[1]["carga"] == 45.0
    assert puntos[1]["volumen_total"] == 1350.0 # 45 * 3 * 10

    assert puntos[2]["periodo_mes"] == "2026-10"
    assert puntos[2]["carga"] == 50.0
    assert puntos[2]["volumen_total"] == 1600.0 # 50 * 4 * 8
    assert puntos[2]["activa"] is True


def test_guardado_automatico_mensual_rutina(client, db):
    """
    Verifica que si la rutina activa inició meses atrás, el sistema asegure
    e inserte instantáneas automáticas mensuales para cada mes intermedio transcurrido.
    """
    # Rutina activa iniciada en Agosto 2026
    r_activa = models.Rutina(
        id_rutina=20,
        dni_cliente="40111222",
        fecha_inicio=date(2026, 8, 1),
        periodo=4,
        objetivo="Adaptación",
        activa=True
    )
    db.add(r_activa)
    db.flush()
    db.add(models.DetalleRutina(
        id_detalle=20,
        id_rutina=20,
        id_usuario=2,
        id_ejercicio=3, # Remo
        dia=1,
        series=3,
        repeticiones=12,
        carga=Decimal("35.00")
    ))
    db.commit()

    # Al consultar el progreso, debe dispararse el auto-archivado mensual para los meses transcurridos
    token_admin = get_token("cadmin", "Admin")
    res = client.get(
        "/api/clientes/40111222/progreso-rutinas?id_ejercicio=3",
        headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert res.status_code == 200
    data = res.json()
    puntos = data["puntos"]

    # Debe contener Agosto 2026 y los meses siguientes hasta el mes corriente
    assert len(puntos) >= 2
    meses = [p["periodo_mes"] for p in puntos]
    assert "2026-08" in meses
    assert "2026-09" in meses


def test_control_acceso_progreso_socio(client, db):
    """Un socio solo puede ver su propio progreso; no puede ver el de otro socio."""
    token_socio1 = get_token("40111222", "Cliente")

    # Socio 1 intenta ver progreso del Socio 2 (40999888)
    res = client.get(
        "/api/clientes/40999888/progreso-rutinas?id_ejercicio=1",
        headers={"Authorization": f"Bearer {token_socio1}"}
    )
    assert res.status_code == 403

    # El entrenador sí tiene acceso a cualquier socio
    token_trainer = get_token("entrenador1", "Entrenador")
    res_trainer = client.get(
        "/api/clientes/40111222/progreso-rutinas/ejercicios",
        headers={"Authorization": f"Bearer {token_trainer}"}
    )
    assert res_trainer.status_code == 200


def test_pr_maximo_ultimos_tres_meses_y_descenso(client, db):
    """
    Verifica que:
    1. El PR vigente se obtenga del máximo de los últimos 3 meses cargados.
    2. Si no se logra ese PR en 3 meses consecutivos, el PR vigente baja.
    """
    # Creamos 5 meses de rutinas consecutivas para el socio 40111222:
    # Mes 1 (Jun): 70 kg
    # Mes 2 (Jul): 100 kg -> Récord personal pico
    # Mes 3 (Ago): 80 kg
    # Mes 4 (Sep): 85 kg
    # Mes 5 (Oct): 80 kg -> Han pasado Jul(100), Ago(80), Sep(85), Oct(80).
    # En Oct (últimos 3 meses: Ago=80, Sep=85, Oct=80), el PR debe bajar a 85 kg porque 100 kg quedó fuera de los 3 meses.
    cargas = [
        (date(2026, 6, 1), Decimal("70.00"), False),
        (date(2026, 7, 1), Decimal("100.00"), False),
        (date(2026, 8, 1), Decimal("80.00"), False),
        (date(2026, 9, 1), Decimal("85.00"), False),
        (date(2026, 10, 1), Decimal("80.00"), True),
    ]

    for idx, (f_inicio, carga_val, es_activa) in enumerate(cargas):
        id_r = 50 + idx
        r = models.Rutina(
            id_rutina=id_r,
            dni_cliente="40111222",
            fecha_inicio=f_inicio,
            periodo=4,
            objetivo="Fuerza",
            activa=es_activa
        )
        db.add(r)
        db.flush()
        db.add(models.DetalleRutina(
            id_detalle=50 + idx,
            id_rutina=id_r,
            id_usuario=2,
            id_ejercicio=1,
            dia=1,
            series=3,
            repeticiones=5,
            carga=carga_val
        ))
    db.commit()

    token_socio = get_token("40111222", "Cliente")
    res = client.get(
        "/api/clientes/40111222/progreso-rutinas?id_ejercicio=1&anio=2026",
        headers={"Authorization": f"Bearer {token_socio}"}
    )
    assert res.status_code == 200
    data = res.json()

    # Los últimos 3 meses cargados son Ago(80), Sep(85) y Oct(80)
    # Por tanto, el PR vigente debe haber bajado a 85.0 kg
    assert data["pr_vigente"] == 85.0
    assert "Sep 2026" in data["pr_vigente_mes"]

    puntos = data["puntos"]
    assert len(puntos) == 5

    # En Jul (punto index 1), con 100 kg, era PR:
    assert puntos[1]["carga"] == 100.0
    assert puntos[1]["es_pr"] is True

    # En Sep (punto index 3), con 85 kg (ventana Jul=100, Ago=80, Sep=85), no supera a Jul(100):
    assert puntos[3]["carga"] == 85.0
    assert puntos[3]["es_pr"] is False

    # En Oct (punto index 4), con 80 kg (ventana Ago=80, Sep=85, Oct=80), el PR bajó a 85 kg pero Oct no lo supera:
    assert puntos[4]["carga"] == 80.0
    assert puntos[4]["es_pr"] is False


def test_paginacion_por_anio_calendario(client, db):
    """
    Verifica que se pagine por año calendario (máximo 12 meses por pantalla),
    permitiendo navegar entre diferentes años de historial.
    """
    # Rutina en 2025
    r2025 = models.Rutina(
        id_rutina=60,
        dni_cliente="40111222",
        fecha_inicio=date(2025, 11, 1),
        periodo=4,
        objetivo="Iniciación",
        activa=False
    )
    db.add(r2025)
    db.flush()
    db.add(models.DetalleRutina(
        id_detalle=60,
        id_rutina=60,
        id_usuario=2,
        id_ejercicio=2,
        dia=1,
        series=3,
        repeticiones=10,
        carga=Decimal("50.00")
    ))

    # Rutina en 2026
    r2026 = models.Rutina(
        id_rutina=61,
        dni_cliente="40111222",
        fecha_inicio=date(2026, 4, 1),
        periodo=4,
        objetivo="Hipertrofia",
        activa=True
    )
    db.add(r2026)
    db.flush()
    db.add(models.DetalleRutina(
        id_detalle=61,
        id_rutina=61,
        id_usuario=2,
        id_ejercicio=2,
        dia=1,
        series=4,
        repeticiones=8,
        carga=Decimal("65.00")
    ))
    db.commit()

    token_socio = get_token("40111222", "Cliente")

    # Consultar año 2025
    res2025 = client.get(
        "/api/clientes/40111222/progreso-rutinas?id_ejercicio=2&anio=2025",
        headers={"Authorization": f"Bearer {token_socio}"}
    )
    assert res2025.status_code == 200
    data2025 = res2025.json()
    assert data2025["anio_seleccionado"] == 2025
    assert 2025 in data2025["anios_disponibles"]
    assert 2026 in data2025["anios_disponibles"]
    assert len(data2025["puntos"]) == 1
    assert data2025["puntos"][0]["periodo_mes"] == "2025-11"

    # Consultar año 2026
    res2026 = client.get(
        "/api/clientes/40111222/progreso-rutinas?id_ejercicio=2&anio=2026",
        headers={"Authorization": f"Bearer {token_socio}"}
    )
    assert res2026.status_code == 200
    data2026 = res2026.json()
    assert data2026["anio_seleccionado"] == 2026
    assert any(p["periodo_mes"] == "2026-04" for p in data2026["puntos"])

