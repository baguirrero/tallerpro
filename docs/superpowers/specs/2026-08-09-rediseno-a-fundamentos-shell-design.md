# Rediseño · Entrega A — Fundamentos y shell — Diseño

**Fecha:** 2026-08-09
**Estado:** aprobado, listo para plan de implementación
**Antecedentes:** [`fase 0`](2026-08-08-fase-0-design.md) · [`fase 1`](2026-08-08-fase-1-design.md) · [`fase 2`](2026-08-08-fase-2-design.md) · [`fase 2b`](2026-08-09-fase-2b-design.md)

---

## 1. Objetivo

TallerPro se ve como Bootstrap por defecto. El frontend importa Bootstrap 5 entero
y tiene **quince líneas de CSS propio**: el fondo del `body`, la columna del Kanban
y un cursor. No hay tokens, ni tipografía elegida, ni escala de espaciado, ni modo
oscuro.

Este rediseño le da a la aplicación un lenguaje visual propio, con la temática de
Monday.com: color en el mueble y color en el dato. Es la **entrega A de tres**, y
construye lo que no existe todavía —los tokens, las primitivas y el shell— porque
ninguna pantalla se puede rediseñar contra un sistema que no está.

### Las tres entregas

| | Alcance | Depende de |
|---|---|---|
| **A** (esta) | Tokens, primitivas y shell con barra lateral | — |
| **B** | Dashboard, lista de órdenes, detalle de orden y Kanban | A |
| **C** | Auth, formularios, detalle de trabajo, usuarios, ficha de vehículo, perfil | A |

Cada una lleva su propio ciclo spec → plan → implementación, y **cada una deja la
aplicación funcionando**.

## 2. Decisiones tomadas

| Pregunta | Decisión |
|---|---|
| ¿Qué referente manda? | Monday: color en el mueble y en el dato, no solo en el dato |
| ¿Qué pasa con Bootstrap? | Convive durante las tres entregas y se retira al cerrar la C |
| ¿Dónde se usa la app? | Escritorio primero; el móvil funciona pero no manda |
| ¿Modo oscuro? | Sí, desde el principio, con las dos paletas completas |
| ¿Acento? | Azul eléctrico `#0073EA` — obliga a mudar «En proceso» al violeta |
| ¿Tipografía? | Inter, auto-hospedada |
| ¿Barra lateral? | Clara, con el activo en azul suave |
| ¿Modal propio? | Sí, en esta entrega — amplía la lista original a propósito (§7) |

**La regla que ordena el color:** el acento no se usa para ningún estado. Azul
significa «esto se puede pulsar»; nunca «esto está así».

## 3. Alcance

**Dentro**

- Tokens de color, espaciado, radios, sombras, tipografía y movimiento, en los dos temas.
- Reset propio, auto-hospedaje de Inter y utilidades de layout.
- Diez primitivas en `src/app/shared/ui/`.
- Shell: barra lateral, topbar, interruptor de tema, cajón móvil.
- El sistema de tema: preferencia del sistema, elección manual y persistencia.

**Fuera**

- Rediseñar cualquier pantalla → entregas B y C. Las pantallas actuales siguen con Bootstrap y **se ven como hoy**.
- Quitar Bootstrap → al cerrar la entrega C.
- Buscador global y notificaciones → no hay endpoints; ponerlos sería decorado (§6).
- Arrastrar tarjetas en el Kanban → sigue siendo por botones; el CDK no entró en el temario.
- Cualquier cambio en el backend. **Esta entrega no toca `backend/`.**

## 4. Tokens

Ningún componente nombra un color crudo. Los tokens son semánticos, de modo que el
tema oscuro es redefinir un bloque y nada más.

### Superficie, borde y texto

| Token | Claro | Oscuro |
|---|---|---|
| `--superficie` | `#FFFFFF` | `#18233A` |
| `--superficie-hundida` | `#F5F7FA` | `#101828` |
| `--superficie-elevada` | `#FFFFFF` | `#1E2B45` |
| `--borde` | `#E1E6EF` | `#26334A` |
| `--borde-fuerte` | `#C9D2E0` | `#35455F` |
| `--texto-primario` | `#172B4D` | `#E9EDF5` |
| `--texto-suave` | `#5B6B85` | `#98A5BC` |
| `--acento` | `#0073EA` | `#2F8FF5` |
| `--acento-hover` | `#0060C2` | `#58A6F7` |
| `--acento-suave` | `#E1EFFC` | `#1B2E4A` |
| `--acento-texto` | `#FFFFFF` | `#101828` |

