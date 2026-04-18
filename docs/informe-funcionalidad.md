# Informe Detallado de Funcionalidad — CRM Hipotecario

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Portal del Cliente (Frontend SPA)](#3-portal-del-cliente)
4. [CRM Interno para Asesores](#4-crm-interno-para-asesores)
5. [Backoffice de Dirección](#5-backoffice-de-dirección)
6. [Backend PHP (Dominio)](#6-backend-php)
7. [BFF — Backend for Frontend (Node.js)](#7-bff-backend-for-frontend)
8. [Componentes Compartidos (UI)](#8-componentes-compartidos)
9. [Seguridad y Autenticación](#9-seguridad-y-autenticación)
10. [Integraciones Externas](#10-integraciones-externas)
11. [Modelo de Datos](#11-modelo-de-datos)
12. [Flujo de Negocio Completo](#12-flujo-de-negocio-completo)
13. [Estado Actual y Validación](#13-estado-actual-y-validación)

---

## 1. Resumen Ejecutivo

El **CRM Hipotecario** es una plataforma integral para la gestión del ciclo completo de solicitudes hipotecarias. Consta de tres capas:

| Capa | Tecnología | Función |
|------|------------|---------|
| **Frontend SPA** | JavaScript vanilla (ES Modules) | Interfaz de usuario para clientes, asesores y dirección |
| **BFF (API Gateway)** | Node.js + Express | Capa intermedia: autenticación, caché, agregación, integraciones |
| **Backend Core** | PHP 8.2+ (DDD/Clean Architecture) | Lógica de dominio, persistencia, reglas de negocio |

El sistema gestiona **3 perfiles de usuario**:

- **Cliente** — Portal público: seguimiento de su expediente, documentos, ofertas.
- **Asesor (advisor)** — CRM interno: gestión de leads, clientes, expedientes, tareas.
- **Admin/Gerente (admin/manager)** — Backoffice: KPIs, reportes, auditoría.

---

## 2. Arquitectura del Sistema

```
┌────────────────────────────────────────────────────────────────┐
│                    FRONTEND SPA (Puerto 8080)                  │
│  ┌──────────────┬────────────────┬──────────────────────────┐  │
│  │   Portal     │   CRM Interno  │      Backoffice          │  │
│  │  (7 páginas) │  (10 páginas)  │     (3 páginas)          │  │
│  └──────────────┴────────────────┴──────────────────────────┘  │
│  Componentes compartidos: Navbar, Sidebar, DataTable, Form...  │
│  Utilidades: Router (hash), State Store, Auth Service, API     │
├────────────────────────────────────────────────────────────────┤
│                   BFF Node.js (Puerto 3001)                    │
│  Express + JWT + Helmet + CORS + Rate Limiting + Winston       │
│  4 grupos de rutas: /portal, /crm, /banks, /backoffice         │
│  Servicios: Cache, EventBus, BackendProxy                      │
│  Adaptadores: Bancos (A, B), Notificaciones, Documentos        │
├────────────────────────────────────────────────────────────────┤
│                  Backend PHP (Puerto 8000)                      │
│  Domain-Driven Design · Clean Architecture                     │
│  Entidades: User, Lead, Client, Expediente, Offer, Document,  │
│             Task, Notification, AuditLog                       │
│  Use Cases: ~30 casos de uso organizados por módulo            │
│  Infraestructura: MySQL, JWT, Router HTTP                      │
└────────────────────────────────────────────────────────────────┘
```

### Tecnologías clave

- **Frontend**: JavaScript ES Modules, hash-based routing, store pub/sub, CSS puro.
- **BFF**: Express 4.x, JWT (jsonwebtoken), Axios, node-cache, multer 2.x, Winston.
- **Backend**: PHP 8.2+, PDO/MySQL, Firebase JWT, Ramsey UUID, PHPUnit 12.x.

---

## 3. Portal del Cliente

El portal público permite a los clientes gestionar sus solicitudes hipotecarias.

### 3.1 Páginas del Portal

| Componente | Ruta | Funcionalidad |
|------------|------|---------------|
| `PortalLogin` | `#/portal/login` | Login con email/contraseña. Redirige a `#/portal` si ya autenticado. Enlace a registro y a CRM. |
| `PortalRegister` | `#/portal/register` | Formulario de registro completo (nombre, apellidos, email, teléfono, contraseña). Validación de contraseñas. Crea lead + cliente en backend. |
| `PortalDashboard` | `#/portal` | Dashboard personal: bienvenida, acciones rápidas, expedientes activos (cards), notificaciones recientes (lista). |
| `PortalExpedientes` | `#/portal/expedientes` | Grid de todos los expedientes del cliente con estado, importes, plazo, fecha. Click navega al detalle. |
| `PortalExpedienteDetail` | `#/portal/expedientes/:id` | Timeline visual de estados (8 pasos), detalles financieros (importe, LTV, plazo, score), documentos, ofertas recibidas. |
| `PortalDocuments` | `#/portal/documents` | Subida de documentos con categoría (identidad, nómina, escritura, etc.). Tabla de documentos subidos con estado. |
| `PortalOffers` | `#/portal/offers/:id` | Comparación de ofertas por expediente. Destaca "mejor oferta" por cuota. Botones aceptar/rechazar para ofertas pendientes. |

### 3.2 API del Portal (BFF `/portal`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/register` | Registro (crea lead + cliente, genera JWT) |
| POST | `/login` | Login (valida contra backend, genera JWT) |
| GET | `/profile` | Perfil del cliente |
| PUT | `/profile` | Actualizar perfil |
| GET | `/expedientes` | Listar expedientes del cliente |
| GET | `/expedientes/:id` | Detalle con ofertas |
| POST | `/documents` | Subir documento (multer) |
| GET | `/documents` | Listar documentos |
| GET | `/notifications` | Notificaciones |
| POST | `/notifications/:id/read` | Marcar como leída |
| GET | `/offers/:expedienteId` | Ofertas de un expediente |

---

## 4. CRM Interno para Asesores

Herramienta de gestión comercial para asesores, gerentes y administradores.

### 4.1 Páginas del CRM

| Componente | Ruta | Funcionalidad |
|------------|------|---------------|
| `CrmLogin` | `#/crm/login` | Login específico para personal interno. Redirige admin/manager a backoffice, asesores a CRM dashboard. |
| `CrmDashboard` | `#/crm` | Dashboard del asesor: 4 KPIs (leads, expedientes, tareas, ofertas), tabla de leads recientes, lista de tareas pendientes, cards de expedientes recientes. |
| `CrmLeads` | `#/crm/leads` | DataTable con búsqueda, ordenación. Columnas: nombre, email, teléfono, origen, estado, fecha. Botón "+ Nuevo Lead" abre modal con formulario (nombre, email, teléfono, origen, notas). |
| `CrmLeadDetail` | `#/crm/leads/:id` | Vista detallada: datos de contacto, puntuación, notas, historial. Acciones: Calificar (si nuevo), Convertir a cliente (si calificado), Asignar asesor. |
| `CrmClients` | `#/crm/clients` | DataTable de clientes: nombre, email, teléfono, documento, ingresos, fecha de alta. Click navega a vista 360°. |
| `CrmClientDetail` | `#/crm/clients/:id` | Vista 360°: datos personales + financieros, expedientes asociados (cards clickables), documentos (tabla), actividad reciente (timeline). |
| `CrmExpedientes` | `#/crm/expedientes` | Pipeline Kanban con 9 columnas de estado (nuevo → firmado + rechazado). Cards con ID, cliente, importe. Click navega al detalle. Botón "+ Nuevo Expediente". |
| `CrmExpedienteDetail` | `#/crm/expedientes/:id` | Timeline visual, detalles financieros (importe, propiedad, LTV, plazo, score). Botones de transición de estado dinámicos según estado actual. Botón "Calcular Score". Enlace a ofertas. |
| `CrmTasks` | `#/crm/tasks` | DataTable de tareas: título, descripción, prioridad, estado, fecha límite, acción "Completar". Botón "+ Nueva Tarea" con formulario (título, descripción, asignado, prioridad, fecha). |
| `CrmOffers` | `#/crm/offers/:id` | Ofertas por expediente: cards con banco, tipo interés, cuota, coste total, condiciones. Destaca mejor oferta. Botón "+ Registrar Oferta" con formulario. |

### 4.2 API del CRM (BFF `/crm`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard agregado (cached 60s) |
| GET | `/leads` | Listar leads |
| POST | `/leads` | Crear lead (validado) |
| GET | `/leads/:id` | Detalle con historial |
| POST | `/leads/:id/assign` | Asignar asesor |
| POST | `/leads/:id/qualify` | Calificar lead |
| POST | `/leads/:id/convert` | Convertir a cliente |
| GET | `/clients` | Listar clientes |
| GET | `/clients/:id` | Vista 360° (cliente + expedientes + docs + actividad) |
| GET | `/expedientes` | Listar expedientes |
| GET | `/expedientes/:id` | Detalle expediente |
| POST | `/expedientes` | Crear expediente (validado) |
| POST | `/expedientes/:id/transition` | Cambiar estado |
| POST | `/expedientes/:id/score` | Calcular scoring |
| GET | `/tasks` | Listar tareas |
| POST | `/tasks` | Crear tarea (validada) |
| POST | `/tasks/:id/complete` | Completar tarea |
| GET | `/offers/:expId` | Ofertas de expediente |
| POST | `/offers` | Registrar oferta (validada) |

---

## 5. Backoffice de Dirección

Panel exclusivo para administradores y gerentes.

### 5.1 Páginas del Backoffice

| Componente | Ruta | Funcionalidad |
|------------|------|---------------|
| `BackofficeDashboard` | `#/backoffice` | Panel de KPIs: 6 tarjetas (leads, clientes, expedientes activos, ofertas, tasa conversión, volumen total). Barras de distribución por estado de leads y expedientes. Resumen de ofertas (aceptadas, rechazadas, pendientes). |
| `BackofficeReports` | `#/backoffice/reports` | 3 pestañas: **Pipeline** (embudo visual), **Conversión** (métricas lead→cliente→expediente→oferta→firma, tiempo medio, volumen cerrado), **Asesores** (DataTable: nombre, leads, expedientes, cerrados, conversión, volumen). |
| `BackofficeAudit` | `#/backoffice/audit` | Registro de auditoría con DataTable: fecha, acción, tipo entidad, ID, usuario, detalles, IP. Filtro por tipo de entidad (leads, clientes, expedientes, ofertas, tareas, documentos, usuarios). |

### 5.2 API del Backoffice (BFF `/backoffice`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/reports/dashboard` | KPIs globales (cached 120s) |
| GET | `/reports/pipeline` | Embudo del pipeline |
| GET | `/reports/conversion` | Métricas de conversión |
| GET | `/reports/advisors` | Rendimiento de asesores |
| GET | `/audit` | Log de auditoría |
| GET | `/audit/:entityType/:entityId` | Historial de entidad |

---

## 6. Backend PHP

### 6.1 Entidades del Dominio

| Entidad | Campos clave | Reglas de negocio |
|---------|-------------|-------------------|
| **User** | email (VO), passwordHash, role (Enum), isActive | Bcrypt cost 12. Roles: Admin, Advisor, Manager, Viewer. |
| **Lead** | fullName, email, phone, source, status, score | Máquina de estados: new → contacted → qualified → converted/lost. Score 0-100. |
| **Client** | nombre, email, document, employmentType, monthlyIncome | `calculateDebtRatio()`. Relación 1:1 con Lead. |
| **Expediente** | clientId, advisorId, propertyValue, requestedAmount, term, status, score | 9 estados con transiciones válidas. `calculateLTV()`. Validación: amount ≤ propertyValue. |
| **Offer** | expedienteId, bankId, interestRate, monthlyPayment, totalCost, status | Estados: pending → accepted/rejected/expired. `isExpired()`. |
| **Document** | expedienteId, clientId, fileName, mimeType, size, status, version | Versionado. Estados: uploaded → verified/rejected/expired. |
| **Task** | expedienteId, assignedTo, title, priority, status, dueDate | Estados: pending → inProgress → completed/cancelled. `isOverdue()`. |
| **AuditLog** | action, entityType, entityId, userId, details, ip | Inmutable. Registro de toda acción del sistema. |
| **Notification** | userId, type, subject, message, status | Multicanal: email, SMS, push, internal. |

### 6.2 Value Objects

- **Email** — Validación de formato.
- **Phone** — Formato telefónico.
- **Money** — Importes con moneda.
- **Score** — Rango 0-100.
- **DateRange** — Intervalo de fechas.

### 6.3 Servicios de Dominio

- **ScoringService** — Calcula viabilidad hipotecaria (0-100):
  - 30% Ratio LTV
  - 25% Ratio de deuda
  - 20% Nivel de ingresos
  - 15% Estabilidad laboral
  - 10% Plazo del préstamo

- **ExpedienteStateMachine** — Valida transiciones de estado.

### 6.4 Casos de Uso (~30)

| Módulo | Casos de uso |
|--------|-------------|
| Auth | Login, Register |
| Lead | Create, Qualify, Convert, Assign, List |
| Client | Create, Update, Get, List |
| Expediente | Create, Get, List, Score, Transition |
| Offer | Create, Accept, List |
| Document | Upload, Verify, List |
| Task | Create, Complete, List |
| Notification | Send, List, MarkRead |
| Audit | LogAction, GetAuditTrail |
| Report | GetDashboard, GetPipeline |

### 6.5 Infraestructura

- **Router HTTP** — PSR-7 compatible con parámetros y middleware.
- **Middleware** — Auth JWT, CORS, Rate Limiting.
- **Repositorios** — 9 implementaciones MySQL con QueryBuilder.
- **Container DI** — Lazy loading de controladores y servicios.

---

## 7. BFF — Backend for Frontend

### 7.1 Middleware

| Middleware | Función |
|-----------|---------|
| `helmet` | Cabeceras de seguridad HTTP |
| `cors` | Orígenes permitidos (localhost:3000, 5173) |
| `morgan` | Logging HTTP |
| `rateLimit` | 100 peticiones / 15 min |
| `authenticateToken` | Validación JWT Bearer |
| `requireRole` | Control de acceso por rol |
| `validate` | Validación declarativa de esquemas |
| `requestLogger` | UUID de request, timing |
| `errorHandler` | Clases de error tipadas (AppError, ValidationError, etc.) |

### 7.2 Servicios

| Servicio | Función |
|----------|---------|
| `backendProxy` | Cliente HTTP hacia PHP backend con retry + backoff exponencial |
| `cacheService` | Caché en memoria (node-cache) con TTL configurable |
| `eventBus` | EventEmitter para eventos asíncronos del sistema |

### 7.3 Adaptadores

| Adaptador | Función |
|-----------|---------|
| **BankAAdapter** | "Banco Nacional" — simulación con cálculo de cuota |
| **BankBAdapter** | "Banco Internacional" — campos en español |
| **BankAdapterFactory** | Registro y selección de bancos |
| **emailAdapter** | Envío de email (simulado) |
| **smsAdapter** | Envío de SMS (simulado) |
| **pushAdapter** | Notificación push (simulado) |
| **notificationService** | Orquestación multicanal + listeners de eventos |
| **documentProcessor** | Validación de archivos, renombrado UUID |

---

## 8. Componentes Compartidos (UI)

| Componente | Tipo | Descripción |
|------------|------|-------------|
| `Navbar` | Layout | Navegación superior con enlaces por rol. Dropdown de usuario. Menú responsive. |
| `Sidebar` | Layout | Barra lateral CRM/Backoffice con 8 enlaces con iconos. Estado activo. |
| `DataTable` | Datos | Tabla con búsqueda (debounced), ordenación, paginación, click en fila, acciones toolbar. |
| `Pipeline` | Datos | Kanban con columnas por estado, cards clickables, conteo por columna. |
| `KPICard` | Datos | Tarjeta de métrica con título, valor, icono, tendencia (↑↓→), color de acento. |
| `Form` | Input | Generador dinámico de formularios. Tipos: text, email, tel, select, textarea, checkbox. Validación. |
| `Modal` | UI | Diálogo modal genérico. Botón cerrar, ESC, overlay. `confirmModal()` con Promise. |
| `FileUpload` | Input | Drag-and-drop. Validación tipo/tamaño. Lista de archivos con eliminación. |
| `StatusBadge` | UI | Badge con color y texto según estado. |

---

## 9. Seguridad y Autenticación

### Mecanismos implementados

| Medida | Implementación |
|--------|----------------|
| **JWT** | Generación en BFF (jsonwebtoken). Validación en BFF y Backend (firebase/php-jwt). HS256. 8h expiración. |
| **Bcrypt** | Hash de contraseñas con cost 12 (backend PHP). |
| **Helmet** | Cabeceras HTTP de seguridad (XSS, sniffing, clickjacking). |
| **CORS** | Orígenes restringidos. |
| **Rate Limiting** | 100 req / 15 min por IP. |
| **XSS Prevention** | `escapeHtml()` en todo dato de usuario en el frontend. |
| **SQL Injection** | Prepared statements con PDO. |
| **Input Validation** | Validación en BFF (middleware) y Backend (DTOs). |
| **Route Guards** | `beforeEach` en router frontend. `authenticateToken` y `requireRole` en BFF. |
| **Auth Expiry** | Evento `auth:expired` con logout automático. |

### Control de acceso por rol

| Ruta | client | advisor | admin/manager |
|------|--------|---------|---------------|
| Portal (`/portal/*`) | ✅ | — | — |
| CRM (`/crm/*`) | — | ✅ | ✅ |
| Backoffice (`/backoffice/*`) | — | — | ✅ |

---

## 10. Integraciones Externas

### Bancos (Pattern: Adapter + Circuit Breaker)

```
BankAdapterFactory → BankAAdapter / BankBAdapter
                      ↓ (hereda)
                   BaseBankAdapter (circuit breaker, retry, backoff)
```

- **Banco Nacional (A)**: Tasa base 3%, cálculo de cuota mensual.
- **Banco Internacional (B)**: Campos en español, comisión de apertura 1%.
- Circuit breaker: 5 fallos → circuito abierto → 30s timeout → half-open.

### Notificaciones (Multicanal)

- Email (SMTP simulado), SMS (Twilio simulado), Push (FCM simulado).
- Listeners automáticos: lead.created → email asesor, expediente.statusChanged → email cliente, offer.received → email cliente.

---

## 11. Modelo de Datos

### Tablas (9 migraciones SQL)

| Tabla | Relaciones |
|-------|-----------|
| `users` | — |
| `leads` | → users (assigned_to) |
| `clients` | → leads |
| `expedientes` | → clients, → users (advisor) |
| `offers` | → expedientes |
| `tasks` | → expedientes, → users (assigned_to) |
| `documents` | → expedientes, → clients |
| `notifications` | → users |
| `audit_logs` | → users |

---

## 12. Flujo de Negocio Completo

```
1. CAPTACIÓN
   Cliente se registra en Portal → se crea Lead + Client
   ↓
2. GESTIÓN COMERCIAL
   Asesor ve Lead en CRM → Califica → Convierte a Expediente
   ↓
3. DOCUMENTACIÓN
   Cliente sube documentos → Asesor verifica
   ↓
4. ENVÍO A BANCOS
   Asesor envía solicitud a Banco A y B (via BankAdapter)
   ↓
5. OFERTAS
   Bancos responden (webhook) → Ofertas aparecen en Portal y CRM
   ↓
6. NEGOCIACIÓN
   Cliente compara ofertas → Acepta la mejor
   ↓
7. FIRMA
   Expediente pasa a "Aprobado" → "Firmado"
   ↓
8. REPORTING
   Dirección consulta KPIs, pipeline, conversión en Backoffice
```

### Máquina de estados del Expediente

```
nuevo → en_estudio → documentacion_pendiente → enviado_a_banco →
oferta_recibida → negociacion → aprobado → firmado

Cualquier estado (excepto firmado) puede transicionar a → rechazado
```

---

## 13. Estado Actual y Validación

### Componentes completados

| Área | Componentes | Estado |
|------|-------------|--------|
| Portal del Cliente | 7 páginas | ✅ Completado |
| CRM Interno | 10 páginas | ✅ Completado |
| Backoffice | 3 páginas | ✅ Completado |
| App.js (entry point) | Routing + guards + layout | ✅ Completado |
| Backend PHP | Dominio + Use Cases + Infraestructura | ✅ Completado |
| BFF Node.js | Rutas + Middleware + Servicios + Adaptadores | ✅ Completado |
| Componentes compartidos | 9 componentes UI reutilizables | ✅ Completado |
| Seguridad | JWT + Bcrypt + Helmet + CORS + Rate Limit | ✅ Completado |
| Migraciones BD | 9 tablas | ✅ Completado |
| Documentación arquitectura | Informe completo | ✅ Completado |
| Documentación funcionalidad | Este informe | ✅ Completado |

### Vulnerabilidades corregidas

| Dependencia | Versión anterior | Versión actual | CVE |
|-------------|-----------------|----------------|-----|
| phpunit/phpunit | ^10.0 | ^12.5.22 | Argument injection |
| multer | ^1.4.5-lts.1 | ^2.1.1 | Múltiples DoS |

### Tests existentes

- **Backend PHP**: CreateLeadUseCaseTest, ExpedienteTest, ScoringServiceTest (PHPUnit).
- **BFF Node.js**: adapters.test.js, middleware.test.js, services.test.js (Node test runner).

---

*Documento generado para el CRM Hipotecario v1.0.0*
