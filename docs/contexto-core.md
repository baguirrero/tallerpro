# TallerPro — Contexto del core

Documento autocontenido del estado actual del sistema. Sirve para poner al día a
alguien (o a un asistente de IA) sin leer el código. Describe lo que **hay**, no
lo que se planea.

---

## 1. Qué es

Sistema de gestión de órdenes de servicio para un taller mecánico chico.
Proyecto final de la Especialización en Desarrollo Web Full Stack del DMC
Institute. Reemplaza el cuaderno y el WhatsApp con los que hoy se coordina qué
vehículo está en qué estado y cuánto trabajo tiene encima cada mecánico.

Flujo implementado hoy, punta a punta:

```
Asesor registra la ORDEN: escribe la placa y, si el auto ya vino antes,
se autocompletan sus datos y los del propietario
   └─> Jefe de taller la parte en TRABAJOS y los asigna a mecánicos
          └─> Mecánico mueve sus trabajos por el Kanban (PENDIENTE → EN_PROCESO → COMPLETADO)
                 └─> Sobre cada trabajo: COMENTARIOS y ADJUNTOS (fotos / PDF)
```

Es monotaller (no hay multi-tenancy) y monomoneda (PEN, locale `es-PE`).

---

## 2. Stack y topología

| Capa | Tecnología |
|---|---|
| Frontend | Angular 20 — standalone components, signals, rutas lazy, Bootstrap 5 |
| Backend | NestJS 11 + TypeORM 1.x |
| Base de datos | PostgreSQL 16 |
| Auth | JWT firmado a mano (`@nestjs/jwt`) + bcrypt(10) + guards por rol |
| Archivos | Multer en memoria detrás de una interfaz: disco en desarrollo, bucket S3 en producción |

Puertos en local: frontend `4200`, API `3001`, PostgreSQL `5434`, pgAdmin `5050`.
(3001 y 5434 en vez de 3000 y 5432 porque los estándar estaban ocupados.)

Despliegue: Render plan gratuito, tres servicios descritos en `render.yaml`
(`tallerpro-api`, `tallerpro-web`, `tallerpro-db`), recreables como Blueprint.
En producción la conexión llega por `DATABASE_URL` y `JWT_SECRET` lo genera
Render.

```
Angular (static) ──HTTP+JWT──> NestJS API ──TypeORM──> PostgreSQL
                                    └── AlmacenamientoArchivos
                                          ├── disco   (desarrollo, /uploads)
                                          └── bucket S3 (producción, URL firmada)
```

---

## 3. Modelo de dominio

```
VEHICULOS ──< ORDENES

USUARIOS ──┬── usuario_roles ── ROLES        (N:M)
           ├──< ORDENES (creado_por)
           │       └──< TRABAJOS
           │               ├──< COMENTARIOS
           │               └──< ADJUNTOS
           ├──< TRABAJOS (asignado_a, creado_por)
           ├──< COMENTARIOS (usuario_id)
           └──< ADJUNTOS (subido_por)
```

Todas las PK son UUID salvo `roles.id`, que es `SERIAL`.
`TRABAJOS`, `COMENTARIOS` y `ADJUNTOS` tienen `onDelete: CASCADE` hacia su padre.

### Entidades

**`usuarios`** — `username`(unique), `email`(unique), `password_hash`, `nombres`,
`apellidos`, `activo`, timestamps. N:M con roles vía `usuario_roles`.

**`roles`** — cuatro filas fijas, cargadas por el seed: `Administrador`,
`Jefe de Taller`, `Asesor de Servicio`, `Mecánico`. El nombre *es* la clave de
autorización: el JWT lleva los nombres, no los ids.

**`vehiculos`** — la identidad es la `placa`(unique), siempre normalizada.
Además `marca`, `modelo`, `anio`, y el propietario embebido
(`propietario_nombre`, `propietario_telefono`). Borrarlo con órdenes colgando
falla: la FK es `RESTRICT`.

**`ordenes`** — la unidad de trabajo: `numero_orden`(unique), `descripcion`,
`presupuesto`, `fecha_ingreso`, `fecha_entrega`, `estado`, y `vehiculo_id`.

