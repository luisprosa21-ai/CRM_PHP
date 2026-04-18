# Mapa de Flujo de Ejecución (Execution Flow Map)

## CRM Hipotecario — Informe Completo del Ciclo de Vida de la Aplicación

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura General del Sistema](#2-arquitectura-general-del-sistema)
3. [Bootstrapping — Inicialización y Carga de Dependencias](#3-bootstrapping--inicialización-y-carga-de-dependencias)
   - 3.1 [Backend PHP — Bootstrapping](#31-backend-php--bootstrapping)
   - 3.2 [BFF Node.js — Bootstrapping](#32-bff-nodejs--bootstrapping)
   - 3.3 [Frontend Vanilla JS — Bootstrapping](#33-frontend-vanilla-js--bootstrapping)
4. [Entry Points — Puntos de Entrada](#4-entry-points--puntos-de-entrada)
   - 4.1 [Backend PHP: `public/index.php`](#41-backend-php-publicindexphp)
   - 4.2 [BFF Node.js: `src/server.js`](#42-bff-nodejs-srcserverjs)
   - 4.3 [Frontend: `public/index.html` → `src/app.js`](#43-frontend-publicindexhtml--srcappjs)
5. [Pipeline de Datos — Flujo de Información](#5-pipeline-de-datos--flujo-de-información)
   - 5.1 [Flujo General Request/Response](#51-flujo-general-requestresponse)
   - 5.2 [Pipeline del Backend PHP](#52-pipeline-del-backend-php)
   - 5.3 [Pipeline del BFF](#53-pipeline-del-bff)
   - 5.4 [Pipeline del Frontend](#54-pipeline-del-frontend)
6. [Contenedor de Dependencias (DI Container)](#6-contenedor-de-dependencias-di-container)
7. [Sistema de Enrutamiento](#7-sistema-de-enrutamiento)
   - 7.1 [Router del Backend PHP](#71-router-del-backend-php)
   - 7.2 [Rutas del BFF](#72-rutas-del-bff)
   - 7.3 [Router del Frontend (Hash-Based)](#73-router-del-frontend-hash-based)
8. [Middleware Pipeline](#8-middleware-pipeline)
   - 8.1 [Middleware del Backend](#81-middleware-del-backend)
   - 8.2 [Middleware del BFF](#82-middleware-del-bff)
9. [Ciclo de Vida de una Petición Completa (End-to-End)](#9-ciclo-de-vida-de-una-petición-completa-end-to-end)
   - 9.1 [Ejemplo: Login de usuario](#91-ejemplo-login-de-usuario)
   - 9.2 [Ejemplo: Crear un Lead](#92-ejemplo-crear-un-lead)
   - 9.3 [Ejemplo: Transición de estado de Expediente](#93-ejemplo-transición-de-estado-de-expediente)
   - 9.4 [Ejemplo: Envío a Banco](#94-ejemplo-envío-a-banco)
   - 9.5 [Ejemplo: Subida de documento](#95-ejemplo-subida-de-documento)
10. [Sistema de Eventos de Dominio](#10-sistema-de-eventos-de-dominio)
11. [Flujo de Autenticación y Autorización](#11-flujo-de-autenticación-y-autorización)
12. [Máquina de Estados del Expediente](#12-máquina-de-estados-del-expediente)
13. [Sistema de Scoring (Puntuación Crediticia)](#13-sistema-de-scoring-puntuación-crediticia)
14. [Integración con Bancos — Patrón Adapter con Circuit Breaker](#14-integración-con-bancos--patrón-adapter-con-circuit-breaker)
15. [Sistema de Notificaciones Multicanal](#15-sistema-de-notificaciones-multicanal)
16. [Sistema de Caché](#16-sistema-de-caché)
17. [Gestión de Errores](#17-gestión-de-errores)
18. [Persistencia y Acceso a Datos](#18-persistencia-y-acceso-a-datos)
19. [Sistema de Auditoría y Trazabilidad](#19-sistema-de-auditoría-y-trazabilidad)
20. [Testing y Validación](#20-testing-y-validación)
21. [Apéndice: Mapa Completo de Archivos](#21-apéndice-mapa-completo-de-archivos)

---

## 1. Resumen Ejecutivo

El CRM Hipotecario es una plataforma de tres capas que gestiona el ciclo completo de intermediación hipotecaria: desde la captación de leads hasta la firma con el banco. La aplicación está compuesta por:

| Capa | Tecnología | Puerto | Responsabilidad |
|------|-----------|--------|-----------------|
| **Frontend** | Vanilla JavaScript (SPA) | 8080 | Interfaz de usuario para portal de clientes, CRM interno y backoffice |
| **BFF** (Backend for Frontend) | Node.js / Express | 3001 | API Gateway, orquestación, integración con bancos, notificaciones, caché |
| **Backend** | PHP 8.2+ (Clean Architecture) | 8000 | Lógica de dominio, persistencia, reglas de negocio |
| **Base de datos** | MySQL | 3306 | Almacenamiento relacional |

### Diagrama de Arquitectura de Alto Nivel

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         NAVEGADOR WEB                                    │
│                                                                          │
│  ┌────────────┐   ┌──────────────┐   ┌───────────────┐                 │
│  │   Portal    │   │  CRM Interno │   │  Backoffice   │                 │
│  │  (Cliente)  │   │  (Asesores)  │   │ (Admin/Mgr)   │                 │
│  └─────┬──────┘   └──────┬───────┘   └──────┬────────┘                 │
│        │                  │                   │                           │
│        └──────────────────┼───────────────────┘                          │
│                           │                                              │
│                    ┌──────┴───────┐                                      │
│                    │ Router Hash  │                                      │
│                    │ State Store  │                                      │
│                    │ API Services │                                      │
│                    └──────┬───────┘                                      │
└───────────────────────────┼──────────────────────────────────────────────┘
                            │ HTTP (fetch)
                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    BFF — Node.js/Express (:3001)                         │
│                                                                          │
│  ┌─────────┐ ┌──────┐ ┌───────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │ Helmet  │→│ CORS │→│Rate Limit │→│ Morgan   │→│ JWT Auth + RBAC │  │
│  └─────────┘ └──────┘ └───────────┘ └──────────┘ └────────┬────────┘  │
│                                                              │           │
│  ┌──────────────────────────────────────────────────────────┘           │
│  │                                                                      │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐        │
│  ├─→│ /portal  │  │ /crm     │  │ /banks   │  │ /backoffice  │        │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘        │
│  │       │              │              │               │                 │
│  │  ┌────┴──────────────┴──────────────┴───────────────┴────────┐      │
│  │  │                     Services                               │      │
│  │  │  BackendProxy │ CacheService │ EventBus                    │      │
│  │  └──────┬────────────────────────────────────┬───────────────┘      │
│  │         │                                     │                      │
│  │         │                          ┌──────────┴──────────┐          │
│  │         │                          │   Adapters          │          │
│  │         │                          │ ┌───────────────┐   │          │
│  │         │                          │ │ Bank A/B      │   │          │
│  │         │                          │ │ Email/SMS/Push│   │          │
│  │         │                          │ │ DocProcessor  │   │          │
│  │         │                          │ └───────────────┘   │          │
│  │         │                          └─────────────────────┘          │
└──────────┼──────────────────────────────────────────────────────────────┘
            │ HTTP (axios) + Bearer Token forwarding
            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                Backend PHP — Clean Architecture (:8000)                   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │                Infrastructure Layer                           │       │
│  │  index.php → CORS → Router → AuthMiddleware → Controller     │       │
│  └─────────────────────────────────────┬────────────────────────┘       │
│                                         │                                │
│  ┌─────────────────────────────────────┼────────────────────────┐       │
│  │              Application Layer       │                        │       │
│  │  Controller → DTO → UseCase → Service                        │       │
│  └─────────────────────────────────────┬────────────────────────┘       │
│                                         │                                │
│  ┌─────────────────────────────────────┼────────────────────────┐       │
│  │               Domain Layer           │                        │       │
│  │  Entity ← ValueObject ← Service ← Event                     │       │
│  │  RepositoryInterface (contratos)                              │       │
│  └─────────────────────────────────────┬────────────────────────┘       │
│                                         │                                │
│  ┌─────────────────────────────────────┼────────────────────────┐       │
│  │          Infrastructure (Persistence)│                        │       │
│  │  MySQLRepository → QueryBuilder → PDO Connection             │       │
│  └─────────────────────────────────────┬────────────────────────┘       │
└──────────────────────────────────────────┼───────────────────────────────┘
                                           │ PDO/MySQL
                                           ▼
                                  ┌─────────────────┐
                                  │    MySQL (:3306) │
                                  │  crm_hipotecario │
                                  │   9 tablas       │
                                  └─────────────────┘
```

---

## 2. Arquitectura General del Sistema

La aplicación sigue un patrón de **arquitectura en tres capas + BFF** (Backend for Frontend):

### 2.1 Patrones Arquitectónicos Aplicados

| Patrón | Dónde se aplica | Propósito |
|--------|----------------|-----------|
| **Clean Architecture** | Backend PHP | Separación en Domain, Application e Infrastructure |
| **BFF (Backend for Frontend)** | Capa Node.js | Orquestación, agregación y adaptación para el frontend |
| **SPA (Single Page Application)** | Frontend | Navegación sin recarga completa |
| **Repository Pattern** | Backend PHP | Abstracción del acceso a datos |
| **Use Case Pattern** | Backend PHP | Un caso de uso = una acción de negocio |
| **DTO Pattern** | Backend PHP | Transferencia tipada de datos entre capas |
| **Singleton** | Connection, Container, Servicios BFF | Instancias únicas reutilizables |
| **Factory** | BankAdapterFactory | Creación de adapters de banco |
| **Adapter** | Bank/Notification adapters | Normalización de APIs externas |
| **State Machine** | ExpedienteStateMachine | Control de transiciones de estado |
| **Observer/EventBus** | EventDispatcher (PHP) y EventBus (BFF) | Desacoplamiento de efectos secundarios |
| **Circuit Breaker** | BaseBankAdapter | Resiliencia ante fallos de APIs externas |
| **Middleware Pipeline** | Express + PHP Router | Cadena de procesamiento de peticiones |

---

## 3. Bootstrapping — Inicialización y Carga de Dependencias

### 3.1 Backend PHP — Bootstrapping

El proceso de inicialización del backend PHP sigue esta secuencia estricta:

```
index.php (Entry Point)
    │
    ├─ 1. AUTOLOAD: require vendor/autoload.php
    │      └─ Composer PSR-4 autoloader
    │         ├─ CRM\Domain\      → src/Domain/
    │         ├─ CRM\Application\ → src/Application/
    │         └─ CRM\Infrastructure\ → src/Infrastructure/
    │
    ├─ 2. ENVIRONMENT: Dotenv::createImmutable()->load()
    │      └─ Lee .env → $_ENV
    │         ├─ DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
    │         ├─ JWT_SECRET, JWT_EXPIRATION
    │         ├─ APP_ENV, APP_DEBUG
    │         ├─ UPLOAD_DIR, MAX_UPLOAD_SIZE
    │         └─ ALLOWED_ORIGINS
    │
    ├─ 3. ERROR HANDLING
    │      ├─ set_error_handler()  → Convierte warnings/notices en ErrorException
    │      └─ set_exception_handler() → Respuesta JSON de error global
    │            └─ Si APP_DEBUG=true: incluye message, file, line, trace
    │            └─ Si APP_DEBUG=false: solo "Internal Server Error"
    │
    ├─ 4. CORS: CorsMiddleware::handle()
    │      ├─ Lee config/app.php → cors.allowed_origins
    │      ├─ Establece Access-Control-Allow-* headers
    │      └─ Si OPTIONS (preflight) → 204 No Content y exit
    │
    ├─ 5. CONTAINER: new Container()
    │      └─ Contenedor de inyección de dependencias (lazy singletons)
    │         (No instancia nada aún — todo es lazy)
    │
    ├─ 6. ROUTER: new Router()
    │      └─ Tabla de rutas vacía: array<method, array<path, handler>>
    │
    ├─ 7. ROUTES: require routes.php ($router, $container)
    │      ├─ Crea authMiddleware y adminMiddleware (closures)
    │      ├─ Instancia controladores desde el Container
    │      │    └─ Container crea: UseCases → Repositories → QueryBuilder → PDO
    │      └─ Registra 30+ rutas con sus middlewares
    │
    └─ 8. DISPATCH: $router->dispatch($method, $uri)
           ├─ Extrae method de $_SERVER['REQUEST_METHOD']
           ├─ Extrae uri de parse_url($_SERVER['REQUEST_URI'])
           ├─ Busca coincidencia en tabla de rutas
           ├─ Ejecuta middlewares en orden
           └─ Invoca handler del controlador
```

#### Dependencias PHP (composer.json)

```json
{
  "require": {
    "php": ">=8.2",
    "vlucas/phpdotenv": "^5.5",    // Variables de entorno
    "firebase/php-jwt": "^7.0",     // Tokens JWT
    "ramsey/uuid": "^4.7"           // Generación de UUIDs
  },
  "require-dev": {
    "phpunit/phpunit": "^12.5.22"   // Testing
  }
}
```

#### Inicialización de la Base de Datos (Lazy Singleton)

```
Container::getQueryBuilder()
    │
    └─ Connection::getInstance() [Singleton]
         │
         ├─ Lee config/database.php
         │    └─ host, port, database, charset desde $_ENV
         │
         ├─ Construye DSN: "mysql:host=...;port=...;dbname=...;charset=utf8mb4"
         │
         └─ new PDO($dsn, $username, $password, $options)
              └─ Opciones:
                   ├─ ERRMODE_EXCEPTION (errores como excepciones)
                   ├─ FETCH_ASSOC (arrays asociativos)
                   ├─ EMULATE_PREPARES=false (prepared statements nativos)
                   └─ SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci
```

### 3.2 BFF Node.js — Bootstrapping

```
server.js (Entry Point)
    │
    ├─ 1. DEPENDENCIES
    │      ├─ require('dotenv').config()          → Carga .env
    │      ├─ require('express')                   → Framework web
    │      ├─ require('helmet')                    → Seguridad HTTP headers
    │      ├─ require('cors')                      → Cross-Origin
    │      ├─ require('morgan')                    → HTTP logging
    │      └─ require('express-rate-limit')        → Rate limiting
    │
    ├─ 2. CONFIG: require('./config')
    │      └─ Centraliza todas las variables de entorno:
    │           ├─ port: 3001
    │           ├─ phpBackendUrl: "http://localhost:8000"
    │           ├─ jwt: { secret, expiresIn: '8h' }
    │           ├─ cache: { ttl: 300 }
    │           ├─ rateLimit: { windowMs: 900000, max: 100 }
    │           ├─ cors: { origin: ['localhost:3000', 'localhost:5173'] }
    │           └─ smtp, sms, documents config
    │
    ├─ 3. MIDDLEWARE STACK (orden importa)
    │      ├─ app.use(helmet())                    → Headers de seguridad
    │      ├─ app.use(cors(config.cors))           → CORS
    │      ├─ app.use(requestLogger)               → UUID de request + logging
    │      ├─ app.use(rateLimit(config.rateLimit)) → 100 req/15min
    │      ├─ app.use(express.json({limit:'10mb'}))→ Body parsing JSON
    │      └─ app.use(express.urlencoded())        → Body parsing URL-encoded
    │
    ├─ 4. HEALTH CHECK
    │      └─ GET /health → { status: 'ok', timestamp, uptime }
    │
    ├─ 5. ROUTE MODULES
    │      ├─ app.use('/portal', portalRoutes)
    │      ├─ app.use('/crm', crmRoutes)
    │      ├─ app.use('/banks', bankRoutes)
    │      └─ app.use('/backoffice', backofficeRoutes)
    │
    ├─ 6. ERROR HANDLER GLOBAL
    │      └─ app.use(errorHandler) → Formato JSON consistente
    │
    ├─ 7. NOTIFICATION SERVICE INIT
    │      └─ notificationService.init()
    │           └─ Registra listeners en EventBus:
    │                ├─ 'lead.created' → Email al asesor
    │                ├─ 'expediente.statusChanged' → Email al cliente
    │                ├─ 'offer.received' → Email al cliente
    │                ├─ 'document.uploaded' → Log only
    │                └─ 'notification.send' → Dispatch directo
    │
    └─ 8. SERVER START
           └─ app.listen(port) → "BFF running on port 3001"
           └─ Graceful Shutdown:
                ├─ SIGTERM → server.close() → process.exit(0)
                └─ SIGINT  → server.close() → process.exit(0)
```

#### Dependencias Node.js (package.json)

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| express | ^4.21 | Framework web |
| axios | ^1.9 | HTTP Client (llamadas al backend PHP) |
| jsonwebtoken | ^9.0 | Generación/validación JWT |
| helmet | ^8.1 | Cabeceras HTTP de seguridad |
| cors | ^2.8 | Cross-Origin Resource Sharing |
| morgan | ^1.10 | HTTP request logging |
| winston | ^3.17 | Logging estructurado |
| express-rate-limit | ^7.5 | Protección contra abuso |
| multer | ^1.4 | Subida de archivos |
| node-cache | ^5.1 | Caché en memoria |
| uuid | ^11.1 | Generación de IDs únicos |
| dotenv | ^16.5 | Variables de entorno |

### 3.3 Frontend Vanilla JS — Bootstrapping

```
index.html
    │
    ├─ 1. HTML ESTRUCTURA BASE
    │      ├─ <div id="app"></div>             → Contenedor principal SPA
    │      ├─ <div id="toast-container"></div> → Contenedor de notificaciones
    │      └─ <script type="module" src="src/app.js">
    │
    └─ app.js (Entry Point)
         │
         ├─ 2. IMPORTS
         │      ├─ Router (hash-based)
         │      ├─ Store (state management)
         │      ├─ AuthService
         │      ├─ NotificationService
         │      └─ Todos los componentes de página
         │
         ├─ 3. AUTH INITIALIZATION
         │      └─ initAuth()
         │           ├─ Lee localStorage('crm_auth')
         │           ├─ Si existe: restaura token + user en Store
         │           └─ Configura token en todas las instancias ApiService
         │
         ├─ 4. LAYOUT RENDERING
         │      ├─ renderNavbar()  → Barra superior (60px fija)
         │      └─ renderSidebar() → Panel lateral (260px, solo CRM/Backoffice)
         │
         ├─ 5. ROUTE REGISTRATION (30+ rutas)
         │      ├─ Públicas: /, /portal/login, /portal/register, /crm/login
         │      ├─ Portal: /portal, /portal/expedientes, /portal/documents, ...
         │      ├─ CRM: /crm, /crm/leads, /crm/clients, /crm/expedientes, ...
         │      └─ Backoffice: /backoffice, /backoffice/reports, /backoffice/audit
         │
         ├─ 6. ROUTE GUARDS (beforeEach)
         │      ├─ Verifica isAuthenticated()
         │      ├─ Redirige a login si no autenticado
         │      ├─ Verifica roles para backoffice (admin/gerente)
         │      └─ Actualiza layout (sidebar visible/oculto) según sección
         │
         └─ 7. ROUTER INIT
                └─ router.init()
                     ├─ Lee hash actual de la URL
                     ├─ Busca ruta registrada
                     ├─ Ejecuta beforeEach guard
                     └─ Ejecuta handler del componente
```

---

## 4. Entry Points — Puntos de Entrada

### 4.1 Backend PHP: `public/index.php`

**Ubicación:** `backend/public/index.php`

Este es el **único punto de entrada HTTP** del backend. Todas las peticiones al servidor PHP son dirigidas aquí (configuración típica de `.htaccess` o `nginx`).

```php
// Flujo simplificado
require autoload          → Composer PSR-4
Dotenv::load()            → Variables de entorno
set_error_handler()       → Errores → Excepciones
set_exception_handler()   → Excepciones → JSON
CorsMiddleware::handle()  → CORS headers (preflight → exit)
new Container()           → DI Container (lazy)
new Router()              → Tabla de rutas
routes.php($router, $c)   → Registro de rutas
$router->dispatch($m,$u)  → Matching + Middleware + Handler
```

**Todas las peticiones siguen este camino:**

```
HTTP Request
  → index.php
    → CORS check
      → Route matching
        → Middleware(s) execution
          → Controller method
            → UseCase::execute()
              → Repository::save/find()
                → QueryBuilder → PDO → MySQL
              → EventDispatcher::dispatch()
            ← array (result)
          ← JSON response
        ← HTTP response
```

### 4.2 BFF Node.js: `src/server.js`

**Ubicación:** `bff/src/server.js`

Punto de entrada del BFF. Inicializa Express con su stack de middleware y monta los módulos de rutas.

```javascript
// Flujo simplificado
require('dotenv').config()
const app = express()
app.use(helmet, cors, logger, rateLimit, json)
app.use('/portal', portalRoutes)
app.use('/crm', crmRoutes)
app.use('/banks', bankRoutes)
app.use('/backoffice', backofficeRoutes)
app.use(errorHandler)
notificationService.init()  // Registra listeners de eventos
app.listen(3001)
```

### 4.3 Frontend: `public/index.html` → `src/app.js`

**Ubicación:** `frontend/public/index.html` + `frontend/src/app.js`

El HTML es una estructura mínima que carga el módulo principal:

```html
<body>
  <div id="app"></div>
  <div id="toast-container"></div>
  <script type="module" src="src/app.js"></script>
</body>
```

`app.js` actúa como el orquestador principal: inicializa autenticación, registra rutas, configura guards y renderiza el layout.

---

## 5. Pipeline de Datos — Flujo de Información

### 5.1 Flujo General Request/Response

Una petición completa atraviesa las tres capas:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USUARIO (Navegador)                                                         │
│                                                                             │
│  1. Acción del usuario (click, submit)                                     │
│  2. Componente captura evento                                               │
│  3. ApiService.post('/crm/leads', data)                                    │
│       └─ fetch('http://localhost:3001/crm/leads', {                        │
│              method: 'POST',                                                │
│              headers: { Authorization: 'Bearer <jwt>', Content-Type: JSON },│
│              body: JSON.stringify(data)                                     │
│          })                                                                 │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │ HTTP POST
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BFF (Node.js :3001)                                                         │
│                                                                             │
│  4. Helmet → CORS → Rate Limit → Body Parse                               │
│  5. Request Logger (asigna X-Request-Id UUID)                              │
│  6. authenticateToken() → valida JWT → req.user = { id, email, role }      │
│  7. Route handler:                                                          │
│       └─ Validación de schema del body                                     │
│       └─ backendProxy.post('/api/leads', data, req.headers.authorization)  │
│  8. EventBus.emit('lead.created', {...})                                   │
│       └─ NotificationService escucha → envía email                         │
│  9. res.json({ success: true, data: result })                              │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │ HTTP POST (axios) con Bearer token forwarding
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Backend PHP (:8000)                                                         │
│                                                                             │
│  10. index.php → CORS → Router dispatch                                    │
│  11. AuthMiddleware::handle()                                               │
│        └─ Extrae Bearer token → AuthService::validateToken()               │
│        └─ $_REQUEST['_auth_user_id'] = payload.sub                         │
│  12. LeadController::store($params)                                        │
│        └─ Lee JSON body: json_decode(file_get_contents('php://input'))     │
│        └─ Crea CreateLeadDTO                                               │
│  13. CreateLeadUseCase::execute($dto)                                      │
│        └─ Valida campos requeridos                                         │
│        └─ Lead::create($fullName, $email, $phone, $source, $notes)        │
│             └─ Genera UUID, status='new', timestamps                       │
│        └─ LeadRepository::save($lead)                                      │
│             └─ QueryBuilder::insert('leads', $lead->toArray())             │
│                  └─ PDO::prepare + execute                                  │
│        └─ EventDispatcher::dispatch(new LeadCreated(...))                  │
│        └─ return $lead->toArray()                                          │
│  14. http_response_code(201)                                                │
│      echo json_encode(['success' => true, 'data' => $result])             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Pipeline del Backend PHP

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────────────────────┐
│              INFRASTRUCTURE LAYER                     │
│                                                       │
│  Router::dispatch()                                   │
│    ├─ matchRoute(pattern, uri) → $params             │
│    ├─ Execute middlewares (AuthMiddleware)            │
│    └─ Call controller method($params)                │
│                                                       │
│  Controller                                           │
│    ├─ Lee input: json_decode(php://input)            │
│    ├─ Construye DTO desde input                      │
│    └─ Llama UseCase::execute($dto)                   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              APPLICATION LAYER                        │
│                                                       │
│  UseCase::execute($dto)                               │
│    ├─ Validación de datos de entrada                 │
│    ├─ Operaciones sobre Entity (Domain)              │
│    ├─ Interacción con Repository                     │
│    ├─ Despacho de Domain Events                      │
│    └─ Retorno de datos (array)                       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                DOMAIN LAYER                           │
│                                                       │
│  Entity                                               │
│    ├─ Factory methods (create/fromArray)              │
│    ├─ Value Objects (Email, Phone, Money, Score)     │
│    ├─ Business rules (validate, transition)          │
│    └─ Serialización (toArray)                        │
│                                                       │
│  Domain Services                                      │
│    ├─ ScoringService → Calcula score crediticio      │
│    └─ ExpedienteStateMachine → Validaciones estado   │
│                                                       │
│  Events                                               │
│    ├─ LeadCreated                                    │
│    ├─ ExpedienteStatusChanged                        │
│    ├─ DocumentUploaded                               │
│    └─ OfferReceived                                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│           INFRASTRUCTURE (Persistence)                │
│                                                       │
│  MySQLRepository                                      │
│    └─ QueryBuilder                                   │
│         └─ PDO (prepared statements)                 │
│              └─ MySQL                                │
└─────────────────────────────────────────────────────┘
```

### 5.3 Pipeline del BFF

```
HTTP Request desde Frontend
    │
    ▼
┌─────────────────────────────────────────────────────┐
│          MIDDLEWARE STACK (Express)                    │
│                                                       │
│  1. helmet()          → Security headers             │
│  2. cors()            → Validate origin              │
│  3. requestLogger()   → Assign X-Request-Id (UUID)   │
│  4. rateLimit()       → 100 req/15min                │
│  5. express.json()    → Parse body                   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              ROUTE HANDLER                            │
│                                                       │
│  1. authenticateToken() → Validate JWT               │
│  2. requireRole()       → Check RBAC                 │
│  3. validate(schema)    → Input validation           │
│  4. Lógica de orquestación:                          │
│     ├─ cacheService.get() → Check cache              │
│     ├─ backendProxy.get/post() → Forward to PHP      │
│     ├─ Agregar datos de múltiples endpoints          │
│     ├─ eventBus.emit() → Trigger side effects        │
│     └─ cacheService.set() → Update cache             │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              SERVICES                                 │
│                                                       │
│  BackendProxy                                         │
│    ├─ Axios HTTP client                              │
│    ├─ Authorization header forwarding                │
│    ├─ Retry logic (2 retries, exponential backoff)   │
│    └─ Error mapping                                  │
│                                                       │
│  CacheService                                         │
│    ├─ NodeCache (in-memory)                          │
│    ├─ TTL configurable por key                       │
│    └─ Auto-expiration check (60s)                    │
│                                                       │
│  EventBus                                             │
│    ├─ EventEmitter pattern                           │
│    ├─ lead.created → NotificationService             │
│    ├─ expediente.statusChanged → NotificationService │
│    └─ offer.received → NotificationService           │
└─────────────────────────────────────────────────────┘
```

### 5.4 Pipeline del Frontend

```
Acción del Usuario
    │
    ▼
┌─────────────────────────────────────────────────────┐
│              COMPONENTE                               │
│                                                       │
│  1. Event listener captura acción (click, submit)    │
│  2. Recoge datos del formulario / UI                 │
│  3. Muestra loading spinner                          │
│  4. Llama ApiService                                 │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│           API SERVICE (fetch wrapper)                 │
│                                                       │
│  1. Construye URL: baseUrl + path                    │
│  2. Añade headers:                                   │
│       Authorization: Bearer <token>                  │
│       Content-Type: application/json                 │
│  3. fetch(url, options)                              │
│  4. Si 401 → emit('auth:expired') → logout          │
│  5. Parse response.json()                            │
│  6. Return data                                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│          COMPONENTE (callback)                        │
│                                                       │
│  1. Recibe datos de API                              │
│  2. Actualiza Store si necesario                     │
│  3. Re-renderiza HTML (innerHTML)                    │
│  4. Vincula nuevos event listeners                   │
│  5. Muestra toast de éxito/error                     │
└─────────────────────────────────────────────────────┘
```

---

## 6. Contenedor de Dependencias (DI Container)

El `Container` del backend PHP implementa un patrón de inyección de dependencias **manual con lazy singletons**.

### Árbol de Dependencias Completo

```
Container
│
├─ INFRAESTRUCTURA
│   ├─ getQueryBuilder() [singleton: 'query_builder']
│   │    └─ Connection::getInstance() [static singleton]
│   │         └─ new PDO(dsn, user, pass, options)
│   │
│   ├─ getAuthService() [singleton: 'auth_service']
│   │    └─ config/app.php → jwt config
│   │
│   └─ getEventDispatcher() [singleton: 'event_dispatcher']
│        └─ new EventDispatcher()
│
├─ REPOSITORIOS (todos singleton, todos reciben QueryBuilder)
│   ├─ getUserRepository()         → MySQLUserRepository(QueryBuilder)
│   ├─ getLeadRepository()         → MySQLLeadRepository(QueryBuilder)
│   ├─ getClientRepository()       → MySQLClientRepository(QueryBuilder)
│   ├─ getExpedienteRepository()   → MySQLExpedienteRepository(QueryBuilder)
│   ├─ getOfferRepository()        → MySQLOfferRepository(QueryBuilder)
│   ├─ getTaskRepository()         → MySQLTaskRepository(QueryBuilder)
│   ├─ getDocumentRepository()     → MySQLDocumentRepository(QueryBuilder)
│   ├─ getNotificationRepository() → MySQLNotificationRepository(QueryBuilder)
│   └─ getAuditLogRepository()     → MySQLAuditLogRepository(QueryBuilder)
│
├─ SERVICIOS DE DOMINIO
│   ├─ getScoringService()    → ScoringService()
│   └─ getStateMachine()      → ExpedienteStateMachine()
│
├─ MIDDLEWARE
│   └─ getAuthMiddleware()    → AuthMiddleware(AuthService)
│
└─ CONTROLADORES (NO singleton — se crean nuevos cada vez)
    ├─ getAuthController()
    │    ├─ LoginUseCase(UserRepo, AuthService)
    │    └─ RegisterUseCase(UserRepo)
    │
    ├─ getLeadController()
    │    ├─ CreateLeadUseCase(LeadRepo, EventDispatcher)
    │    ├─ AssignLeadUseCase(LeadRepo, UserRepo)
    │    ├─ QualifyLeadUseCase(LeadRepo)
    │    ├─ ConvertLeadUseCase(LeadRepo, ClientRepo)
    │    └─ ListLeadsUseCase(LeadRepo)
    │
    ├─ getClientController()
    │    ├─ CreateClientUseCase(ClientRepo)
    │    ├─ UpdateClientUseCase(ClientRepo)
    │    ├─ GetClientUseCase(ClientRepo)
    │    └─ ListClientsUseCase(ClientRepo)
    │
    ├─ getExpedienteController()
    │    ├─ CreateExpedienteUseCase(ExpedienteRepo, ClientRepo)
    │    ├─ GetExpedienteUseCase(ExpedienteRepo)
    │    ├─ ListExpedientesUseCase(ExpedienteRepo)
    │    ├─ TransitionExpedienteUseCase(ExpedienteRepo, StateMachine, EventDispatcher)
    │    └─ ScoreExpedienteUseCase(ExpedienteRepo, ClientRepo, ScoringService)
    │
    ├─ getTaskController()
    │    ├─ CreateTaskUseCase(TaskRepo)
    │    ├─ CompleteTaskUseCase(TaskRepo)
    │    └─ ListTasksUseCase(TaskRepo)
    │
    ├─ getOfferController()
    │    ├─ CreateOfferUseCase(OfferRepo, EventDispatcher)
    │    ├─ AcceptOfferUseCase(OfferRepo)
    │    └─ ListOffersUseCase(OfferRepo)
    │
    ├─ getDocumentController()
    │    ├─ UploadDocumentUseCase(DocumentRepo, EventDispatcher)
    │    ├─ VerifyDocumentUseCase(DocumentRepo)
    │    └─ ListDocumentsUseCase(DocumentRepo)
    │
    ├─ getNotificationController()
    │    ├─ ListNotificationsUseCase(NotificationRepo)
    │    └─ MarkReadUseCase(NotificationRepo)
    │
    ├─ getAuditController()
    │    └─ GetAuditTrailUseCase(AuditLogRepo)
    │
    └─ getReportController()
         ├─ GetDashboardUseCase(LeadRepo, ExpedienteRepo, ClientRepo)
         └─ GetPipelineUseCase(ExpedienteRepo)
```

---

## 7. Sistema de Enrutamiento

### 7.1 Router del Backend PHP

El router implementa un matching basado en segmentos de URI con soporte de parámetros dinámicos.

#### Algoritmo de Dispatch

```
dispatch(method, uri):
    1. uri = rtrim(uri, '/') || '/'
    2. Para cada ruta registrada en routes[method]:
         a. matchRoute(pattern, uri):
              - Divide pattern y uri en segmentos por '/'
              - Si diferente número de segmentos → null
              - Para cada segmento:
                   Si es {param}: extrae valor → params[param] = valor
                   Si no: compara literal → mismatch = null
              - Retorna params (puede ser array vacío)
         b. Si match:
              - Ejecuta cada middleware:
                   Si retorna false → return (request blocked)
              - Ejecuta handler(params)
              - return
    3. Si no match → 404 JSON
```

#### Tabla Completa de Rutas

| Método | Ruta | Controlador | Middleware |
|--------|------|------------|------------|
| POST | `/api/auth/login` | AuthController::login | — |
| POST | `/api/auth/register` | AuthController::register | admin |
| GET | `/api/leads` | LeadController::index | auth |
| POST | `/api/leads` | LeadController::store | auth |
| GET | `/api/leads/{id}` | LeadController::show | auth |
| POST | `/api/leads/{id}/assign` | LeadController::assign | auth |
| POST | `/api/leads/{id}/qualify` | LeadController::qualify | auth |
| POST | `/api/leads/{id}/convert` | LeadController::convert | auth |
| GET | `/api/clients` | ClientController::index | auth |
| POST | `/api/clients` | ClientController::store | auth |
| GET | `/api/clients/{id}` | ClientController::show | auth |
| PUT | `/api/clients/{id}` | ClientController::update | auth |
| GET | `/api/expedientes` | ExpedienteController::index | auth |
| POST | `/api/expedientes` | ExpedienteController::store | auth |
| GET | `/api/expedientes/{id}` | ExpedienteController::show | auth |
| POST | `/api/expedientes/{id}/transition` | ExpedienteController::transition | auth |
| POST | `/api/expedientes/{id}/score` | ExpedienteController::score | auth |
| GET | `/api/tasks` | TaskController::index | auth |
| POST | `/api/tasks` | TaskController::store | auth |
| POST | `/api/tasks/{id}/complete` | TaskController::complete | auth |
| GET | `/api/offers` | OfferController::index | auth |
| POST | `/api/offers` | OfferController::store | auth |
| POST | `/api/offers/{id}/accept` | OfferController::accept | auth |
| GET | `/api/documents` | DocumentController::index | auth |
| POST | `/api/documents` | DocumentController::upload | auth |
| POST | `/api/documents/{id}/verify` | DocumentController::verify | auth |
| GET | `/api/notifications` | NotificationController::index | auth |
| POST | `/api/notifications/{id}/read` | NotificationController::markRead | auth |
| GET | `/api/audit` | AuditController::index | auth |
| GET | `/api/reports/dashboard` | ReportController::dashboard | auth |
| GET | `/api/reports/pipeline` | ReportController::pipeline | auth |

### 7.2 Rutas del BFF

#### Portal Routes (`/portal/...`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|------------|
| POST | `/portal/register` | No | Registro de cliente + creación de lead |
| POST | `/portal/login` | No | Autenticación de cliente |
| GET | `/portal/profile` | Sí | Perfil del cliente |
| PUT | `/portal/profile` | Sí | Actualizar perfil |
| GET | `/portal/expedientes` | Sí | Listar expedientes del cliente |
| GET | `/portal/expedientes/:id` | Sí | Detalle expediente + ofertas |
| POST | `/portal/documents` | Sí | Subir documento (multer) |
| GET | `/portal/documents` | Sí | Listar documentos |
| GET | `/portal/notifications` | Sí | Listar notificaciones |
| POST | `/portal/notifications/:id/read` | Sí | Marcar leída |
| GET | `/portal/offers/:expedienteId` | Sí | Ofertas (con caché) |

#### CRM Routes (`/crm/...`)

| Método | Ruta | Auth + Role | Descripción |
|--------|------|-------------|------------|
| GET | `/crm/dashboard` | auth | Dashboard KPIs (caché 60s) |
| GET/POST | `/crm/leads` | auth | CRUD leads |
| GET | `/crm/leads/:id` | auth | Lead + historial (parallel fetch) |
| POST | `/crm/leads/:id/assign` | auth | Asignar a asesor |
| POST | `/crm/leads/:id/qualify` | auth | Calificar lead |
| POST | `/crm/leads/:id/convert` | auth | Convertir a cliente |
| GET/POST | `/crm/clients` | auth | CRUD clientes |
| GET | `/crm/clients/:id` | auth | Vista 360° (cliente + expedientes + docs) |
| GET/POST | `/crm/expedientes` | auth | CRUD expedientes |
| GET | `/crm/expedientes/:id` | auth | Detalle completo |
| POST | `/crm/expedientes/:id/transition` | auth | Cambio de estado (emite evento) |
| POST | `/crm/expedientes/:id/score` | auth | Scoring crediticio |
| GET/POST | `/crm/tasks` | auth | CRUD tareas |
| POST | `/crm/tasks/:id/complete` | auth | Completar tarea |
| GET | `/crm/offers/:expedienteId` | auth | Listar ofertas |
| POST | `/crm/offers` | auth | Registrar oferta (emite evento) |

#### Bank Routes (`/banks/...`)

| Método | Ruta | Auth + Role | Descripción |
|--------|------|-------------|------------|
| GET | `/banks/available` | auth | Bancos disponibles |
| POST | `/banks/submit/:bankId` | asesor+ | Enviar expediente a banco |
| GET | `/banks/status/:applicationId` | auth | Estado de solicitud |
| POST | `/banks/webhook` | — | Callback de banco |

#### Backoffice Routes (`/backoffice/...`)

| Método | Ruta | Auth + Role | Descripción |
|--------|------|-------------|------------|
| GET | `/backoffice/reports/dashboard` | admin/gerente | Dashboard KPIs (caché 120s) |
| GET | `/backoffice/reports/pipeline` | admin/gerente | Funnel de conversión |
| GET | `/backoffice/reports/conversion` | admin/gerente | Analytics de conversión |
| GET | `/backoffice/reports/advisors` | admin/gerente | Rendimiento de asesores |
| GET | `/backoffice/audit` | admin/gerente | Trail de auditoría |
| GET | `/backoffice/audit/:entityType/:entityId` | admin/gerente | Historial de entidad |

### 7.3 Router del Frontend (Hash-Based)

El frontend utiliza un router basado en hash (`#/path`) que evita la necesidad de configuración server-side.

```
window.location.hash = '#/crm/leads'
    │
    ▼
Router.hashchange listener
    │
    ├─ Extrae path: '/crm/leads'
    ├─ Busca ruta registrada (con soporte de :param)
    ├─ Ejecuta beforeEach guard:
    │    ├─ isAuthenticated()? → No → redirect login
    │    ├─ isBackoffice && role != admin/gerente? → redirect
    │    └─ updateLayout() → show/hide sidebar
    └─ Ejecuta handler: CrmLeads(params)
         └─ Renderiza HTML en <div id="app">
```

---

## 8. Middleware Pipeline

### 8.1 Middleware del Backend

#### CorsMiddleware

```
Petición HTTP entrante
    │
    ├─ Lee $_SERVER['HTTP_ORIGIN']
    ├─ Verifica si origin está en allowed_origins
    │    ├─ Sí → header("Access-Control-Allow-Origin: {$origin}")
    │    └─ Tiene '*' → header("Access-Control-Allow-Origin: *")
    │
    ├─ Establece Allow-Methods, Allow-Headers, Max-Age
    │
    └─ Si REQUEST_METHOD === 'OPTIONS':
         └─ 204 No Content → exit (preflight handled)
```

#### AuthMiddleware

```
Petición a ruta protegida
    │
    ├─ Lee $_SERVER['HTTP_AUTHORIZATION']
    │
    ├─ ¿Empieza con 'Bearer '?
    │    └─ No → 401 { error: 'Unauthorized', message: 'Missing or invalid Authorization header' }
    │
    ├─ Extrae token: substr(header, 7)
    │
    ├─ AuthService::validateToken(token)
    │    ├─ JWT::decode(token, key, [HS256])
    │    ├─ Verifica exp, iss
    │    └─ Retorna payload { sub, email, role } o null
    │
    ├─ ¿payload === null?
    │    └─ Sí → 401 { error: 'Unauthorized', message: 'Invalid or expired token' }
    │
    └─ Almacena contexto de usuario:
         $_REQUEST['_auth_user_id'] = payload.sub
         $_REQUEST['_auth_user_email'] = payload.email
         $_REQUEST['_auth_user_role'] = payload.role
         → return true (continúa pipeline)
```

#### AuthMiddleware::requireRole (para admin)

```
Petición a ruta admin-only (ej: POST /api/auth/register)
    │
    ├─ Ejecuta handle() primero (validación JWT)
    │    └─ Si falla → 401
    │
    ├─ Lee $_REQUEST['_auth_user_role']
    │
    └─ ¿role in_array($roles)?
         ├─ Sí → return true
         └─ No → 403 { error: 'Forbidden', message: 'Insufficient permissions' }
```

#### RateLimitMiddleware (disponible pero no activo en rutas actuales)

```
Petición entrante
    │
    ├─ Identifica IP: $_SERVER['REMOTE_ADDR']
    ├─ Clave: md5(IP)
    ├─ Lee archivo storage/rate_limit/{key}
    │
    ├─ ¿Bloqueado (blocked_until > now)?
    │    └─ 429 Too Many Requests + Retry-After header
    │
    ├─ Filtra requests dentro de la ventana (60s)
    │
    ├─ ¿count >= maxRequests (60)?
    │    └─ Bloquea IP + 429
    │
    └─ Registra request + headers:
         X-RateLimit-Limit: 60
         X-RateLimit-Remaining: N
```

### 8.2 Middleware del BFF

El BFF tiene una cadena de middleware más rica:

```
Request entrante (:3001)
    │
    ├─ 1. helmet()
    │      └─ Establece: X-Content-Type-Options, X-Frame-Options,
    │         Strict-Transport-Security, Content-Security-Policy, etc.
    │
    ├─ 2. cors({ origin: ['localhost:3000', 'localhost:5173'] })
    │      └─ Valida Origin header contra whitelist
    │
    ├─ 3. requestLogger()
    │      ├─ Genera UUID → X-Request-Id header
    │      ├─ Log entrada: { method, url, requestId }
    │      └─ onFinished: Log salida: { method, url, status, duration }
    │
    ├─ 4. rateLimit({ windowMs: 900000, max: 100 })
    │      └─ 100 peticiones por IP cada 15 minutos
    │      └─ Si excede → 429 Too Many Requests
    │
    ├─ 5. express.json({ limit: '10mb' })
    │      └─ Parsea body JSON
    │
    ├─ 6. express.urlencoded({ extended: true })
    │      └─ Parsea body URL-encoded
    │
    └─ POR RUTA:
         │
         ├─ 7. authenticateToken() [si ruta protegida]
         │      ├─ Lee Authorization: Bearer <token>
         │      ├─ jwt.verify(token, secret)
         │      └─ req.user = { id, email, role }
         │
         ├─ 8. requireRole(['admin', 'gerente']) [si requiere rol]
         │      └─ Verifica req.user.role ∈ roles permitidos
         │
         └─ 9. validate(schema) [si requiere validación]
                └─ Valida req.body contra schema definido
                └─ Si falla → 400 ValidationError con detalle de campos
```

---

## 9. Ciclo de Vida de una Petición Completa (End-to-End)

### 9.1 Ejemplo: Login de usuario

```
╔═══════════════════════════════════════════════════════════════════════╗
║  FLUJO: Login de usuario CRM                                         ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  [Frontend]                                                           ║
║  1. CrmLogin: usuario llena email + password                         ║
║  2. authService.login(email, password, 'crm')                        ║
║  3. crmApi.post('/login', { email, password })                       ║
║     → fetch POST http://localhost:3001/crm/login                     ║
║                                                                       ║
║  [BFF]                                                                ║
║  4. Route: POST /crm/login (sin auth)                                ║
║  5. backendProxy.post('/api/auth/login', { email, password })        ║
║     → axios POST http://localhost:8000/api/auth/login                ║
║                                                                       ║
║  [Backend PHP]                                                        ║
║  6. Router dispatch → AuthController::login($params)                 ║
║  7. Lee JSON body → new LoginDTO(email, password)                    ║
║  8. LoginUseCase::execute($dto):                                     ║
║     a. UserRepository::findByEmail($email)                           ║
║        → QueryBuilder::table('users')->where('email','=',$email)     ║
║        → SELECT * FROM users WHERE email = :w0 LIMIT 1               ║
║     b. User::fromArray($row)                                        ║
║     c. $user->authenticate($password)                                ║
║        → password_verify($password, $user->passwordHash)             ║
║     d. AuthService::generateToken($userId, $email, $role)            ║
║        → JWT::encode(payload, secret, HS256)                         ║
║        → payload: { sub: userId, email, role, iss, iat, exp }        ║
║     e. return { token, user: {...} }                                 ║
║  9. HTTP 200 → { success: true, data: { token, user } }             ║
║                                                                       ║
║  [BFF]                                                                ║
║  10. Retransmite respuesta → res.json(backendResponse)               ║
║                                                                       ║
║  [Frontend]                                                           ║
║  11. authService recibe { token, user }                              ║
║  12. localStorage.setItem('crm_auth', { token, user })               ║
║  13. store.setState({ user, token })                                 ║
║  14. Configura token en ApiService instances                         ║
║  15. router.navigate('#/crm') → CrmDashboard                        ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### 9.2 Ejemplo: Crear un Lead

```
╔═══════════════════════════════════════════════════════════════════════╗
║  FLUJO: Crear un Lead desde CRM                                      ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  [Frontend]                                                           ║
║  1. CrmLeads: click "Nuevo Lead" → abre Modal con Form              ║
║  2. Usuario llena: nombre, email, teléfono, fuente, notas           ║
║  3. Submit → crmApi.post('/leads', data)                             ║
║     → fetch POST localhost:3001/crm/leads { Authorization: Bearer }  ║
║                                                                       ║
║  [BFF]                                                                ║
║  4. Middleware: auth → validate schema                               ║
║  5. backendProxy.post('/api/leads', req.body, auth)                  ║
║     → axios POST localhost:8000/api/leads                            ║
║                                                                       ║
║  [Backend PHP]                                                        ║
║  6. AuthMiddleware::handle() → valida JWT → $_REQUEST['_auth_*']     ║
║  7. LeadController::store($params)                                   ║
║  8. Input: json_decode(php://input, true)                            ║
║  9. new CreateLeadDTO(fullName, email, phone, source, notes)         ║
║  10. CreateLeadUseCase::execute($dto):                               ║
║      a. Validación:                                                  ║
║         - fullName no vacío                                          ║
║         - email no vacío                                             ║
║         - phone no vacío                                             ║
║      b. Lead::create(fullName, email, phone, source, notes)          ║
║         - Genera UUID con Uuid::uuid4()                              ║
║         - status = LeadStatus::NEW ('new')                           ║
║         - score = null                                               ║
║         - timestamps = now()                                         ║
║      c. LeadRepository::save($lead)                                  ║
║         → QueryBuilder::insert('leads', lead->toArray())             ║
║         → INSERT INTO leads (id, full_name, email, ...) VALUES (...)  ║
║      d. EventDispatcher::dispatch(new LeadCreated(                   ║
║              lead_id, full_name, source                              ║
║         ))                                                           ║
║         → Notifica a listeners registrados para 'lead.created'       ║
║      e. return lead->toArray()                                       ║
║  11. HTTP 201 → { success: true, data: { id, full_name, ... } }     ║
║                                                                       ║
║  [BFF]                                                                ║
║  12. Recibe respuesta del backend                                    ║
║  13. eventBus.emit('lead.created', { leadId, ... })                  ║
║      └─ NotificationService listener:                                ║
║           → emailAdapter.send({                                      ║
║                to: asesor_email,                                     ║
║                subject: 'Nuevo Lead asignado',                       ║
║                body: 'Lead: fullName...'                             ║
║             })                                                       ║
║  14. res.status(201).json(result)                                    ║
║                                                                       ║
║  [Frontend]                                                           ║
║  15. Recibe respuesta exitosa                                        ║
║  16. notify.success('Lead creado exitosamente')                      ║
║  17. Cierra modal                                                    ║
║  18. Refresca tabla de leads (re-fetch)                              ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### 9.3 Ejemplo: Transición de estado de Expediente

```
╔═══════════════════════════════════════════════════════════════════════╗
║  FLUJO: Transición de Expediente (nuevo → en_estudio)                ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  [Frontend]                                                           ║
║  1. CrmExpedienteDetail: click botón "Pasar a Estudio"              ║
║  2. crmApi.post('/expedientes/{id}/transition', { status })          ║
║                                                                       ║
║  [BFF]                                                                ║
║  3. Auth middleware → JWT validation                                 ║
║  4. backendProxy.post('/api/expedientes/{id}/transition', body)      ║
║                                                                       ║
║  [Backend PHP]                                                        ║
║  5. ExpedienteController::transition($params)                        ║
║     a. $id = $params['id']                                           ║
║     b. $newStatus = input['status']                                  ║
║  6. TransitionExpedienteUseCase::execute($id, $newStatus):           ║
║     a. ExpedienteRepository::findById($id)                           ║
║        → SELECT * FROM expedientes WHERE id = :w0 LIMIT 1            ║
║     b. Expediente::fromArray($row)                                   ║
║     c. $oldStatus = $expediente->getStatus()                         ║
║     d. ExpedienteStateMachine::validate($oldStatus, $newStatus)      ║
║        ┌─────────────────────────────────────────────┐               ║
║        │ TRANSITIONS = [                              │               ║
║        │   'nuevo' => ['en_estudio'],                │               ║
║        │   'en_estudio' => ['doc_pendiente',         │               ║
║        │                     'rechazado'],           │               ║
║        │   'doc_pendiente' => ['enviado_a_banco'],   │               ║
║        │   'enviado_a_banco' => ['oferta_recibida',  │               ║
║        │                         'rechazado'],       │               ║
║        │   'oferta_recibida' => ['negociacion',      │               ║
║        │                         'rechazado'],       │               ║
║        │   'negociacion' => ['aprobado', 'rechazado'],│              ║
║        │   'aprobado' => ['firmado'],                │               ║
║        │ ]                                            │               ║
║        │ ¿'nuevo' → 'en_estudio'? → ✓ Válido       │               ║
║        └─────────────────────────────────────────────┘               ║
║     e. $expediente->transition($newStatus)                           ║
║        → Actualiza status + updatedAt                                ║
║     f. ExpedienteRepository::save($expediente)                       ║
║        → UPDATE expedientes SET status=:status, ... WHERE id=:id     ║
║     g. EventDispatcher::dispatch(new ExpedienteStatusChanged(        ║
║              expediente_id, old_status, new_status, advisor_id       ║
║        ))                                                            ║
║     h. return expediente->toArray()                                  ║
║  7. HTTP 200 → { success: true, data: { id, status: 'en_estudio' }} ║
║                                                                       ║
║  [BFF]                                                                ║
║  8. eventBus.emit('expediente.statusChanged', {                      ║
║        expedienteId, oldStatus, newStatus                            ║
║     })                                                               ║
║     └─ NotificationService:                                          ║
║          → emailAdapter.send({                                       ║
║               to: client_email,                                      ║
║               subject: 'Su expediente ha cambiado de estado',        ║
║               body: 'Nuevo estado: En Estudio'                       ║
║          })                                                          ║
║  9. res.json(result)                                                 ║
║                                                                       ║
║  [Frontend]                                                           ║
║  10. Actualiza UI: badge 'en_estudio'                                ║
║  11. notify.success('Estado actualizado')                            ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### 9.4 Ejemplo: Envío a Banco

```
╔═══════════════════════════════════════════════════════════════════════╗
║  FLUJO: Enviar expediente a un banco (integración externa)           ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  [Frontend]                                                           ║
║  1. CrmExpedienteDetail: click "Enviar a Banco Nacional"             ║
║  2. bankApi.post('/submit/bank_a', { expediente_id })                ║
║                                                                       ║
║  [BFF]                                                                ║
║  3. Auth + requireRole(['asesor', 'admin', 'gerente'])               ║
║  4. validate({ expediente_id: required })                            ║
║  5. BankAdapterFactory.getAdapter('bank_a')                          ║
║     → new BankAAdapter() (Banco Nacional)                            ║
║  6. backendProxy.get('/api/expedientes/' + id)                       ║
║     → Obtiene datos completos del expediente                         ║
║                                                                       ║
║  7. adapter.submitApplication(expedienteData)                        ║
║     ┌─────────────────────────────────────────────────────┐          ║
║     │ BaseBankAdapter (Circuit Breaker):                   │          ║
║     │                                                       │          ║
║     │  a. _checkCircuit()                                   │          ║
║     │     Estado: CLOSED → permitir                         │          ║
║     │     Estado: OPEN → Error "Circuit open"              │          ║
║     │     Estado: HALF_OPEN → permitir (test)              │          ║
║     │                                                       │          ║
║     │  b. _retryWithBackoff(maxRetries=3)                  │          ║
║     │     Intento 1: delay 0ms                              │          ║
║     │     Intento 2: delay 500ms (500 × 2^0)              │          ║
║     │     Intento 3: delay 1000ms (500 × 2^1)             │          ║
║     │                                                       │          ║
║     │  c. BankAAdapter._doSubmit(data)                     │          ║
║     │     Transform: {                                      │          ║
║     │       applicant: { name, income, employment },       │          ║
║     │       mortgage: { amount, term, property_value }     │          ║
║     │     }                                                 │          ║
║     │     POST https://api.banconacional.example.com/apply │          ║
║     │                                                       │          ║
║     │  d. normalizeResponse(rawResponse)                   │          ║
║     │     → { applicationId, status, interestRate,         │          ║
║     │        monthlyPayment, bankId, bankName }            │          ║
║     │                                                       │          ║
║     │  e. Si éxito: _onSuccess() → reset failures          │          ║
║     │     Si fallo: _onFailure() → increment failures      │          ║
║     │     Si failures >= 5: state = OPEN                   │          ║
║     └─────────────────────────────────────────────────────┘          ║
║                                                                       ║
║  8. backendProxy.post('/api/offers', normalizedOffer)                ║
║     → Persiste oferta en base de datos                               ║
║                                                                       ║
║  9. eventBus.emit('offer.received', {                                ║
║        offerId, expedienteId, bankName, interestRate                 ║
║     })                                                               ║
║     └─ NotificationService → email al cliente                        ║
║                                                                       ║
║  10. res.json({ success: true, data: result })                       ║
║                                                                       ║
║  [Frontend]                                                           ║
║  11. notify.success('Expediente enviado a Banco Nacional')           ║
║  12. Actualiza lista de ofertas                                      ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### 9.5 Ejemplo: Subida de documento

```
╔═══════════════════════════════════════════════════════════════════════╗
║  FLUJO: Subida de documento a un expediente                          ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  [Frontend]                                                           ║
║  1. PortalDocuments o FileUpload component                           ║
║  2. Usuario arrastra/selecciona archivo                              ║
║  3. FormData + portalApi.upload('/documents', formData)              ║
║     → fetch POST con Content-Type: multipart/form-data               ║
║                                                                       ║
║  [BFF]                                                                ║
║  4. Auth middleware                                                   ║
║  5. multer middleware:                                                ║
║     → Parsea multipart → req.file                                    ║
║  6. documentProcessor.processUpload(req.file)                        ║
║     ├─ Valida MIME type (pdf, jpeg, png, docx)                       ║
║     ├─ Valida tamaño (< 10MB)                                       ║
║     ├─ Genera nombre UUID: uuid-v4.extension                        ║
║     └─ Retorna metadata: { originalName, storedName, path, ... }     ║
║  7. backendProxy.post('/api/documents', {                            ║
║        expediente_id, client_id, type, fileName,                     ║
║        filePath, mimeType, size, uploadedBy                          ║
║     })                                                               ║
║                                                                       ║
║  [Backend PHP]                                                        ║
║  8. DocumentController::upload($params)                              ║
║  9. UploadDocumentUseCase::execute($dto):                            ║
║     a. Document::create(expedienteId, clientId, type,                ║
║           fileName, filePath, mimeType, size, uploadedBy)            ║
║        → id = UUID, status = 'uploaded', version = 1                 ║
║     b. DocumentRepository::save($document)                           ║
║        → INSERT INTO documents (...)                                 ║
║     c. EventDispatcher::dispatch(new DocumentUploaded(               ║
║           document_id, expediente_id, type                           ║
║        ))                                                            ║
║  10. HTTP 201 → { success: true, data: document }                    ║
║                                                                       ║
║  [BFF]                                                                ║
║  11. eventBus.emit('document.uploaded', data)                        ║
║      → Log registrado (no envía notificación)                        ║
║  12. res.status(201).json(result)                                    ║
║                                                                       ║
║  [Frontend]                                                           ║
║  13. notify.success('Documento subido correctamente')                ║
║  14. Refresca lista de documentos                                    ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 10. Sistema de Eventos de Dominio

La aplicación implementa un patrón **Observer/Pub-Sub** en dos niveles:

### 10.1 EventDispatcher PHP (Domain Events)

```
EventDispatcher (implements EventDispatcherInterface)
    │
    ├─ subscribe(eventName, callable $listener)
    │    └─ listeners[eventName][] = $listener
    │
    └─ dispatch(DomainEvent $event)
         └─ Para cada listener en listeners[$event->getName()]:
              → $listener($event)
```

#### Eventos de Dominio Definidos

| Evento | Disparado por | Payload |
|--------|--------------|---------|
| `lead.created` | CreateLeadUseCase | lead_id, full_name, source |
| `expediente.status_changed` | TransitionExpedienteUseCase | expediente_id, old_status, new_status, advisor_id |
| `document.uploaded` | UploadDocumentUseCase | document_id, expediente_id, type |
| `offer.received` | CreateOfferUseCase | offer_id, expediente_id, bank_name, interest_rate |

### 10.2 EventBus BFF (Application Events)

```
EventBus (Node.js EventEmitter wrapper)
    │
    ├─ emit(eventName, data)
    │    └─ Llama todos los handlers registrados
    │    └─ try/catch por handler (error-safe)
    │    └─ Log del evento emitido
    │
    └─ addListener(eventName, handler)
         └─ Registra handler para evento
```

#### Listeners Automáticos (registrados por NotificationService.init())

| Evento | Acción automática |
|--------|------------------|
| `lead.created` | Email al asesor asignado |
| `expediente.statusChanged` | Email al cliente notificando cambio |
| `offer.received` | Email al cliente sobre nueva oferta |
| `document.uploaded` | Solo log (sin notificación) |
| `notification.send` | Dispatch directo al canal apropiado |

---

## 11. Flujo de Autenticación y Autorización

### 11.1 Generación de Token JWT

```
AuthService::generateToken(userId, email, role)
    │
    └─ JWT::encode(
         payload: {
           sub: userId,        // Subject (ID usuario)
           email: email,       // Email del usuario
           role: role,         // Rol (admin|advisor|manager|viewer)
           iss: 'crm-hipotecario',  // Issuer
           iat: time(),        // Issued At
           exp: time() + 3600  // Expiration (1 hora backend / 8 horas BFF)
         },
         key: JWT_SECRET,
         algorithm: 'HS256'
       )
```

### 11.2 Flujo de Validación por Capa

```
Frontend                BFF                     Backend PHP
────────                ───                     ───────────
localStorage            JWT verify              JWT verify
   │                       │                       │
   ├─ token              ├─ jsonwebtoken          ├─ firebase/php-jwt
   ├─ user               ├─ req.user = decoded    ├─ $_REQUEST['_auth_*']
   └─ role               └─ requireRole()         └─ requireRole()

Bearer token se propaga:
Frontend → BFF (Authorization header) → Backend PHP (axios forwarding)
```

### 11.3 Roles y Permisos

| Rol | Portal | CRM | Banks | Backoffice |
|-----|--------|-----|-------|------------|
| **admin** | ✗ | ✓ | ✓ | ✓ |
| **gerente** (manager) | ✗ | ✓ | ✓ | ✓ |
| **asesor** (advisor) | ✗ | ✓ | ✓ | ✗ |
| **viewer** | ✗ | ✓ (lectura) | ✗ | ✗ |
| **cliente** | ✓ | ✗ | ✗ | ✗ |

---

## 12. Máquina de Estados del Expediente

El expediente hipotecario sigue una máquina de estados finitos que modela su ciclo de vida completo:

```
                         ┌───────────────────┐
                         │      NUEVO        │
                         │   (Estado Inicial) │
                         └────────┬──────────┘
                                  │
                                  ▼
                         ┌───────────────────┐
                    ┌───→│    EN ESTUDIO     │
                    │    └────────┬──────────┘
                    │             │
                    │     ┌──────┴──────┐
                    │     │             │
                    │     ▼             ▼
                    │ ┌──────────┐ ┌──────────┐
                    │ │DOCUMEN-  │ │RECHAZADO │
                    │ │TACIÓN    │ │(Terminal) │
                    │ │PENDIENTE │ └──────────┘
                    │ └────┬─────┘       ▲
                    │      │             │
                    │      ▼             │
                    │ ┌──────────┐       │
                    │ │ENVIADO A │───────┘
                    │ │ BANCO    │
                    │ └────┬─────┘
                    │      │
                    │      ▼
                    │ ┌──────────┐
                    │ │ OFERTA   │───────┐
                    │ │RECIBIDA  │       │
                    │ └────┬─────┘       │
                    │      │             │
                    │      ▼             ▼
                    │ ┌──────────┐ ┌──────────┐
                    │ │NEGOCIA-  │ │RECHAZADO │
                    │ │  CIÓN    │ └──────────┘
                    │ └────┬─────┘
                    │      │
                    │ ┌────┴─────┐
                    │ │          │
                    │ ▼          ▼
                    │┌──────┐ ┌──────────┐
                    ││APRO- │ │RECHAZADO │
                    ││BADO  │ └──────────┘
                    │└──┬───┘
                    │   │
                    │   ▼
                    │┌──────────┐
                    ││ FIRMADO  │
                    ││(Terminal)│
                    │└──────────┘
                    │
                    └─── Cualquier rechazo termina el flujo
```

### Tabla de Transiciones

| Estado Actual | Transiciones Permitidas |
|--------------|------------------------|
| `nuevo` | → `en_estudio` |
| `en_estudio` | → `documentacion_pendiente` \| `rechazado` |
| `documentacion_pendiente` | → `enviado_a_banco` |
| `enviado_a_banco` | → `oferta_recibida` \| `rechazado` |
| `oferta_recibida` | → `negociacion` \| `rechazado` |
| `negociacion` | → `aprobado` \| `rechazado` |
| `aprobado` | → `firmado` |
| `firmado` | — (terminal) |
| `rechazado` | — (terminal) |

### Validación de Transición (doble)

La validación se ejecuta en dos puntos:

1. **ExpedienteStateMachine::validate()** (Domain Service) — Verifica contra tabla de transiciones
2. **Expediente::transition()** (Entity) — Verifica internamente con constante TRANSITIONS

---

## 13. Sistema de Scoring (Puntuación Crediticia)

El `ScoringService` calcula una puntuación de viabilidad hipotecaria basada en 5 factores ponderados:

```
ScoreExpedienteUseCase::execute(expedienteId)
    │
    ├─ Obtiene Expediente (ExpedienteRepository)
    ├─ Obtiene Client (ClientRepository)
    │
    └─ ScoringService::calculateScore(client, expediente)
         │
         ├─ LTV Score (30% del peso)
         │    └─ LTV = requestedAmount / propertyValue
         │         ≤60%: 100 | ≤70%: 85 | ≤80%: 70 |
         │         ≤90%: 45  | ≤100%: 20 | >100%: 0
         │
         ├─ Debt Score (25% del peso)
         │    └─ Ratio = estimatedPayment / monthlyIncome
         │         ≤25%: 100 | ≤30%: 85 | ≤35%: 65 |
         │         ≤40%: 40  | ≤50%: 20 | >50%: 0
         │         (Usa tasa conservadora del 3% anual)
         │
         ├─ Income Score (20% del peso)
         │    └─ monthlyIncome
         │         ≥5000€: 100 | ≥3500€: 85 | ≥2500€: 70 |
         │         ≥1500€: 50  | ≥1000€: 30 | <1000€: 10
         │
         ├─ Employment Score (15% del peso)
         │    └─ employmentType
         │         indefinido/funcionario: 100 | jubilado: 70 |
         │         temporal: 60 | autónomo: 50 | otro: 30
         │
         └─ Term Score (10% del peso)
              └─ term (meses)
                   ≤120: 100 | ≤180: 90 | ≤240: 75 |
                   ≤300: 55  | ≤360: 40 | >360: 20

         Score Final = Σ (factor_score × weight)

         Resultado: Score Value Object {
            value: 0-100 (2 decimales),
            isViable(): score >= 50,
            getRiskLevel():
               ≥80: 'low' | ≥60: 'medium' |
               ≥40: 'high' | <40: 'very_high'
         }
```

---

## 14. Integración con Bancos — Patrón Adapter con Circuit Breaker

### 14.1 Arquitectura de Adapters

```
BankAdapterFactory (Registry Pattern)
    │
    ├─ listAvailable() → [
    │     { bankId: 'bank_a', bankName: 'Banco Nacional', baseUrl: '...' },
    │     { bankId: 'bank_b', bankName: 'Banco Internacional', baseUrl: '...' }
    │  ]
    │
    └─ getAdapter(bankId) → BaseBankAdapter subclass
         │
         ├─ BankAAdapter (Banco Nacional)
         │    ├─ API: https://api.banconacional.example.com
         │    ├─ Transform: Nested JSON (applicant, mortgage, employment)
         │    └─ Response: applicationId, status, interestRate, monthlyPayment
         │
         └─ BankBAdapter (Banco Internacional)
              ├─ API: https://api.bancointernacional.example.com
              ├─ Transform: Flat Spanish-keyed fields
              └─ Status mapping: recibida→received, en_analisis→under_review
```

### 14.2 Circuit Breaker Pattern

```
BaseBankAdapter
    │
    ├─ Estado: CLOSED (normal)
    │   └─ Peticiones pasan normalmente
    │   └─ Si falla: failureCount++
    │   └─ Si failureCount >= 5: → OPEN
    │
    ├─ Estado: OPEN (corte)
    │   └─ Todas las peticiones rechazadas inmediatamente
    │   └─ Error: "Circuit breaker is open"
    │   └─ Después de 30s: → HALF_OPEN
    │
    └─ Estado: HALF_OPEN (prueba)
        └─ Permite una petición de prueba
        └─ Si éxito: → CLOSED, resetear failureCount
        └─ Si fallo: → OPEN
```

### 14.3 Retry con Backoff Exponencial

```
_retryWithBackoff(operation, maxRetries=3):
    │
    ├─ Intento 1: delay = 0ms → ejecutar
    │    └─ Si éxito → return
    │    └─ Si fallo → continuar
    │
    ├─ Intento 2: delay = 500ms (500 × 2^0)
    │    └─ Si éxito → return
    │    └─ Si fallo → continuar
    │
    └─ Intento 3: delay = 1000ms (500 × 2^1)
         └─ Si éxito → return
         └─ Si fallo → throw error
```

---

## 15. Sistema de Notificaciones Multicanal

```
NotificationService (BFF)
    │
    ├─ init() → Registra listeners en EventBus
    │
    └─ sendNotification({ userId, type, channel, to, subject, message })
         │
         ├─ channel === 'email'
         │    └─ emailAdapter.send({ to, subject, body, template })
         │         └─ (Simulado) → { success, messageId, sentAt }
         │
         ├─ channel === 'sms'
         │    └─ smsAdapter.send({ to, message })
         │         └─ (Simulado) → { success, messageId, segments }
         │
         ├─ channel === 'push'
         │    └─ pushAdapter.send({ userId, title, body })
         │         └─ (Simulado) → { success, messageId }
         │
         └─ channel === desconocido
              └─ throw Error('Unsupported notification channel')
```

### Notificaciones Automáticas

| Evento | Canal | Destinatario | Contenido |
|--------|-------|-------------|-----------|
| Lead creado | Email | Asesor asignado | "Nuevo lead asignado: {nombre}" |
| Expediente cambia estado | Email | Cliente | "Su expediente ha cambiado a: {estado}" |
| Oferta recibida | Email | Cliente | "Nueva oferta de {banco} al {tasa}%" |
| Documento subido | — | — | Solo log (sin notificación) |

---

## 16. Sistema de Caché

El BFF implementa caché en memoria usando `node-cache`:

```
CacheService
    │
    ├─ Configuración:
    │    ├─ TTL por defecto: 300 segundos (5 minutos)
    │    ├─ Check period: 60 segundos
    │    └─ TTL configurable por key
    │
    ├─ Uso en rutas:
    │    ├─ GET /crm/dashboard      → TTL: 60s
    │    ├─ GET /backoffice/reports  → TTL: 120s
    │    └─ GET /portal/offers      → TTL: 300s (defecto)
    │
    └─ Flujo:
         1. cacheService.get(key)
            ├─ Hit → return cached data
            └─ Miss → continuar
         2. backendProxy.get(endpoint)
         3. cacheService.set(key, data, ttl)
         4. return data
```

---

## 17. Gestión de Errores

### 17.1 Backend PHP — Estrategia de Errores

```
set_error_handler():
    PHP Warning/Notice → ErrorException → capturado por handlers

set_exception_handler():
    Throwable no capturada → JSON 500 response
    Si APP_DEBUG:
        { error, message, file, line, trace }
    Si !APP_DEBUG:
        { error: 'Internal Server Error' }

Controllers:
    try {
        UseCase::execute()
    } catch (InvalidArgumentException) → 400 Bad Request
      catch (DomainException)           → 422/404/409 según contexto
      catch (\Throwable)                → 500 Internal Server Error
```

### 17.2 Mapeo de Excepciones a Códigos HTTP

| Excepción | Código HTTP | Uso |
|-----------|------------|-----|
| `InvalidArgumentException` | 400 | Validación de entrada (campos vacíos, formato inválido) |
| `DomainException` (login) | 401 | Credenciales incorrectas |
| `DomainException` (not found) | 404 | Recurso no encontrado |
| `DomainException` (duplicate) | 409 | Email duplicado, conflicto de unicidad |
| `DomainException` (state) | 422 | Transición de estado inválida, regla de negocio violada |
| `RuntimeException` | 404 | Ruta no encontrada |
| `Throwable` (catch-all) | 500 | Error interno inesperado |

### 17.3 BFF — Error Handler Global

```
errorHandler(err, req, res, next):
    │
    ├─ ValidationError  → 400 { code: 'VALIDATION_ERROR', details: [...] }
    ├─ AuthenticationError → 401 { code: 'AUTHENTICATION_ERROR' }
    ├─ NotFoundError    → 404 { code: 'NOT_FOUND' }
    ├─ AppError (custom) → err.statusCode { code: err.code }
    │
    └─ Error genérico:
         Producción → 500 { message: 'Internal server error' }
         Desarrollo → 500 { message, stack }
```

### 17.4 Frontend — Manejo de Errores

```
ApiService:
    fetch(url, options)
      .then(response):
          Si !response.ok:
              Si 401 → emit 'auth:expired' → logout → redirect login
              Sino → throw { status, data: await response.json() }
      .catch(error):
          → throw { status: 0, message: 'Connection error' }

Componente:
    try { await apiCall() }
    catch(err) {
        notify.error(err.message || 'Error inesperado')
    }
```

---

## 18. Persistencia y Acceso a Datos

### 18.1 Esquema de Base de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                    crm_hipotecario (MySQL)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐     ┌──────────┐     ┌──────────────┐             │
│  │  users   │     │  leads   │     │   clients    │             │
│  │──────────│     │──────────│     │──────────────│             │
│  │ id (PK)  │◄────│assigned_to│    │ id (PK)      │             │
│  │ email    │     │ id (PK)  │────►│ lead_id (FK) │             │
│  │ password │     │ full_name│     │ first_name   │             │
│  │ first_nm │     │ email    │     │ last_name    │             │
│  │ last_nm  │     │ phone    │     │ email        │             │
│  │ role     │     │ source   │     │ document_type│             │
│  │ is_active│     │ status   │     │ document_num │             │
│  └────┬─────┘     │ score    │     │ monthly_inc  │             │
│       │           └──────────┘     └──────┬───────┘             │
│       │                                    │                     │
│       │  ┌─────────────────────────────────┤                     │
│       │  │                                 │                     │
│       │  ▼                                 ▼                     │
│  ┌────┴──────────┐              ┌──────────────────┐            │
│  │  expedientes  │              │   documents      │            │
│  │───────────────│              │──────────────────│            │
│  │ id (PK)       │◄─────┐      │ id (PK)          │            │
│  │ client_id(FK) │      │      │ expediente_id(FK)│            │
│  │ advisor_id(FK)│      │      │ client_id(FK)    │            │
│  │ property_val  │      │      │ type             │            │
│  │ requested_amt │      │      │ file_name        │            │
│  │ term          │      │      │ status           │            │
│  │ status        │      │      │ uploaded_by(FK)  │            │
│  │ score         │      │      │ verified_by(FK)  │            │
│  └───┬───────────┘      │      └──────────────────┘            │
│      │                   │                                      │
│  ┌───┴───────┐   ┌──────┴──────┐    ┌──────────────────┐      │
│  │  offers   │   │   tasks     │    │  notifications   │      │
│  │───────────│   │─────────────│    │──────────────────│      │
│  │ id (PK)   │   │ id (PK)     │    │ id (PK)          │      │
│  │ exp_id(FK)│   │ exp_id(FK)  │    │ user_id(FK)      │      │
│  │ bank_id   │   │ assigned(FK)│    │ type             │      │
│  │ bank_name │   │ title       │    │ subject          │      │
│  │ int_rate  │   │ priority    │    │ message          │      │
│  │ term      │   │ status      │    │ status           │      │
│  │ monthly   │   │ due_date    │    │ sent_at          │      │
│  │ status    │   │ completed_at│    │ read_at          │      │
│  │ expires_at│   └─────────────┘    └──────────────────┘      │
│  └───────────┘                                                  │
│                            ┌──────────────────┐                 │
│                            │   audit_logs     │                 │
│                            │──────────────────│                 │
│                            │ id (PK)          │                 │
│                            │ user_id(FK)      │                 │
│                            │ action           │                 │
│                            │ entity_type      │                 │
│                            │ entity_id        │                 │
│                            │ old_value (JSON) │                 │
│                            │ new_value (JSON) │                 │
│                            │ ip_address       │                 │
│                            └──────────────────┘                 │
└──────────────────────────────────────────────────────────────────┘
```

### 18.2 QueryBuilder — Fluent Interface

El QueryBuilder implementa un patrón **fluent/immutable** (cada operación retorna un clon):

```php
// Ejemplo de consulta:
$qb->table('leads')
   ->where('status', '=', 'qualified')
   ->where('assigned_to', '=', $advisorId)
   ->orderBy('created_at', 'DESC')
   ->limit(20)
   ->offset(0)
   ->get();

// SQL generado:
// SELECT * FROM leads
// WHERE status = :w0 AND assigned_to = :w1
// ORDER BY created_at DESC
// LIMIT :_limit OFFSET :_offset

// Con prepared statements y type binding automático
```

### 18.3 Repository Pattern — Interfaz → Implementación

```
Domain Layer (contratos):                Infrastructure Layer (implementaciones):
──────────────────────                   ────────────────────────────────
UserRepositoryInterface         ◄────►   MySQLUserRepository
LeadRepositoryInterface         ◄────►   MySQLLeadRepository
ClientRepositoryInterface       ◄────►   MySQLClientRepository
ExpedienteRepositoryInterface   ◄────►   MySQLExpedienteRepository
OfferRepositoryInterface        ◄────►   MySQLOfferRepository
TaskRepositoryInterface         ◄────►   MySQLTaskRepository
DocumentRepositoryInterface     ◄────►   MySQLDocumentRepository
NotificationRepositoryInterface ◄────►   MySQLNotificationRepository
AuditLogRepositoryInterface     ◄────►   MySQLAuditLogRepository
```

Cada repositorio MySQL recibe el `QueryBuilder` por constructor y utiliza:
- `table()->where()->get()` para consultas
- `insert()` para creación
- `update()` para actualizaciones
- `raw()` para consultas SQL complejas (joins, group by)

---

## 19. Sistema de Auditoría y Trazabilidad

### 19.1 Audit Trail

```
AuditLog Entity:
    │
    ├─ userId       → Quién realizó la acción
    ├─ action       → Qué hizo (create, update, delete, transition)
    ├─ entityType   → Sobre qué tipo de entidad
    ├─ entityId     → ID de la entidad afectada
    ├─ oldValue     → Estado anterior (JSON snapshot)
    ├─ newValue     → Estado nuevo (JSON snapshot)
    ├─ ipAddress    → Dirección IP del request
    └─ userAgent    → User Agent del navegador
```

### 19.2 Trazabilidad de Requests (BFF)

```
requestLogger middleware:
    │
    ├─ Entrada:
    │    ├─ X-Request-Id = uuid()
    │    ├─ Log: { method, url, requestId, timestamp }
    │
    └─ Salida (onFinished):
         └─ Log: { method, url, status, duration, requestId }
```

### 19.3 Tabla audit_logs (append-only)

La tabla de auditoría es **append-only** (solo INSERT, nunca UPDATE ni DELETE) para garantizar integridad del historial. Almacena snapshots JSON del estado antes y después de cada operación para cumplimiento normativo.

---

## 20. Testing y Validación

### 20.1 Backend PHP (PHPUnit)

| Suite | Archivo | Tests | Cobertura |
|-------|---------|-------|-----------|
| Application | CreateLeadUseCaseTest | 6 | Creación, validación, eventos |
| Domain | ExpedienteTest | 14 | Estado, transiciones, LTV, validación |
| Domain | ScoringServiceTest | 4 | Scoring alto/bajo/medio, value object |

### 20.2 BFF Node.js (Jest)

| Suite | Archivo | Tests | Cobertura |
|-------|---------|-------|-----------|
| Adapters | adapters.test.js | ~15 | Bank adapters, DocumentProcessor, NotificationService |
| Middleware | middleware.test.js | ~12 | Auth JWT, Role validation, Schema validation |
| Services | services.test.js | ~8 | CacheService, EventBus |

---

## 21. Apéndice: Mapa Completo de Archivos

```
CRM_PHP/
├── docs/
│   ├── informe-arquitectura-software.md
│   ├── informe-funcionalidad.md
│   └── informe-flujo-ejecucion.md          ← Este documento
│
├── backend/                                  (PHP 8.2+ — Clean Architecture)
│   ├── .env.example
│   ├── composer.json
│   ├── phpunit.xml
│   ├── config/
│   │   ├── app.php                          ← Configuración general (JWT, CORS, uploads)
│   │   └── database.php                     ← Configuración MySQL
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 001_create_users_table.sql
│   │   │   ├── 002_create_leads_table.sql
│   │   │   ├── 003_create_clients_table.sql
│   │   │   ├── 004_create_expedientes_table.sql
│   │   │   ├── 005_create_offers_table.sql
│   │   │   ├── 006_create_tasks_table.sql
│   │   │   ├── 007_create_documents_table.sql
│   │   │   ├── 008_create_notifications_table.sql
│   │   │   └── 009_create_audit_logs_table.sql
│   │   └── seeds/
│   │       └── seed.sql                     ← Datos iniciales (4 users, 5 leads, etc.)
│   ├── public/
│   │   └── index.php                        ← ENTRY POINT (único punto de entrada HTTP)
│   ├── src/
│   │   ├── Domain/                          ← Capa de Dominio (sin dependencias externas)
│   │   │   ├── Entity/
│   │   │   │   ├── Enums.php                ← 12 enumeraciones de dominio
│   │   │   │   ├── User.php
│   │   │   │   ├── Lead.php
│   │   │   │   ├── Client.php
│   │   │   │   ├── Expediente.php
│   │   │   │   ├── Task.php
│   │   │   │   ├── Document.php
│   │   │   │   ├── Offer.php
│   │   │   │   ├── Notification.php
│   │   │   │   └── AuditLog.php
│   │   │   ├── ValueObject/
│   │   │   │   ├── Email.php                ← Validación + normalización de email
│   │   │   │   ├── Phone.php                ← Validación de teléfono
│   │   │   │   ├── Money.php                ← Aritmética monetaria con divisa
│   │   │   │   ├── Score.php                ← Puntuación 0-100 con niveles de riesgo
│   │   │   │   └── DateRange.php            ← Rango de fechas con overlap
│   │   │   ├── Service/
│   │   │   │   ├── ScoringService.php       ← Scoring crediticio (5 factores ponderados)
│   │   │   │   └── ExpedienteStateMachine.php ← Máquina de estados (9 estados)
│   │   │   ├── Event/
│   │   │   │   ├── DomainEvent.php          ← Clase base abstracta
│   │   │   │   ├── EventDispatcher.php      ← Pub/Sub de eventos
│   │   │   │   ├── LeadCreated.php
│   │   │   │   ├── ExpedienteStatusChanged.php
│   │   │   │   ├── DocumentUploaded.php
│   │   │   │   └── OfferReceived.php
│   │   │   └── Repository/
│   │   │       ├── UserRepositoryInterface.php
│   │   │       ├── LeadRepositoryInterface.php
│   │   │       ├── ClientRepositoryInterface.php
│   │   │       ├── ExpedienteRepositoryInterface.php
│   │   │       ├── OfferRepositoryInterface.php
│   │   │       ├── TaskRepositoryInterface.php
│   │   │       ├── DocumentRepositoryInterface.php
│   │   │       ├── NotificationRepositoryInterface.php
│   │   │       └── AuditLogRepositoryInterface.php
│   │   ├── Application/                     ← Capa de Aplicación (orquestación)
│   │   │   ├── DTO/
│   │   │   │   ├── LoginDTO.php
│   │   │   │   ├── RegisterDTO.php
│   │   │   │   ├── CreateLeadDTO.php
│   │   │   │   ├── CreateClientDTO.php
│   │   │   │   ├── CreateExpedienteDTO.php
│   │   │   │   ├── CreateTaskDTO.php
│   │   │   │   ├── CreateOfferDTO.php
│   │   │   │   ├── UploadDocumentDTO.php
│   │   │   │   ├── DashboardDTO.php
│   │   │   │   └── PaginationDTO.php
│   │   │   ├── Service/
│   │   │   │   └── AuthService.php          ← JWT generate/validate/getUserId
│   │   │   └── UseCase/
│   │   │       ├── Auth/
│   │   │       │   ├── LoginUseCase.php
│   │   │       │   └── RegisterUseCase.php
│   │   │       ├── Lead/
│   │   │       │   ├── CreateLeadUseCase.php
│   │   │       │   ├── ListLeadsUseCase.php
│   │   │       │   ├── AssignLeadUseCase.php
│   │   │       │   ├── QualifyLeadUseCase.php
│   │   │       │   └── ConvertLeadUseCase.php
│   │   │       ├── Client/
│   │   │       │   ├── CreateClientUseCase.php
│   │   │       │   ├── GetClientUseCase.php
│   │   │       │   ├── ListClientsUseCase.php
│   │   │       │   └── UpdateClientUseCase.php
│   │   │       ├── Expediente/
│   │   │       │   ├── CreateExpedienteUseCase.php
│   │   │       │   ├── GetExpedienteUseCase.php
│   │   │       │   ├── ListExpedientesUseCase.php
│   │   │       │   ├── TransitionExpedienteUseCase.php
│   │   │       │   └── ScoreExpedienteUseCase.php
│   │   │       ├── Task/
│   │   │       │   ├── CreateTaskUseCase.php
│   │   │       │   ├── CompleteTaskUseCase.php
│   │   │       │   └── ListTasksUseCase.php
│   │   │       ├── Offer/
│   │   │       │   ├── CreateOfferUseCase.php
│   │   │       │   ├── AcceptOfferUseCase.php
│   │   │       │   └── ListOffersUseCase.php
│   │   │       ├── Document/
│   │   │       │   ├── UploadDocumentUseCase.php
│   │   │       │   ├── VerifyDocumentUseCase.php
│   │   │       │   └── ListDocumentsUseCase.php
│   │   │       ├── Notification/
│   │   │       │   ├── SendNotificationUseCase.php
│   │   │       │   ├── ListNotificationsUseCase.php
│   │   │       │   └── MarkReadUseCase.php
│   │   │       ├── Audit/
│   │   │       │   ├── LogActionUseCase.php
│   │   │       │   └── GetAuditTrailUseCase.php
│   │   │       └── Report/
│   │   │           ├── GetDashboardUseCase.php
│   │   │           └── GetPipelineUseCase.php
│   │   └── Infrastructure/                  ← Capa de Infraestructura
│   │       ├── Config/
│   │       │   └── Container.php            ← DI Container (lazy singletons)
│   │       ├── Database/
│   │       │   ├── Connection.php           ← PDO Singleton
│   │       │   └── QueryBuilder.php         ← Fluent query builder (immutable)
│   │       ├── Http/
│   │       │   ├── Controller/
│   │       │   │   ├── AuthController.php
│   │       │   │   ├── LeadController.php
│   │       │   │   ├── ClientController.php
│   │       │   │   ├── ExpedienteController.php
│   │       │   │   ├── TaskController.php
│   │       │   │   ├── OfferController.php
│   │       │   │   ├── DocumentController.php
│   │       │   │   ├── NotificationController.php
│   │       │   │   ├── AuditController.php
│   │       │   │   └── ReportController.php
│   │       │   ├── Middleware/
│   │       │   │   ├── AuthMiddleware.php    ← JWT + Role verification
│   │       │   │   ├── CorsMiddleware.php   ← CORS headers + preflight
│   │       │   │   └── RateLimitMiddleware.php ← File-based rate limit
│   │       │   └── Router/
│   │       │       ├── Router.php           ← Pattern matching con {params}
│   │       │       └── routes.php           ← Registro de 31 rutas
│   │       └── Repository/
│   │           ├── MySQLUserRepository.php
│   │           ├── MySQLLeadRepository.php
│   │           ├── MySQLClientRepository.php
│   │           ├── MySQLExpedienteRepository.php
│   │           ├── MySQLOfferRepository.php
│   │           ├── MySQLTaskRepository.php
│   │           ├── MySQLDocumentRepository.php
│   │           ├── MySQLNotificationRepository.php
│   │           └── MySQLAuditLogRepository.php
│   └── tests/
│       ├── Application/
│       │   └── CreateLeadUseCaseTest.php
│       └── Domain/
│           ├── ExpedienteTest.php
│           └── ScoringServiceTest.php
│
├── bff/                                      (Node.js/Express — API Gateway)
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── server.js                        ← ENTRY POINT
│   │   ├── config/
│   │   │   └── index.js                     ← Configuración centralizada
│   │   ├── middleware/
│   │   │   ├── auth.js                      ← JWT + RBAC
│   │   │   ├── errorHandler.js              ← Error formatting global
│   │   │   ├── requestLogger.js             ← UUID tracking + Winston
│   │   │   └── validator.js                 ← Schema validation
│   │   ├── routes/
│   │   │   ├── portalRoutes.js              ← Rutas cliente final (11 endpoints)
│   │   │   ├── crmRoutes.js                 ← Rutas CRM interno (18+ endpoints)
│   │   │   ├── bankRoutes.js                ← Integración bancaria (4 endpoints)
│   │   │   └── backofficeRoutes.js          ← Gestión y reportes (6 endpoints)
│   │   ├── services/
│   │   │   ├── backendProxy.js              ← HTTP client con retry
│   │   │   ├── cacheService.js              ← In-memory cache (NodeCache)
│   │   │   └── eventBus.js                  ← Event emitter
│   │   └── adapters/
│   │       ├── bank/
│   │       │   ├── baseBankAdapter.js       ← Circuit breaker + retry
│   │       │   ├── bankAAdapter.js          ← Banco Nacional
│   │       │   ├── bankBAdapter.js          ← Banco Internacional
│   │       │   └── bankAdapterFactory.js    ← Registry pattern
│   │       ├── notification/
│   │       │   ├── notificationService.js   ← Orquestador multicanal
│   │       │   ├── emailAdapter.js          ← Simulado (SMTP)
│   │       │   ├── smsAdapter.js            ← Simulado (Twilio)
│   │       │   └── pushAdapter.js           ← Simulado (FCM)
│   │       └── document/
│   │           └── documentProcessor.js     ← Validación + UUID filename
│   └── tests/
│       ├── adapters.test.js
│       ├── middleware.test.js
│       └── services.test.js
│
└── frontend/                                 (Vanilla JS — SPA)
    ├── package.json
    ├── public/
    │   └── index.html                       ← ENTRY POINT (HTML shell)
    └── src/
        ├── app.js                           ← Main module (routing + layout + guards)
        ├── styles/
        │   └── main.css                     ← Design system (CSS variables)
        ├── services/
        │   ├── api.js                       ← Fetch wrapper (4 API instances)
        │   ├── auth.js                      ← Login/logout/localStorage
        │   └── notification.js              ← Toast notifications
        ├── utils/
        │   ├── router.js                    ← Hash-based SPA router
        │   ├── state.js                     ← Store con subscriptions
        │   └── helpers.js                   ← Formatters, validators, utilities
        └── components/
            ├── shared/                      ← Componentes reutilizables
            │   ├── Navbar.js
            │   ├── Sidebar.js
            │   ├── Form.js
            │   ├── DataTable.js
            │   ├── Modal.js
            │   ├── StatusBadge.js
            │   ├── KPICard.js
            │   ├── Pipeline.js
            │   └── FileUpload.js
            ├── crm/                         ← Páginas del CRM interno
            │   ├── CrmLogin.js
            │   ├── CrmDashboard.js
            │   ├── CrmLeads.js
            │   ├── CrmLeadDetail.js
            │   ├── CrmClients.js
            │   ├── CrmClientDetail.js
            │   ├── CrmExpedientes.js
            │   ├── CrmExpedienteDetail.js
            │   ├── CrmTasks.js
            │   └── CrmOffers.js
            ├── portal/                      ← Páginas del portal cliente
            │   ├── PortalLogin.js
            │   ├── PortalRegister.js
            │   ├── PortalDashboard.js
            │   ├── PortalExpedientes.js
            │   ├── PortalExpedienteDetail.js
            │   ├── PortalDocuments.js
            │   └── PortalOffers.js
            └── backoffice/                  ← Páginas del backoffice
                ├── BackofficeDashboard.js
                ├── BackofficeReports.js
                └── BackofficeAudit.js
```

---

*Documento generado el 2026-04-18. Versión del análisis basada en el estado actual del repositorio `luisprosa21-ai/CRM_PHP`.*
