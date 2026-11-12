PYTHON ?= python3
VENV := backend/.venv
PIP := $(VENV)/bin/pip
PYTEST := $(VENV)/bin/pytest
UVICORN := $(VENV)/bin/uvicorn
DB_USER ?= root
DB_NAME ?= GimnasioDB
SQL_SCHEMA ?= Documentos/Creacion_de_BD_v1.1.sql
SQL_SEED ?= Documentos/carga_de_datos_v1.1.sql

.PHONY: help venv install db seed run test clean

help:
	@echo "================================================================="
	@echo "  SOMA Gym - Comandos de Automatizacion (Makefile)"
	@echo "================================================================="
	@echo "  make install   Crea el entorno virtual (.venv), instala"
	@echo "                 dependencias y genera backend/.env si no existe."
	@echo "  make db        Crea la base de datos e inserta los datos"
	@echo "                 desde los scripts SQL unificados (usuario: $(DB_USER))."
	@echo "  make seed      Regenera el dataset de 42 socios (12 meses de"
	@echo "                 historial) con fechas al dia y recarga MySQL."
	@echo "  make run       Inicia el servidor FastAPI en http://localhost:8000"
	@echo "  make test      Ejecuta toda la suite de pruebas con pytest."
	@echo "  make clean     Elimina archivos temporales y caches de Python."
	@echo "================================================================="

venv:
	@if [ ! -d "$(VENV)" ]; then \
		echo "-> Creando entorno virtual en $(VENV)..."; \
		$(PYTHON) -m venv $(VENV); \
	fi
	@$(PIP) install --upgrade pip

install: venv
	@echo "-> Instalando dependencias desde backend/requirements.txt..."
	@$(PIP) install -r backend/requirements.txt
	@if [ ! -f backend/.env ]; then \
		echo "-> Creando backend/.env a partir de backend/.env.example..."; \
		cp backend/.env.example backend/.env; \
	else \
		echo "-> backend/.env ya existe, se conserva la configuracion actual."; \
	fi
	@echo "-> Instalacion completada con exito."

db:
	@echo "-> Ejecutando script unico de creacion de esquema ($(SQL_SCHEMA))..."
	mysql -u $(DB_USER) < "$(SQL_SCHEMA)"
	@echo "-> Ejecutando script unico de carga de datos ($(SQL_SEED))..."
	mysql -u $(DB_USER) $(DB_NAME) < "$(SQL_SEED)"
	@echo "-> Base de datos $(DB_NAME) inicializada correctamente."

seed:
	@echo "-> Regenerando semilla de datos (42 socios, 12 meses de historial) y aplicando en MySQL..."
	DB_USER=$(DB_USER) DB_NAME=$(DB_NAME) $(VENV)/bin/python backend/scripts/seed_db.py --apply

run:
	@echo "-> Iniciando servidor SOMA Gym en http://localhost:8000 ..."
	cd backend && ./.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	@echo "-> Ejecutando suite de pruebas automatizadas..."
	$(PYTEST) backend/tests/ -v

clean:
	@echo "-> Limpiando caches de Python y Pytest..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	@echo "-> Limpieza completada."