### Estados de la orden y del trabajo

Cada estado es un par fondo/texto. Los siete de orden cubren también los cuatro de
trabajo, que son un subconjunto.

| Estado | Claro (fondo / texto) | Oscuro (fondo / texto) |
|---|---|---|
| Recibida · Pendiente | `#E6E9EF` / `#495468` | `#26314A` / `#AFB9CE` |
| Cotizada | `#FFF0CC` / `#8A5A00` | `#4A3A12` / `#F5C563` |
| En proceso | `#EAE2FC` / `#5B33B5` | `#33245C` / `#B79BF5` |
| Esperando repuesto | `#FFE0CC` / `#9A4400` | `#5A3212` / `#F5A96B` |
| Finalizada · Completado | `#D3F5E0` / `#14663A` | `#12452B` / `#72D89D` |
| Entregada | `#323C4E` / `#FFFFFF` | `#8791A6` / `#101828` |
| Cancelada | `#FFDCDC` / `#A11B1B` | `#5A1C1C` / `#F58F8F` |

Dos cambios sobre lo que hay hoy, los dos deliberados:

- **«En proceso» pasa del azul al violeta**, porque el azul es ahora el color de lo pulsable.
- **«Cotizada» y «Esperando repuesto» dejan de compartir el ámbar.** Hoy las dos son
  `warning` de Bootstrap y compiten; son esperas distintas —una espera al cliente, la
  otra al proveedor— y ahora se distinguen: ámbar y naranja.

### Prioridad, que no es un estado

`BAJA`, `MEDIA` y `ALTA` **no se dibujan como pastilla**, sino como un punto de color
más el texto en `--texto-suave`. Si fueran pastillas competirían con el estado en la
misma tarjeta, que es exactamente el ruido que este rediseño viene a quitar.

| Prioridad | Punto |
|---|---|
| Baja | `#94A3B8` |
| Media | `#F59E0B` |
| Alta | `#DC2626` |

### Feedback, separado de los estados

Para validaciones y toasts. Van aparte de los estados a propósito: si el error de un
formulario reusara el rojo de «Cancelada», cambiar uno rompería el otro en silencio.

| Token | Claro (fondo / texto) | Oscuro (fondo / texto) |
|---|---|---|
| `--exito` | `#E3F7EB` / `#0E7A43` | `#123D28` / `#56C88A` |
| `--error` | `#FDE7E7` / `#C42B2B` | `#4D1A1A` / `#F08585` |
| `--aviso` | `#FFF6E0` / `#8A5D00` | `#3F3110` / `#E8B44C` |

El ámbar de aviso es `#8A5D00` y no el `#9A6800` que pedía la intuición: ese medía
4.48 sobre su fondo, justo por debajo de AA. Oscurecerlo dos pasos lo deja en 5.35.

### Escalas

```css
/* espaciado, base 4 */
--e1: 4px;  --e2: 8px;  --e3: 12px; --e4: 16px;
--e6: 24px; --e8: 32px; --e12: 48px; --e16: 64px;

/* radios */
--r-sm: 6px;    /* input, botón, pastilla pequeña */
--r-md: 10px;   /* tarjeta, modal */
--r-full: 999px;

/* tipografía — base 14 en cuerpo, 13 en tabla */
--t-etiqueta: 11px;  --t-menor: 12px;  --t-tabla: 13px;
--t-base: 14px;      --t-titulo: 16px; --t-h2: 20px;  --t-h1: 24px;

/* sombras: siempre acompañadas de borde */
--sombra-1: 0 1px 2px rgba(23,43,77,.06);
--sombra-2: 0 4px 12px rgba(23,43,77,.08);
--sombra-3: 0 12px 32px rgba(23,43,77,.14);

/* movimiento */
--dur-rapida: 120ms;  --ease-salida:  cubic-bezier(.16, 1, .3, 1);
--dur-media:  180ms;  --ease-entrada: cubic-bezier(.4, 0, 1, 1);
--dur-lenta:  260ms;  --ease-suave:   cubic-bezier(.4, 0, .2, 1);

/* layout del shell */
--ancho-barra: 240px;  --alto-topbar: 56px;
```

