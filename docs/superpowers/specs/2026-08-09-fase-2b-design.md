# Fase 2b — Diseño

**Fecha:** 2026-08-09
**Estado:** aprobado, listo para plan de implementación
**Antecedentes:** [`fase 0`](2026-08-08-fase-0-design.md) · [`fase 1`](2026-08-08-fase-1-design.md) · [`fase 2`](2026-08-08-fase-2-design.md)

---

## 1. Objetivo

En el Kanban de hoy un trabajo parado esperando una pieza se ve exactamente igual
que uno en el que alguien está trabajando: los dos son una tarjeta en "En
proceso". Esa confusión es la causa número uno de demora en un taller — nadie
persigue el repuesto porque nadie ve que falta.

Esta fase le da columna propia a la espera, registra **qué** se está esperando, y
sube el dato hasta el estado de la orden para que se lea sin abrir el detalle.

Se separó de la fase 2 a propósito y es chica: no toca la cotización, ni la
aprobación, ni el dinero.

## 2. Decisiones tomadas

| Pregunta | Decisión |
|---|---|
| ¿Columna propia o marca sobre la tarjeta? | Columna propia: solo así el conteo por columna distingue lo que avanza de lo que está trancado |
| ¿Por dónde se entra y se sale? | La espera cuelga de `EN_PROCESO`: se entra desde ahí y se vuelve ahí. Un trabajo que aún no arrancó se queda en `PENDIENTE` |
| ¿Se registra el motivo? | Sí, `motivo_espera` obligatorio al entrar y limpiado al salir. Sin él la columna no responde "¿qué falta?" |
| ¿La orden refleja la espera? | Sí, `EstadoOrden.ESPERANDO_REPUESTO` derivado |
| ¿Dónde vive la máquina de estados? | En el backend, como función pura con su `.spec`. El frontend refleja la misma tabla para decidir botones |
| ¿Qué controles lleva la tarjeta? | Un botón por destino válido, generado desde el grafo. Se van las flechas `◀ ▶` |

## 3. Alcance

**Dentro**

- `ESPERANDO_REPUESTO` en `EstadoTrabajo` y en `EstadoOrden`.
- `trabajos.motivo_espera`, con la invariante sostenida por un `CHECK`.
- `trabajos/transiciones.ts`: el grafo de estados del trabajo, exigido por la API.
- Cuarta columna en el Kanban y botones por acción en vez de `◀ ▶`.
- Derivación del nuevo estado de orden.

**Fuera**

- Enlazar el motivo con una fila de `repuestos` → pide stock y proveedor, que no existen.
- Historial de esperas: cuántas veces y por cuánto estuvo trancado un trabajo → material de la fase 5 (KPIs).
- Avisar al cliente de que su auto espera una pieza → fase 4.
- Compra al proveedor, orden de pedido, tiempo estimado de llegada.
- Todo lo que ya estaba fuera en la fase 2: facturación, `Cliente` como entidad, paginación, `401` en el interceptor.

## 4. Modelo

`ESPERANDO_REPUESTO` mide 18 caracteres y las dos columnas `estado` son
`character varying(20)`, así que **no hay que ensanchar ninguna columna**. La
migración agrega una sola:

| Columna | Tipo | Significado |
|---|---|---|
| `trabajos.motivo_espera` | `varchar(200)` nullable | Qué se está esperando, en palabras del taller: "Pastillas Bosch", "Bomba de agua, pedida el martes" |

```sql
ALTER TABLE "trabajos" ADD COLUMN "motivo_espera" character varying(200);
ALTER TABLE "trabajos" ADD CONSTRAINT "CHK_trabajos_motivo_espera"
  CHECK (("estado" = 'ESPERANDO_REPUESTO') = ("motivo_espera" IS NOT NULL));
```

**Sin backfill:** ninguna fila existente puede estar en un estado que no existía,
y todas quedan con `motivo_espera` nulo, que es lo que el `CHECK` exige de ellas.
La migración no pierde datos y el `down` solo borra la restricción y la columna.

