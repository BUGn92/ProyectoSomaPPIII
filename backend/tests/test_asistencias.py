"""
Pruebas Unitarias y de Integración: Módulo de Asistencias, Check-in Digital y Alertas de Inactividad
"""
import pytest
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.config.database import Base, get_db
from app.models import models
from app.crud import crud
from app.routes.auth import create_access_token

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
        # 1. Admin y Entrenador
        admin = models.Usuario(
            id_usuario=1,
            nombre="Admin SOMA",
            usuario_login="cadmin",
            password=crud.hash_password("admin1234"),
            rol="Admin",
            debe_cambiar_password=False
        )
        recep = models.Usuario(
            id_usuario=2,
            nombre="Recepcionista SOMA",
            usuario_login="recep1",
            password=crud.hash_password("recep1234"),
            rol="Recepcionista",
            debe_cambiar_password=False
        )
        session.add_all([admin, recep])
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

def get_auth_headers(username: str, rol: str) -> dict:
    token = create_access_token(data={"sub": username, "rol": rol})
    return {"Authorization": f"Bearer {token}"}


def test_checkin_socio_al_dia_y_apto_vigente(client, db):
    """Valida el ingreso exitoso de un socio con cuota y apto médico al día."""
    hoy = date.today()
    cli = models.Cliente(
        dni="35111222",
        nombre="Laura",
        apellido="Gómez",
        edad=28,
        fecha_alta=hoy - timedelta(days=10),
        activo=True,
        apto_medico_vigente=True,
        fecha_vencimiento_apto=hoy + timedelta(days=180)
    )
    memb = models.ClienteMembresia(
        id_cliente_membresia=1,
        dni_cliente="35111222",
        id_membresia=1,
        fecha_inicio=hoy - timedelta(days=5),
        fecha_fin=hoy + timedelta(days=25),
        estado="Activo"
    )
    db.add_all([cli, memb])
    db.commit()

    res = client.post("/api/asistencias/checkin", json={"dni": "35111222"})
    assert res.status_code == 201
    data = res.json()
    assert data["dni"] == "35111222"
    assert data["nombre_completo"] == "Laura Gómez"
    assert data["estado_cuota"] == "Al día"
    assert data["alerta_cuota"] is False
    assert data["apto_medico_vigente"] is True
    assert data["alerta_apto"] is False
    assert "Bienvenido" in data["mensaje_bienvenida"]

    # Verificar registro en base de datos
    asist = db.query(models.Asistencia).filter_by(dni_cliente="35111222").first()
    assert asist is not None
    assert asist.estado_cuota == "Al día"


def test_checkin_socio_cuota_vencida_alerta(client, db):
    """Valida que un socio con cuota vencida registre asistencia pero active la alerta."""
    hoy = date.today()
    cli = models.Cliente(
        dni="35222333",
        nombre="Carlos",
        apellido="Pérez",
        edad=35,
        fecha_alta=hoy - timedelta(days=60),
        activo=True,
        apto_medico_vigente=True,
        fecha_vencimiento_apto=hoy + timedelta(days=60)
    )
    memb = models.ClienteMembresia(
        id_cliente_membresia=2,
        dni_cliente="35222333",
        id_membresia=1,
        fecha_inicio=hoy - timedelta(days=60),
        fecha_fin=hoy - timedelta(days=5), # vencida hace 5 días
        estado="Vencida"
    )
    db.add_all([cli, memb])
    db.commit()

    res = client.post("/api/asistencias/checkin", json={"dni": "35222333"})
    assert res.status_code == 201
    data = res.json()
    assert data["estado_cuota"] == "Atrasado"
    assert data["alerta_cuota"] is True
    assert data["alerta_apto"] is False
    assert "cuota se encuentra vencida" in data["mensaje_bienvenida"]


def test_checkin_socio_apto_medico_vencido_alerta(client, db):
    """Valida la alerta si el apto médico caducó."""
    hoy = date.today()
    cli = models.Cliente(
        dni="35333444",
        nombre="Martina",
        apellido="Sosa",
        edad=22,
        fecha_alta=hoy - timedelta(days=10),
        activo=True,
        apto_medico_vigente=True,
        fecha_vencimiento_apto=hoy - timedelta(days=1) # venció ayer
    )
    memb = models.ClienteMembresia(
        id_cliente_membresia=3,
        dni_cliente="35333444",
        id_membresia=1,
        fecha_inicio=hoy,
        fecha_fin=hoy + timedelta(days=30),
        estado="Activo"
    )
    db.add_all([cli, memb])
    db.commit()

    res = client.post("/api/asistencias/checkin", json={"dni": "35333444"})
    assert res.status_code == 201
    data = res.json()
    assert data["apto_medico_vigente"] is False
    assert data["alerta_apto"] is True
    assert "apto médico" in data["mensaje_bienvenida"]