En tema oscuro las sombras cambian a negro con más opacidad: sobre superficies
oscuras una sombra azulada al 6 % no se ve.

### Inter, auto-hospedada

La fuente variable se sirve desde `public/fonts/`, no desde Google Fonts: una
petición menos a un tercero, funciona sin internet, y en Render no se depende de un
CDN externo. Se declara con `font-display: swap` y se precarga desde `index.html`.

Las cifras llevan `font-variant-numeric: tabular-nums` en tablas, importes, placas y
correlativos. Sin eso las columnas de dinero bailan, que es el defecto más visible de
la lista de órdenes actual.

## 5. Arquitectura de archivos

```
frontend/src/
├── styles/
│   ├── tokens.css       variables, claro y oscuro
│   ├── base.css         reset, tipografía, foco visible
│   └── utilidades.css   solo layout, texto y tabla — nada de componentes
├── styles.css           importa los tres, y nada más
└── app/
    ├── shared/ui/       las primitivas del sistema
    └── core/services/tema.ts   el servicio de tema
```

`styles.css` se queda como único punto de entrada declarado en `angular.json`, y
pasa a ser tres `@import`. Trocearlo por responsabilidad evita el archivo único que
crece sin control, que es como empezó el actual.

**Las primitivas son componentes Angular, no clases CSS.** El proyecto ya tiene el
patrón —`badge-estado` es un componente— y así el movimiento vive dentro del
componente que lo necesita, en vez de en una hoja global que nadie asocia con nada.
Van con prefijo `app-`, como el resto del proyecto.

## 6. El shell

Reemplaza `app.html` completo. La barra lateral es clara, con el elemento activo en
`--acento-suave` y texto en `--acento-hover`.

```
┌──────────────┬────────────────────────────────────────┐
│ 🔧 TallerPro │  Órdenes            ◐ tema    CM ▾     │  ← topbar 56px
├──────────────┼────────────────────────────────────────┤
│ ◻ Inicio     │                                        │
│ ▤ Órdenes    │   contenido, ancho máximo 1280px       │
│ ◻ Usuarios   │                                        │
│              │                                        │
│ ACCIONES     │                                        │
│ ＋ Nueva orden│                                       │
└──────────────┴────────────────────────────────────────┘
   240px
```

**Navegación:** Inicio · Órdenes · Usuarios (solo Administrador) · Nueva orden. La
visibilidad por rol reusa `TokenService.tieneRol()`, que ya existe.

**Topbar:** título de la sección, interruptor de tema y menú de usuario con Perfil y
Salir.

**Móvil:** por debajo de 768 px la columna se va a un cajón que entra desde la
izquierda con el botón ☰, con velo detrás y cierre con `Esc`.

**Sin sesión** —login y registro— no hay barra lateral ni topbar: el contenido se
centra en la pantalla. El shell ya distingue ese caso hoy con
`@if (tokenService.estaAutenticado())`.

### Lo que no lleva, y por qué

- **Buscador global:** no existe endpoint de búsqueda. Un campo que no busca es mentira.
- **Notificaciones:** no hay nada que notificar hasta la fase 4.
- **«Vehículos» en el menú:** no hay ruta de listado, solo `/vehiculos/:id`. Enlazarlo daría 404.

### El detalle que rompe si se pasa por alto

Hoy `app.html` envuelve el `router-outlet` en un `.container` de Bootstrap, y **las
dieciocho plantillas del proyecto están escritas asumiendo ese ancho máximo y ese
padding**. El shell nuevo reemplaza ese contenedor, así que su área de contenido debe
conservar un ancho máximo y un padding equivalentes. Si se sustituye por un contenedor
a sangre, todas las pantallas de las entregas B y C se estiran de borde a borde y la
aplicación parece rota durante dos entregas.

### El servicio de tema

`core/services/tema.ts`, con la misma forma que `TokenService`: un signal expuesto,
persistencia en `localStorage` y lectura inicial de `prefers-color-scheme` cuando no
hay preferencia guardada. Escribe `data-tema="oscuro"` en el elemento raíz.

Para evitar el destello blanco al cargar en tema oscuro, `index.html` lleva un script
en línea de tres líneas que aplica el atributo antes de que Angular arranque.

## 7. Primitivas