La invariante es `motivo_espera ≠ null ⟺ estado = ESPERANDO_REPUESTO`, y la
sostiene la base y no solo el servicio, en la misma línea que las claves foráneas
obligatorias de la fase 0 y la placa única de la fase 1. Si algún camino olvida
limpiar el motivo al retomar, revienta en el `INSERT` y no seis meses después en
un reporte que dice que un trabajo terminado sigue esperando una pieza.

El motivo es **texto libre y no apunta a una fila de `repuestos`**. Enlazarlo
parece obvio y es prematuro: los repuestos de la fase 2 son líneas de cotización
sin stock ni proveedor, y lo que falta muchas veces ni siquiera está cotizado
todavía.

## 5. Máquina de estados del trabajo

Hasta hoy el movimiento era lineal y lo imponía el frontend sumando ±1 sobre el
índice del array de columnas. Con cuatro estados esa aritmética ya no describe el
grafo: la espera es un **desvío**, no una etapa, y obligar a atravesarla para
completar un trabajo ensuciaría justamente el dato que la columna viene a dar.

```
  Pendiente ⇄ En proceso ⇄ Completado
                  ⇅
        Esperando repuesto
```

`backend/src/trabajos/transiciones.ts`, función pura con su `.spec`, vecina de
`estado-orden.ts`, `totales.ts` y `placa.ts`:

```ts
export const TRANSICIONES: Record<EstadoTrabajo, EstadoTrabajo[]> = {
  [EstadoTrabajo.PENDIENTE]:          [EstadoTrabajo.EN_PROCESO],
  [EstadoTrabajo.EN_PROCESO]:         [EstadoTrabajo.PENDIENTE,
                                       EstadoTrabajo.ESPERANDO_REPUESTO,
                                       EstadoTrabajo.COMPLETADO],
  [EstadoTrabajo.ESPERANDO_REPUESTO]: [EstadoTrabajo.EN_PROCESO],
  [EstadoTrabajo.COMPLETADO]:         [EstadoTrabajo.EN_PROCESO],
};

export function transicionValida(desde: string, hacia: string): boolean;
```

Seis aristas. Quedarse en el mismo estado **no** es una transición válida: un
`PATCH` que no cambia nada es un error del llamador, no una operación idempotente
que valga la pena aceptar en silencio.

Esto cierra un hueco anotado en `docs/contexto-core.md` §7: la regla deja de
vivir únicamente en el navegador, donde no es exigible.

## 6. Derivación del estado de la orden

`EstadoOrden` gana `ESPERANDO_REPUESTO`. Las reglas se evalúan en este orden:

| Situación | Estado |
|---|---|
| Sin trabajos | `RECIBIDA` |
| Algún trabajo **cotizado** con `aprobado = null` | `COTIZADA` |
| De los aprobados: ninguno, o todos en `PENDIENTE` | `RECIBIDA` |
| De los aprobados: **ninguno en `EN_PROCESO` y alguno en `ESPERANDO_REPUESTO`** | **`ESPERANDO_REPUESTO`** |
| De los aprobados: todos en `COMPLETADO` | `FINALIZADA` |
| De los aprobados: cualquier otra combinación | `EN_PROCESO` |

La regla nueva dice, en una frase: **nada avanza y algo espera una pieza**.
Basta con que un solo trabajo aprobado esté en `EN_PROCESO` para que la orden
vuelva a reportarse `EN_PROCESO`, porque el taller sí está trabajando en ese
auto aunque otra cosa esté trancada.

**Consecuencia que conviene tener presente:** una orden con un trabajo en
`PENDIENTE` y otro en `ESPERANDO_REPUESTO` se reporta `ESPERANDO_REPUESTO`,
aunque el pendiente se pudiera empezar. Es coherente con lo que la regla mide
—nadie está trabajando en ese auto— y es lo que el asesor necesita responder por
teléfono. Si en el uso diario molesta, la salida es afinar la regla a "y ningún
aprobado en `PENDIENTE`", no cambiar lo que significa `EN_PROCESO`.

