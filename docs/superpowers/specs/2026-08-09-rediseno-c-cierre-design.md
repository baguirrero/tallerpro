# Rediseño · Entrega C — El resto y el retiro de Bootstrap — Diseño

**Fecha:** 2026-08-09
**Estado:** aprobado, listo para plan de implementación
**Antecedentes:** [`entrega A`](2026-08-09-rediseno-a-fundamentos-shell-design.md) · [`entrega B`](2026-08-09-rediseno-b-pantallas-nucleo-design.md)

---

## 1. Objetivo

La entrega A construyó el sistema y no tocó ninguna pantalla. La entrega B movió
las tres que el taller usa a diario. Quedan ocho, y queda Bootstrap cargado.

Esta entrega las mueve y **cierra la transición**: al terminar, TallerPro no
depende de Bootstrap ni queda un solo diálogo del navegador. Es la última de las
tres, y la única cuyo entregable principal es una resta.

Dos decisiones la caracterizan, y ninguna es de aspecto:

- **`app-campo` y `app-select` se vuelven `ControlValueAccessor`** (§3). Es la
  decisión que la entrega B dejó explícitamente abierta por falta de casos.
- **El detalle de trabajo se muda a un panel lateral** (§5). Hoy se dibuja debajo
  del tablero y hay que pasar el Kanban entero para leer un comentario.

## 2. Decisiones tomadas

| Pregunta | Decisión |
|---|---|
| ¿Reactive forms o signals? | Las primitivas se vuelven CVA; los seis formularios quedan como están |
| ¿Una entrega o dos? | Una. Quitar Bootstrap **es** la comprobación de que no quedó nada a medias |
| ¿Dónde vive el detalle de trabajo? | Panel lateral que entra desde la derecha |
| ¿Cuánto cambia el login? | Conserva la tarjeta centrada; cambian tokens y primitivas |
| ¿Selector de archivos como primitiva? | No. Un solo sitio de uso; se resuelve local (§4) |

## 3. Las primitivas se vuelven `ControlValueAccessor`

### El problema

`app-campo` y `app-select` exponen `valor` / `valorCambia`. Eso no se enchufa a un
`formControlName`, y hay **26 repartidos en seis pantallas**:

| Pantalla | Controles |
|---|---|
| `formulario-orden` | 9 |
| `formulario-trabajo` | 6 |
| `registro` | 5 |
| `cambiar-password` | 3 |
| `login` | 2 |
| `detalle-trabajo` | 1 |

### La decisión, y el caso que la decide

Las primitivas implementan `ControlValueAccessor` y **los seis formularios
conservan sus `FormGroup`, sus validadores y sus tuberías**. Solo cambia el
markup.

El caso que cierra la discusión es el autocompletado por placa de
`formulario-orden`:

```ts
this.formulario.controls.placa.valueChanges.pipe(
  debounceTime(400),
  map((placa) => placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase()),
  distinctUntilChanged(),
  filter((placa) => placa.length >= 6),
  switchMap((placa) => this.vehiculoService.buscarPorPlaca(placa)...),
)
// …y al encontrarlo, patchValue({...}, { emitEvent: false })
```

Reescribir eso con signals es rehacer a mano la parte más delicada del proyecto
—incluido el `emitEvent: false` que evita el bucle— a cambio de nada. La entrega
B resolvió su único caso con signals porque eran tres campos triviales; con
veintiséis controles y esta tubería a la vista, la respuesta se invierte.

### Las dos formas conviven, y no es una inconsistencia

Las primitivas siguen aceptando `valor` / `valorCambia`. El editor de repuestos
de la entrega B las usa así y no hay razón para tocarlo. Son **dos maneras de
conectar la misma primitiva**, no dos primitivas ni dos sistemas de formularios:
la regla es que un formulario con `FormGroup` usa `formControlName`, y un puñado
de campos sueltos usa `valor`.

### El error deja de pasarse a mano

Hoy cada plantilla decide si mostrar el error y con qué texto. Con CVA la
primitiva conoce su propio control y muestra el mensaje cuando el control está
**inválido y tocado** —no antes, para no gritarle a alguien que todavía no
escribió nada—.

Los textos salen de un mapa único:

| Error de Angular | Mensaje |
|---|---|
| `required` | Este campo es obligatorio |
| `minlength` | Mínimo {n} caracteres |
| `email` | Correo electrónico no válido |
| `min` | El valor mínimo es {min} |
| `max` | El valor máximo es {max} |

`min` y `max` son **dos mensajes separados**, no uno que diga «entre X e Y».
Angular los emite por separado —`{min: 1950, actual: 1900}`— y nunca los dos a la
vez, así que desde un solo error no hay forma de saber el otro extremo.