| Componente | Anatomía y estados |
|---|---|
| `app-boton` | variantes primario · secundario · fantasma · peligro; tamaños sm/md; `cargando`; icono opcional; deshabilitado |
| `app-campo` | etiqueta, input, texto de ayuda y error; estados foco, error y deshabilitado |
| `app-select` | mismo envoltorio que `app-campo`, para que un formulario se lea uniforme |
| `app-pastilla` | absorbe `badge-estado`; recibe el estado y resuelve el par de tokens |
| `app-tarjeta` | superficie con borde, cabecera opcional y cuerpo |
| `app-toast` + `ToastService` | éxito · error · aviso; se apila abajo a la derecha; se va solo a los 5 s |
| `app-esqueleto` | rectángulo con pulso, en variantes de texto, fila y tarjeta |
| `app-estado-vacio` | icono, mensaje y acción opcional |
| `app-modal` | contenedor con velo, cabecera, cuerpo y pie; cierra con `Esc` y con clic en el velo |
| `app-confirmar` | sobre `app-modal`: mensaje, confirmar y cancelar; variante peligro |

**La tabla no es componente.** Son clases en `utilidades.css` más `app-esqueleto` y
`app-estado-vacio` alrededor. Envolverla en un componente Angular obligaría a inventar
una API de columnas que ninguna de las tres tablas del proyecto necesita.

**Por qué el modal entra en esta entrega**, ampliando la lista original: la aplicación
usa hoy `confirm()` del navegador para borrar y `prompt()` para pedir el motivo de
espera. Son diálogos del sistema operativo —no se pueden estilar, y en Monday o ClickUp
no existen—. Construirlo aquí hace que la entrega B sea solo pantallas; dejarlo para
después la bloquearía.

Ninguna primitiva se conecta a la API ni conoce el dominio, con una excepción
consciente: `app-pastilla` conoce los nombres de los estados, porque su trabajo es
justamente traducirlos a color y etiqueta.

## 8. Movimiento

Cinco reglas, y de ellas salen los tokens de §4:

1. **Solo `transform` y `opacity`.** Nada que provoque relayout.
2. **Las entradas usan ease-out y las salidas son más cortas.** Aparecer se disfruta; desaparecer estorba.
3. **El movimiento tiene origen.** Un menú crece desde el botón que lo abrió, no desde el centro de la nada.
4. **Lo que se espera instantáneo no se anima.** Mover una tarjeta del Kanban debe sentirse inmediato; animar esa transición la haría sentir lenta aunque la API responda igual.
5. **`prefers-reduced-motion: reduce` apaga desplazamientos y escalas** y deja solo la opacidad. No es una casilla que marcar: a algunas personas esto les produce náuseas.

Qué anima, concretamente:

| Elemento | Movimiento |
|---|---|
| Botón | `scale(.97)` al presionar, 120 ms — es lo que le da tacto |
| Nav activo | el indicador se desliza entre elementos, 180 ms |
| Toast | entra desde abajo, 8 px y opacidad, 180 ms; sale en 120 ms |
| Modal | escala de `.98` a `1` más opacidad, 180 ms; el velo, 120 ms |
| Cajón móvil | entra desde la izquierda, 260 ms |
| Esqueleto | pulso de opacidad, 1.4 s en bucle |

**El cambio de tema no se anima.** Transicionar el color de cientos de elementos a la
vez produce un barrido sucio y cuesta caro. Cambio instantáneo; lo que se mueve es el
icono del interruptor.

## 9. Convivencia con Bootstrap

Bootstrap sigue cargado durante las tres entregas y se retira al cerrar la C.

**La regla, que hay que respetar con disciplina:** un componente usa el sistema nuevo
o usa Bootstrap, **nunca los dos**. Mezclar `.btn` con `<app-boton>` en la misma
plantilla produce las guerras de especificidad que hacen odiosa este tipo de transición.

El encapsulado de estilos de Angular acota las primitivas nuevas. En sentido contrario
no protege —los estilos globales de Bootstrap sí alcanzan a los elementos dentro de un
componente—, así que las primitivas fijan explícitamente lo que Bootstrap podría
imponerles: `font`, `line-height`, `border`, `background` y `border-radius`.

Costo durante la transición: unos 30 KB comprimidos de más. Se acepta.

## 10. Accesibilidad y contraste

