# Rediseño · Entrega B — Pantallas núcleo — Diseño

**Fecha:** 2026-08-09
**Estado:** aprobado, listo para plan de implementación
**Antecedentes:** [`entrega A`](2026-08-09-rediseno-a-fundamentos-shell-design.md) · [`fase 2`](2026-08-08-fase-2-design.md) · [`fase 2b`](2026-08-09-fase-2b-design.md)

---

## 1. Objetivo

La entrega A construyó el sistema —tokens, diez primitivas y el shell— y **no rediseñó
ninguna pantalla**. La aplicación quedó a dos velocidades a propósito: mueble nuevo,
contenido viejo.

Esta entrega mueve al sistema nuevo las tres pantallas que el taller usa a diario:
el dashboard, la lista de órdenes y el detalle de orden con su Kanban. Es donde el
rediseño se empieza a notar, y es también donde se retiran los diálogos del navegador
—`confirm()` y `prompt()`— que la entrega A dejó listos para reemplazar.

No es solo pintura. Tres de las decisiones de abajo cambian cómo se usa la aplicación:
el dashboard deja de ser un marcador para decir qué está trancado (§4), la lista gana
un buscador y guarda el filtro en la URL (§5), y el detalle deja de ser un scroll de
tres pantallas (§6).

## 2. Decisiones tomadas

| Pregunta | Decisión |
|---|---|
| ¿Hasta dónde llega el detalle de orden? | Cabecera, Kanban, cotización y aprobación. `formulario-trabajo` y `detalle-trabajo` quedan para la C |
| ¿Cómo se organiza el detalle? | Cabecera compacta + dos pestañas: Trabajos y Cotización |
| ¿Qué es el dashboard? | Lo que pide acción hoy, no el conteo de los siete estados |
| ¿Cómo se filtra la lista? | Pestañas de estado con contador, el estado en la URL, y buscador en el navegador |
| ¿El buscador va contra la API? | No. Filtra lo ya cargado, y lo dice: «3 de 52» |
| ¿Primitiva nueva para el motivo de espera? | No. `app-modal` + `app-campo` en línea, un solo sitio de uso |

## 3. Alcance

**Dentro**

| Archivo | Qué pasa |
|---|---|
| `features/dashboard/` | Se rehace: tres cifras accionables, tira secundaria y tabla de trabajos |
| `features/ordenes/lista-ordenes/` | Pestañas, buscador, estado en query param, tabla nueva |
| `features/ordenes/detalle-orden/` | Cabecera compacta y pestañas |
| `features/ordenes/panel-cotizacion/` | Rediseñado; el editor de repuestos pasa a signals (§9) |
| `features/ordenes/panel-aprobacion/` | Rediseñado; se muda dentro de la pestaña Cotización |
| `features/trabajos/tablero-kanban/` | Columnas y tarjetas nuevas; el `prompt()` pasa a modal |

**Fuera**

- **`formulario-trabajo` y `detalle-trabajo`** siguen con Bootstrap hasta la entrega C, donde se rediseñan junto al resto de formularios de una sola pasada. Son los dos únicos componentes Bootstrap que quedan dibujándose dentro de una pantalla nueva; la §11 dice cómo se disimula.
- **Quitar Bootstrap de `angular.json`** → cierre de la entrega C.
- **Paginación e índices sobre `placa`, `estado` y `asignado_a`** → siguen siendo la deuda técnica anotada en `docs/contexto-core.md`. Esta entrega la roza (§5) pero no la paga.
- **Arrastrar tarjetas en el Kanban** → sigue moviéndose por botones.
- **Cualquier cambio en `backend/`.** Esta entrega no toca el backend, y eso es verificable: `git diff --stat backend/` debe salir vacío.
- **Endpoints nuevos.** Todo sale de lo que ya existe: `GET /ordenes`, `GET /ordenes/estadisticas`, `GET /trabajos/mis-trabajos` y `GET /trabajos/orden/:ordenId`.

### Lo que se toca pero no se borra

`shared/components/badge-estado/` y `shared/components/spinner/` **siguen existiendo al
terminar esta entrega**. Las pantallas de B dejan de usarlos, pero `detalle-trabajo`,
`ficha-vehiculo`, `formulario-orden` y `lista-usuarios` todavía los importan. Borrarlos
ahora rompe cuatro pantallas; se van al cerrar la entrega C, con Bootstrap.

## 4. Dashboard