El input `error` sigue existiendo y **pisa** al mapa: es la vía por la que un
mensaje del servidor llega al campo, como el «Esa placa ya existe con otros
datos» que el catálogo ya muestra.

### Qué se toca de la primitiva

`app-campo` y `app-select` ganan `NG_VALUE_ACCESSOR`, `writeValue`,
`registerOnChange`, `registerOnTouched` y `setDisabledState`. Este último importa:
hoy el deshabilitado es un input, y con reactive forms también llega por
`form.disable()`. Los dos caminos tienen que terminar en el mismo sitio.

**Un CVA no puede tener `input.required`.** El valor llega por `writeValue`, así
que `valor` queda opcional con `''` por defecto, que es lo que ya es.

## 4. Primitivas nuevas: dos, y solo dos

| Nueva | Qué es | Quién la pide |
|---|---|---|
| `app-area` | `<textarea>` con el mismo envoltorio, etiqueta, ayuda y error que `app-campo`; también CVA | Descripción de la orden y el campo de comentario |
| `app-panel` | El panel lateral de la §5 | Detalle de trabajo |

Con esto el sistema queda en **trece** primitivas.

### El campo de comentario pasa a ser un área

Hoy hay **un solo `<textarea>`** en todo el proyecto: la descripción de la orden.
El campo de comentario del detalle de trabajo es un `<input type="text">`, y eso
es una limitación real, no una elección: un comentario es prosa —«la junta llegó
rota, pedí otra al proveedor, avisar al cliente»— y escribirlo en un renglón de
una línea sin poder ver lo que uno escribió es incómodo.

Pasa a `app-area` de dos filas. **Consecuencia que hay que aceptar a propósito:**
`Enter` deja de enviar y pasa a hacer salto de línea. El envío queda solo en el
botón «Comentar», que ya existe y ya es el camino visible.

La descripción del trabajo **se queda en una línea**: su etiqueta actual dice
«Descripción (opcional)» y en la práctica se usa como un rótulo corto, no como
prosa. Convertirla también sería agrandar un campo que nadie pidió agrandar.

Con eso `app-area` nace con dos usos, que es el mismo criterio con el que la
entrega B extrajo `app-prioridad` y con el que esta entrega **no** extrae el
selector de archivos.

### El selector de archivos no es primitiva

Se usa en un solo sitio —subir un adjunto— y un selector decente es un problema
propio: arrastrar y soltar, previsualizar, progreso, validar tipo y tamaño antes
de mandar. Convertirlo en primitiva a partir de un caso sería inventar una API
contra un solo ejemplo, que es exactamente el error que esta misma entrega evita
en §3 al no mudar los formularios.

Se resuelve local en el detalle de trabajo: un `app-boton` que dispara un
`<input type="file">` oculto, y el nombre del archivo elegido a su lado. Si la
fase 4 pide subir fotos desde el móvil, se extrae ahí con el problema completo a
la vista.

## 5. El panel lateral

```
┌──────────────────────────────┐┌───────────────────┐
│ Pend  Proc  Espera  Compl    ││ Cambio de aceite ✕│
│ ┌───┐ ┌───┐        ┌───┐     ││ [En proceso]      │
│ │   │ │▪▪▪│        │   │     ││                   │
│ └───┘ └───┘        └───┘     ││ COMENTARIOS (2)   │
│                              ││ Pedro · 10:24     │
│                              ││ Falta la junta    │
│                              ││ [escribir…]  [→]  │
│                              ││                   │
│                              ││ ADJUNTOS (1)      │
│                              ││ 📎 foto.jpg  2 MB │
│                              ││ [Elegir] [Subir]  │
└──────────────────────────────┘└───────────────────┘
```

`app-panel` entra desde la derecha, **420 px**, a sangre de arriba abajo, con
velo. Cabecera con título, contenido con scroll propio y ranura de pie opcional.

**Reusa lo que `app-modal` ya resolvió**, y esa es la razón de que sea una
primitiva chica y no una desde cero: `Esc`, clic en el velo, trampa de foco
mientras está abierto y devolución del foco al cerrar. La diferencia con el modal
es de forma y de intención —el modal interrumpe para preguntar algo corto; el
panel acompaña mientras se sigue viendo el contexto—, no de mecánica.

Por debajo de 768 px ocupa el ancho completo, como el cajón del shell.

**Movimiento:** entra desde la derecha en 260 ms con `--ease-salida`, la misma
duración que el cajón móvil, porque es el mismo gesto. Con
`prefers-reduced-motion: reduce` solo aparece.

### Por qué no el modal que ya existe