Los pares de la §4 están medidos, no estimados. **Todos superan AA (≥ 4.5)** en los
dos temas:

| Estado | Claro | Oscuro |
|---|---|---|
| Recibida | 6.28 | 6.57 |
| Cotizada | 5.25 | 6.85 |
| En proceso | 6.49 | 5.83 |
| Esperando repuesto | 5.24 | 5.67 |
| Finalizada | 5.99 | 6.29 |
| Entregada | 11.10 | 5.60 |
| Cancelada | 6.15 | 5.69 |

Y el mueble: texto principal 14.10, texto suave 5.40, nav activo 5.20, texto en oscuro
13.35. Los tres pares de feedback de la §4 también están medidos y pasan: entre 4.76 y
6.67 según el caso.

**El botón primario sale en 4.53**, apenas por encima del umbral. Pasa, pero sin
margen. Si en uso se ve flojo, la salida es oscurecer el acento a `#0068D4`, que sube a
5.1 sin cambiar de familia.

Además: foco visible en todo lo enfocable con un anillo de dos píxeles en `--acento`;
`Tab` recorre la aplicación entera; `Esc` cierra modal y cajón; el modal atrapa el foco
mientras está abierto y lo devuelve al cerrar; los iconos que van solos llevan
`aria-label`.

## 11. Verificación

Nada de esto tiene tests unitarios que lo demuestren, así que la verificación es
explícita:

| Qué | Cómo |
|---|---|
| Compila | `npm run build` sin errores |
| Peso | El `dist` parte de **812 KB**. Se admite crecer hasta **~1 MB**: Inter variable en subconjunto latino (~110 KB) más los estilos propios (~20 KB). Si crece mucho más, algo se coló |
| Se ve bien | Recorrido en pantalla con la app corriendo, en claro y en oscuro |
| Móvil | Viewport estrecho: el cajón entra, cierra y no deja el fondo desplazable |
| Contraste | El script de medición se vuelve a correr si se toca un color |
| Teclado | `Tab` completo, foco siempre visible, `Esc` cierra modal y cajón |
| Movimiento reducido | Una pasada con `prefers-reduced-motion: reduce` activado |
| Convivencia | **Las pantallas que siguen con Bootstrap se abren y se ven como hoy** |
| Backend intacto | `npm test` y `npm run test:e2e` siguen en verde: esta entrega no toca `backend/` |

## 12. Límites conocidos

- **La aplicación queda a dos velocidades** hasta la entrega C: shell nuevo, pantallas viejas. Es el precio de no romperla, y se ve raro pero funciona.
- **No hay tests de regresión visual.** Si un cambio en `tokens.css` estropea una pantalla, se descubre mirando. Montar capturas comparadas es más máquina de la que este proyecto justifica hoy.
- **El sistema no está documentado en una página propia.** No hay un catálogo de componentes navegable; la referencia es la spec y el código.
- **El Kanban se sigue moviendo con botones.** Arrastrar pide el CDK de Angular, que quedó fuera del temario del curso.
- **Los iconos son caracteres,** no una librería. Es suficiente para esta entrega y evita otra dependencia; si la entrega B pide iconografía de verdad, se decide ahí.

## 13. Riesgos

| Riesgo | Mitigación |
|---|---|
| El shell rompe las pantallas que aún no se rediseñan | El área de contenido conserva el ancho máximo y el padding del `.container` que reemplaza (§6). Se verifica abriendo las ocho pantallas de la entrega C |
| Bootstrap pisa las primitivas nuevas | Cada primitiva fija explícitamente `font`, `line-height`, `border`, `background` y `border-radius`, que es lo que Bootstrap impone globalmente |
| El tema oscuro se queda a medias | Los tokens son la única fuente de color: un componente que se vea mal en oscuro delata que nombró un color crudo, y eso se busca con un grep de `#` en los estilos de `shared/ui/` |
| Destello blanco al cargar en tema oscuro | Script en línea en `index.html` que aplica `data-tema` antes de que Angular arranque |
| El movimiento se siente lento o mareante | Duraciones cortas por defecto (120–260 ms), y `prefers-reduced-motion` respetado desde el primer componente y no como parche final |
| La entrega crece sin control | Las primitivas están enumeradas y cerradas en §7. Cualquier componente que aparezca y no esté en esa lista es señal de que una pantalla se está colando en esta entrega |
