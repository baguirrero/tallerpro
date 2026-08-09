# Fase 2 — Diseño

**Fecha:** 2026-08-08
**Estado:** aprobado, listo para plan de implementación
**Antecedentes:** [`fase 0`](2026-08-08-fase-0-design.md) · [`fase 1`](2026-08-08-fase-1-design.md)

---

## 1. Objetivo

Hoy una orden lleva `presupuesto`: un número suelto que nadie desglosa y que
nadie autoriza. El taller puede ejecutar trabajos que el cliente nunca aprobó, y
cuando el cliente discute el precio no hay nada que mostrarle.

Esta fase convierte ese número en una cotización con desglose, y agrega el paso
que faltaba en el ciclo: **la respuesta del cliente**. Un trabajo no aprobado no
se puede mover en el Kanban.

## 2. Decisiones tomadas

| Pregunta | Decisión |
|---|---|
| ¿La cotización es una lista aparte de `trabajos`? | No. El trabajo gana precio y repuestos; la cotización es la suma de los trabajos |
| ¿Cómo entra la aprobación en la máquina de estados? | Estado `COTIZADA` entre `RECIBIDA` y `EN_PROCESO`, y un trabajo sin aprobar no se mueve |
| ¿Cómo se guardan los repuestos? | Tabla propia colgando del trabajo, con `CASCADE` |
| Alcance | Solo cotización y aprobación. `ESPERANDO_REPUESTO` es la fase 2b; el enlace al cliente sigue en la 4 |

## 3. Alcance

**Dentro**

- `precio_mano_obra` y `aprobado` en `trabajos`; tabla `repuestos`.
- `ordenes.presupuesto` se elimina; el total se calcula.
- Estado `COTIZADA`, derivado, y bloqueo de los trabajos sin aprobar.
- Endpoints de repuestos y de aprobación en bloque.
- Panel de cotización y de respuesta del cliente en el detalle de orden.
- Precio y repuestos en el formulario de trabajo.

**Fuera**

- `ESPERANDO_REPUESTO` en el Kanban → fase 2b.
- Enlace público para que el cliente apruebe él mismo → fase 4.
- Facturación, comprobante, formas de pago.
- Inventario de repuestos, proveedores, stock.
- Historial de cambios de precio o de quién aprobó qué.
- `Cliente` como entidad; paginación; Swagger; `401` en el interceptor.

## 4. Modelo

### `trabajos` gana dos columnas

| Columna | Tipo | Significado |
|---|---|---|
| `precio_mano_obra` | `numeric(10,2)` nullable | `null` = sin cotizar. **`0` es un precio válido**: una revisión de cortesía |
| `aprobado` | `boolean` nullable | `null` = esperando respuesta · `true` = aprobado · `false` = rechazado |

Un booleano solo no alcanzaba: hay **tres** estados, y "todavía no le preguntamos"
es distinto de "dijo que no".

Como `presupuesto` en `ordenes`, `precio_mano_obra` lleva el mismo `transformer`
que convierte el `numeric` a número al leer: el driver de PostgreSQL devuelve las
columnas `numeric` como texto para no perder precisión.

### `repuestos`, nueva

| Columna | Tipo |
|---|---|
| `id` | UUID |
| `descripcion` | `varchar(200)` |
| `cantidad` | `int`, mínimo 1 |
| `precio_unitario` | `numeric(10,2)`, con `transformer` |
| `trabajo_id` | UUID, `ON DELETE CASCADE` |
| `created_at` | timestamp |

```
ORDENES ──< TRABAJOS ──┬──< REPUESTOS
                       ├──< COMENTARIOS
                       └──< ADJUNTOS
```

### `ordenes.presupuesto` se elimina

Era el número suelto que esta fase viene a resolver. **Es la única pérdida de
datos de la fase**: cualquier presupuesto ya cargado desaparece, porque no hay
forma honesta de repartirlo entre trabajos que no existen. Con la base vacía de
hoy no importa; si el proyecto ya estuviera desplegado con datos, habría que
exportarlo antes.

### Qué significa "cotizado"

**Un trabajo está cotizado cuando `precio_mano_obra` no es nulo.** Los repuestos
no cuentan para esto: agregar repuestos a un trabajo sin precio de mano de obra
no lo declara cotizado.

Es una regla explícita y no un descuido. Poner el precio de mano de obra —aunque
sea `0`— es el acto de declarar el trabajo cotizado, y mantenerlo así permite
que la derivación del estado mire tres columnas escalares sin unir con
`repuestos` en cada cambio de un trabajo.

Para que la regla no se convierta en una trampa, **agregar un repuesto a un
trabajo sin precio de mano de obra responde `409`**. Sin esa validación, alguien
cargaría repuestos, olvidaría el precio de mano de obra, y esos repuestos no
aparecerían en ningún total: dinero invisible.

## 5. Derivación del estado

