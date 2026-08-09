# Fase 1 — Diseño

**Fecha:** 2026-08-08
**Estado:** aprobado, listo para plan de implementación
**Antecedente:** [`2026-08-08-fase-0-design.md`](2026-08-08-fase-0-design.md)

---

## 1. Objetivo

Hoy los datos del vehículo y del cliente viven desnormalizados dentro de
`ordenes`: `placa`, `marca`, `modelo`, `anio`, `cliente_nombre` y
`cliente_telefono`. El mismo auto que vuelve al taller tres veces son tres
registros sin relación entre sí, así que **no existe el historial por placa**,
que es justo lo que un mecánico necesita antes de meter mano.

Esta fase extrae el vehículo como entidad propia y cuelga las órdenes de él. El
resultado que se busca: escribir una placa conocida en el formulario de orden
autocompleta los datos y ofrece ver todo lo que se le hizo antes a ese auto.

## 2. Decisiones tomadas

| Pregunta | Decisión |
|---|---|
| Qué desbloquear primero | El historial técnico del vehículo. El peso del modelo va en `Vehiculo` |
| Dónde vive el dato del cliente | En el vehículo, como propietario. `Cliente` no se crea todavía |
| Placa conocida con datos distintos | Avisar y dejar elegir: `409` con las diferencias, salvo confirmación explícita |
| Pantallas | Autocompletado por placa en el formulario de orden, y ficha de vehículo con historial |
| Cómo resuelve el vehículo la orden | La orden lleva los datos y el backend hace find-or-create |

## 3. Alcance

**Dentro**

- Entidad `Vehiculo` y migración con backfill desde las órdenes existentes.
- `ordenes.vehiculo_id` en lugar de los seis campos desnormalizados.
- Find-or-create del vehículo al crear y al editar una orden, con detección de
  conflicto.
- `GET /vehiculos/placa/:placa` y `GET /vehiculos/:id`.
- Autocompletado por placa en el formulario de orden y diálogo de conflicto.
- Ficha de vehículo con historial de órdenes.

**Fuera** (queda para fases siguientes)

- `Cliente` como entidad. Un cliente con dos autos sigue apareciendo dos veces.
- Sección de vehículos en el menú, con listado y edición.
- `POST`, `PATCH` y `DELETE` de vehículos como endpoints propios.
- Cotización, aprobación del cliente, repuestos, facturación.
- Paginación, Swagger, manejo de `401` en el interceptor.

## 4. Modelo y migración

### Entidad `Vehiculo`

Tabla `vehiculos`:

| Columna | Tipo | Nota |
|---|---|---|
| `id` | UUID | PK |
| `placa` | `varchar(10)` | **único**, normalizada: mayúsculas y solo letras y dígitos |
| `marca` | `varchar(50)` | obligatoria |
| `modelo` | `varchar(50)` | obligatorio |
| `anio` | `int` | opcional |
| `propietario_nombre` | `varchar(150)` | obligatorio |
| `propietario_telefono` | `varchar(20)` | obligatorio |
| `created_at` / `updated_at` | timestamp | |

`ordenes` pierde `placa`, `marca`, `modelo`, `anio`, `cliente_nombre` y
`cliente_telefono`, y gana `vehiculo_id` (UUID, `NOT NULL`).

La relación es `@ManyToOne` con **`onDelete: 'RESTRICT'`**. Es deliberadamente lo
contrario de lo que hacen `trabajos`, `comentarios` y `adjuntos`: borrar un
vehículo que tiene historial debe fallar, no llevarse las órdenes por delante.

```
VEHICULOS ──< ORDENES ──< TRABAJOS ──┬──< COMENTARIOS
                                     └──< ADJUNTOS
```

### Migración `ExtraerVehiculos`

Un solo archivo, en este orden. El backfill importa aunque hoy la base esté
vacía: si el proyecto ya se desplegó, ahí sí hay filas.

1. `CREATE TABLE vehiculos (...)` con el índice único sobre `placa`.
2. Poblar desde las órdenes, una fila por placa normalizada:

```sql
INSERT INTO vehiculos (id, placa, marca, modelo, anio,
                       propietario_nombre, propietario_telefono, created_at, updated_at)
SELECT DISTINCT ON (upper(regexp_replace(placa, '[^A-Za-z0-9]', '', 'g')))
       gen_random_uuid(), upper(regexp_replace(placa, '[^A-Za-z0-9]', '', 'g')),
       marca, modelo, anio, cliente_nombre, cliente_telefono, now(), now()
FROM ordenes
ORDER BY upper(regexp_replace(placa, '[^A-Za-z0-9]', '', 'g')), created_at DESC;
```

3. `ALTER TABLE ordenes ADD COLUMN vehiculo_id uuid` (nullable por ahora).
4. Enlazar:

```sql
UPDATE ordenes o SET vehiculo_id = v.id
FROM vehiculos v
WHERE v.placa = upper(regexp_replace(o.placa, '[^A-Za-z0-9]', '', 'g'));
```

5. `ALTER COLUMN vehiculo_id SET NOT NULL` y la clave foránea con `RESTRICT`.
6. `DROP COLUMN` de los seis campos viejos.

Cuando una placa aparece en varias órdenes con datos distintos, **gana la orden
más reciente** (`created_at DESC` en el `DISTINCT ON`).

`down()` recorre el camino inverso: devuelve las seis columnas, las repuebla
desde `vehiculos`, y elimina `vehiculo_id` y la tabla.

`gen_random_uuid()` es nativa desde PostgreSQL 13; aquí corre 16, así que no hace
falta `pgcrypto`.

## 5. API

### Lógica pura

Dos módulos sin Nest ni TypeORM, siguiendo el patrón que la fase 0 estableció con
`estado-orden.ts` y `numero-orden.ts`:

**`vehiculos/placa.ts`**

```ts
normalizarPlaca(valor: string): string
```

Pasa a mayúsculas y descarta todo lo que no sea letra o dígito, de modo que
`abc-123`, `ABC 123` y `abc123` sean el mismo auto. **La placa se guarda y se
muestra ya normalizada**: `ABC-123` queda como `ABC123`. Es una decisión
consciente — una sola forma canónica en toda la aplicación, sin una segunda
columna ni un índice sobre expresión — a costa de perder el guion que trae
impresa la placa peruana.

**`vehiculos/comparar-vehiculo.ts`**

```ts
interface Diferencia { campo: string; guardado: unknown; enviado: unknown }
compararVehiculo(guardado: DatosVehiculo, enviado: Partial<DatosVehiculo>): Diferencia[]
```

Compara `marca`, `modelo`, `anio`, `propietario_nombre` y `propietario_telefono`.
**Un campo ausente en `enviado` no es una diferencia**: que el asesor deje el año
vacío no significa "bórrale el año al vehículo". `placa` no se compara nunca —
es la identidad, y es lo que se usó para encontrar el registro.

### Endpoints nuevos

Los dos son de lectura y para cualquier usuario autenticado, igual que las
consultas de órdenes.

| Método | Ruta | Devuelve |
|---|---|---|
| GET | `/vehiculos/placa/:placa` | El vehículo, o `404`. Sin historial |
| GET | `/vehiculos/:id` | El vehículo más su historial de órdenes |

Están separados a propósito: el primero se llama en cada tecleo del campo de
placa y no tiene por qué arrastrar el historial.

**No hay `POST`, `PATCH` ni `DELETE` de vehículos.** Un vehículo se crea y se
actualiza como efecto de crear o editar una orden, operación que ya está limitada
a Administrador, Jefe de Taller y Asesor. Así no se agrega superficie de permisos.

### DTOs de orden

`CrearOrdenDto` conserva `placa`, `marca`, `modelo` y `anio`; renombra
`cliente_nombre` y `cliente_telefono` a `propietario_nombre` y
`propietario_telefono` para que coincidan con las columnas del vehículo; y suma:

```ts
@IsOptional() @IsBoolean()
actualizar_vehiculo?: boolean;
```

`ActualizarOrdenDto` mantiene esos campos con la misma semántica. Eso permite
corregir una orden registrada con la placa equivocada: se edita con la placa
buena y la orden se muda al vehículo correcto.

### Resolución del vehículo

`VehiculosService.resolverParaOrden(datos, actualizar, manager)`:

1. Normaliza la placa.
2. Busca el vehículo por placa.
3. Si no existe, lo crea con los datos recibidos y lo devuelve.
4. Si existe, corre `compararVehiculo`. Sin diferencias, lo devuelve tal cual.
5. Con diferencias y `actualizar !== true`, lanza `ConflictException` con el
   detalle.
6. Con diferencias y `actualizar === true`, aplica los campos enviados y lo
   devuelve.

Cuerpo del `409`:

```json
{
  "statusCode": 409,
  "message": "La placa ABC-123 ya está registrada con datos distintos",
  "diferencias": [
    { "campo": "modelo", "guardado": "Yaris", "enviado": "Corolla" },
    { "campo": "propietario_nombre", "guardado": "Rosa Delgado", "enviado": "Juan Pérez" }
  ]
}
```

`OrdenesService.crear` y `.actualizar` invocan la resolución **dentro de la misma
transacción** que escribe la orden, para que una orden que falla no deje un
vehículo huérfano.

### Consultas que se adaptan

`OrdenesService.obtenerTodas` y `.obtenerPorId` incorporan la relación
`vehiculo` a sus `relations` y `select`, que hoy listan los campos planos.

## 6. Frontend

### Formulario de orden