Hoy son ocho cuadros del mismo tamaño —el total y un contador por estado— y una tabla.
Ocho cifras que pesan igual no dicen qué hacer: hay que leerlas todas y decidir. La
pantalla pasa a responder una pregunta concreta: **qué está trancado ahora**.

```
Hola, Carlos
Resumen del taller

┌───────────────┬───────────────┬───────────────┐
│  3            │  2            │  5            │
│  Esperando    │  Esperando al │  Listas para  │
│  repuesto  →  │  cliente   →  │  entregar  →  │
└───────────────┴───────────────┴───────────────┘

  Recibidas 4 · En proceso 7 · Entregadas 31 · Canceladas 0 · Total 52

┌─────────────────────────────────────────────────────┐
│ Mis trabajos asignados                            3 │
├─────────────────────────────────────────────────────┤
│ TRABAJO       VEHÍCULO      PRIORIDAD  ESTADO       │
│ Cambio de…    ORD-0042      ● Alta     [En proceso] │
│               ABC-123                               │
└─────────────────────────────────────────────────────┘
```

### Las tres cifras

| Tarjeta | Estado de orden | Enlaza a |
|---|---|---|
| Esperando repuesto | `ESPERANDO_REPUESTO` | `/ordenes?estado=ESPERANDO_REPUESTO` |
| Esperando al cliente | `COTIZADA` | `/ordenes?estado=COTIZADA` |
| Listas para entregar | `FINALIZADA` | `/ordenes?estado=FINALIZADA` |

Salen de `porEstado`, que ya viene en la respuesta de `estadisticas`. Un estado ausente
del arreglo cuenta cero: hoy la API solo devuelve las filas con `cantidad > 0`, así que
la pantalla no puede asumir que los siete llegan.

**En cero no gritan.** La cifra pasa a `--texto-suave`, desaparece la flecha y la
tarjeta deja de ser clicable: no hay ningún listado que ir a ver, y un enlace que lleva
a una tabla vacía es una promesa incumplida. Que las tres estén en cero es la buena
noticia del día y debe leerse tranquila, no como tres ceros enormes.

### La tira secundaria

Los cuatro estados restantes más el total, en una línea de texto, cada uno enlazado a la
lista con su filtro. No se pierde nada de la información de hoy; cambia el peso visual.

### Mis trabajos asignados

La tabla usa `.tabla` de `utilidades.css`. La **prioridad se dibuja como punto de color
más texto en `--texto-suave`**, no como pastilla: es la regla de la §4 de la entrega A,
y acá se nota, porque en la misma fila hay una pastilla de estado con la que competiría.

Sin trabajos, `app-estado-vacio` con un mensaje corto. Sin la orden cargada en el
trabajo, la fila igual se dibuja: el enlace «Ver orden» es lo único que se omite.

### Carga y error

`app-esqueleto` en lugar de `app-spinner`: tres esqueletos de tarjeta arriba y cuatro
filas abajo, con la forma de lo que va a llegar. Si `estadisticas` falla, un bloque de
error en el cuerpo de la pantalla —no un toast: es un fallo de carga, no el resultado de
una acción (§10)—. Si falla `mis-trabajos`, la tabla queda vacía sin tumbar el resto,
que es lo que ya hace hoy.

## 5. Lista de órdenes

```
Órdenes de servicio                              [+ Nueva orden]
┌──────────────────────────────────────────────────────────────┐
│ ‹Todas 52› Recibidas 4  Cotizadas 2  En proceso 7  Esperan… › │
├──────────────────────────────────────────────────────────────┤
│ 🔍 ABC                                    3 de 52            │
├──────────────────────────────────────────────────────────────┤
│ N° ORDEN    VEHÍCULO       CLIENTE       APROBADO    ESTADO  │
│ ORD-0042    Toyota Yaris   Juan Pérez    1,240.00  [Proceso] │
│             ABC-123        987654321                         │
└──────────────────────────────────────────────────────────────┘
```

### El estado se muda a la URL

El filtro pasa de un signal privado a un **query param**: `/ordenes?estado=COTIZADA`. El
componente lo lee de `ActivatedRoute` y navega cuando se cambia de pestaña.

Dos cosas dependen de esto, y por eso no es un detalle: los enlaces del dashboard (§4)
caen en la pestaña correcta, y recargar la página o volver con el botón «atrás» conserva
lo que se estaba mirando. Un valor que no corresponde a ningún estado se ignora y se
muestra «Todas», que es más útil que una tabla vacía sin explicación.

