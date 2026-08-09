# Fase 0 — Diseño

**Fecha:** 2026-08-08
**Estado:** aprobado, listo para plan de implementación

---

## 1. Objetivo

TallerPro va camino a usarse en un taller real. Antes de seguir agregando
funcionalidad hay que arreglar cuatro cosas de la base que, con datos de
verdad, causan pérdida de información o estados incoherentes:

1. El esquema se administra con `synchronize: true`, también en producción.
2. `numero_orden` se genera con `COUNT(*) + 1`, que se repite y choca contra su
   índice único.
3. El estado de la orden va suelto del de sus trabajos y admite cualquier salto.
4. Los adjuntos viven en un disco efímero y desaparecen en cada despliegue.

Esta fase no agrega funcionalidad de negocio nueva. Deja la base en condiciones
de recibirla.

## 2. Decisiones tomadas

| Pregunta | Decisión |
|---|---|
| Destino del proyecto | Camino a producto real |
| Base desplegada en Render | Desechable: la migración inicial crea el esquema desde cero |
| Almacenamiento de archivos | Compatible con S3 (`@aws-sdk/client-s3`), configurable por endpoint |
| Estado de la orden | Híbrido: el avance en taller se deriva de los trabajos, la entrega y la cancelación son manuales |
| Forma de entrega | Cuatro cortes independientes, en orden de dependencia |

## 3. Alcance

**Dentro**

- Migraciones de TypeORM y `synchronize: false`.
- Correlativo de orden por secuencia de PostgreSQL.
- Máquina de estados de la orden, acoplada a los trabajos.
- Almacenamiento de adjuntos detrás de una interfaz, con driver de disco y
  driver S3.
- Tres arreglos que caen en el camino: adjuntos privados en producción, borrado
  sin archivos huérfanos, y `orden_id` fuera de `ActualizarTrabajoDto`.
- Reemplazo de los dos tests obsoletos del andamiaje por pruebas de las reglas
  reales.

**Fuera** (queda para fases siguientes)

- Paginación e índices.
- Swagger, health check, logging estructurado.
- Manejo de `401` en el interceptor del frontend.
- Cliente y vehículo como entidades, cotización, aprobación del cliente.
- Refresh token y revalidación de `activo` contra la base.

## 4. Orden de entrega

Cada corte es un commit que deja el sistema funcionando y desplegable.

1. Migraciones
2. Correlativo
3. Máquina de estados
4. Almacenamiento

El orden no es negociable: los cortes 2, 3 y 4 modifican el esquema, y sin
migraciones cada uno se aplicaría con `synchronize`, que es justo lo que se
viene a eliminar.

---

## 5. Corte 1 — Migraciones

### Archivos nuevos

**`backend/src/data-source.ts`** — `DataSource` que consume únicamente el CLI de
TypeORM. Existe porque el CLI no puede resolver `autoLoadEntities`, que depende
del contenedor de Nest, y necesita globs explícitos:

```
entities:   ['src/**/*.entity.ts']
migrations: ['src/migrations/*.ts']
```

Lee el `.env` con `dotenv` y respeta la misma bifurcación que `app.module.ts`:
si existe `DATABASE_URL` la usa con `ssl: { rejectUnauthorized: false }`; si no,
arma la conexión con `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`.

**`backend/src/migrations/<timestamp>-EsquemaInicial.ts`** — generada contra una
base vacía. Contiene el esquema completo actual: `usuarios`, `roles`,
`usuario_roles`, `ordenes`, `trabajos`, `comentarios`, `adjuntos`, con sus
claves foráneas y sus `ON DELETE CASCADE`.

### Cambios

**`backend/src/app.module.ts`** — en las dos ramas del `useFactory`:

```
synchronize:    false
migrations:     [__dirname + '/migrations/*.js']
migrationsRun:  true
```

Un solo glob sirve para desarrollo y producción porque `nest start` también
ejecuta desde `dist/`. `migrationsRun: true` aplica lo pendiente al arrancar,
así Render no necesita un paso de build adicional.