`esTerminal`, `puedeEntregar` y `puedeCancelar` **no cambian**: la espera no es
terminal, se puede cancelar desde ahí, y entregar sigue exigiendo `FINALIZADA`.
De eso último sale una propiedad deseable y gratis: **un trabajo esperando una
pieza impide entregar el auto**, porque la orden no puede llegar a `FINALIZADA`
mientras haya un aprobado sin completar.

## 7. API

`PATCH /trabajos/:id/estado` es el único endpoint que cambia. No hay ruta nueva:
mandar a la espera es mover el trabajo, no una operación aparte.

### DTO

```ts
export class ActualizarEstadoDto {
  @IsEnum(EstadoTrabajo)
  estado!: EstadoTrabajo;

  /** Obligatorio al entrar en la espera; prohibido hacia cualquier otro destino. */
  @ValidateIf((dto) => dto.estado === EstadoTrabajo.ESPERANDO_REPUESTO)
  @IsString() @IsNotEmpty() @MaxLength(200)
  motivo_espera?: string;
}
```

La obligatoriedad es condicional y vive en el DTO para que el `400` lo dé el
`ValidationPipe` global y no el servicio: es una queja sobre el cuerpo del
pedido, no sobre el estado del dominio.

**La otra mitad de la regla —mandar un motivo hacia un destino que no es la
espera— no se puede expresar en el mismo DTO**, y conviene dejarlo escrito porque
la trampa no se ve. `@ValidateIf` no reemplaza la condición anterior: las
acumula, y class-validator exige que **todas** den `true` para siquiera validar
la propiedad. Un segundo `@ValidateIf` con la condición inversa deja las dos
condiciones sin poder cumplirse a la vez, y el efecto no es rechazar de más sino
**apagar la validación entera** de `motivo_espera`, en silencio y también para el
caso obligatorio.

Así que ese rechazo va en el servicio, junto a las otras comprobaciones de
dominio, y también responde `400`.

### Orden de comprobaciones

Todo dentro de `conOrdenBloqueada`, que ya bloquea la fila de la orden y rechaza
las órdenes terminales con `409`:

| # | Comprobación | Falla con | Estado |
|---|---|---|---|
| 1 | El trabajo existe | `404` | sin cambios |
| 2 | Rol supervisor, o el trabajo está asignado al usuario | `403` | sin cambios |
| 3 | `aprobado === true` | `409` | sin cambios |
| 4 | `transicionValida(actual.estado, destino)` | `409` | **nuevo** |
| 5 | Viene `motivo_espera` y el destino no es la espera | `400` | **nuevo** |
| 6 | Escribe `estado`, y guarda o limpia `motivo_espera` | — | **nuevo** |

El paso 4 va **después** de los permisos a propósito: a quien no puede tocar el
trabajo no se le explica por qué esa transición sería ilegal.

El mensaje del `409` nombra el destino y la salida, no solo el rechazo:

> `No se puede completar un trabajo que espera repuesto: primero indíquelo como retomado.`

### Concurrencia

La transición se valida releyendo el trabajo con la fila de la orden ya
bloqueada, dentro de la misma transacción que después deriva el estado. Dos
mecánicos pulsando a la vez no pueden abrir dos caminos: el segundo lee el estado
que dejó el primero y su transición ya no es válida.

### Lo que no cambia y conviene saber

`GET /ordenes?estado=` recibe un `string` sin validar contra el enum y lo pasa al
`where`, así que el filtro acepta el estado nuevo sin tocar el backend. Y
`GET /ordenes/estadisticas` agrupa con `GROUP BY orden.estado`, de modo que la
tarjeta del dashboard aparece sola en cuanto haya una orden en ese estado.

Sí hay que tocar los `select` explícitos de `obtenerPorOrden` y
`obtenerMisTrabajos`: sin `motivo_espera: true` el campo nunca llega al
frontend aunque esté en la base.

## 8. Frontend

### Constantes

Casi todo el trabajo lo hace `core/models/estados.ts`:

```ts
ESTADOS_TRABAJO = ['PENDIENTE','EN_PROCESO','ESPERANDO_REPUESTO','COMPLETADO']
ESTADOS_ORDEN   = [...,'EN_PROCESO','ESPERANDO_REPUESTO','FINALIZADA',...]
TRANSICIONES_TRABAJO   // la misma tabla que el backend
ACCION_TRANSICION      // 'EN_PROCESO->ESPERANDO_REPUESTO': '⏸ Esperar repuesto'
ETIQUETA_ESTADO_ORDEN / ETIQUETA_ESTADO_TRABAJO  // 'Esperando repuesto'
```

`ESTADOS_TRABAJO` deja de ser un eje ordenado y pasa a ser solo el orden de las
columnas. `TRANSICIONES_TRABAJO` duplica la tabla del backend, igual que
`rolesGuard` duplica la matriz de permisos: es UX, no seguridad, y la autoridad
sigue siendo el `409` de la API.

Las acciones, una por arista:

| Desde → hacia | Botón |
|---|---|
| `PENDIENTE` → `EN_PROCESO` | Iniciar |
| `EN_PROCESO` → `ESPERANDO_REPUESTO` | ⏸ Esperar repuesto |
| `EN_PROCESO` → `COMPLETADO` | Completar |
| `EN_PROCESO` → `PENDIENTE` | ← Devolver a pendiente |
| `ESPERANDO_REPUESTO` → `EN_PROCESO` | ▶ Retomar |
| `COMPLETADO` → `EN_PROCESO` | ← Reabrir |

**Color:** `ESPERANDO_REPUESTO` va en `warning` (ámbar) y `COTIZADA` pasa de
`warning` a `info`. El ámbar es la señal más fuerte después del rojo de cancelada
y le corresponde a lo que está trancado por el taller; que el cliente todavía no
responda no es una alarma. Es el único cambio de esta fase sobre algo que ya
funcionaba.

### Tablero

`col-md-4` pasa a `col-md-3` por la cuarta columna. `mover(trabajo, -1 | 1)`
—que sumaba sobre el índice— se reemplaza por:

```ts
destinos(trabajo: Trabajo): string[]   // TRANSICIONES_TRABAJO, filtrado por permiso
mover(trabajo: Trabajo, destino: string): void
```

Los botones salen de un `@for` sobre `destinos(trabajo)`, así que la tarjeta no
puede ofrecer una arista que el backend vaya a rechazar. `puedeMover` no cambia:
sigue exigiendo aprobación del cliente más rol supervisor o asignación, y cuando
da `false` la lista de destinos queda vacía y no se dibuja ningún botón.

El motivo se pide con `prompt()`, por coherencia con el `confirm()` que la lista
de órdenes ya usa al eliminar. Cancelar no hace nada; un motivo en blanco tampoco
dispara el pedido. La tarjeta en espera muestra `⏸ {{ motivo_espera }}`.

Al volver la respuesta del `PATCH` se actualizan **`estado` y `motivo_espera`**
en la señal local: si solo se copiara el estado, la tarjeta retomada seguiría
mostrando el motivo viejo hasta recargar.

### Lo que no hay que tocar

El dashboard itera `datos.porEstado` y el filtro de la lista itera
`ESTADOS_ORDEN`: los dos muestran el estado nuevo con solo agregar la etiqueta y
el color. `badge-estado` es genérico y lee `COLOR_ESTADO`.

`trabajo.model.ts` gana `motivo_espera?: string`.

## 9. Pruebas

