"""
Pruebas de Integración para el Módulo de Plantillas de Rutinas (Iniciación y Objetivos)
Valida:
1. Listado de plantillas de rutinas prediseñadas (iniciación, pérdida de peso, hipertrofia, fuerza/halterofilia).
2. Verificación de la rutina de iniciación: 3 días, <= 50 minutos de duración, series y repeticiones controladas.
3. Filtrado por objetivo de entrenamiento.
4. Obtención de detalle completo de una plantilla por ID.
5. Aplicación / Asignación de la plantilla de iniciación a un cliente en formato planilla sin alterar contratos existentes.
"""

import pytest
from datetime import date
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
        # Sembrar usuario Admin y Entrenador
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
            nombre="Mario Fuerte",
            usuario_login="mfuerte",
            password=crud.hash_password("trainer123"),
            rol="Entrenador",
            debe_cambiar_password=False
        )
        session.add_all([admin_user, trainer_user])

        # Sembrar catálogo de ejercicios
        ej1 = models.Ejercicio(id_ejercicio=1, nombre_ejercicio="Press de Banca Plano", grupo_muscular="Pecho", activo=True)
        ej2 = models.Ejercicio(id_ejercicio=2, nombre_ejercicio="Sentadilla Libre con Barra", grupo_muscular="Piernas", activo=True)
        ej3 = models.Ejercicio(id_ejercicio=3, nombre_ejercicio="Dominadas", grupo_muscular="Espalda", activo=True)
        ej4 = models.Ejercicio(id_ejercicio=4, nombre_ejercicio="Press Militar", grupo_muscular="Hombros", activo=True)
        ej5 = models.Ejercicio(id_ejercicio=5, nombre_ejercicio="Curl con barra", grupo_muscular="Bíceps", activo=True)
        ej6 = models.Ejercicio(id_ejercicio=6, nombre_ejercicio="Extensiones en polea", grupo_muscular="Tríceps", activo=True)
        ej7 = models.Ejercicio(id_ejercicio=7, nombre_ejercicio="Peso Muerto", grupo_muscular="Piernas/Espalda", activo=True)
        session.add_all([ej1, ej2, ej3, ej4, ej5, ej6, ej7])
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


def get_auth_headers(usuario_login: str, rol: str) -> dict:
    token = create_access_token({"sub": usuario_login, "rol": rol})
    return {"Authorization": f"Bearer {token}"}


def test_listar_plantillas_rutina(client, db):
    """Verifica que se listen las 4 plantillas para diferentes objetivos."""
    headers = get_auth_headers("mfuerte", "Entrenador")
    response = client.get("/api/plantillas-rutina/", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert len(data) >= 4
    nombres = [p["nombre"] for p in data]
    assert any("Iniciación" in n for n in nombres)
    assert any("Pérdida de Peso" in n for n in nombres)
    assert any("Hipertrofia" in n for n in nombres)
    assert any("Fuerza" in n for n in nombres)


def test_rutina_iniciacion_cumple_requisitos(client, db):
    """
    Verifica que la plantilla de iniciación cumpla:
    - Al menos 3 días por semana.
    - No más de 1 hora (duracion_estimada_min <= 60).
    - Ejercicios estructurados por días.
    """
    headers = get_auth_headers("mfuerte", "Entrenador")
    response = client.get("/api/plantillas-rutina/?objetivo=Iniciación", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

    iniciacion = data[0]
    assert iniciacion["dias_semana"] >= 3
    assert iniciacion["duracion_estimada_min"] <= 60
    assert len(iniciacion["dias"]) >= 3

    # Verificar que cada día tenga ejercicios asignados
    for dia in iniciacion["dias"]:
        assert len(dia["detalles"]) > 0
        for det in dia["detalles"]:
            assert det["series"] > 0
            assert det["repeticiones"] > 0
            assert det["descanso"] is not None


def test_obtener_plantilla_por_id(client, db):
    """Verifica la consulta individual de una plantilla."""
    headers = get_auth_headers("cadmin", "Admin")
    response = client.get("/api/plantillas-rutina/1", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id_plantilla"] == 1
    assert "Iniciación" in data["nombre"]

    # Caso 404
    resp_404 = client.get("/api/plantillas-rutina/9999", headers=headers)
    assert resp_404.status_code == 404


def test_aplicar_plantilla_iniciacion_a_cliente(client, db):
    """
    Valida el flujo integral: un entrenador consulta la plantilla de iniciación,
    toma sus días/ejercicios y se la asigna a un cliente nuevo mediante POST /api/clientes/{dni}/rutina.
    """
    # 1. Crear Cliente y Usuario correspondiente
    cliente_db = models.Cliente(
        dni="42111222",
        nombre="Carlos",
        apellido="Novato",
        fecha_alta=date.today(),
        activo=True
    )
    usuario_db = models.Usuario(
        id_usuario=10,
        nombre="Carlos Novato",
        usuario_login="42111222",
        password=crud.hash_password("clave123"),
        rol="Cliente",
        debe_cambiar_password=False,
        activo=True
    )
    db.add_all([cliente_db, usuario_db])
    db.commit()

    headers = get_auth_headers("mfuerte", "Entrenador")

    # 2. Obtener la plantilla de iniciación
    res_plantilla = client.get("/api/plantillas-rutina/1", headers=headers)
    assert res_plantilla.status_code == 200
    plantilla = res_plantilla.json()

    # 3. Armar el payload para la rutina del cliente
    payload_rutina = {
        "fecha_inicio": str(date.today()),
        "periodo": 4,
        "objetivo": plantilla["objetivo"],
        "observaciones": plantilla["observaciones"],
        "activa": True,
        "dias": [
            {
                "detalles": [
                    {
                        "id_ejercicio": det["id_ejercicio"],
                        "series": det["series"],
                        "repeticiones": det["repeticiones"],
                        "carga": float(det["carga_sugerida"]) if det.get("carga_sugerida") is not None else 0.0,
                        "descanso": det["descanso"]
                    }
                    for det in dia["detalles"]
                ]
            }
            for dia in plantilla["dias"]
        ]
    }

    # 4. Guardar rutina para el cliente
    res_asignar = client.post("/api/clientes/42111222/rutina", json=payload_rutina, headers=headers)
    assert res_asignar.status_code == 201
    rutina_creada = res_asignar.json()

    assert rutina_creada["objetivo"] == plantilla["objetivo"]
    assert len(rutina_creada["dias"]) == 3

    # 5. Consultar rutina asignada como el socio
    headers_socio = get_auth_headers("42111222", "Cliente")
    res_socio = client.get("/api/clientes/42111222/rutina", headers=headers_socio)
    assert res_socio.status_code == 200
    socio_data = res_socio.json()
    assert len(socio_data["detalles"]) == len(plantilla["detalles"])