**`backend/package.json`** — agregar `dotenv` a `devDependencies` (hoy llega de
rebote como dependencia transitiva de `@nestjs/config`, y depender de eso es
frágil), y los scripts:

```
"typeorm":            "typeorm-ts-node-commonjs -d src/data-source.ts"
"migration:generate": "npm run typeorm -- migration:generate"
"migration:run":      "npm run typeorm -- migration:run"
"migration:revert":   "npm run typeorm -- migration:revert"
"migration:show":     "npm run typeorm -- migration:show"
```

Uso: `npm run migration:generate -- src/migrations/EsquemaInicial`.

Verificado: TypeORM 1.1.0 conserva estos comandos y el binario
`typeorm-ts-node-commonjs`; `ts-node ^10.9.2` ya está en `devDependencies`.

### Notas

El seed no se toca. TypeORM aplica las migraciones al inicializar el
`DataSource`, lo que ocurre antes de que los módulos disparen `onModuleInit`,
así que `SeedService` sigue encontrando las tablas creadas.

La base de Render debe recrearse: su esquema lo creó `synchronize` y no existe
la tabla `migrations`, de modo que el primer `migration:run` intentaría crear
tablas que ya están. Procedimiento: borrar la base, arrancar la API, dejar que
corra la migración inicial y que el seed cargue roles y usuarios.

### Criterios de aceptación

- `npm run migration:show` lista la migración inicial.
- Contra una base vacía, arrancar la API crea todas las tablas y el seed carga
  los cuatro roles y los cuatro usuarios.
- `grep -r "synchronize: true" backend/src` no devuelve nada.

---

## 6. Corte 2 — Correlativo de orden

### Migración `CrearSecuenciaNumeroOrden`

```sql
CREATE SEQUENCE ordenes_numero_seq;
SELECT setval('ordenes_numero_seq', COALESCE(
  (SELECT MAX(NULLIF(regexp_replace(numero_orden, '\D', '', 'g'), '')::bigint)
   FROM ordenes), 0
) + 1, false);
```

El `setval` arranca la secuencia por encima del máximo existente, de modo que la
migración es segura aunque se aplique sobre una base con datos. `down` hace
`DROP SEQUENCE`.

### Cambio en `OrdenesService`

`generarNumeroOrden()` deja de contar filas y pide el siguiente valor a la
secuencia, usando el `manager` del repositorio para que viaje por la misma
conexión:

```
SELECT nextval('ordenes_numero_seq')  →  ORD-000001
```

Formato: `ORD-` más el valor con `padStart(6, '0')`. Contador global, sin
reinicio anual.

### Notas

Las secuencias de PostgreSQL son atómicas y no se bloquean entre sí, así que dos
altas simultáneas nunca producen el mismo número. No se revierten con la
transacción: si una alta falla, ese número queda saltado. Para órdenes de taller
es aceptable y hasta informativo. Si en el futuro se emite facturación
electrónica, la numeración fiscal necesita otro mecanismo, sin huecos.

### Criterios de aceptación

- Crear tres órdenes produce `ORD-000001`, `ORD-000002`, `ORD-000003`.
- Eliminar la última y crear otra produce `ORD-000004`, no un duplicado.

---

## 7. Corte 3 — Máquina de estados de la orden

### Lógica pura

**`backend/src/ordenes/estado-orden.ts`** — sin Nest, sin TypeORM, solo
funciones. Es lo que permite probar la regla sin levantar una base.

```ts
derivarEstado(estadosDeTrabajos: EstadoTrabajo[]): EstadoOrden
esTerminal(estado: EstadoOrden): boolean
puedeEntregar(estado: EstadoOrden): boolean
puedeCancelar(estado: EstadoOrden): boolean
```

Tabla de derivación:

| Trabajos de la orden | Estado derivado |
|---|---|
| ninguno, o todos en `PENDIENTE` | `RECIBIDA` |
| todos en `COMPLETADO` | `FINALIZADA` |
| cualquier otra combinación | `EN_PROCESO` |