El campo de placa consulta `GET /vehiculos/placa/:placa` **400 ms después** de
que el usuario deja de teclear. Si la placa es conocida:

- Se autocompletan marca, modelo, año y los datos del propietario.
- Aparece un aviso discreto — *"Vehículo conocido · 3 órdenes previas"* — con
  enlace a la ficha.

Si el asesor modifica algo autocompletado y guarda, la API responde `409` y se
abre un diálogo que muestra qué cambió, con dos salidas:

- **Actualizar el vehículo** — reenvía la misma orden con `actualizar_vehiculo: true`.
- **Corregir** — cierra el diálogo y devuelve el foco al formulario.

El diálogo se dispara con la respuesta del backend, no con una comparación hecha
en el cliente: así la regla vive en un solo sitio y un cliente desactualizado no
puede pisar datos en silencio.

### Ficha de vehículo

Ruta nueva `/vehiculos/:id`, componente `ficha-vehiculo`, cargada de forma
diferida como el resto. Muestra los datos del auto y del propietario, y una tabla
con su historial de órdenes: número, fecha de ingreso, estado y descripción, cada
fila enlazada a su orden. Se llega desde el detalle de orden y desde el aviso del
formulario.

### Lo que se adapta

- `detalle-orden`: el bloque "Vehículo" lee `orden.vehiculo.*` y gana el enlace
  al historial.
- `lista-ordenes` y `dashboard`: leen `orden.vehiculo.placa`.
- `core/models`: se agrega `Vehiculo`; `Orden` cambia sus seis campos por la
  relación.
- `core/services`: se agrega `VehiculoService`.

## 7. Pruebas

| Qué | Dónde | Cubre |
|---|---|---|
| `placa.spec.ts` | backend, unitario | Minúsculas, espacios internos y externos, guiones, puntos, cadena vacía |
| `comparar-vehiculo.spec.ts` | backend, unitario | Sin diferencias; una; varias; campo ausente que no cuenta; la placa nunca se compara |
| `vehiculo.e2e-spec.ts` | backend, e2e | Placa nueva crea vehículo · segunda orden reutiliza · datos distintos dan `409` con diferencias · reenvío con el flag actualiza · la ficha devuelve las dos órdenes |

Verificación manual al cierre: escribir una placa conocida en el formulario y
comprobar el autocompletado y el aviso; provocar el conflicto a propósito y
comprobar que el diálogo aparece, que "Corregir" no cambia nada y que "Actualizar
el vehículo" sí; y recorrer la ficha desde una orden.

## 8. Límites conocidos

Lo que este diseño deja abierto a propósito, dicho ahora y no cuando aparezca:

- **Un cliente con dos autos aparece dos veces.** Es la consecuencia directa de
  no crear `Cliente` todavía. Se resuelve cuando el objetivo pase a ser la ficha
  de cliente.
- **La placa no se puede corregir desde la ficha del vehículo**, porque no hay
  pantalla de edición. Una placa mal tipeada crea un vehículo fantasma. El daño
  es bajo —queda con una sola orden— y se corrige editando esa orden con la placa
  buena, con lo que el fantasma se queda sin órdenes. Un `PATCH /vehiculos/:id`
  para Administrador y Jefe lo cerraría del todo si molesta.
- **No hay noción de cambio de propietario en el tiempo.** Actualizar el
  propietario reescribe el dato; no queda registro de quién era el dueño cuando
  se hizo cada orden. Para un taller chico alcanza; una entidad `Cliente` con
  histórico de titularidad es otra fase.
- **El autocompletado consulta en cada pausa de tecleo.** Sin caché y sin
  paginación, que a este volumen no hacen falta.
- **La placa pierde el guion.** Se guarda y se muestra normalizada (`ABC123`, no
  `ABC-123`) para tener una sola forma canónica. Si en el taller resulta molesto,
  la alternativa es guardar la placa tal como se tipea y poner el índice único
  sobre la expresión normalizada; cuesta una columna de comparación o un índice
  sobre expresión más un lookup por query builder.

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| El backfill pierde datos si dos placas normalizan igual con propietarios distintos | Gana la orden más reciente, que es el dato más probablemente vigente. Con la base vacía de hoy no se ejercita, pero la migración es correcta igual |
| `RESTRICT` impide borrar un vehículo y nadie entiende por qué | Es intencional y el mensaje de error lo dice. No hay endpoint de borrado de vehículos en esta fase |
| El diálogo de conflicto molesta en el uso diario | Solo aparece cuando los datos enviados difieren de los guardados. Si el asesor no toca lo autocompletado, no se dispara nunca |
| Renombrar `cliente_*` a `propietario_*` rompe algún consumidor | No hay consumidores externos de la API; los siete archivos del frontend que tocan esos campos se actualizan en la misma fase |