**`trabajos`** — hija de orden. `titulo`, `descripcion`, `prioridad`, `estado`,
`fecha_limite`, `asignado_a`(nullable), `creado_por`.

**`comentarios`** — `contenido` (máx. 1000), cuelga de un trabajo.

**`adjuntos`** — `nombre_original` (lo que ve el usuario), `clave` (la identidad
del objeto en el almacenamiento: UUID + extensión), `tipo_mime`, `tamano`. Cuelga
de un trabajo. La API añade un campo calculado `url` en cada respuesta.

### Máquinas de estado

- **Orden:** `RECIBIDA` → `EN_PROCESO` → `FINALIZADA` se **derivan** de los
  trabajos; `ENTREGADA` y `CANCELADA` son acciones humanas con endpoint propio y
  son terminales. El campo `estado` no se puede mandar por el `PATCH` genérico.
- **Trabajo (columnas del Kanban):** `PENDIENTE` → `EN_PROCESO` → `COMPLETADO`.
  El movimiento es de a un paso, adelante o atrás, y lo impone el frontend
  (índice en el array de columnas), no el backend.
- **Prioridad:** `BAJA` · `MEDIA` · `ALTA`.

Los dos estados **están acoplados**: la derivación corre dentro de una
transacción que bloquea la fila de la orden cada vez que se crea, mueve o elimina
un trabajo. Sobre una orden terminal no se admite ningún cambio en sus trabajos
(`409`).

---

## 4. Seguridad y permisos

**Autenticación.** `JwtAuthGuard` propio (no Passport): lee el header
`Authorization: Bearer`, verifica con `JWT_SECRET` y deja el payload en
`request.user`. El payload es `{ sub, username, email, roles[] }`.
`JWT_EXPIRES_IN` va en **segundos** (7200 = 2 h) porque el tipo de `expiresIn`
en `@nestjs/jwt` no acepta un string arbitrario leído del `.env`.

No hay refresh token y el guard no vuelve a consultar la base: un usuario
desactivado sigue operando hasta que su token expire.

**Autorización.** `RolesGuard` + decorador `@Roles(...)` comparando contra los
nombres de rol del payload. Un endpoint sin `@Roles` queda abierto a *cualquier*
usuario autenticado.

El frontend replica la misma matriz en `rolesGuard` (rutas) y en
`TokenService.tieneRol()` (visibilidad de botones). Es UX, no seguridad: la
autoridad está en la API.

### Matriz de permisos

| Rol | Órdenes | Trabajos | Comentarios | Adjuntos | Usuarios |
|---|---|---|---|---|---|
| **Administrador** | CRUD completo | CRUD completo | Sí | Sí, puede eliminar | Listar, activar/desactivar |
| **Jefe de Taller** | Crear, editar, ver | Crear, asignar, editar, eliminar | Sí | Sí, puede eliminar | Ver mecánicos |
| **Asesor de Servicio** | Crear, editar, ver | Ver | Sí | Subir | Ver mecánicos |
| **Mecánico** | Ver | Ver, cambiar estado de los suyos | Sí | Subir | — |

**Regla de negocio principal** — la única regla real codificada:
un mecánico solo puede cambiar el estado de un trabajo **asignado a él**.
Administrador y Jefe de Taller pueden mover cualquiera. Vive en
`TrabajosService.actualizarEstado()` y devuelve `403`.

El registro público (`POST /auth/registro`) siempre crea al usuario con rol
**Mecánico**; no hay forma de auto-escalar privilegios.

---

## 5. API

Base local `http://localhost:3001`. Todo responde JSON. Validación global con
`ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`
— un campo de más en el body es `400`.