Las tres reglas se evalúan en ese orden, de modo que `[PENDIENTE, COMPLETADO]`
—parte del trabajo hecho, parte sin empezar— cae en `EN_PROCESO`.

`ENTREGADA` y `CANCELADA` son terminales: `derivarEstado` no se invoca sobre una
orden que ya está en uno de esos estados. Sin esa salvaguarda, reabrir un
trabajo devolvería a `EN_PROCESO` una orden que el cliente ya se llevó.

De ahí se desprende una segunda regla: **sobre una orden terminal no se crean,
editan, mueven ni eliminan trabajos** → `409`.

Esa regla alcanza a los trabajos, no a la orden. `DELETE /ordenes/:id` sigue
permitido en cualquier estado, incluidos los terminales: es la vía del
administrador para dar de baja un registro completo, y arrastra en cascada sus
trabajos, comentarios y adjuntos.

Transiciones manuales:

| Desde | Acción | Hacia | Roles |
|---|---|---|---|
| `FINALIZADA` | entregar | `ENTREGADA` | Administrador, Jefe de Taller, Asesor |
| cualquier no terminal | cancelar | `CANCELADA` | Administrador, Jefe de Taller |

### Dónde se dispara la derivación

En `TrabajosService`, en los tres puntos que alteran el conjunto de trabajos de
una orden: `crear`, `actualizarEstado` y `eliminar`.

Las tres operaciones pasan a ejecutarse dentro de una transacción que empieza
tomando la fila de la orden con `SELECT ... FOR UPDATE`. Sin ese bloqueo hay una
carrera real: si dos mecánicos completan los dos últimos trabajos a la vez, cada
transacción ve al otro trabajo todavía sin terminar, ambas concluyen "sigue en
proceso" y la orden queda en `EN_PROCESO` con todo completado. Bloquear la fila
de la orden serializa el cálculo.

Secuencia dentro de la transacción:

1. `SELECT ... FOR UPDATE` sobre la orden.
2. Si la orden es terminal → `409`.
3. Aplicar el cambio sobre el trabajo (incluida la regla de asignación
   existente, que sigue devolviendo `403`).
4. Releer los estados de todos los trabajos de la orden.
5. `derivarEstado(...)`; si difiere del estado actual, actualizar la orden.

### API

Dos acciones explícitas reemplazan al campo:

```
PATCH /ordenes/:id/entregar    Administrador · Jefe de Taller · Asesor
PATCH /ordenes/:id/cancelar    Administrador · Jefe de Taller
```

Y **`estado` sale de `ActualizarOrdenDto`**. Con `forbidNonWhitelisted: true`,
mandarlo pasa a ser `400`, lo que cierra el salto de `RECIBIDA` a `ENTREGADA`
por el PATCH genérico.

Una transición inválida responde **`409 Conflict`**, no `400`: el cuerpo del
request es válido; lo que no admite la operación es el estado del recurso.

**`ActualizarTrabajoDto`** pasa a `OmitType(CrearTrabajoDto, ['orden_id'])`. Un
trabajo que se mudara de orden dejaría mal derivadas a las dos.

### Frontend

- **`formulario-orden.ts`** — quitar `estado` del `FormGroup`, quitar la línea
  `datos.estado = valores.estado` de la rama de edición, y borrar el `<select
  id="estado">` de `formulario-orden.html` (líneas 117-121). Quedan sin uso
  `ESTADOS_ORDEN` y `ETIQUETA_ESTADO_ORDEN` en ese componente: se retiran los
  imports.
- **`detalle-orden.html`** — junto al badge de estado (línea 13), botones
  "Entregar" y "Cancelar", visibles según rol y estado según las mismas reglas
  que aplica la API. `detalle-orden.ts` gana los métodos correspondientes y
  recarga la orden tras cada acción.
- **`orden.ts` (servicio)** — métodos `entregar(id)` y `cancelar(id)`.
- **`detalle-orden.ts`** — al recibir el evento del Kanban, recargar la orden
  para que el badge siga al tablero.
- **`tablero-kanban.ts`** — emitir un evento tras un cambio de estado exitoso
  para disparar esa recarga.

