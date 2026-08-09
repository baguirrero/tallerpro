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
Asesor registra la ORDEN (vehículo + cliente + presupuesto estimado)
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
| Archivos | Multer con `diskStorage` local, servidos por `ServeStaticModule` en `/uploads` |

Puertos en local: frontend `4200`, API `3001`, PostgreSQL `5434`, pgAdmin `5050`.
(3001 y 5434 en vez de 3000 y 5432 porque los estándar estaban ocupados.)

Despliegue: Render plan gratuito, tres servicios descritos en `render.yaml`
(`tallerpro-api`, `tallerpro-web`, `tallerpro-db`), recreables como Blueprint.
En producción la conexión llega por `DATABASE_URL` y `JWT_SECRET` lo genera
Render.

```
Angular (static) ──HTTP+JWT──> NestJS API ──TypeORM──> PostgreSQL
                                    └── /uploads (disco local, efímero en Render)
```

---

## 3. Modelo de dominio

```
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

**`ordenes`** — la unidad de trabajo. Mezcla tres cosas en una sola tabla:
- Servicio: `numero_orden`(unique), `descripcion`, `presupuesto`, `fecha_ingreso`, `fecha_entrega`, `estado`
- Vehículo: `placa`, `marca`, `modelo`, `anio`
- Cliente: `cliente_nombre`, `cliente_telefono`

**`trabajos`** — hija de orden. `titulo`, `descripcion`, `prioridad`, `estado`,
`fecha_limite`, `asignado_a`(nullable), `creado_por`.

**`comentarios`** — `contenido` (máx. 1000), cuelga de un trabajo.

**`adjuntos`** — `nombre_original`, `nombre_archivo` (UUID + extensión), `ruta`,
`tipo_mime`, `tamano`. Cuelga de un trabajo.

### Máquinas de estado

- **Orden:** `RECIBIDA` → `EN_PROCESO` → `FINALIZADA` → `ENTREGADA`, más `CANCELADA`.
  *No hay validación de transición*: el estado se manda como campo libre en el
  `PATCH` y se acepta cualquier valor del enum desde cualquier otro.
- **Trabajo (columnas del Kanban):** `PENDIENTE` → `EN_PROCESO` → `COMPLETADO`.
  El movimiento es de a un paso, adelante o atrás, y lo impone el frontend
  (índice en el array de columnas), no el backend.
- **Prioridad:** `BAJA` · `MEDIA` · `ALTA`.

Los dos estados **no están acoplados**: completar todos los trabajos de una orden
no cambia el estado de la orden. Alguien tiene que moverlo a mano.

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
| GET | `/ordenes?estado=` | autenticado |
| GET | `/ordenes/estadisticas` | autenticado |
| GET | `/ordenes/:id` | autenticado |
| POST | `/ordenes` | Admin, Jefe, Asesor |
| PATCH | `/ordenes/:id` | Admin, Jefe, Asesor |
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
| GET | `/uploads/:nombreArchivo` | **público, sin token** |

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

- **`synchronize: true`** en las dos configuraciones de TypeORM (local y
  producción). Las tablas se crean y alteran solas al arrancar. No hay
  migraciones.
- **Las columnas `date` están tipadas como `string`**, no como `Date`. Guardadas
  como `Date`, `new Date('2026-07-27')` es medianoche UTC y en Perú (UTC-5)
  retrocede un día.
- **`presupuesto` lleva un `transformer`** en la columna. Las columnas `numeric`
  de PostgreSQL vuelven del driver como texto para no perder precisión; la API
  devolvía `"680.50"` y al editar la orden el formulario reenviaba ese string,
  que la validación `@IsNumber` rechazaba. El transformer lo convierte al leer.
- **La validación de archivos vive en el `fileFilter` de Multer**, no en
  `FileTypeValidator`: ese necesita el buffer y con `diskStorage` el archivo se
  escribe directo a disco. El `fileFilter` además rechaza antes de escribir nada.
  Límite: JPG/PNG/PDF, 5 MB.
- **`numero_orden` se genera con `COUNT(*) + 1`** formateado como `ORD-0001`.
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

## 8. Huecos conocidos

Inventario honesto de lo que falta, para que nadie lo descubra a los golpes.

**Modelo**
- Cliente y vehículo no son entidades: van desnormalizados dentro de la orden.
  El mismo cliente con tres visitas son tres registros; no hay historial por placa.
- El estado de la orden y el de sus trabajos son independientes.
- El presupuesto es un número suelto: no hay ítems, ni costo real, ni aprobación
  del cliente, ni repuestos, ni facturación.
- No hay auditoría de quién cambió qué estado y cuándo (solo `updated_at`).

**Correctitud**
- `numero_orden` por `COUNT(*)+1` se rompe con concurrencia y se repite si se
  elimina una orden → choca contra el índice único.
- `PATCH /ordenes/:id` acepta cualquier `estado` del enum sin validar la
  transición: se puede saltar de `RECIBIDA` a `ENTREGADA`.
- `ActualizarTrabajoDto` hereda `orden_id`, así que un trabajo puede mudarse de
  orden por accidente.
- Al asignar un trabajo no se verifica que el usuario exista ni que sea mecánico;
  un id inválido revienta como error de FK (500) en vez de 400.
- `DELETE /ordenes/:id` borra en cascada trabajos, comentarios y adjuntos, pero
  **no borra los archivos del disco**.

**Seguridad**
- `/uploads/*` es público: con el nombre del archivo se accede sin token.
- Comentarios y adjuntos no comprueban pertenencia; cualquier usuario
  autenticado lee y escribe sobre cualquier trabajo.
- Un usuario desactivado conserva su sesión hasta que expire el token.
- `synchronize: true` en producción puede provocar pérdida de datos ante un
  cambio de entidad.

**Operación**
- Sin paginación en órdenes ni usuarios; sin índices sobre `placa`, `estado` o
  `asignado_a`.
- El interceptor no reacciona al `401`: el token vence y la app sigue mostrando
  errores hasta que se recarga.
- Sin Swagger, sin health check, sin logging estructurado.
- Los dos tests que vienen del andamiaje están obsoletos y fallan: el e2e espera
  un `GET /` con `"Hello World!"` que no existe, y `app.spec.ts` busca un `<h1>`
  con `"Hello, frontend"` que ya no está en `app.html`. No hay ninguna prueba de
  las reglas de negocio.

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
