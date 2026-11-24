# CMMS - Sistema de Gestión de Mantenimiento Preventivo

Planifica, ejecuta y mide el mantenimiento preventivo industrial en un mismo sistema.

Tecnologías principales: .NET 10, ASP.NET Core Web API, SQL Server, React 19, Vite 8, Tailwind CSS 4 y autenticación con JWT.

---

## Descripción

CMMS (Computerized Maintenance Management System) es una aplicación web para gestionar el mantenimiento preventivo de la maquinaria de una planta industrial. Centraliza los equipos, los planes de mantenimiento, las órdenes de trabajo, los paros de máquina y el inventario de repuestos, y convierte esos datos en indicadores de confiabilidad (MTBF y MTTR) para apoyar la toma de decisiones.

El proyecto se compone de:

- API REST en ASP.NET Core (.NET 10) con autenticación JWT y base de datos SQL Server.
- Aplicación web en React 19 con una interfaz oscura de estilo industrial, gráficas interactivas y exportación a PDF.

## Funcionalidades

| Módulo | Qué permite hacer |
|---|---|
| Autenticación | Inicio de sesión con JWT, recuperación y restablecimiento de contraseña por correo electrónico. |
| Usuarios y roles | Control de acceso por rol (Administrador, Supervisor y tecnico). Rutas y acciones protegidas tanto en el frontend como el backend. |
| Dashboard | Resumen con máquinas registradas, órdenes activas, repuestos con stock bajo e intervenciones del mes. |
| Calendario | Vista mensual de mantenimientos programados, vencidos y completados. Contador de pendientes en el menú, acceso directo para registrar la orden desde el plan programado y exportación a PDF. |
| Máquinas | Registro de equipos por área, marca y estado, con los repuestos asociados a cada máquina. |
| Planes de mantenimiento | Planes por máquina con frecuencia en meses, última y próxima ejecución. |
| Órdenes de trabajo | Flujo completo: Pendiente, En Proceso, Completada o Cancelada, con registro de consumo de repuestos. |
| Paros de máquina | Registro y cierre de paros, con cálculo de duración y consulta de paros activos. |
| Repuestos e inventario | Catálogo con categorías, unidad de medida y costo unitario; alertas de stock bajo y movimientos de entrada. |
| Indicadores | MTBF, MTTR, MTBF del programa preventivo (intervalo programado frente a real), tendencia mensual, consumo e inversión en repuestos por área. Filtro por mes y exportación a PDF. |

## Indicadores de confiabilidad

- **MTTR** (Mean Time To Repair): promedio de horas que dura un paro cerrado. Mientras más bajo, mejor.
- **MTBF del programa preventivo**: compara el intervalo programado de cada plan, según su frecuencia con el intervalo real entre intervenciones completadas, para medir el cumplimiento del programa.

Los indicadores históricos se calculan mediante vistas de SQL Server (`vw_MTBF`, `vw_MTTR`, `vw_ConsumoRepuestos`) y los indicadores por periodo se calculan en la API.

## Arquitectura

El flujo general de la aplicación es el siguiente:

```
Usuario
  -> Frontend (React + Vite)
       -> API REST (ASP.NET Core, .NET 10)   [HTTPS + JWT]
            -> SQL Server                    [Entity Framework Core]
            -> Servidor SMTP                 [MailKit, correos de recuperación]
```

## Tecnologías

**Backend**

- .NET 10 y ASP.NET Core Web API
- Entity Framework Core 10 (SQL Server)
- Autenticación `JwtBearer`
- OpenAPI y Scalar para la documentación interactiva de la API

**Frontend**

- React 19, Vite 8 y React Router 7
- Tailwind CSS 4
- Axios (cliente HTTP con interceptor de token)
- Recharts (gráficas) y jsPDF con jspdf-autotable (reportes en PDF)
- lucide-react (iconos) y Oxlint (análisis estático)

## Estructura del proyecto

```
CMMS-Industrial/
├── CMMS_MANT_PREVENTIVOS/        # API REST (.NET 10)
│   ├── Controllers/              #    Endpoints por módulo
│   ├── DTOs/                     #    Objetos de transferencia de datos
│   ├── Data/                     #    DbContext y modelos de EF Core
│   ├── Services/                 #    Servicio de correo (EmailService)
│   ├── Program.cs                #    Configuración de JWT, CORS y servicios
│   └── appsettings.json          #    Configuración de la API
├── cmms-frontend/                # Aplicación web (React + Vite)
│   └── src/
│       ├── pages/                #    Pantallas (Dashboard, Calendario, Indicadores...)
│       ├── components/           #    Layout, rutas protegidas y componentes comunes
│       ├── services/             #    Cliente de la API por módulo
│       ├── context/              #    Contexto de autenticación
│       ├── hooks/                #    Hooks personalizados
│       └── Utils/                #    Utilidades (PDF, mantenimientos, unidades)
└── CMMS_MANT_PREVENTIVOS.slnx    # Solución de Visual Studio
```