### Criterios de aceptación

- Completar todos los trabajos de una orden la deja en `FINALIZADA` sin
  intervención.
- Reabrir un trabajo de una orden `FINALIZADA` la devuelve a `EN_PROCESO`.
- Una orden sin trabajos permanece en `RECIBIDA`.
- Entregar desde `RECIBIDA` responde `409`.
- Mover un trabajo de una orden `ENTREGADA` responde `409`.
- Un mecánico que mueve un trabajo ajeno sigue recibiendo `403`.
- Mandar `estado` en `PATCH /ordenes/:id` responde `400`.

---

## 8. Corte 4 — Almacenamiento de adjuntos

### Interfaz

**`backend/src/almacenamiento/almacenamiento.interface.ts`**

```ts
interface AlmacenamientoArchivos {
  guardar(archivo: { buffer: Buffer; nombreOriginal: string; mime: string })
    : Promise<{ clave: string }>
  eliminar(clave: string): Promise<void>
  obtenerUrl(clave: string): Promise<string>
}
```

Token de inyección `ALMACENAMIENTO`.

### Implementaciones

**`AlmacenamientoDisco`** — escribe en `./uploads` con nombre `randomUUID() +
extensión`, igual que hoy. `obtenerUrl` devuelve `<API_URL>/uploads/<clave>`.
Para desarrollo.

**`AlmacenamientoS3`** — `@aws-sdk/client-s3` para `PutObject` y `DeleteObject`,
`@aws-sdk/s3-request-presigner` para `obtenerUrl`, que genera una URL firmada
con **5 minutos** de vigencia. Para producción.

**`AlmacenamientoModule`** elige la implementación con un provider factory según
`STORAGE_DRIVER` (`disco` | `s3`), y la exporta.

### Variables de entorno nuevas

```
STORAGE_DRIVER=disco            # disco | s3
S3_ENDPOINT=                    # lo que permite apuntar a R2, Supabase o MinIO
S3_REGION=auto
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
```

Se documentan en `.env.example`. En `render.yaml`, el servicio `tallerpro-api`
recibe `STORAGE_DRIVER=s3` y las credenciales como variables sincronizadas
manualmente (`sync: false`), para no versionar secretos.

### Cambios que arrastra

**Multer pasa a `memoryStorage()`.** Es la única forma de que el buffer llegue
al servicio en vez de escribirse en disco. El `fileFilter` se queda igual —sigue
siendo el lugar correcto y sigue rechazando antes de procesar— y el límite de
5 MB también, que ahora además acota cuánta memoria puede ocupar un request.

**La columna `ruta` pasa a llamarse `clave` y `nombre_archivo` desaparece.**
Migración `AdjuntosClaveDeObjeto`: renombra `ruta` a `clave` y elimina
`nombre_archivo`. Las dos columnas guardaban variantes de lo mismo —el nombre
generado y la ruta en disco— y con la abstracción de almacenamiento la única
identidad que importa es la clave del objeto. `nombre_original` se queda: es lo
que el usuario ve. Sin migración de datos, la base es desechable. Se actualiza
la entidad `Adjunto`, el `select` de `AdjuntosService.obtenerPorTrabajo` y el
modelo del frontend.

**Los adjuntos dejan de ser públicos en producción.** `ServeStaticModule` se
monta condicionalmente, solo cuando `STORAGE_DRIVER=disco`. Con el driver S3 la
ruta `/uploads` no existe y todo acceso pasa por URL firmada. Esto cierra, sin
trabajo extra, el hueco de que hoy cualquiera con la URL ve las fotos del
vehículo de un cliente.

**La URL viaja dentro del adjunto.** `GET /adjuntos/trabajo/:trabajoId` y
`POST /adjuntos/trabajo/:trabajoId` incluyen un campo `url` ya resuelto en cada
elemento. No se agrega un endpoint aparte: el template usa un `<a href>` simple,
sin imágenes inline, así que resolver en el listado evita una petición por
archivo y el bloqueo de ventanas emergentes que traería resolver al hacer clic.
Firmar es un cálculo local del SDK, sin viaje a S3, de modo que hacerlo por
elemento es barato. Cinco minutos alcanzan de sobra para una lista que el
usuario está mirando; si expira, recarga.