| Método | Ruta | Rol requerido |
|---|---|---|
| POST | `/auth/registro` | público (crea Mecánico) |
| POST | `/auth/login` | público |
| PATCH | `/auth/cambiar-password` | autenticado |
| GET | `/usuarios` | Administrador |
| GET | `/usuarios/mecanicos` | Admin, Jefe, Asesor |
| PATCH | `/usuarios/:id/estado` | Administrador |
| GET | `/vehiculos/placa/:placa` | autenticado (autocompletado; acepta cualquier formato) |
| GET | `/vehiculos/:id` | autenticado (ficha con historial) |
| GET | `/ordenes?estado=` | autenticado |
| GET | `/ordenes/estadisticas` | autenticado |
| GET | `/ordenes/:id` | autenticado |
| POST | `/ordenes` | Admin, Jefe, Asesor |
| PATCH | `/ordenes/:id` | Admin, Jefe, Asesor |
| PATCH | `/ordenes/:id/entregar` | Admin, Jefe, Asesor (solo desde `FINALIZADA`) |
| PATCH | `/ordenes/:id/cancelar` | Admin, Jefe (desde cualquier no terminal) |
| DELETE | `/ordenes/:id` | Administrador |
| GET | `/trabajos/mis-trabajos` | autenticado (los del token) |
| GET | `/trabajos/orden/:ordenId` | autenticado |
| POST | `/trabajos` | Admin, Jefe |
| PATCH | `/trabajos/:id` | Admin, Jefe |
| PATCH | `/trabajos/:id/estado` | autenticado + regla de asignación |
| DELETE | `/trabajos/:id` | Admin, Jefe |
| GET | `/comentarios/trabajo/:trabajoId` | autenticado |
| POST | `/comentarios/trabajo/:trabajoId` | autenticado |
| GET | `/adjuntos/trabajo/:trabajoId` | autenticado |
| POST | `/adjuntos/trabajo/:trabajoId` | autenticado (multipart, campo `archivo`) |
| DELETE | `/adjuntos/:id` | Admin, Jefe |
| GET | `/uploads/:clave` | solo con `STORAGE_DRIVER=disco`; en producción no existe |

`GET /ordenes/estadisticas` es el único QueryBuilder del proyecto: `COUNT`
agrupado por estado, más el total. Alimenta las tarjetas del dashboard.

Colección ejecutable en `docs/endpoints.http` (extensión REST Client).

---

## 6. Frontend

```
src/app/
├── core/
│   ├── guards/        authGuard (token presente), rolesGuard (data.roles)
│   ├── interceptors/  jwtInterceptor — añade Bearer solo a environment.apiUrl
│   ├── models/        interfaces + constantes de estados, etiquetas y colores
│   └── services/      auth, token, orden, trabajo, comentario, adjunto, usuario
├── shared/components/ navbar, spinner, badge-estado
└── features/          auth · dashboard · ordenes · trabajos · usuarios · perfil
```

Todas las rutas de `features` son `loadComponent` (lazy). Estado local con
**signals**; no hay NgRx ni store global. `TokenService` es el único estado
compartido: guarda token y usuario en `localStorage` y los expone como signals
(`estaAutenticado`, `usuario`, `rolPrincipal`, `nombreCompleto`), de modo que la
navbar y los guards reaccionan solos.

Pantallas: login, registro, dashboard (estadísticas + "mis trabajos"), lista de
órdenes con filtro por estado, formulario de orden (alta y edición comparten
componente), detalle de orden (datos + Kanban + alta de trabajo + panel de
trabajo con comentarios y adjuntos), lista de usuarios, cambio de contraseña.

El Kanban se mueve con botones `◀ ▶`, no arrastrando: el CDK de Angular no
entró en el temario del curso.

---

## 7. Decisiones e invariantes que no se ven en el código

Cosas que sorprenden si no se saben:

- **El esquema se administra con migraciones.** `synchronize: false` en las dos
  configuraciones y `migrationsRun: true` aplica lo pendiente al arrancar.
- **Las columnas `date` están tipadas como `string`**, no como `Date`. Guardadas
  como `Date`, `new Date('2026-07-27')` es medianoche UTC y en Perú (UTC-5)
  retrocede un día.
- **`presupuesto` lleva un `transformer`** en la columna. Las columnas `numeric`
  de PostgreSQL vuelven del driver como texto para no perder precisión; la API
  devolvía `"680.50"` y al editar la orden el formulario reenviaba ese string,
  que la validación `@IsNumber` rechazaba. El transformer lo convierte al leer.