## Instalación y ejecución

### Requisitos previos

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 20.19+ o 22.12+
- SQL Server o SQL Server Express

### 1. Clonar el repositorio

```bash
git clone https://github.com/Waord2000/CMMS-Industrial.git
cd CMMS-Industrial
```

### 2. Base de datos

Crea en SQL Server una base de datos llamada `CMMS_MantenimientoPreventivo` y ejecuta en ella el script SQL del modelo.

La cadena de conexión por defecto apunta a `localhost\SQLEXPRESS` con autenticación de Windows. Si tu instancia es distinta, cámbiala en `CMMS_MANT_PREVENTIVOS/appsettings.json`:

```json
"ConnectionStrings": {
  "CmmsConnection": "Server=localhost\\SQLEXPRESS;Database=CMMS_MantenimientoPreventivo;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

### 3. Backend (API)

```bash
cd CMMS_MANT_PREVENTIVOS
dotnet dev-certs https --trust        # solo la primera vez
dotnet run --launch-profile https
```

La API queda disponible en `https://localhost:7099` (y `http://localhost:5013`). En modo desarrollo, la documentación interactiva está en `https://localhost:7099/scalar/v1`.

### 4. Frontend

En otra terminal:

```bash
cd cmms-frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Configuración

### API (`appsettings.json`)

| Clave | Descripción |
|---|---|
| `ConnectionStrings:CmmsConnection` | Cadena de conexión a SQL Server. |
| `Jwt:Key` | Clave secreta para firmar los tokens. Usa una clave propia y no la subas al repositorio. |
| `Jwt:ExpiresInMinutes` | Duración de la sesión (480 minutos por defecto). |
| `Email:*` | Servidor SMTP para los correos de recuperación de contraseña. |
| `Frontend:BaseUrl` | URL del frontend usada en los enlaces de recuperación. |

Para guardar la clave JWT fuera del código, en desarrollo puedes usar user-secrets:

```bash
cd CMMS_MANT_PREVENTIVOS
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "una-clave-larga-y-aleatoria-de-al-menos-32-caracteres"
```

Para probar la recuperación de contraseña en local puedes usar una herramienta de correo de pruebas (por ejemplo, smtp4dev o Papercut) escuchando en `localhost:2525`, que es el puerto configurado por defecto.

### Frontend (`cmms-frontend/.env`)

| Variable | Valor por defecto |
|---|---|
| `VITE_API_URL` | `https://localhost:7099/api` |

La API permite solicitudes (CORS) desde `http://localhost:5173` y `http://localhost:3000`.

## API REST

Todos los endpoints, salvo los de `Auth`, requieren el encabezado `Authorization: Bearer <token>`.

| Recurso | Ruta base | Operaciones destacadas |
|---|---|---|
| Autenticación | `/api/Auth` | `login`, `olvide-contrasena`, `restablecer-contrasena` |
| Máquinas | `/api/Maquinas` | CRUD |
| Repuestos | `/api/Repuestos` | CRUD, `stock-bajo` |
| Movimientos de inventario | `/api/MovimientosInventario` | Listado, por repuesto, `entrada` |
| Planes de mantenimiento | `/api/PlanesMantenimiento` | CRUD |
| Órdenes de trabajo | `/api/OrdenesTrabajo` | CRUD, `registrar`, `iniciar`, `completar`, `cancelar` |
| Paros de máquina | `/api/ParosMaquina` | Listado, registro, `activos`, `por-maquina`, `cerrar` |
| Indicadores | `/api/Indicadores` | `mtbf`, `mttr`, `mtbf-preventivo`, `mttr-periodo`, `mtbf-periodo`, `consumo-detalle`, `tendencia` |
| Usuarios | `/api/Usuarios` | CRUD |

Además existen recursos de apoyo para áreas, tipos de mantenimiento, categorías de repuestos, roles, tareas de plan, consumo de repuestos y la relación máquina-repuesto.

### Permisos por rol

- **Administrador:** acceso total, incluida la eliminación de registros, la gestión de usuarios y los catálogos.
- **Supervisor:** puede crear y editar órdenes de trabajo y repuestos, y cancelar órdenes.
- **Tecnico:** puede observar el calendario, generar la orden de trabajo y visualizar las metricas MTTR, MTBF y costos por área.

## Autor

Desarrollado por Walter Ordoñez [Waord2000](https://github.com/Waord2000).