`EstadoOrden` gana `COTIZADA`. Las reglas se evalúan en este orden:

| Situación | Estado |
|---|---|
| Sin trabajos | `RECIBIDA` |
| Algún trabajo **cotizado** con `aprobado = null` | **`COTIZADA`** |
| De los aprobados: ninguno, o todos en `PENDIENTE` | `RECIBIDA` |
| De los aprobados: todos en `COMPLETADO` | `FINALIZADA` |
| De los aprobados: cualquier otra combinación | `EN_PROCESO` |

**Solo los trabajos aprobados participan del avance.** Un trabajo rechazado no
impide que la orden llegue a `FINALIZADA`, y uno sin cotizar tampoco: el jefe
está armando la cotización y eso no debe mover el estado.

Si el cliente **rechaza todo**, no quedan trabajos aprobados y la orden vuelve a
`RECIBIDA`. No hay nada que hacer; cancelarla es una decisión humana que ya tiene
su propio botón.

**Consecuencia que conviene tener presente:** aprobar la cotización sin que nadie
haya empezado devuelve la orden de `COTIZADA` a `RECIBIDA`, porque todos los
trabajos aprobados siguen en `PENDIENTE`. Visualmente parece un retroceso, pero
es coherente con lo que los estados significan: `EN_PROCESO` es que alguien está
trabajando, no que el cliente dijo que sí. La orden pasa a `EN_PROCESO` en cuanto
el mecánico mueve la primera tarjeta. Si en el uso diario ese salto atrás
molesta, la salida es un estado `APROBADA` propio, no cambiar lo que significa
`EN_PROCESO`.

`COTIZADA` no es terminal: se puede cancelar desde ahí. `puedeEntregar` sigue
exigiendo `FINALIZADA` y `esTerminal` sigue siendo `ENTREGADA` y `CANCELADA`.

**El bloqueo:** `TrabajosService.actualizarEstado` responde `409` cuando el
trabajo tiene `aprobado !== true`. Es la regla que de verdad impide trabajar sin
autorización, y vive junto a la que ya rechaza los cambios sobre una orden
terminal.

## 6. API

### Lógica pura

**`ordenes/totales.ts`** — el único sitio donde se calcula dinero:

```ts
interface LineaRepuesto { cantidad: number; precio_unitario: number }

interface TrabajoCotizado {
  precio_mano_obra?: number | null;
  aprobado?: boolean | null;
  repuestos?: LineaRepuesto[];
}

interface Totales { aprobado: number; pendiente: number; rechazado: number }

subtotalTrabajo(trabajo: TrabajoCotizado): number
calcularTotales(trabajos: TrabajoCotizado[]): Totales
```

`subtotalTrabajo` suma la mano de obra más `cantidad × precio_unitario` de cada
repuesto. Un trabajo sin cotizar aporta `0` y no entra en ningún bucket.

Tres cifras separadas en vez de un `total` ambiguo: **aprobado** es lo que el
cliente va a pagar, **pendiente** lo que todavía no responde, y **rechazado** lo
que dijo que no. Cada consumidor compone lo que necesita.

**`ordenes/estado-orden.ts`** — `derivarEstado` **cambia de firma**:

```ts
interface TrabajoParaDerivar {
  estado: string;
  precio_mano_obra?: number | null;
  aprobado?: boolean | null;
}

derivarEstado(trabajos: TrabajoParaDerivar[]): EstadoOrden
```

Hoy recibe `string[]` con los estados. **Sus 12 tests de la fase 0 hay que
reescribirlos**: no fallan por un descuido, es que la función responde otra
pregunta.

### Endpoints

| Método | Ruta | Roles |
|---|---|---|
| PATCH | `/trabajos/:id` (gana `precio_mano_obra`) | Admin · Jefe |
| POST | `/trabajos/:trabajoId/repuestos` | Admin · Jefe (`409` si el trabajo no tiene precio de mano de obra) |
| DELETE | `/repuestos/:id` | Admin · Jefe |
| PATCH | `/ordenes/:id/aprobacion` | Admin · Jefe · **Asesor** |

El asesor entra en la aprobación porque es quien habla con el cliente.

Los repuestos no tienen `PATCH`: se borran y se vuelven a agregar. Editar una
línea de cotización es lo mismo que reemplazarla.

### Aprobación en bloque

Va en bloque y no de a un trabajo porque así ocurre: el cliente dice que sí a
tres cosas y que no a una, en una sola conversación. Una transacción, una
derivación al final, y ningún estado intermedio raro.

```json
{
  "decisiones": [
    { "trabajo_id": "…", "aprobado": true },
    { "trabajo_id": "…", "aprobado": false }
  ]
}
```

Validaciones:

- Un `trabajo_id` que no pertenece a la orden → `400`.
- Un trabajo **sin cotizar** → `409`: no se puede autorizar lo que no se cotizó.
- Una orden terminal → `409`, como el resto de las operaciones sobre trabajos.

