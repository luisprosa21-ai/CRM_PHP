# Informe de arquitectura de software para una plataforma CRM hipotecaria

## Índice

1. [Contexto funcional del negocio](#1-contexto-funcional-del-negocio)
2. [Visión global de sistemas](#2-visión-global-de-sistemas)
3. [Sistemas, arquitectura recomendada y función](#3-sistemas-arquitectura-recomendada-y-función)
4. [Arquitecturas posibles para estos sistemas](#4-arquitecturas-posibles-para-estos-sistemas)
5. [Propuesta de arquitectura objetivo](#5-propuesta-de-arquitectura-objetivo)
6. [Función de cada sistema dentro del flujo de negocio](#6-función-de-cada-sistema-dentro-del-flujo-de-negocio)
7. [Tecnologías habituales en una plataforma como esta](#7-tecnologías-habituales-en-una-plataforma-como-esta)
8. [Qué papel jugaría alguien con experiencia en PHP, JS y Node.js](#8-qué-papel-jugaría-alguien-con-experiencia-en-php-js-y-nodejs)
9. [Conclusión ejecutiva](#9-conclusión-ejecutiva)

---

## 1. Contexto funcional del negocio

Una empresa de CRM hipotecario suele actuar como intermediario tecnológico entre:

- El **cliente final** que solicita financiación.
- El **asesor/comercial** que gestiona el expediente.
- Los **bancos o entidades financieras** que reciben la solicitud.

En la práctica, el sistema no es solo "un CRM", sino un conjunto de plataformas que cubren todo el ciclo:

1. Captación del lead.
2. Alta del cliente y del expediente.
3. Recogida documental.
4. Validación y scoring.
5. Envío de la solicitud a bancos.
6. Recepción y comparación de ofertas.
7. Seguimiento, firma y cierre.
8. Analítica, trazabilidad y cumplimiento normativo.

Por tanto, conviene pensar en una **arquitectura de ecosistema**, no en una única aplicación.

---

## 2. Visión global de sistemas

La solución puede dividirse en estos sistemas principales:

| # | Sistema | Descripción breve |
|---|---------|-------------------|
| 1 | Portal de cliente | Interfaz para el usuario final |
| 2 | CRM interno para asesores | Herramienta de gestión comercial |
| 3 | Motor de expedientes hipotecarios | Núcleo funcional del negocio |
| 4 | Plataforma de integración con bancos | Conexión con entidades financieras |
| 5 | Gestor documental | Administración de documentación |
| 6 | Motor de reglas y scoring | Evaluación automática de viabilidad |
| 7 | Capa de APIs | Puerta de entrada/salida de la plataforma |
| 8 | Módulo de internacionalización | Operación en distintos mercados |
| 9 | Capa de datos e inteligencia artificial | Analítica y automatización |
| 10 | Sistema de notificaciones y comunicaciones | Gestión de comunicación multicanal |
| 11 | Backoffice y reporting | Visibilidad para dirección y operaciones |
| 12 | Seguridad, auditoría y cumplimiento | Protección y trazabilidad |

Cada uno cumple una función distinta y puede construirse con arquitecturas diferentes según su criticidad, escalabilidad y ritmo de cambio.

---

## 3. Sistemas, arquitectura recomendada y función

### 3.1 Portal de cliente

**Función**

Es la interfaz para que el usuario final:

- Se registre.
- Rellene formularios.
- Suba documentación.
- Consulte el estado de su solicitud.
- Reciba mensajes y alertas.
- Compare propuestas.

**Arquitectura recomendada:** Frontend desacoplado + BFF (Backend for Frontend)

**Estructura:**

- Frontend SPA o SSR moderno: React, Vue o Angular.
- BFF específico para el portal.
- API Gateway detrás.

**Por qué esta arquitectura**

El portal de cliente necesita una experiencia muy fluida, responsive y segura. El BFF permite adaptar los datos del backend al frontend sin exponer toda la complejidad interna.

**Funciones técnicas**

- Autenticación y sesión.
- Carga asíncrona de datos.
- Formularios dinámicos.
- Firma de consentimientos.
- Subida de documentos.
- Seguimiento del estado del expediente.

**Ventajas**

- Buena experiencia de usuario.
- Menor acoplamiento con el core.
- Más fácil adaptar interfaces por país o idioma.

---

### 3.2 CRM interno para asesores

**Función**

Lo usan empleados internos o gestores comerciales para:

- Gestionar leads.
- Asignar expedientes.
- Ver historial del cliente.
- Contactar con bancos.
- Registrar tareas.
- Controlar el funnel comercial.

**Arquitectura recomendada:** Aplicación modular monolítica o arquitectura por módulos bien separada

**Por qué**

En un CRM interno, muchas funciones están muy relacionadas y comparten datos. Si la empresa está creciendo, es habitual empezar con un monolito modular bien diseñado antes de pasar a microservicios.

**Módulos típicos**

- Leads
- Clientes
- Expedientes
- Tareas
- Mensajería
- Ofertas
- Actividad y trazabilidad
- Gestión de usuarios y roles

**Funciones técnicas**

- Vista 360º del cliente.
- Pipeline comercial.
- Seguimiento de SLA.
- Gestión de incidencias.
- Registro de llamadas, correos y observaciones.

**Ventajas**

- Desarrollo más rápido.
- Menor complejidad operativa.
- Más fácil mantener consistencia transaccional.

---

### 3.3 Motor de expedientes hipotecarios

**Función**

Es el núcleo funcional del negocio. Gestiona el ciclo de vida del expediente desde la entrada inicial hasta la aprobación o cierre.

**Arquitectura recomendada:** Arquitectura de dominio / hexagonal / clean architecture

**Por qué**

El expediente hipotecario tiene reglas de negocio complejas:

- Estados.
- Transiciones.
- Validaciones.
- Excepciones.
- Dependencias con documentos.
- Interacción con bancos.

La arquitectura hexagonal permite separar claramente:

- **Dominio**: lógica de negocio pura.
- **Casos de uso**: orquestación de operaciones.
- **Adaptadores externos**: infraestructura y servicios.

**Funciones técnicas**

- Modelado del expediente.
- Gestión de estados.
- Validación de requisitos.
- Control de hitos.
- Historial completo de cambios.

**Ejemplo de estados**

```
Nuevo → En estudio → Documentación pendiente → Enviado a banco → Oferta recibida → Negociación → Aprobado → Firmado
                                                                                                          ↘ Rechazado
```

| Estado | Descripción |
|--------|-------------|
| Nuevo | Expediente recién creado |
| En estudio | En revisión por un asesor |
| Documentación pendiente | Faltan documentos por aportar |
| Enviado a banco | Solicitud remitida a entidad financiera |
| Oferta recibida | El banco ha respondido con una propuesta |
| Negociación | En fase de negociación de condiciones |
| Aprobado | Operación aprobada |
| Firmado | Operación completada y firmada |
| Rechazado | Operación denegada |

**Ventajas**

- Muy mantenible.
- Facilita pruebas unitarias.
- Reduce dependencia de frameworks.

---

### 3.4 Plataforma de integración con bancos

**Función**

Conecta el sistema interno con bancos, comparadores, brokers o partners financieros.

**Arquitectura recomendada:** Arquitectura orientada a integración + API Gateway + adaptadores por entidad

**Por qué**

Cada banco puede tener:

- APIs distintas.
- Formatos distintos.
- Reglas distintas.
- SLA distintos.

No conviene integrar cada banco directamente con el core. Es mejor una capa de integración con adaptadores.

**Funciones técnicas**

- Normalizar solicitudes.
- Transformar datos al formato de cada banco.
- Gestionar autenticación por partner.
- Reintentos y colas.
- Registro de errores de integración.
- Seguimiento de respuestas y ofertas.

**Patrones útiles**

| Patrón | Propósito |
|--------|-----------|
| Adapter | Transformar interfaces entre sistemas |
| Anti-corruption layer | Proteger el dominio de modelos externos |
| Message broker | Gestionar asincronía |
| Circuit breaker | Evitar cascada de fallos |
| Retry con backoff | Reintentos con espera incremental |

**Ventajas**

- Evita acoplamiento con terceros.
- Facilita añadir bancos nuevos.
- Mejora la resiliencia.

---

### 3.5 Gestor documental

**Función**

Administra toda la documentación hipotecaria:

- DNI/NIE/pasaporte.
- Nóminas.
- Declaraciones.
- Escrituras.
- Recibos.
- Tasaciones.
- Contratos.

**Arquitectura recomendada:** Servicio independiente con almacenamiento de objetos + metadatos en base de datos

**Por qué**

Los documentos tienen volumen alto, requisitos de seguridad y necesidades de control de versiones.

**Funciones técnicas**

- Subida y almacenamiento seguro.
- Indexación de metadatos.
- Versionado.
- OCR y extracción de datos.
- Control de permisos.
- Expiración y retención.

**Tecnologías típicas**

- Object storage (S3, MinIO, Azure Blob, etc.).
- Base de datos relacional para metadatos.
- OCR integrado.
- Antimalware y validación de ficheros.

**Ventajas**

- Escalabilidad.
- Separación entre datos estructurados y archivos.
- Mejor cumplimiento normativo.

---

### 3.6 Motor de reglas y scoring

**Función**

Evalúa automáticamente la viabilidad de una operación y ayuda a priorizar expedientes.

**Arquitectura recomendada:** Servicio especializado de reglas / decision engine

**Por qué**

Las reglas cambian con frecuencia:

- Ratio de endeudamiento.
- Nivel de ingresos.
- Nacionalidad.
- Tipo de contrato.
- Historial del cliente.
- Requisitos por banco.

No conviene codificar todo en el core como `if/else` rígidos.

**Funciones técnicas**

- Reglas configurables.
- Scoring interno.
- Precalificación.
- Segmentación por perfil.
- Recomendación de bancos adecuados.

**Ventajas**

- Flexibilidad comercial.
- Mejor velocidad de adaptación.
- Posibilidad de introducir IA sin romper el core.

---

### 3.7 Capa de APIs

**Función**

Es la puerta de entrada y salida de la plataforma hacia:

- Frontends.
- Móviles.
- Sistemas de partners.
- Integraciones internas.
- Bancos.
- Servicios externos.

**Arquitectura recomendada:** API Gateway + APIs REST/GraphQL según caso de uso

**Por qué**

Una plataforma hipotecaria moderna suele tener múltiples consumidores. La capa de API permite centralizar:

- Autenticación.
- Rate limiting.
- Observabilidad.
- Control de versiones.
- Auditoría.

**Funciones técnicas**

- Exposición de endpoints.
- Validación de tokens.
- Registro de trazas.
- Control de permisos.
- Versionado de contratos.

**Recomendación práctica**

| Tipo | Uso recomendado |
|------|-----------------|
| REST | Integraciones estándar |
| GraphQL o BFF | Frontends complejos |
| Webhooks | Eventos |

**Ventajas**

- Orden arquitectónico.
- Escalabilidad.
- Facilidad de integración con terceros.

---

### 3.8 Módulo de internacionalización

**Función**

Permite operar en distintos países o mercados con reglas, idiomas, monedas y normativas diferentes.

**Arquitectura recomendada:** Arquitectura por configuración + separación por tenant/país

**Por qué**

El mercado internacional no solo cambia el idioma. También cambia:

- Formatos de documento.
- Normas KYC.
- Tipos de contrato.
- Criterios bancarios.
- Divisas.
- Impuestos.
- Nomenclatura legal.

**Funciones técnicas**

- Traducciones de interfaz.
- Formatos locales.
- Reglas específicas por país.
- Catálogos parametrizables.
- Gestión multimoneda.
- Soporte multi-tenant.

**Ventajas**

- Escalado internacional más simple.
- Menos forks del producto.
- Menor coste de mantenimiento.

---

### 3.9 Capa de datos e inteligencia artificial

**Función**

Centraliza datos para analítica, automatización y modelos de IA.

**Arquitectura recomendada:** Arquitectura analítica separada del sistema transaccional

**Por qué**

No conviene ejecutar analítica pesada directamente sobre la base operativa del CRM. Lo correcto es separar:

- **OLTP**: operación diaria.
- **OLAP / DWH / Lakehouse**: analítica y modelos.

**Casos de uso de IA**

- Clasificación automática de documentos.
- Extracción de datos con OCR.
- Predicción de probabilidad de aprobación.
- Recomendación de entidad bancaria.
- Detección de anomalías.
- Automatización de respuestas.

**Funciones técnicas**

- Ingesta de datos.
- Normalización.
- Feature store.
- Entrenamiento de modelos.
- Inferencia en tiempo real o batch.

**Ventajas**

- Mejora de conversión.
- Reducción de trabajo manual.
- Mayor calidad de decisión.

---

### 3.10 Sistema de notificaciones y comunicaciones

**Función**

Gestiona la comunicación con cliente y equipo interno:

- Email.
- SMS.
- WhatsApp.
- Notificaciones push.
- Avisos internos.

**Arquitectura recomendada:** Servicio asíncrono basado en eventos

**Por qué**

Las notificaciones no deben bloquear procesos de negocio. Lo adecuado es dispararlas de forma desacoplada desde eventos del sistema.

**Funciones técnicas**

- Plantillas.
- Preferencias del usuario.
- Envíos programados.
- Reintentos.
- Confirmación de entrega.
- Historial de comunicación.

**Ventajas**

- Menor dependencia entre módulos.
- Mejor experiencia de usuario.
- Trazabilidad completa.

---

### 3.11 Backoffice y reporting

**Función**

Proporciona visibilidad a dirección, operaciones y cumplimiento:

- Número de expedientes.
- Ratio de conversión.
- Tiempos medios.
- Actividad por asesor.
- Bancos más eficaces.
- Causas de rechazo.

**Arquitectura recomendada:** Dashboards sobre DWH + servicios de BI

**Por qué**

El reporting debe leer datos consolidados y no sobrecargar el sistema operativo.

**Funciones técnicas**

- KPIs.
- Exportaciones.
- Seguimiento operativo.
- Informes de negocio.
- Auditoría de actividad.

**Ventajas**

- Mejor toma de decisiones.
- Menor impacto sobre producción.
- Métricas consistentes.

---

### 3.12 Seguridad, auditoría y cumplimiento

**Función**

Protege información sensible y garantiza trazabilidad.

**Arquitectura recomendada:** Seguridad transversal a todos los sistemas

**Componentes**

| Componente | Función |
|------------|---------|
| IAM / SSO | Gestión de identidad centralizada |
| MFA | Autenticación multifactor |
| RBAC o ABAC | Control de acceso por rol o atributo |
| Auditoría centralizada | Registro inmutable de acciones |
| Cifrado en tránsito y en reposo | Protección de datos |
| Gestión de secretos | Almacenamiento seguro de credenciales |
| Logs inmutables | Trazabilidad completa |
| Consentimiento y trazabilidad legal | Cumplimiento normativo |

**Funciones técnicas**

- Control de acceso por rol.
- Registro de acciones de usuarios.
- Protección de datos personales.
- Políticas de retención.
- Evidencias para auditoría.

**Ventajas**

- Menor riesgo legal.
- Mayor confianza del cliente.
- Mejor preparación para certificaciones.

---

## 4. Arquitecturas posibles para estos sistemas

### Opción A. Monolito modular

**Cuándo encaja**

- Empresa pequeña o en fase de crecimiento.
- Equipo reducido.
- Necesidad de salir rápido al mercado.

**Ventajas**

- Más simple de desarrollar.
- Menor coste operativo.
- Consistencia de datos más fácil.

**Inconvenientes**

- Escalado menos granular.
- Riesgo de acoplamiento si no se diseña bien.

> **Recomendación:** Muy buena opción para el CRM interno y el motor de expedientes al inicio.

---

### Opción B. Microservicios

**Cuándo encaja**

- Gran volumen de usuarios.
- Equipos múltiples.
- Integraciones frecuentes.
- Crecimiento internacional.

**Ventajas**

- Escalado independiente.
- Despliegues aislados.
- Mejor separación de dominios.

**Inconvenientes**

- Mayor complejidad.
- Observabilidad obligatoria.
- Más coste DevOps.

> **Recomendación:** Muy útil para notificaciones, integraciones bancarias, documentos, IA, reporting y APIs externas.

---

### Opción C. Arquitectura orientada a eventos

**Cuándo encaja**

- Procesos asíncronos.
- Necesidad de desacoplar módulos.
- Trazabilidad de cambios.

**Ejemplos de eventos**

| Evento | Contexto |
|--------|----------|
| `LeadCreado` | Nuevo lead captado |
| `DocumentoSubido` | Documento aportado por el cliente |
| `ExpedienteValidado` | Expediente pasa validación interna |
| `OfertaRecibida` | Banco responde con una oferta |
| `FirmaCompletada` | Operación firmada y cerrada |

**Ventajas**

- Escalabilidad.
- Mejor desacoplamiento.
- Ideal para automatización.

**Inconvenientes**

- Mayor dificultad de depuración.
- Consistencia eventual.

> **Recomendación:** Ideal para notificaciones, integración con bancos y pipeline de expedientes.

---

### Opción D. Arquitectura hexagonal / clean architecture

**Cuándo encaja**

- Núcleo de negocio complejo.
- Necesidad de mantener reglas durante años.
- Cambio frecuente de infraestructura o proveedores.

**Ventajas**

- Dominio aislado.
- Alta testabilidad.
- Menor dependencia tecnológica.

> **Recomendación:** Muy adecuada para el core hipotecario.

---

## 5. Propuesta de arquitectura objetivo

Una opción realista y muy sólida para este tipo de empresa sería:

### Núcleo transaccional

**Monolito modular con clean architecture**

Incluye:

- CRM interno.
- Gestión de expedientes.
- Reglas de negocio.
- Usuarios y permisos.

### Servicios periféricos

**Microservicios o servicios desacoplados** para:

- Documentos.
- Notificaciones.
- Integraciones con bancos.
- Auditoría.
- Analítica/IA.

### Capa de integración

- API Gateway.
- Message broker.
- Webhooks.

### Capa analítica

- DWH/Lakehouse.
- ETL/ELT.
- Modelos de IA.

### Diagrama de alto nivel

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PORTAL DE CLIENTE                            │
│                    (SPA/SSR + BFF + Auth)                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    API GATEWAY       │
                    │  (Auth, Rate Limit,  │
                    │   Observabilidad)    │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
┌─────────▼──────────┐ ┌──────▼───────┐ ┌──────────▼──────────┐
│  NÚCLEO TRANSAC.   │ │  SERVICIOS   │ │  CAPA ANALÍTICA     │
│  (Monolito modular │ │  PERIFÉRICOS │ │                     │
│   Clean Arch)      │ │              │ │  - DWH / Lakehouse  │
│                    │ │  - Docs      │ │  - ETL / ELT        │
│  - CRM interno     │ │  - Notific.  │ │  - Modelos IA       │
│  - Expedientes     │ │  - Bancos    │ │  - Reporting / BI   │
│  - Reglas/Scoring  │ │  - Auditoría │ │                     │
│  - Usuarios/Roles  │ │  - IA/OCR    │ │                     │
└─────────┬──────────┘ └──────┬───────┘ └─────────────────────┘
          │                    │
          └────────┬───────────┘
                   │
          ┌────────▼────────┐
          │  MESSAGE BROKER  │
          │  (Eventos async) │
          └─────────────────┘
```

Esta combinación suele dar muy buen resultado porque equilibra:

- Rapidez de desarrollo.
- Escalabilidad.
- Control del dominio.
- Coste operativo.

---

## 6. Función de cada sistema dentro del flujo de negocio

### Flujo típico

#### 1. Captación

El cliente entra por portal, landing o captación comercial.

**Sistemas implicados:**

- Portal de cliente
- CRM

#### 2. Alta y preanálisis

Se recogen datos básicos y se realiza una primera valoración.

**Sistemas implicados:**

- Motor de reglas
- Scoring
- CRM

#### 3. Documentación

El usuario sube documentos y el sistema los clasifica.

**Sistemas implicados:**

- Gestor documental
- IA/OCR

#### 4. Validación interna

Un asesor revisa el expediente.

**Sistemas implicados:**

- CRM interno
- Motor de expedientes

#### 5. Envío a bancos

El expediente se transforma al formato de cada entidad.

**Sistemas implicados:**

- Plataforma de integración bancaria
- API Gateway
- Event bus

#### 6. Recepción de ofertas

Se reciben respuestas y se comparan condiciones.

**Sistemas implicados:**

- Motor de expedientes
- CRM
- Backoffice

#### 7. Comunicación al cliente

Se avisa al cliente, se solicitan pasos finales y se completan procesos.

**Sistemas implicados:**

- Notificaciones
- Portal de cliente

#### 8. Cierre y trazabilidad

Se registra el cierre, firma y auditoría completa.

**Sistemas implicados:**

- Core transaccional
- Auditoría
- Reporting

### Diagrama de flujo

```
Captación ──► Alta y preanálisis ──► Documentación ──► Validación interna
                                                              │
                                                              ▼
Cierre y trazabilidad ◄── Comunicación al cliente ◄── Recepción de ofertas ◄── Envío a bancos
```

---

## 7. Tecnologías habituales en una plataforma como esta

Sin entrar en una marca concreta, una plataforma de este tipo suele apoyarse en:

| Área | Tecnología |
|------|------------|
| Backend del core | PHP |
| Frontend y servicios auxiliares | JavaScript / TypeScript |
| APIs auxiliares, BFF o integraciones | Node.js |
| Base de datos transaccional | Bases de datos relacionales (MySQL, PostgreSQL) |
| Procesos asíncronos | Colas / brokers (RabbitMQ, Kafka, Redis Streams) |
| Almacenamiento de documentos | Object storage (S3, MinIO, Azure Blob) |
| Caché y sesiones | Redis |
| Despliegue | Docker y CI/CD |
| Observabilidad | Logs, métricas y trazas |
| Automatización documental | OCR / IA |

---

## 8. Qué papel jugaría alguien con experiencia en PHP, JS y Node.js

En una empresa con este perfil, una persona con experiencia en PHP y JavaScript, y valor añadido en Node.js, suele encajar especialmente bien en:

**Desarrollo y mantenimiento:**

- Desarrollo del core del CRM.
- Integración de APIs.
- Mantenimiento del motor de expedientes.
- Creación de módulos internos.
- BFF o servicios de apoyo.
- Automatización de procesos.
- Mejora de UX en el frontend.
- Adaptación de flujos para internacionalización.

**Si además entiende arquitectura, puede aportar mucho en:**

- Separación de capas.
- Diseño de APIs.
- Modelado de dominio.
- Consistencia de datos.
- Escalabilidad futura.

---

## 9. Conclusión ejecutiva

Para una empresa de CRM hipotecario que conecta clientes con bancos, la arquitectura más sensata no suele ser un único sistema, sino un **ecosistema de sistemas especializados**.

La propuesta más equilibrada es:

- **Núcleo transaccional modular** para el negocio principal.
- **Servicios desacoplados** para documentos, notificaciones, integraciones e IA.
- **API Gateway** como punto de control.
- **Arquitectura orientada a eventos** para automatización.
- **Capa analítica separada** para reporting e inteligencia.

Esto permite cubrir de forma robusta las funciones clave del negocio:

| Función | Sistema principal |
|---------|-------------------|
| Captar | Portal + CRM |
| Validar | Motor de reglas + Scoring |
| Documentar | Gestor documental + IA/OCR |
| Integrar | Plataforma bancaria + API Gateway |
| Comparar | Motor de expedientes + CRM |
| Notificar | Sistema de notificaciones |
| Auditar | Seguridad + Auditoría |
| Optimizar | Capa analítica + IA |