El estado **sigue viajando a la API** —`GET /ordenes?estado=…`, como hoy—. Filtrarlo en
el navegador sería más rápido hoy, pero deja de funcionar el día que llegue la
paginación, y ese día está anotado en la deuda técnica.

### Los contadores de las pestañas

Vienen de `estadisticas`, la misma llamada del dashboard. Es una petición más que hoy en
esta pantalla; es pequeña y es lo que hace que las pestañas informen en vez de solo
filtrar. Si esa llamada falla, las pestañas se dibujan sin número: pierden información,
no funcionalidad.

En pantallas angostas la tira de pestañas se desplaza en horizontal. No se pliega en un
desplegable: eso sería volver al `<select>` de hoy con más código.

### El buscador

Filtra **en el navegador, sobre las órdenes ya cargadas**, por número de orden, placa,
marca, modelo y nombre del propietario. Comparación en minúsculas y sin espacios
sobrantes en los dos lados.

No hay endpoint de búsqueda, y la §6 de la entrega A ya fijó la regla: un campo que
finge buscar en todo cuando solo mira una página es peor que no tenerlo. Por eso el
contador dice **«3 de 52»** en cuanto hay texto: nombra exactamente sobre qué está
filtrando. Hoy `GET /ordenes` devuelve todo, así que «lo cargado» es «todo»; cuando
llegue la paginación, este contador es lo que va a delatar que el buscador tiene que
mudarse al servidor.

### La tabla

`.tabla` de `utilidades.css`. Columnas: N° Orden · Vehículo (marca y modelo, con la
placa debajo) · Cliente (nombre, con el teléfono debajo) · Ingreso · Aprobado · Estado ·
acciones.

El importe y la fecha van con `tabular-nums`, que es el arreglo que la entrega A dejó
preparado justamente para esta tabla.

**La fila entera lleva al detalle.** El número de orden sigue siendo un `<a>` de verdad
—para que `Tab` lo alcance y para que se pueda abrir en otra pestaña—; el clic en la
fila es una comodidad además de eso, no en lugar de eso. Con la fila clicable, el botón
«Ver» sobra y se va: quedan Editar y Eliminar, según el rol, y el clic en ellos no debe
propagarse a la fila.

### Vacíos

Dos mensajes distintos, porque son dos situaciones distintas:

| Situación | Qué se muestra |
|---|---|
| No hay ninguna orden todavía | `app-estado-vacio` con el botón «Nueva orden», si el rol puede crearla |
| El filtro o el buscador no dejan nada | `app-estado-vacio` que nombra el filtro y ofrece limpiarlo |

### Eliminar

`app-confirmar` en variante peligro, con el número de la orden en el mensaje. Al
confirmar, se recarga la lista y sale un toast de éxito; si la API responde error, sale
un toast de error y la lista se queda como estaba.

## 6. Detalle de orden

Hoy la pantalla apila seis bloques —cabecera, formulario de trabajo, aprobación,
cotización, Kanban y detalle de trabajo—. Con el Kanban de cuatro columnas en el medio,
mide tres pantallas de alto y obliga a bajar hasta el fondo para llegar a lo que el
taller mira todo el día.

```
← Órdenes
ORD-2026-0042  [En proceso]            Editar   Entregar   Cancelar
Toyota Yaris 2019 · ABC-123 · Juan Pérez · 987654321
Ingreso 04/08/2026   Entrega —   Aprobado S/ 1,240.00
Cambio de aceite y revisión de frenos delanteros.
────────────────────────────────────────────────────────────────────
⚠ El cliente aún no responde la cotización.        Registrar respuesta
────────────────────────────────────────────────────────────────────
 ‹Trabajos›   Cotización
────────────────────────────────────────────────────────────────────
                                                        [+ Trabajo]
┌──────────┬──────────┬──────────┬──────────┐
│Pendiente2│Proceso  1│Espera   0│Complet. 3│
└──────────┴──────────┴──────────┴──────────┘
```

### La cabecera

No es una `app-tarjeta`: es la cabecera de la página. Lleva las migas de vuelta al
listado, el número, la pastilla de estado, las acciones a la derecha, y dos líneas de
datos. La placa enlaza a la ficha del vehículo, como hoy. La descripción va debajo, a
ancho completo, en `--texto-suave`.