`app-modal` mide 460 px y está pensado para una pregunta corta. Meterle una lista
de comentarios que crece más un subidor de archivos obliga a ensancharlo y a
darle scroll interno: termina siendo el panel lateral, pero centrado, más angosto
y tapando el tablero que uno quiere seguir viendo.

## 6. Pantalla por pantalla

### Login y registro

Conservan la tarjeta centrada; es la única forma que no cambia. Son cuatro
usuarios entrando una vez al día en un taller de una sede: una portada a dos
columnas sería superficie que después hay que mantener.

Cambia el interior: tokens, Inter, `app-campo` y `app-boton`. **El error de
credenciales pasa a toast**, siguiendo la regla de la entrega B —resultado de una
acción, no fallo de carga—.

Son las únicas dos pantallas sin shell, y eso no cambia: `app.html` ya distingue
el caso con `@if (tokenService.estaAutenticado())`.

### Formulario de orden

El más grande de los ocho: nueve controles, y el único con lógica propia que vale
la pena. Se conservan **tal cual** las dos cosas que lo hacen útil:

- El aviso de **vehículo conocido**, que aparece cuando la placa ya existe y
  autocompleta marca, modelo, año y propietario.
- La tabla de **diferencias** del `409`, que aparece cuando la placa existe con
  otros datos y ofrece pisarlos con `actualizar_vehiculo`.

Ninguna de las dos cambia de comportamiento: cambian de aspecto. La rejilla es
`display: grid` con las columnas de la entrega A, y los tres bloques de hoy
—vehículo, propietario, servicio— se conservan como agrupación, porque describen
tres cosas distintas.

### Formulario de trabajo

Seis controles, incluido el `<select>` de mecánico y el `app-area` de
descripción. Vive plegado dentro del detalle de orden desde la entrega B, así que
al rediseñarlo **desaparece el último bloque Bootstrap visible de esa pantalla**.

El campo de mano de obra conserva su ayuda actual, que dice algo que no es obvio:
vacío es «sin cotizar» y `0` es un precio.

### Cambiar contraseña

Tres campos, el más simple. Tarjeta angosta centrada en el contenido del shell.

### Detalle de trabajo

Se muda al panel lateral (§5). Dentro:

- Cabecera con el título y la pastilla de estado.
- **Comentarios**: la lista con autor y fecha, y el `app-area` para escribir uno
  (§4). La lista vacía usa `app-estado-vacio` en su variante chica.
- **Adjuntos**: la lista con nombre, tamaño, quién lo subió y fecha; el enlace
  abre en pestaña nueva como hoy. Debajo, el selector de archivo de §4 con su
  línea de formatos y tamaño admitidos.
- **El `confirm()` de borrar un adjunto pasa a `app-confirmar`.** Es el último
  diálogo del navegador del proyecto.

### Lista de usuarios

Tabla con `.tabla` dentro de un `.panel` con `.tabla-envoltura`, las tres clases
que la entrega B dejó en `utilidades.css`. El estado activo/inactivo se dibuja con
una pastilla propia de la pantalla, **no con `app-pastilla`**: activo no es un
estado de orden ni de trabajo, y meterlo en el diccionario de estados repetiría el
error que la entrega B evitó con las marcas de aprobación.

**Activar o desactivar un usuario pasa por `app-confirmar`.** Es el otro
`confirm()` que queda hoy.

### Ficha de vehículo

Cabecera con la placa, los datos del vehículo y del propietario, y la tabla del
historial con `app-pastilla` por orden. Es la pantalla más simple de las ocho.

## 7. El retiro de Bootstrap

Es la **última tarea**, y su verificación no es un `npm run build` en verde: es
recorrer las once rutas.

En orden:

1. Quitar de `angular.json` las dos líneas: `bootstrap.min.css` y
   `bootstrap.bundle.min.js`.
2. `npm uninstall bootstrap`.
3. Borrar `src/app/shared/components/` entero —`spinner` y `badge-estado`—, que
   sobreviven desde la entrega B solo porque estas pantallas los usaban.
4. Recorrer las once rutas en los dos temas.

**El `bundle.min.js` se puede quitar sin ceremonia:** un `grep` de `data-bs-` y de
`bootstrap` sobre `src/app/` no devuelve nada. Ningún componente usa el JavaScript
de Bootstrap; se cargaba por costumbre.

### Las dos redes antes de llegar

- **Un `grep` de clases de Bootstrap sobre `features/`, que debe dar cero.** Hoy
  quedan 157 repartidas en los ocho archivos de esta entrega:

  | Pantalla | Clases |
  |---|---|
  | `formulario-orden` | 43 |
  | `formulario-trabajo` | 26 |
  | `registro` | 21 |
  | `detalle-trabajo` | 20 |
  | `cambiar-password` | 15 |
  | `ficha-vehiculo` | 13 |
  | `login` | 11 |
  | `lista-usuarios` | 8 |

  El patrón lleva `\b` **a los dos lados** del grupo. Sin el de cierre, `table`
  coincide dentro de `tablero` y la clase propia `class="tablero"` se reporta como
  Bootstrap; pasó al verificar la entrega B.