def test_checkin_errores_validacion_y_socio_inactivo(client, db):
    """Valida rechazo de DNI inválido, inexistente o socio inactivo."""
    # 1. DNI inválido (letras)
    res_inv = client.post("/api/asistencias/checkin", json={"dni": "abc1234"})
    assert res_inv.status_code == 422

    # 2. DNI inexistente
    res_no_existe = client.post("/api/asistencias/checkin", json={"dni": "99999999"})
    assert res_no_existe.status_code == 400
    assert "no corresponde a ningún socio" in res_no_existe.json()["detail"]

    # 3. Socio dado de baja lógicamente (activo=False)
    cli_inactivo = models.Cliente(
        dni="35444555",
        nombre="Inactivo",
        apellido="Baja",
        fecha_alta=date.today(),
        activo=False
    )
    db.add(cli_inactivo)
    db.commit()

    res_inactivo = client.post("/api/asistencias/checkin", json={"dni": "35444555"})
    assert res_inactivo.status_code == 400
    assert "se encuentra inactivo" in res_inactivo.json()["detail"]


def test_consulta_asistencias_de_hoy(client, db):
    """Valida listado de asistencias de la jornada para el staff."""
    hoy = date.today()
    cli = models.Cliente(dni="35555666", nombre="Pedro", apellido="Ríos", fecha_alta=hoy, activo=True)
    db.add(cli)
    db.commit()

    # Registrar checkin
    client.post("/api/asistencias/checkin", json={"dni": "35555666"})

    headers_admin = get_auth_headers("cadmin", "Admin")
    res = client.get("/api/asistencias/hoy", headers=headers_admin)
    assert res.status_code == 200
    lista = res.json()
    assert len(lista) == 1
    assert lista[0]["dni_cliente"] == "35555666"
    assert lista[0]["nombre_completo"] == "Pedro Ríos"


def test_alerta_socios_inactivos_15_dias(client, db):
    """Valida la detección de socios que no asisten desde hace más de 15 días."""
    hoy = date.today()
    ahora = datetime.now()

    # 1. Socio que asistió hoy -> NO debe ser inactivo
    cli_activo = models.Cliente(dni="35666777", nombre="Activo", apellido="Hoy", fecha_alta=hoy - timedelta(days=30), activo=True)
    # 2. Socio cuya última asistencia fue hace 20 días -> SÍ debe figurar
    cli_ausente = models.Cliente(dni="35777888", nombre="Ausente", apellido="Largo", fecha_alta=hoy - timedelta(days=60), activo=True, telefono="3421234567")
    # 3. Socio nuevo dado de alta hace 25 días que NUNCA asistió -> SÍ debe figurar
    cli_nunca_fue = models.Cliente(dni="35888999", nombre="Nunca", apellido="Asistio", fecha_alta=hoy - timedelta(days=25), activo=True)

    db.add_all([cli_activo, cli_ausente, cli_nunca_fue])
    db.commit()

    # Registrar asistencias
    asist_hoy = models.Asistencia(dni_cliente="35666777", fecha_hora=ahora, estado_cuota="Al día", apto_medico_vigente=True)
    asist_vieja = models.Asistencia(dni_cliente="35777888", fecha_hora=ahora - timedelta(days=20), estado_cuota="Al día", apto_medico_vigente=True)
    db.add_all([asist_hoy, asist_vieja])
    db.commit()

    headers = get_auth_headers("cadmin", "Admin")
    res = client.get("/api/asistencias/inactivos?dias=15", headers=headers)
    assert res.status_code == 200
    inactivos = res.json()
    dnis_inactivos = [i["dni"] for i in inactivos]

    assert "35777888" in dnis_inactivos
    assert "35888999" in dnis_inactivos
    assert "35666777" not in dnis_inactivos


def test_metricas_y_estadisticas_asistencias(client, db):
    """Valida el cálculo de asistencias de hoy y conteo de inactivos."""
    headers = get_auth_headers("cadmin", "Admin")
    res = client.get("/api/asistencias/estadisticas", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "asistencias_hoy" in data
    assert "asistencias_semana" in data
    assert "asistencias_mes" in data
    assert "socios_inactivos_alerta" in data
