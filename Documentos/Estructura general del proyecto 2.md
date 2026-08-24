/proyecto-soma

│

├── /backend                 # Lógica de negocio y conexión a BD

│   ├── /config              # Configuraciones (conexión a DB, variables de entorno)

│   ├── /controllers         # Controladores (procesan las peticiones que llegan)

│   ├── /models              # Modelos de datos (Cliente, Membresia, Pago, etc.)

│   ├── /routes              # Definición de las URLs/Endpoints de la API

│   ├── /services            # Reglas de negocio complejas (ej. alertas de inactividad)

│   └── app.js / main.py     # Archivo principal que levanta el servidor

│

├── /frontend                # Interfaz de usuario (Vistas)

│   ├── /public              # Archivos estáticos (ícono, index.html base)

│   ├── /src

│   │   ├── /assets          # Imágenes, logos, tipografías y estilos globales CSS

│   │   ├── /components      # Piezas de interfaz reutilizables (botones, tarjetas, navbar)

│   │   ├── /pages           # Vistas completas (PanelAdmin, CheckInDigital, MuroNoticias)

│   │   ├── /services        # Archivos que se conectan con tu API del backend

│   │   └── App.js / main.js # Archivo principal que levanta la interfaz

│

└── /database                # Scripts e historial de la base de datos

├── /migrations          # Cambios de estructura en la BD a lo largo del tiempo

└── init_schema.sql      # El script DDL original de GimnasioDB y sus tablas