**Borrado sin huérfanos.** `AdjuntosService` gana `eliminarPorTrabajos(ids)`.
`TrabajosService.eliminar()` recoge los adjuntos del trabajo y los borra del
almacenamiento dentro de la transacción que ya introdujo el corte 3.
`OrdenesService.eliminar()` no era transaccional y pasa a serlo en este corte:
recoge los adjuntos de todos los trabajos de la orden, los borra del
almacenamiento y recién entonces elimina la orden. Si el borrado remoto falla se
registra con el `Logger` y se continúa: un objeto huérfano es un problema menor
que una orden que no se puede eliminar.

### Frontend

- **`adjunto.model.ts`** — el campo `nombre_archivo` se reemplaza por `url`.
- **`adjunto.ts` (servicio)** — desaparece `obtenerUrl(nombreArchivo)`.
- **`detalle-trabajo.ts`** — desaparece el método `obtenerUrl`.
- **`detalle-trabajo.html`** (línea 61) — `[href]="adjunto.url"`.

### Criterios de aceptación

- Con `STORAGE_DRIVER=disco`, subir, listar, abrir y eliminar un adjunto
  funciona igual que hoy.
- Con `STORAGE_DRIVER=s3` apuntando a un bucket de prueba, el archivo llega al
  bucket y la URL del listado lo abre.
- Con `STORAGE_DRIVER=s3`, `GET /uploads/<clave>` responde `404`.
- Eliminar un trabajo o una orden deja el almacenamiento sin objetos huérfanos.
- Subir un `.exe` o un archivo de 6 MB sigue siendo rechazado.

---

## 9. Pruebas

Se eliminan los dos specs del andamiaje. `backend/test/app.e2e-spec.ts` espera
un `GET /` que devuelva `"Hello World!"`, y no existe ningún `AppController` en
el proyecto. `frontend/src/app/app.spec.ts` busca un `<h1>` con
`"Hello, frontend"` que ya no está en `app.html`. Ninguno prueba nada propio y
los dos fallan.

En su lugar:

| Qué | Dónde | Cubre |
|---|---|---|
| `estado-orden.spec.ts` | backend, unitario | Tabla de derivación completa; transiciones legales e ilegales; estados terminales |
| `trabajos.service.spec.ts` | backend, unitario | Regla de asignación (`403`); rechazo sobre orden terminal (`409`) |
| `almacenamiento-disco.spec.ts` | backend, unitario | Guardar, obtener URL y eliminar contra un directorio temporal |
| `flujo-orden.e2e-spec.ts` | backend, e2e | Login → crear orden → crear trabajo → completarlo → orden `FINALIZADA` → entregar → `409` al intentar mover el trabajo |

Las pruebas unitarias del estado no tocan la base: por eso la lógica vive en un
módulo puro.

**Verificación manual al cierre.** Base desde cero, `migration:run`, seed, y el
recorrido completo con los cuatro usuarios de prueba: el asesor registra una
orden, el jefe la parte en trabajos y los asigna, el mecánico los mueve, y se
comprueba que el estado de la orden acompaña y que los adjuntos sobreviven a un
reinicio del servicio.

---

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| La migración inicial generada no reproduce fielmente lo que creó `synchronize` | Generarla contra una base vacía y comparar con `docs/modelo-er.md`, que documenta el esquema esperado |
| El bloqueo `FOR UPDATE` introduce contención | El bloqueo es por orden, no global, y las transacciones son cortas. El volumen de un taller no lo justifica como problema |
| `memoryStorage` expone a agotar memoria con subidas grandes | El límite de 5 MB de Multer se aplica antes de leer el cuerpo completo |
| Credenciales de S3 versionadas por accidente | En `render.yaml` van como `sync: false`; en local, en `.env`, que ya está en `.gitignore` |
| Romper la demo desplegada a mitad de camino | Cada corte se despliega y se verifica por separado |
