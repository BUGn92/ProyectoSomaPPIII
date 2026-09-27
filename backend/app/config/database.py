import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Cargar variables de entorno desde el archivo .env en la carpeta /backend
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost:3306/GimnasioDB")

# Crear el motor de la base de datos MySQL
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True,  # Verifica conexiones muertas antes de usarlas
    pool_recycle=3600    # Recicla conexiones inactivas para evitar timeouts
)

# Sesión local para interactuar con la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base para definir los modelos ORM
Base = declarative_base()

# Dependencia para obtener la sesión de la base de datos en las rutas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
