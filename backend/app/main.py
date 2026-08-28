import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Cargar configuración del .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

# Importar rutas
from app.routes import auth, usuario, cliente

app = FastAPI(
    title="SOMA Gym API",
    description="API para el sistema de gestión del Gimnasio SOMA (Prácticas Profesionalizantes III)",
    version="1.0.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambiar en producción a los origins específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar enrutadores de la API
app.include_router(auth.router)
app.include_router(usuario.router)
app.include_router(cliente.router)

# Ruta de chequeo de estado de la API
@app.get("/api/health", tags=["General"])
async def health():
    return {
        "status": "online",
        "message": "La API del Gimnasio SOMA está en línea"
    }

# Montar archivos estáticos para el frontend
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)