- **El peso del `dist`.** Viene de 812 KB en la entrega A y 932 KB al cerrar la B.
  Esta entrega es la primera que debería **bajarlo**: se van unos 30 KB
  comprimidos de CSS más el bundle de JS. Si no baja, Bootstrap no salió del todo.

### El riesgo real

Que una pantalla dependa de un estilo base de Bootstrap que nadie escribió a
propósito: el margen de un `<p>`, el `border-collapse` de una `<table>`, el
tamaño de un `<h5>`. Eso no lo detecta ningún `grep`, porque no hay una clase que
buscar —es el `reboot` actuando sobre etiquetas desnudas—.

Por eso el retiro va acompañado del recorrido completo, y por eso es la última
tarea y no la primera: cuando llegue, las once rutas ya deberían estar sobre el
sistema propio, y lo que se rompa será poco y evidente.

`styles/base.css` ya trae reset propio desde la entrega A, así que la red está
puesta; lo que falta es comprobar que alcanza.

## 8. Verificación

| Qué | Cómo |
|---|---|
| Compila | `npm run build` sin errores |
| Tests | La suite de Karma en verde; los nuevos cubren los mensajes de error del CVA |
| Backend intacto | `git diff --stat master -- backend/` vacío |
| Sin Bootstrap | El `grep` de la §7 sobre `features/`, vacío |
| Sin diálogos del navegador | `grep` de `confirm(` y `prompt(` sobre `src/app/`, vacío |
| Formularios | Los seis validan como hoy: campo obligatorio vacío, mínimos, y el envío deshabilitado mientras el formulario es inválido |
| Autocompletado por placa | Escribir una placa conocida rellena marca, modelo, año y propietario; una desconocida no muestra error |
| Conflicto de placa | Una placa existente con otros datos muestra la tabla de diferencias y deja pisarlos |
| Panel lateral | Abre desde una tarjeta, el tablero sigue visible, `Esc` y el velo cierran, el foco vuelve a la tarjeta |
| Adjuntos | Subir un archivo, verlo en la lista, y borrarlo pasando por `app-confirmar` |
| Usuarios | Activar y desactivar pasando por `app-confirmar` |
| Las once rutas | Recorrido completo en claro y en oscuro |
| Móvil | Viewport de 375 px en las once; el panel lateral ocupa el ancho completo |
| Teclado | `Tab` completo con foco visible; `Esc` cierra panel, modal y cajón |
| Contraste | `node scripts/contraste.mjs` en verde |
| Peso | El `dist` **baja** respecto de los 932 KB de la entrega B |

## 9. Límites conocidos

- **El selector de archivos sigue siendo un `<input type="file">`**, sin arrastrar
  ni previsualizar (§4).
- **Sin tests de regresión visual.** Sigue siendo el hueco que arrastra el
  rediseño entero: si un cambio en `tokens.css` estropea una pantalla, se
  descubre mirando.
- **El Kanban se sigue moviendo con botones.** El CDK no entró en el temario y
  esta entrega no lo cambia.
- **Los iconos siguen siendo caracteres**, no una librería.
- **Queda deuda que el rediseño no toca**: el interceptor no reacciona al `401`, y
  no hay paginación ni índices sobre `placa`, `estado` y `asignado_a`. Lo segundo
  arrastra al buscador de la lista de órdenes, que hoy filtra sobre lo cargado
  porque hoy se carga todo.

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| Un estilo base de Bootstrap sostenía algo sin que se note | El retiro es la última tarea y va con las once rutas recorridas, no con un build en verde (§7) |
| El CVA rompe un formulario que hoy funciona | Los `FormGroup` y los validadores no se tocan: cambia el markup. Cada formulario se ejercita con su validación y su envío |
| El autocompletado por placa se rompe al cambiar el markup | Es la razón de elegir CVA (§3). Se verifica con placa conocida, desconocida y en conflicto |
| El panel lateral duplica la lógica del modal | Comparte el mecanismo: velo, `Esc`, trampa de foco y devolución. Si al implementarlo aparece copiar y pegar, se extrae a algo común antes de seguir |
| `setDisabledState` se olvida y el deshabilitado deja de funcionar | Está enumerado en §3 y entra en la verificación del formulario que lo usa |
| La entrega crece sin control | El alcance es ocho pantallas, dos primitivas nuevas y una resta. Cualquier otra primitiva que aparezca es señal de que algo se está colando |