Las decisiones son idempotentes: volver a mandar la misma aprobación no cambia
nada. Se puede cambiar una decisión ya tomada, y la derivación se recalcula.

### Totales en las respuestas

`GET /ordenes`, `GET /ordenes/:id` y el historial de `GET /vehiculos/:id`
incluyen un campo calculado `totales`.

El listado los obtiene **cargando trabajos y repuestos por relación**, no
recalculando la suma en SQL. Es más pesado, pero duplicar el cálculo del dinero
en SQL sería una segunda fuente de verdad para la plata, y eso se desincroniza
tarde o temprano. Al volumen de un taller la diferencia no se nota; si algún día
se nota, se cachea el número, no se duplica la fórmula.

## 7. Frontend

**Formulario de trabajo** gana el precio de mano de obra —opcional, con `0`
permitido— y un editor de repuestos: filas con descripción, cantidad y precio
unitario, con el subtotal actualizándose mientras se escribe.

**Detalle de orden** gana el panel de cotización: cada trabajo con su mano de
obra, sus repuestos desglosados y su subtotal, y las tres cifras al pie. Cuando
la orden está `COTIZADA`, aparece el panel de respuesta: una elección por trabajo
entre aprobar y rechazar, y un botón que manda todas las decisiones juntas.

**Kanban:** los trabajos sin aprobar se muestran atenuados, con una etiqueta que
lo dice, y sus botones `◀ ▶` deshabilitados. El `409` del backend sigue siendo la
autoridad; esto solo evita que el mecánico lo intente.

**Listado y dashboard** muestran el total aprobado donde antes iba el
presupuesto, y el badge `COTIZADA` en naranja (`warning` de Bootstrap).

**Lo que se adapta al quitar `presupuesto`:** el campo sale del formulario de
orden y de `OrdenRequest`; `Orden`, `OrdenDelHistorial`, el listado, el detalle y
la ficha de vehículo pasan a leer `totales.aprobado`.

## 8. Pruebas

| Qué | Dónde | Cubre |
|---|---|---|
| `totales.spec.ts` | backend, unitario | Subtotal con y sin repuestos; `0` como precio válido; los tres buckets; un trabajo sin cotizar que no suma; cantidad mayor que 1 |
| `estado-orden.spec.ts` | backend, unitario, **reescrito** | La tabla de derivación completa, incluidos "rechazó todo" y "todavía sin cotizar" |
| `cotizacion.e2e-spec.ts` | backend, e2e | Cotizar → `COTIZADA` · mover sin aprobar → `409` · aprobar un trabajo sin precio → `409` · repuesto sobre trabajo sin cotizar → `409` · aprobar parcial → vuelve a `RECIBIDA` · mover un aprobado → `EN_PROCESO` · completar los aprobados → `FINALIZADA` pese al rechazado · los totales cuadran |

Verificación manual al cierre: armar una cotización con repuestos en el
navegador, comprobar que el total cuadra con la suma a mano, intentar mover una
tarjeta sin aprobar, registrar una respuesta parcial, y ver que la orden avanza y
finaliza sin el trabajo rechazado.

## 9. Límites conocidos

- **No queda registro de quién aprobó ni cuándo.** `aprobado` es el estado
  actual, no un historial. Para un taller chico alcanza; si algún día hay una
  discusión legal sobre una autorización, hace falta una tabla de eventos.
- **Cambiar un precio después de aprobado no vuelve a pedir autorización.** El
  trabajo sigue aprobado con el precio nuevo. Es un agujero consciente: cerrarlo
  bien requiere versionar la cotización, que es bastante más máquina.
- **Los repuestos no tienen stock ni proveedor.** Son líneas de texto con precio.
  El inventario es otra fase, y la tabla propia existe justamente para poder
  colgarlo ahí.
- **No hay costo real contra cotizado.** Lo cotizado es lo que se cobra; no se
  registra cuánto costó el repuesto al taller.
- **El cliente no aprueba por sí mismo**, lo registra el asesor. El enlace
  público es la fase 4.

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| Quitar `presupuesto` pierde datos | Es explícito y aceptado; la base está vacía. La migración no intenta repartirlo |
| Cambiar la firma de `derivarEstado` rompe la fase 0 en silencio | Los 12 tests existentes se reescriben en la misma tarea; sin eso, no compila |
| El listado con trabajos y repuestos se vuelve pesado | Un solo `SELECT` con joins, no N+1. A este volumen no se nota, y se mide antes de optimizar |
| El bloqueo por aprobación frena el trabajo diario | Solo aplica a trabajos cotizados sin respuesta; uno sin cotizar no bloquea nada. El jefe puede aprobar sin salir del detalle |
| Redondeo al sumar dinero | `numeric(10,2)` en la base y `transformer` a número al leer, igual que el `presupuesto` de hoy. Las sumas son de dos decimales y no se acumulan errores a este volumen |