Los datos que hoy están repartidos en tres columnas —vehículo, propietario, servicio—
caben en dos líneas porque son ocho valores cortos. Las etiquetas («Placa:», «Año:») se
van: `ABC-123` junto a `Toyota Yaris 2019` no necesita que le digan que es una placa.

### La franja de aprobación

Cuando la orden está en `COTIZADA` y el rol puede registrar la respuesta, aparece bajo
la cabecera una franja de aviso con un botón que **cambia a la pestaña Cotización**.

Es lo único que bloquea el trabajo del taller —sin aprobación no se mueve ninguna
tarjeta del Kanban—, así que no puede quedar escondido detrás de una pestaña. Pero
tampoco se duplica el panel: la franja avisa y lleva; el panel vive en un solo sitio.

### Las pestañas

| Pestaña | Contenido |
|---|---|
| **Trabajos** (por defecto) | Botón «+ Trabajo» y el Kanban a ancho completo |
| **Cotización** | Panel de aprobación (si aplica) y el desglose con los totales |

La pestaña activa es un signal del componente, no va en la URL. No hay ningún enlace
externo que necesite apuntar a una pestaña concreta —la franja de aprobación está dentro
de la misma pantalla y cambia el signal directamente—, así que ponerla en la URL sería
maquinaria sin uso.

Los totales siguen visibles en la cabecera aunque la pestaña Cotización esté cerrada:
esconder el desglose es aceptable, esconder cuánto se aprobó no.

### El formulario de trabajo se pliega

`app-formulario-trabajo` se dibuja hoy siempre abierto, arriba del tablero. Pasa a
desplegarse con el botón «+ Trabajo», y al crear un trabajo se cierra solo.

Mejora la pantalla por sí solo —el formulario ocupa el tope de la vista aunque no se
esté creando nada— y de paso resuelve el problema de la §11: el componente sigue siendo
Bootstrap hasta la entrega C, y plegado deja de ser lo primero que se ve.

### El detalle de trabajo

Sigue apareciendo debajo del tablero, dentro de la pestaña Trabajos, con su botón de
cerrar, exactamente como hoy. Es un componente de la entrega C y esta entrega no cambia
su forma ni cómo se abre.

### Acciones y errores

«Entregar» sale directo. «Cancelar» pasa por `app-confirmar` en variante peligro, con el
texto de hoy: la acción no se puede revertir. Las dos reportan por toast (§10). Si la
orden no se puede cargar, la pantalla muestra un bloque de error con el enlace de vuelta
al listado, como hoy.

## 7. Kanban

