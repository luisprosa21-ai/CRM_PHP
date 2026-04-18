# 🏠 CRM Hipotecario

**Plataforma integral de gestión del ciclo completo de solicitudes hipotecarias.**

CRM Hipotecario es un sistema de gestión de relaciones con clientes diseñado para el sector hipotecario. Actúa como intermediario tecnológico entre el **cliente final** que solicita financiación, el **asesor comercial** que gestiona el expediente y las **entidades financieras** que evalúan y ofertan condiciones.

El sistema cubre el flujo de negocio de principio a fin: captación de leads, alta de clientes, gestión de expedientes, recogida documental, envío de solicitudes a bancos, comparación de ofertas, seguimiento y cierre.

---

## Índice

- [Arquitectura](#arquitectura)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
  - [1. Clonar el Repositorio](#1-clonar-el-repositorio)
  - [2. Base de Datos (MySQL)](#2-base-de-datos-mysql)
  - [3. Backend PHP](#3-backend-php)
  - [4. BFF — Backend for Frontend (Node.js)](#4-bff--backend-for-frontend-nodejs)
  - [5. Frontend SPA](#5-frontend-spa)
- [Variables de Entorno](#variables-de-entorno)
  - [Backend (`backend/.env`)](#backend-backendenv)
  - [BFF (`bff/.env`)](#bff-bffenv)
- [Ejecución](#ejecución)
- [Endpoints de la API](#endpoints-de-la-api)
- [Tests](#tests)
- [Usuarios de Prueba](#usuarios-de-prueba)
- [Documentación Adicional](#documentación-adicional)
- [Licencia](#licencia)

---

## Arquitectura

El proyecto sigue una arquitectura de tres capas:

```
┌──────────────────────────────────────────────────────────────┐
│                 FRONTEND SPA (Puerto 8080)                   │
│    Portal de Cliente · CRM Interno · Backoffice              │
│    JavaScript vanilla (ES Modules) + SPA Router (hash)       │
├──────────────────────────────────────────────────────────────┤
│                 BFF Node.js (Puerto 3001)                    │
│    Express · JWT · Helmet · CORS · Rate Limiting · Winston   │
│    Rutas: /portal · /crm · /banks · /backoffice              │
├──────────────────────────────────────────────────────────────┤
│                 BACKEND PHP (Puerto 8000)                    │
│    PHP 8.2+ · DDD / Clean Architecture · MySQL               │
│    Dominio: Users, Leads, Clients, Expedientes, Offers...    │
└──────────────────────────────────────────────────────────────┘
```

| Capa | Tecnología | Función |
|------|------------|---------|
| **Frontend SPA** | JavaScript vanilla (ES Modules) | Interfaz de usuario para clientes, asesores y dirección |
| **BFF (API Gateway)** | Node.js 18+ / Express | Capa intermedia: autenticación, caché, agregación de datos, integraciones externas |
| **Backend Core** | PHP 8.2+ (DDD / Clean Architecture) | Lógica de dominio, persistencia, reglas de negocio |
| **Base de datos** | MySQL 8.0+ | Almacenamiento relacional con charset `utf8mb4` |

### Perfiles de usuario

| Perfil | Acceso | Descripción |
|--------|--------|-------------|
| **Cliente** | Portal (`/portal`) | Seguimiento de su expediente, documentos y ofertas |
| **Asesor** | CRM (`/crm`) | Gestión de leads, clientes, expedientes y tareas |
| **Admin / Gerente** | Backoffice (`/backoffice`) | KPIs, reportes y auditoría |

---

## Estructura del Proyecto

```
CRM_PHP/
├── backend/                  # API REST — PHP 8.2+ (DDD / Clean Architecture)
│   ├── config/               #   Configuración (app, database)
│   ├── database/
│   │   ├── migrations/       #   Scripts SQL de creación de tablas
│   │   └── seeds/            #   Datos de prueba (seed.sql)
│   ├── public/
│   │   └── index.php         #   Punto de entrada HTTP
│   ├── src/
│   │   ├── Application/      #   DTOs, Servicios de aplicación, Casos de uso
│   │   ├── Domain/           #   Entidades, Repositorios, Servicios, Value Objects
│   │   └── Infrastructure/   #   Base de datos, HTTP (Controllers, Middleware, Router)
│   ├── tests/                #   Tests unitarios (PHPUnit)
│   ├── .env.example          #   Plantilla de variables de entorno
│   ├── composer.json
│   └── phpunit.xml
│
├── bff/                      # BFF / API Gateway — Node.js + Express
│   ├── src/
│   │   ├── adapters/         #   Adaptadores de integraciones (bancos, notificaciones, docs)
│   │   ├── config/           #   Configuración centralizada
│   │   ├── middleware/       #   Middlewares (auth, errores, logging)
│   │   ├── routes/           #   Rutas (portal, crm, banks, backoffice)
│   │   ├── services/         #   Servicios (cache, event bus, proxy)
│   │   └── server.js         #   Punto de entrada del servidor
│   ├── tests/                #   Tests (Node.js test runner)
│   ├── .env.example          #   Plantilla de variables de entorno
│   └── package.json
│
├── frontend/                 # SPA — JavaScript vanilla (ES Modules)
│   ├── public/
│   │   └── index.html        #   Página principal
│   ├── src/
│   │   ├── components/       #   Componentes UI (portal, crm, backoffice, shared)
│   │   ├── services/         #   Servicios (API, auth, notificaciones)
│   │   ├── styles/           #   Hojas de estilo CSS
│   │   └── utils/            #   Utilidades (router, estado, helpers)
│   │   └── app.js            #   Punto de entrada de la SPA
│   └── package.json
│
├── docs/                     # Documentación técnica
│   ├── informe-arquitectura-software.md
│   ├── informe-flujo-ejecucion.md
│   └── informe-funcionalidad.md
│
└── README.md
```

---

## Requisitos Previos

Asegúrate de tener instaladas las siguientes herramientas antes de comenzar:

| Herramienta | Versión mínima | Uso |
|-------------|---------------|-----|
| **PHP** | 8.2+ | Backend Core |
| **Composer** | 2.x | Gestión de dependencias PHP |
| **Node.js** | 18+ | BFF y servidor de desarrollo del frontend |
| **npm** | 9+ | Gestión de dependencias Node.js |
| **MySQL** | 8.0+ | Base de datos relacional |

### Extensiones PHP requeridas

- `pdo` y `pdo_mysql` — Conexión a la base de datos
- `mbstring` — Manejo de cadenas multibyte (UTF-8)
- `json` — Codificación/decodificación JSON
- `openssl` — Operaciones criptográficas (JWT)

---

## Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/luisprosa21-ai/CRM_PHP.git
cd CRM_PHP
```

### 2. Base de Datos (MySQL)

Crea la base de datos y ejecuta las migraciones:

```bash
# Conéctate a MySQL
mysql -u root -p

# Dentro de la consola MySQL:
CREATE DATABASE crm_hipotecario CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

Ejecuta los scripts de migración en orden para crear las tablas:

```bash
mysql -u root -p crm_hipotecario < backend/database/migrations/001_create_users_table.sql
mysql -u root -p crm_hipotecario < backend/database/migrations/002_create_leads_table.sql
mysql -u root -p crm_hipotecario < backend/database/migrations/003_create_clients_table.sql
mysql -u root -p crm_hipotecario < backend/database/migrations/004_create_expedientes_table.sql
mysql -u root -p crm_hipotecario < backend/database/migrations/005_create_offers_table.sql
mysql -u root -p crm_hipotecario < backend/database/migrations/006_create_tasks_table.sql
mysql -u root -p crm_hipotecario < backend/database/migrations/007_create_documents_table.sql
mysql -u root -p crm_hipotecario < backend/database/migrations/008_create_notifications_table.sql
mysql -u root -p crm_hipotecario < backend/database/migrations/009_create_audit_logs_table.sql
```

**(Opcional)** Carga los datos de prueba:

```bash
mysql -u root -p crm_hipotecario < backend/database/seeds/seed.sql
```

### 3. Backend PHP

```bash
cd backend

# Instalar dependencias
composer install

# Crear archivo de configuración de entorno
cp .env.example .env
```

Edita `backend/.env` con los valores de tu entorno (consulta la sección [Variables de Entorno](#variables-de-entorno) más abajo).

**Generar un secreto JWT seguro:**

```bash
php -r "echo bin2hex(random_bytes(32)) . PHP_EOL;"
```

Copia el resultado en la variable `JWT_SECRET` de tu archivo `.env`.

**Crear el directorio de almacenamiento de documentos:**

```bash
mkdir -p storage/documents
```

### 4. BFF — Backend for Frontend (Node.js)

```bash
cd bff

# Instalar dependencias
npm install

# Crear archivo de configuración de entorno
cp .env.example .env
```

Edita `bff/.env` con los valores correspondientes. El valor de `JWT_SECRET` **debe coincidir** con el configurado en el backend.

**Crear el directorio de almacenamiento:**

```bash
mkdir -p storage
```

### 5. Frontend SPA

```bash
cd frontend

# Instalar dependencias
npm install
```

El frontend no requiere variables de entorno. Por defecto se conecta al BFF en `http://localhost:3001`.

---

## Variables de Entorno

### Backend (`backend/.env`)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DB_HOST` | Host del servidor MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_NAME` | Nombre de la base de datos | `crm_hipotecario` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASS` | Contraseña de MySQL | *(vacío)* |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | `your-secret-key-here` |
| `JWT_EXPIRATION` | Tiempo de expiración del token (segundos) | `3600` |
| `APP_ENV` | Entorno de ejecución (`development`, `production`) | `development` |
| `APP_DEBUG` | Activar modo debug (`true` / `false`) | `true` |
| `UPLOAD_DIR` | Ruta del directorio de documentos | `./storage/documents` |
| `MAX_UPLOAD_SIZE` | Tamaño máximo de subida en bytes (10 MB) | `10485760` |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (separados por coma) | `http://localhost:3000,http://localhost:8080` |

### BFF (`bff/.env`)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor BFF | `3001` |
| `PHP_BACKEND_URL` | URL del backend PHP | `http://localhost:8000` |
| `JWT_SECRET` | Clave secreta JWT (**debe coincidir con el backend**) | `your-secret-key-here` |
| `NODE_ENV` | Entorno de Node.js | `development` |
| `LOG_LEVEL` | Nivel de logging (Winston) | `info` |
| `CACHE_TTL` | Tiempo de vida de la caché en segundos | `300` |
| `RATE_LIMIT_WINDOW` | Ventana de rate limiting en milisegundos | `900000` |
| `RATE_LIMIT_MAX` | Máximo de peticiones por ventana | `100` |
| `SMTP_HOST` | Host del servidor SMTP | `smtp.example.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USER` | Usuario SMTP | *(vacío)* |
| `SMTP_PASS` | Contraseña SMTP | *(vacío)* |
| `SMS_API_KEY` | Clave API del servicio SMS | *(vacío)* |
| `SMS_API_URL` | URL del servicio SMS | *(vacío)* |
| `BANK_API_TIMEOUT` | Timeout de APIs bancarias (ms) | `30000` |
| `DOCUMENT_STORAGE_PATH` | Ruta de almacenamiento de documentos | `./storage` |

> ⚠️ **Importante:** En producción, cambia `JWT_SECRET` por un valor seguro y aleatorio, establece `APP_ENV=production`, `APP_DEBUG=false` y `NODE_ENV=production`.

---

## Ejecución

Inicia los tres servicios en terminales separadas:

**Terminal 1 — Backend PHP (puerto 8000):**

```bash
cd backend
php -S localhost:8000 -t public
```

**Terminal 2 — BFF Node.js (puerto 3001):**

```bash
cd bff
npm run dev
```

**Terminal 3 — Frontend (puerto 8080):**

```bash
cd frontend
npm run dev
```

Una vez iniciados, accede a la aplicación en el navegador:

| Servicio | URL |
|----------|-----|
| **Frontend (aplicación)** | [http://localhost:8080](http://localhost:8080) |
| **BFF — Health check** | [http://localhost:3001/health](http://localhost:3001/health) |
| **Backend PHP — API** | [http://localhost:8000/api](http://localhost:8000/api) |

---

## Endpoints de la API

El backend PHP expone los siguientes endpoints REST bajo el prefijo `/api`:

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/auth/register` | Registrar usuario (solo admin) |
| `GET` | `/api/leads` | Listar leads |
| `POST` | `/api/leads` | Crear lead |
| `GET` | `/api/leads/{id}` | Detalle de un lead |
| `POST` | `/api/leads/{id}/assign` | Asignar lead a asesor |
| `POST` | `/api/leads/{id}/qualify` | Calificar lead |
| `POST` | `/api/leads/{id}/convert` | Convertir lead a cliente |
| `GET` | `/api/clients` | Listar clientes |
| `POST` | `/api/clients` | Crear cliente |
| `GET` | `/api/clients/{id}` | Detalle de un cliente |
| `PUT` | `/api/clients/{id}` | Actualizar cliente |
| `GET` | `/api/expedientes` | Listar expedientes |
| `POST` | `/api/expedientes` | Crear expediente |
| `GET` | `/api/expedientes/{id}` | Detalle de un expediente |
| `POST` | `/api/expedientes/{id}/transition` | Cambiar estado del expediente |
| `POST` | `/api/expedientes/{id}/score` | Evaluar puntuación (scoring) |
| `GET` | `/api/tasks` | Listar tareas |
| `POST` | `/api/tasks` | Crear tarea |
| `POST` | `/api/tasks/{id}/complete` | Completar tarea |
| `GET` | `/api/offers` | Listar ofertas |
| `POST` | `/api/offers` | Crear oferta |
| `POST` | `/api/offers/{id}/accept` | Aceptar oferta |
| `GET` | `/api/documents` | Listar documentos |
| `POST` | `/api/documents` | Subir documento |
| `POST` | `/api/documents/{id}/verify` | Verificar documento |
| `GET` | `/api/notifications` | Listar notificaciones |
| `POST` | `/api/notifications/{id}/read` | Marcar notificación como leída |
| `GET` | `/api/audit` | Listar registros de auditoría |
| `GET` | `/api/reports/dashboard` | Datos del dashboard |
| `GET` | `/api/reports/pipeline` | Datos del pipeline |

> Todos los endpoints (excepto `/api/auth/login`) requieren autenticación mediante un header `Authorization: Bearer <token>`.

---

## Tests

### Backend (PHPUnit)

```bash
cd backend
./vendor/bin/phpunit
```

Las suites de test disponibles son:
- **Domain** — Tests de las entidades y lógica de dominio
- **Application** — Tests de los casos de uso

### BFF (Node.js Test Runner)

```bash
cd bff
npm test
```

---

## Usuarios de Prueba

Si cargaste los datos de semilla (`seed.sql`), puedes iniciar sesión con los siguientes usuarios. Todos comparten la contraseña: **`Admin123!`**

| Email | Rol | Nombre |
|-------|-----|--------|
| `admin@crm-hipotecario.com` | Admin | Admin Principal |
| `carlos.garcia@crm-hipotecario.com` | Asesor | Carlos García |
| `maria.lopez@crm-hipotecario.com` | Asesor | María López |
| `jefe.ventas@crm-hipotecario.com` | Manager | Roberto Martínez |

---

## Documentación Adicional

- [Informe de arquitectura de software](docs/informe-arquitectura-software.md) — Descripción completa de la arquitectura del ecosistema, sistemas principales, patrones recomendados y propuesta de arquitectura objetivo.
- [Informe de flujo de ejecución](docs/informe-flujo-ejecucion.md) — Detalle del flujo de ejecución de la plataforma.
- [Informe de funcionalidad](docs/informe-funcionalidad.md) — Descripción funcional completa del sistema, componentes y modelo de datos.

---

## Licencia

Este proyecto es de uso privado. Todos los derechos reservados © 2024 CRM Hipotecario.