- **La validación de archivos vive en el `fileFilter` de Multer**, no en
  `FileTypeValidator`. El motivo original fue que `FileTypeValidator` necesita el
  buffer y con `diskStorage` el archivo se escribía directo a disco; hoy Multer
  usa `memoryStorage` y el buffer sí está, pero el `fileFilter` se quedó porque
  rechaza antes de procesar nada. Límite: JPG/PNG/PDF, 5 MB.
- **La placa se guarda normalizada**: mayúsculas y solo letras y dígitos, así que
  `ABC-123` queda como `ABC123`. Una sola forma canónica, a costa del guion.
  Una placa conocida con datos distintos responde `409` con las diferencias en
  vez de reescribir el histórico.
- **`numero_orden` sale de la secuencia `ordenes_numero_seq`**, formateado como
  `ORD-000001`. Puede tener huecos: las secuencias no se revierten con la
  transacción.
- **La conexión local no lleva `ssl`**; la de producción sí
  (`rejectUnauthorized: false`), porque la base de Render es remota.
- **Locale `es-PE` registrado** en `app.config.ts` para que los pipes muestren
  `S/ 1,250.50` y no `PEN1250.50`.
- **El seed corre en `onModuleInit`** y es idempotente por conteo: si ya hay
  roles o usuarios, no hace nada. Crea los cuatro roles y cuatro usuarios de
  prueba, todos con contraseña `123456`.

### Limitaciones conocidas del plan gratuito de Render

- El servicio se duerme sin tráfico; la primera visita tarda ~1 minuto.
- El disco es efímero: los adjuntos se ven bien pero desaparecen en cada
  despliegue o reinicio. Lo que está en PostgreSQL sobrevive.
- Las bases gratuitas expiran a los 30 días de creadas.

---

## 8. Huecos

### Cerrados en la fase 0 (2026-08-08)

Migraciones en lugar de `synchronize`; correlativo por secuencia; estado de la
orden derivado de sus trabajos con transiciones validadas; `orden_id` fuera del
DTO de actualización de trabajo; adjuntos en almacenamiento externo, privados en
producción y sin dejar archivos huérfanos al borrar; claves foráneas
obligatorias.

### Abiertos

**Modelo**
- El cliente no es una entidad: vive dentro del vehículo como propietario, así
  que alguien con dos autos aparece dos veces. El vehículo sí es entidad desde la
  fase 1 y tiene historial por placa.
- No hay pantalla para editar un vehículo: una placa mal tipeada se corrige
  editando la orden con la placa buena, y el fantasma queda sin órdenes.
- Actualizar el propietario reescribe el dato; no queda registro de quién era el
  dueño cuando se hizo cada orden.
- El presupuesto es un número suelto: no hay ítems, ni costo real, ni aprobación
  del cliente, ni repuestos, ni facturación.
- No hay auditoría de quién cambió qué estado y cuándo (solo `updated_at`).

**Seguridad**
- Comentarios y adjuntos no comprueban pertenencia; cualquier usuario
  autenticado lee y escribe sobre cualquier trabajo.
- Un usuario desactivado conserva su sesión hasta que expire el token.

**Operación**
- Sin paginación en órdenes ni usuarios; sin índices sobre `placa`, `estado` o
  `asignado_a`.
- El interceptor no reacciona al `401`: el token vence y la app sigue mostrando
  errores hasta que se recarga.
- Sin Swagger, sin health check, sin logging estructurado.

---

## 9. Puesta en marcha

```bash
cp .env.example .env && docker compose up -d          # PostgreSQL + pgAdmin
cd backend  && npm install && cp ../.env.example .env && npm run start:dev
cd frontend && npm install && npm start
```

Usuarios de prueba, todos con contraseña `123456`:
`admin@taller.com` · `jefe@taller.com` · `asesor@taller.com` · `mecanico@taller.com`

Variables: `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`,
`JWT_SECRET`, `JWT_EXPIRES_IN`, y en producción `DATABASE_URL` y `CORS_ORIGIN`.