```
┌─────────────────────────┐
│ PENDIENTE            2  │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Cambio de aceite    │ │
│ │ ● Alta              │ │
│ │ Luis Vega · 12/08   │ │
│ │ [Iniciar]  [Detalle]│ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**La columna** va sobre `--superficie-hundida` con radio `--r-md`, y su cabecera lleva la
etiqueta del estado y el contador. Vacía, muestra una línea en `--texto-suave` centrada
—no `app-estado-vacio`, que está pensado para ocupar una pantalla, no una columna de
280 px—.

**La tarjeta** es superficie, borde, `--sombra-1`. Título en 14 semibold; prioridad como
punto más texto; mecánico y fecha límite en una línea menor; el motivo de espera, cuando
existe, en una franja con los tokens de `ESPERANDO_REPUESTO`.

**Sin aprobar:** la tarjeta se atenúa y lleva una etiqueta pequeña. No es una pastilla:
«sin aprobar» no es un estado del trabajo —el trabajo está `PENDIENTE`— y dibujarlo como
pastilla junto a la de estado diría que hay dos estados donde hay uno.

**Los botones** de transición pasan a `app-boton` secundario tamaño sm, en el orden que
ya fija `TRANSICIONES_TRABAJO`; «Detalle» pasa a fantasma. Las etiquetas no cambian: las
decidió la fase 2b y ya dicen qué va a pasar («Iniciar», «⏸ Esperar repuesto»).

**Nada se anima al cambiar de columna.** Es la regla 4 de la §8 de la entrega A: mover
una tarjeta debe sentirse inmediato, y animar la transición la haría sentir más lenta
aunque la API responda igual.

**Carga:** esqueletos de tarjeta dentro de las columnas, no un spinner que reemplaza el
tablero entero.

### El `prompt()` se va

Mover un trabajo a `ESPERANDO_REPUESTO` pide hoy el motivo con `prompt()`. Pasa a un
`app-modal` con un `app-campo` adentro, montado **en línea en el Kanban**:

- Título: «¿Qué repuesto se está esperando?»
- Confirmar deshabilitado mientras el campo esté vacío o solo tenga espacios.
- `Esc`, clic en el velo y «Cancelar» abortan el movimiento, igual que hoy cancelar el `prompt()`.
- Al confirmar, se manda el motivo en la misma llamada de `cambiarEstado` que ya existe.

**No se crea una primitiva «pedir un texto».** Hay un solo sitio de uso, y la §12 de la
entrega A dice que un componente que aparece fuera de la lista de primitivas es la señal
de que una pantalla se está colando en el sistema. Si la entrega C encuentra un segundo
caso, ahí se extrae.

## 8. Cotización

El desglose por trabajo mantiene la estructura de hoy —título, marca de aprobación,
subtotal, mano de obra y repuestos— con la tabla y la tipografía nuevas, y los tres
totales a la derecha en cifras tabulares, con «Aprobado» destacado.

### Las marcas de aprobación no son pastillas de estado

Un trabajo puede estar Sin cotizar, Esperando respuesta, Aprobado o Rechazado. Eso no es
`trabajo.estado` —un trabajo aprobado sigue estando `PENDIENTE`—, así que `app-pastilla`
no las cubre: su trabajo es traducir estados del dominio, y forzarle un quinto vocabulario
la convertiría en un diccionario de todo.

Se dibujan como una etiqueta pequeña propia del panel, con los tokens de estado que
correspondan por significado:

| Marca | Tokens |
|---|---|
| Aprobado | `--estado-finalizada-*` |
| Rechazado | `--estado-cancelada-*` |
| Esperando respuesta | `--estado-cotizada-*` |
| Sin cotizar | `--estado-recibida-*` |

Sigue sin nombrarse ningún color crudo, que es la regla que importa.

### El editor de repuestos

Es hoy un `FormGroup` con tres `<input>` de Bootstrap. Pasa a `app-campo` ×3 más
`app-boton`, y **el `FormGroup` se va a tres signals** con la validación a mano:
descripción no vacía, cantidad entera ≥ 1, precio ≥ 0.

El motivo está en la §9: `app-campo` no es un `ControlValueAccessor` y no se enchufa a un
`formControlName`. Con tres campos triviales, signals es menos código que hacerla un CVA
para este caso.

«Quitar» un repuesto **sigue sin confirmación**, como hoy. Esta entrega reemplaza los
diálogos que existen; agregar uno nuevo es cambiar comportamiento, y esa decisión no
estaba en el alcance.

## 9. Panel de aprobación

Se muda dentro de la pestaña Cotización, encima del desglose, y se rediseña: los dos
botones por trabajo (Aprueba / Rechaza) pasan a `app-boton`, marcando la decisión elegida
por variante y no por color de Bootstrap, y «Registrar la respuesta» es el primario del
panel. La lógica —qué trabajos aparecen, cómo se acumulan las decisiones, cuándo se
manda— no cambia.

### La deuda que esta entrega hereda y no paga

`app-campo` y `app-select` exponen `valor` / `valorCambia`, no implementan
`ControlValueAccessor`. En esta entrega se nota una sola vez (§8) y se resuelve con
signals.

**La entrega C es la que tiene que decidir**, porque ahí están los formularios grandes
—orden, trabajo, login, registro, cambio de contraseña— y todos usan reactive forms hoy:
o las primitivas se vuelven CVA y los formularios quedan como están, o los formularios se
mudan a signals. Convertirlas ahora, con un solo caso de uso a la vista, sería diseñar la
API contra un ejemplo.

## 10. Reglas transversales

### Mensajes

| Origen | Dónde aparece |
|---|---|
| Falla al **cargar** una pantalla | Bloque de error en el cuerpo, donde iba el contenido |
| Resultado de una **acción** (eliminar, cancelar, entregar, mover, registrar) | Toast, éxito o error |

Los `alert alert-danger` que hoy quedan colgados arriba de la pantalla desaparecen de las
seis pantallas de esta entrega. La diferencia importa: un error de carga explica por qué
no hay nada que ver y tiene que quedarse; el resultado de una acción se lee y se va.

### Sustituciones

| Antes | Ahora |
|---|---|
| `app-spinner` | `app-esqueleto` con la forma del contenido |
| `app-badge-estado` | `app-pastilla` |
| `.card` | `app-tarjeta` o superficie propia |
| `.btn` | `app-boton` |
| `.table` | `.tabla` de `utilidades.css` |
| `.alert-info` de lista vacía | `app-estado-vacio` |
| `confirm()` | `app-confirmar` |
| `prompt()` | `app-modal` + `app-campo` |

### Ni una clase de Bootstrap

En los archivos que esta entrega toca no queda ninguna. Es la regla de la §9 de la
entrega A —un componente usa un sistema o el otro, nunca los dos— y acá es verificable:
un `grep` de las clases de Bootstrap sobre esos archivos tiene que salir vacío.

La excepción son las dos etiquetas `<app-formulario-trabajo>` y `<app-detalle-trabajo>`
del detalle de orden: son componentes de la entrega C, y lo que traen adentro es asunto
suyo.

## 11. Riesgos

| Riesgo | Mitigación |
|---|---|
| Dos componentes Bootstrap dentro de una pantalla nueva | Los dos quedan fuera de la vista inicial: el formulario se pliega tras «+ Trabajo» (§6) y el detalle solo aparece al pulsar «Detalle» en una tarjeta |
| La pestaña Cotización esconde información | Los totales quedan en la cabecera y la franja de aviso empuja a la pestaña cuando hay algo que registrar (§6) |
| El buscador miente cuando llegue la paginación | El contador «3 de 52» nombra el universo sobre el que filtra, y es lo que va a delatar el problema (§5) |
| El estado en la URL rompe enlaces guardados | El valor desconocido se ignora y cae en «Todas». Ningún estado que hoy funcione deja de funcionar |
| Las tarjetas del Kanban quedan estrechas | El tablero conserva el ancho completo del contenido: es la razón por la que el detalle lleva pestañas y no una barra lateral |
| La entrega crece sin control | El alcance de la §3 enumera seis archivos. Cualquier otro que aparezca en el diff es señal de que la entrega C se está colando |

## 12. Verificación

Nada de esto tiene tests unitarios que lo demuestren, así que la verificación es
explícita y se ejecuta con la aplicación corriendo —API en `localhost:3001` y frontend en
`localhost:4200`—, no se describe.

| Qué | Cómo |
|---|---|
| Compila | `npm run build` sin errores |
| Backend intacto | `git diff --stat backend/` vacío |
| Sin Bootstrap | `grep` de clases de Bootstrap en los archivos de la §3, vacío salvo las dos etiquetas de la §10 |
| Dashboard | Las tres cifras coinciden con la lista filtrada; en cero no enlazan; cada enlace cae en su pestaña |
| Lista | Recargar con `?estado=` conserva la pestaña; el buscador encuentra por placa y por propietario; el contador cuadra |
| Detalle | Las pestañas cambian; la franja aparece solo en `COTIZADA` y lleva a Cotización; los totales cuadran con el desglose |
| Kanban | Las seis transiciones de la fase 2b siguen funcionando; el modal del motivo manda el texto y cancelar no mueve nada |
| Diálogos | No queda ni un `confirm()` ni un `prompt()` en las pantallas de la §3 |
| Los dos temas | Recorrido completo en claro y en oscuro |
| Móvil | Viewport angosto: las pestañas se desplazan, el Kanban se apila, la tabla no desborda la pantalla |
| Teclado | `Tab` alcanza filas, pestañas y botones; `Esc` cierra los modales; el foco vuelve al cerrar |
| Movimiento reducido | Una pasada con `prefers-reduced-motion: reduce` |
| Pantallas de la C | Siguen abriéndose y viéndose como hoy: formulario de orden, detalle de trabajo, usuarios, ficha de vehículo, auth y perfil |

## 13. Límites conocidos

- **La aplicación sigue a dos velocidades**, ahora al revés: lo que se usa a diario está rediseñado y lo que se usa a veces sigue con Bootstrap. Se cierra en la entrega C.
- **El buscador solo ve lo cargado.** Hoy eso es todo; con paginación dejará de serlo.
- **Los contadores de las pestañas cuestan una petición más** en la lista de órdenes.
- **Las primitivas de formulario siguen sin ser CVA** (§9).
- **Quitar un repuesto sigue sin confirmación.**
- **Sigue sin haber tests de regresión visual.** Si un cambio en `tokens.css` estropea una de estas pantallas, se descubre mirando.
- **El Kanban se sigue moviendo con botones.**