| Qué | Dónde | Cubre |
|---|---|---|
| `transiciones.spec.ts` | backend, unitario, **nuevo** | Las siete aristas válidas; las ilegales (completar desde la espera, entrar en espera desde `PENDIENTE`, saltar de `PENDIENTE` a `COMPLETADO`); quedarse en el mismo estado; un estado desconocido |
| `estado-orden.spec.ts` | backend, unitario, **ampliado** | Todos los aprobados esperando → `ESPERANDO_REPUESTO`; esperando junto a uno en proceso → `EN_PROCESO`; esperando junto a uno completado → `ESPERANDO_REPUESTO`; esperando junto a uno pendiente → `ESPERANDO_REPUESTO`; un trabajo **sin aprobar** en espera no participa; un cotizado sin respuesta le sigue ganando con `COTIZADA` |
| `espera-repuesto.e2e-spec.ts` | backend, e2e, **nuevo** | Mandar a la espera sin motivo → `400` · retomar mandando un motivo → `400` · con motivo → la orden pasa a `ESPERANDO_REPUESTO` · completar desde la espera → `409` · retomar → `motivo_espera` queda nulo y la orden vuelve a `EN_PROCESO` · un mecánico ajeno → `403` · un trabajo sin aprobar → `409` |
| `flujo-orden` y `cotizacion` e2e | backend, existentes | Que reescribir `mover()` y `derivarEstado` no rompa las fases 0 y 2 |

Verificación manual al cierre, contra la app corriendo: entrar como mecánico,
iniciar un trabajo aprobado, mandarlo a la espera con motivo, ver la tarjeta
cambiar de columna y la orden aparecer como Esperando repuesto en la lista y en
el dashboard, retomarla, comprobar que el motivo desapareció, e intentar el
`PATCH` ilegal desde `docs/endpoints.http`.

## 10. Documentación a actualizar

- `docs/contexto-core.md`: las dos máquinas de estado (§3), la fila del `PATCH`
  de estado (§5), y en §7 **borrar** la rareza de que "el movimiento lo impone el
  frontend, no el backend", que esta fase deja de ser cierta.
- `docs/modelo-er.md`: la columna nueva.
- `docs/endpoints.http`: los casos de espera y de transición ilegal.

## 11. Límites conocidos

- **No queda historial de esperas.** `motivo_espera` es el motivo actual y se
  borra al retomar, así que no se puede responder "cuántas veces y por cuánto
  estuvo trancado este trabajo". Es exactamente el dato que la fase 5 va a
  necesitar para el tiempo de ciclo, y cerrarlo bien pide una tabla de eventos.
- **El motivo no está enlazado a un repuesto.** Tres autos esperando la misma
  pieza se ven porque alguien lee los tres textos, no porque el sistema lo sepa.
- **Nadie avisa cuando la pieza llega.** El mecánico tiene que acordarse de
  retomar el trabajo; el sistema no le recuerda nada.
- **El cliente no se entera** de que su auto está esperando una pieza. Eso es la
  fase 4.
- **Un trabajo que nunca arrancó no puede declararse en espera**, porque la
  arista `PENDIENTE → ESPERANDO_REPUESTO` no existe. Es deliberado: para saber
  qué pieza falta alguien ya tuvo que meterse al auto. Si en el uso diario resulta
  falso, es una arista más en la tabla y un caso más en dos `.spec`.

## 12. Riesgos

| Riesgo | Mitigación |
|---|---|
| El `CHECK` hace fallar un camino que olvide limpiar el motivo | Es el punto de tenerlo. El e2e ejercita entrar y salir de la espera, así que sale en la primera corrida y no en producción |
| Reescribir `mover()` rompe el único modo de mover trabajos | Los e2e de `flujo-orden` y `cotizacion` cubren el recorrido completo del Kanban y se corren en la misma tarea |
| El mapa de acciones se desincroniza del grafo y un mecánico se queda sin botón | Los botones se generan **desde** `TRANSICIONES_TRABAJO`; si falta la etiqueta de una arista, se muestra el nombre del estado destino en vez de no dibujar nada |
| La tabla de transiciones duplicada en frontend y backend se desvía | El frontend solo decide qué botones dibujar; el `409` del backend es la autoridad, y el e2e lo verifica. Es el mismo trato que ya tiene la matriz de roles |
| Cambiar `COTIZADA` de ámbar a celeste confunde a quien ya se acostumbró | Es un cambio de color, no de significado, y las etiquetas de texto no cambian. Si molesta, se revierte en una línea |
| Cuatro columnas se aprietan en pantallas chicas | `col-md-3` mantiene el apilado vertical de Bootstrap por debajo del breakpoint, que es como ya se ve hoy en un teléfono |
