# Rediseño · Entrega A — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dotar a TallerPro de un sistema de diseño propio —tokens, diez primitivas y un shell con barra lateral, en tema claro y oscuro— sin romper ninguna de las pantallas que todavía usan Bootstrap.

**Architecture:** Los tokens son variables CSS semánticas en `src/styles/`, de modo que el tema oscuro es redefinir un bloque y ningún componente nombra un color crudo. Las primitivas son componentes Angular standalone en `src/app/shared/ui/`, cada una con su movimiento dentro. El shell reemplaza `app.html` y envuelve **todas** las pantallas de golpe, así que conserva el ancho máximo y el padding del `.container` de Bootstrap que sustituye.

**Tech Stack:** Angular 20 (standalone, signals), CSS custom properties, Inter variable vía `@fontsource-variable/inter`, Jasmine + Karma con ChromeHeadless, Bootstrap 5 en convivencia temporal.

**Spec:** `docs/superpowers/specs/2026-08-09-rediseno-a-fundamentos-shell-design.md`

## Global Constraints

- Rama de trabajo: `rediseno-a`, ya creada. No commitear a `master`.
- Mensajes de commit en español, conventional commits en minúscula. Todo commit termina con el trailer `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.
- **Esta entrega no toca `backend/`.** Si un cambio parece necesitarlo, es señal de que se salió del alcance.
- **Nunca correr `npm run lint`**: es `eslint --fix` sobre todo `src` y reformatea archivos ajenos.
- Tests del frontend: `npx ng test --watch=false --browsers=ChromeHeadless` desde `frontend/`. Hoy hay **cero** specs; este plan añade la primera.
- **El acento nunca es el color de un estado.** Azul significa «esto se puede pulsar»; nunca «esto está así».
- **Ningún componente nombra un color crudo.** Todo color sale de un token de `tokens.css`.
- **Un componente usa el sistema nuevo o usa Bootstrap, nunca los dos.**
- Solo se anima `transform` y `opacity`. Toda animación se apaga bajo `prefers-reduced-motion: reduce`.
- Nombres de dominio en español; prefijo `app-` en los selectores, como el resto del proyecto.
- El `dist` parte de **812 KB** y se admite hasta **~1 MB**.

---

## Desvíos deliberados respecto del spec

Dos, los dos para poder verificar lo que se construye:

1. **Se añade una ruta `/ui` con el catálogo de primitivas.** El spec la listaba como límite conocido («el sistema no está documentado en una página propia»). Sin ella, las tareas 4 a 7 construyen componentes que no se pueden mirar en ningún sitio hasta la entrega B, y verificar «se ve bien» sería imposible. Es una pantalla estática de unas 150 líneas que además sirve de referencia en las entregas B y C.
2. **Las primitivas usan `template` y `styles` en línea**, no `templateUrl`. El proyecto usa `templateUrl` incluso para componentes de una línea, pero en una primitiva el marcado y sus estilos no significan nada por separado: tenerlos en un archivo hace el sistema legible de un vistazo.

---

## Estructura de archivos

**Se crean**

| Archivo | Responsabilidad |
|---|---|
| `frontend/src/styles/tokens.css` | Variables de color, escalas, sombras y movimiento; claro y oscuro |
| `frontend/src/styles/base.css` | Reset, tipografía base, foco visible |
| `frontend/src/styles/utilidades.css` | Layout, texto y tabla — nada de componentes |
| `frontend/scripts/contraste.mjs` | Lee `tokens.css` y falla si un par no llega a AA |
| `frontend/src/app/core/services/tema.ts` | Signal de tema, persistencia y preferencia del sistema |
| `frontend/src/app/core/services/tema.spec.ts` | Sus tests |
| `frontend/src/app/shared/ui/boton.ts` | `app-boton` |
| `frontend/src/app/shared/ui/pastilla.ts` | `app-pastilla` |
| `frontend/src/app/shared/ui/tarjeta.ts` | `app-tarjeta` |
| `frontend/src/app/shared/ui/campo.ts` | `app-campo` |
| `frontend/src/app/shared/ui/select.ts` | `app-select` |
| `frontend/src/app/shared/ui/toast.ts` | `app-toast` y `ToastService` |
| `frontend/src/app/shared/ui/esqueleto.ts` | `app-esqueleto` |
| `frontend/src/app/shared/ui/estado-vacio.ts` | `app-estado-vacio` |
| `frontend/src/app/shared/ui/modal.ts` | `app-modal` |
| `frontend/src/app/shared/ui/confirmar.ts` | `app-confirmar` |
| `frontend/src/app/shared/shell/shell.ts` + `.html` | Barra lateral, topbar y cajón |
| `frontend/src/app/features/ui/catalogo.ts` + `.html` | La ruta `/ui` |

**Se modifican**

| Archivo | Cambio |
|---|---|
| `frontend/src/styles.css` | Pasa a ser tres `@import` y el de la fuente |
| `frontend/src/index.html` | Script anti-destello del tema |
| `frontend/src/app/app.ts` y `app.html` | El shell reemplaza al navbar |
| `frontend/src/app/app.routes.ts` | Ruta `/ui` |
| `frontend/package.json` | `@fontsource-variable/inter` |

**Se borra al final:** `frontend/src/app/shared/components/navbar/` — lo reemplaza el shell.

---

### Task 1: Tokens, base y la fuente

**Files:**
- Create: `frontend/src/styles/tokens.css`, `frontend/src/styles/base.css`, `frontend/src/styles/utilidades.css`, `frontend/scripts/contraste.mjs`
- Modify: `frontend/src/styles.css`, `frontend/src/index.html`, `frontend/package.json`

**Interfaces:**
- Consumes: nada.
- Produces: todas las variables CSS que el resto del plan usa por nombre. Ningún componente posterior puede escribir un color literal.

- [ ] **Step 1: Instalar la fuente**

```bash
cd frontend && npm install @fontsource-variable/inter
```

Se usa el paquete en vez de descargar el `.woff2` a mano porque es reproducible: `npm ci` la trae, no depende de que una URL siga viva, y Angular emite el archivo como asset al compilar.

- [ ] **Step 2: Escribir los tokens**

Crear `frontend/src/styles/tokens.css`:

```css
/*
 * La única fuente de color del proyecto.
 *
 * Los tokens son SEMÁNTICOS, no descriptivos: se llaman `--superficie` y no
 * `--blanco`, porque en tema oscuro la superficie no es blanca. Esa es toda la
 * razón por la que el tema oscuro cuesta un bloque y no una reescritura.
 */
:root {
  /* superficie, borde, texto */
  --superficie: #ffffff;
  --superficie-hundida: #f5f7fa;
  --superficie-elevada: #ffffff;
  --borde: #e1e6ef;
  --borde-fuerte: #c9d2e0;
  --texto-primario: #172b4d;
  --texto-suave: #5b6b85;

  /* acento — SOLO para lo pulsable, nunca para un estado */
  --acento: #0073ea;
  --acento-hover: #0060c2;
  --acento-suave: #e1effc;
  --acento-texto: #ffffff;

  /* estados de orden y de trabajo */
  --estado-recibida-fondo: #e6e9ef;      --estado-recibida-texto: #495468;
  --estado-cotizada-fondo: #fff0cc;      --estado-cotizada-texto: #8a5a00;
  --estado-proceso-fondo: #eae2fc;       --estado-proceso-texto: #5b33b5;
  --estado-espera-fondo: #ffe0cc;        --estado-espera-texto: #9a4400;
  --estado-finalizada-fondo: #d3f5e0;    --estado-finalizada-texto: #14663a;
  --estado-entregada-fondo: #323c4e;     --estado-entregada-texto: #ffffff;
  --estado-cancelada-fondo: #ffdcdc;     --estado-cancelada-texto: #a11b1b;

  /* prioridad: puntos, no pastillas */
  --prioridad-baja: #94a3b8;
  --prioridad-media: #f59e0b;
  --prioridad-alta: #dc2626;

  /* feedback — aparte de los estados a propósito */
  --exito-fondo: #e3f7eb;   --exito-texto: #0e7a43;
  --error-fondo: #fde7e7;   --error-texto: #c42b2b;
  --aviso-fondo: #fff6e0;   --aviso-texto: #8a5d00;

  /* espaciado, base 4 */
  --e1: 4px;  --e2: 8px;   --e3: 12px;  --e4: 16px;
  --e6: 24px; --e8: 32px;  --e12: 48px; --e16: 64px;

  /* radios */
  --r-sm: 6px; --r-md: 10px; --r-full: 999px;

  /* tipografía */
  --fuente: 'Inter Variable', system-ui, -apple-system, sans-serif;
  --t-etiqueta: 11px; --t-menor: 12px;  --t-tabla: 13px;
  --t-base: 14px;     --t-titulo: 16px; --t-h2: 20px; --t-h1: 24px;

  /* sombras: siempre acompañadas de borde */
  --sombra-1: 0 1px 2px rgba(23, 43, 77, 0.06);
  --sombra-2: 0 4px 12px rgba(23, 43, 77, 0.08);
  --sombra-3: 0 12px 32px rgba(23, 43, 77, 0.14);

  /* movimiento */
  --dur-rapida: 120ms; --ease-salida: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-media: 180ms;  --ease-entrada: cubic-bezier(0.4, 0, 1, 1);
  --dur-lenta: 260ms;  --ease-suave: cubic-bezier(0.4, 0, 0.2, 1);

  /* layout del shell */
  --ancho-barra: 240px; --alto-topbar: 56px; --ancho-contenido: 1280px;
}

:root[data-tema='oscuro'] {
  --superficie: #18233a;
  --superficie-hundida: #101828;
  --superficie-elevada: #1e2b45;
  --borde: #26334a;
  --borde-fuerte: #35455f;
  --texto-primario: #e9edf5;
  --texto-suave: #98a5bc;

  --acento: #2f8ff5;
  --acento-hover: #58a6f7;
  --acento-suave: #1b2e4a;
  --acento-texto: #101828;

  --estado-recibida-fondo: #26314a;      --estado-recibida-texto: #afb9ce;
  --estado-cotizada-fondo: #4a3a12;      --estado-cotizada-texto: #f5c563;
  --estado-proceso-fondo: #33245c;       --estado-proceso-texto: #b79bf5;
  --estado-espera-fondo: #5a3212;        --estado-espera-texto: #f5a96b;
  --estado-finalizada-fondo: #12452b;    --estado-finalizada-texto: #72d89d;
  --estado-entregada-fondo: #8791a6;     --estado-entregada-texto: #101828;
  --estado-cancelada-fondo: #5a1c1c;     --estado-cancelada-texto: #f58f8f;

  --exito-fondo: #123d28;   --exito-texto: #56c88a;
  --error-fondo: #4d1a1a;   --error-texto: #f08585;
  --aviso-fondo: #3f3110;   --aviso-texto: #e8b44c;

  /* sobre superficie oscura una sombra azulada al 6 % no se ve */
  --sombra-1: 0 1px 2px rgba(0, 0, 0, 0.4);
  --sombra-2: 0 4px 12px rgba(0, 0, 0, 0.45);
  --sombra-3: 0 12px 32px rgba(0, 0, 0, 0.55);
}
```

- [ ] **Step 3: Escribir el reset y las utilidades**

Crear `frontend/src/styles/base.css`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--fuente);
  font-size: var(--t-base);
  line-height: 1.5;
  color: var(--texto-primario);
  background: var(--superficie-hundida);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 { margin: 0; font-weight: 600; letter-spacing: -0.01em; }

/*
 * Foco visible en todo lo enfocable. `:focus-visible` y no `:focus` para que el
 * anillo aparezca al navegar con teclado y no al hacer clic con el ratón.
 */
:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 2px;
  border-radius: var(--r-sm);
}

/* Las cifras se alinean en columna: dinero, placas y correlativos. */
.cifra { font-variant-numeric: tabular-nums; }

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Crear `frontend/src/styles/utilidades.css`:

```css
/* Solo layout, texto y tabla. Ningún componente vive aquí. */

.pila { display: flex; flex-direction: column; gap: var(--e3); }
.fila { display: flex; align-items: center; gap: var(--e2); }
.fila-sep { display: flex; align-items: center; justify-content: space-between; gap: var(--e3); }
.crece { flex: 1; min-width: 0; }

.texto-suave { color: var(--texto-suave); }
.texto-menor { font-size: var(--t-menor); }
.etiqueta {
  font-size: var(--t-etiqueta);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--texto-suave);
}

.tabla { width: 100%; border-collapse: collapse; font-size: var(--t-tabla); }
.tabla th {
  text-align: left;
  font-size: var(--t-etiqueta);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--texto-suave);
  background: var(--superficie-hundida);
  padding: var(--e2) var(--e3);
  border-bottom: 1px solid var(--borde);
}
.tabla td {
  padding: var(--e3);
  border-bottom: 1px solid var(--borde);
  color: var(--texto-primario);
}
.tabla tbody tr:last-child td { border-bottom: none; }
.tabla tbody tr { transition: background var(--dur-rapida) var(--ease-suave); }
.tabla tbody tr:hover { background: var(--superficie-hundida); }
.tabla .num { text-align: right; font-variant-numeric: tabular-nums; }
```

- [ ] **Step 4: Enchufarlo todo**

Reemplazar el contenido de `frontend/src/styles.css`:

```css
/*
 * Solo el subconjunto latino. El paquete trae siete (cirílico, griego,
 * vietnamita…) y el navegador descargaría solo este igualmente gracias al
 * `unicode-range`, pero los otros seis viajarían en el artefacto de despliegue
 * sin que nadie los pida nunca: 166 KB de más en un plan gratuito.
 *
 * El rango cubre el español completo, acentos y ñ incluidos.
 */
@font-face {
  font-family: 'Inter Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')
    format('woff2-variations');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
    U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
    U+FEFF, U+FFFD;
}

@import './styles/tokens.css';
@import './styles/base.css';
@import './styles/utilidades.css';

/* La columna del Kanban sigue viva hasta que la entrega B la rehaga. */
.columna-kanban {
  min-height: 400px;
  background-color: #eef1f5;
  border-radius: 8px;
  padding: 12px;
}

.tarjeta-trabajo {
  cursor: default;
}
```

En `frontend/src/index.html`, dentro de `<head>` y **antes** de cualquier otra cosa:

```html
  <script>
    // Aplica el tema antes de que Angular arranque. Sin esto, cargar en modo
    // oscuro produce un destello blanco de varios cientos de milisegundos.
    (function () {
      var g = localStorage.getItem('tallerpro-tema');
      var oscuro = g ? g === 'oscuro'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (oscuro) document.documentElement.setAttribute('data-tema', 'oscuro');
    })();
  </script>
```

- [ ] **Step 5: Escribir el verificador de contraste**

Crear `frontend/scripts/contraste.mjs`:

```js
/*
 * Lee tokens.css y comprueba que cada par fondo/texto llega a AA (4.5:1).
 * Es el único test automático de esta entrega, y existe porque el contraste es
 * lo único del rediseño que se puede afirmar con un número en vez de mirando.
 *
 * Uso:  node scripts/contraste.mjs
 */
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

/** Los bloques :root y :root[data-tema='oscuro'], por separado. */
function bloque(selector) {
  const i = css.indexOf(selector);
  const desde = css.indexOf('{', i);
  const hasta = css.indexOf('}', desde);
  const vars = {};
  for (const linea of css.slice(desde, hasta).split('\n')) {
    for (const m of linea.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
      vars[m[1]] = m[2];
    }
  }
  return vars;
}

function canal(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex) {
  const n = hex.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function razon(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const PARES = [
  ['estado-recibida', 'estado-recibida'],
  ['estado-cotizada', 'estado-cotizada'],
  ['estado-proceso', 'estado-proceso'],
  ['estado-espera', 'estado-espera'],
  ['estado-finalizada', 'estado-finalizada'],
  ['estado-entregada', 'estado-entregada'],
  ['estado-cancelada', 'estado-cancelada'],
  ['exito', 'exito'],
  ['error', 'error'],
  ['aviso', 'aviso'],
];

const MINIMO = 4.5;
let fallos = 0;

for (const [tema, selector] of [
  ['claro', ':root {'],
  ['oscuro', ":root[data-tema='oscuro']"],
]) {
  const v = bloque(selector);
  console.log(`\n── tema ${tema} ──`);

  for (const [nombre] of PARES) {
    const fondo = v[`--${nombre}-fondo`];
    const texto = v[`--${nombre}-texto`];
    if (!fondo || !texto) {
      console.log(`  ${nombre.padEnd(22)} FALTA un token del par`);
      fallos++;
      continue;
    }
    const r = razon(fondo, texto);
    const ok = r >= MINIMO;
    if (!ok) fallos++;
    console.log(`  ${nombre.padEnd(22)}${r.toFixed(2).padStart(6)}  ${ok ? 'ok' : 'BAJO'}`);
  }

  // El mueble: texto sobre superficie y el primario sobre el acento.
  for (const [nombre, a, b] of [
    ['texto sobre superficie', '--superficie', '--texto-primario'],
    ['texto suave', '--superficie', '--texto-suave'],
    ['botón primario', '--acento', '--acento-texto'],
  ]) {
    const r = razon(v[a], v[b]);
    const ok = r >= MINIMO;
    if (!ok) fallos++;
    console.log(`  ${nombre.padEnd(22)}${r.toFixed(2).padStart(6)}  ${ok ? 'ok' : 'BAJO'}`);
  }
}

if (fallos > 0) {
  console.error(`\n${fallos} par(es) por debajo de ${MINIMO}:1. Corrige tokens.css.`);
  process.exit(1);
}
console.log(`\nTodos los pares superan ${MINIMO}:1 en ambos temas.`);
```

- [ ] **Step 6: Correr el verificador**

```bash
cd frontend && node scripts/contraste.mjs
```

Esperado: todos los pares en `ok` y el mensaje final. Si alguno sale `BAJO`, se corrige el token **antes** de seguir: cada tarea posterior lo da por bueno.

- [ ] **Step 7: Compilar y medir el peso**

```bash
cd frontend && npm run build && du -sh dist/frontend/browser
```

Esperado: compila, el `dist` queda por debajo de **1 MB** (partía de 812 KB), y se emite
**un solo** `.woff2`:

```bash
ls dist/frontend/browser/media/*.woff2
```

Si aparecen siete, el `@font-face` propio no se aplicó y se está importando el CSS
completo del paquete: el `dist` sube a 1040 KB y se pasa del techo.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/styles frontend/src/styles.css frontend/src/index.html \
        frontend/scripts frontend/package.json frontend/package-lock.json
git commit -m "feat: tokens de diseño, reset propio e Inter auto-hospedada"
```

---

### Task 2: El servicio de tema

**Files:**
- Create: `frontend/src/app/core/services/tema.ts`, `frontend/src/app/core/services/tema.spec.ts`

**Interfaces:**
- Consumes: el atributo `data-tema` que `tokens.css` interpreta.
- Produces:
  - `TemaService.oscuro: Signal<boolean>` — de solo lectura para los consumidores.
  - `TemaService.alternar(): void`
  - La clave de `localStorage` es `'tallerpro-tema'` con valores `'claro'` | `'oscuro'`, **los mismos que usa el script de `index.html`**.

- [ ] **Step 1: Escribir los tests**

Es la única lógica testeable de la entrega, y merece test porque tiene tres caminos: preferencia guardada, preferencia del sistema y alternancia.

Crear `frontend/src/app/core/services/tema.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { TemaService } from './tema';

describe('TemaService', () => {
  beforeEach(() => {
    localStorage.removeItem('tallerpro-tema');
    document.documentElement.removeAttribute('data-tema');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.removeItem('tallerpro-tema');
    document.documentElement.removeAttribute('data-tema');
  });

  it('respeta la preferencia guardada por encima de la del sistema', () => {
    localStorage.setItem('tallerpro-tema', 'oscuro');
    const servicio = TestBed.inject(TemaService);
    expect(servicio.oscuro()).toBe(true);
  });

  it('sin preferencia guardada, sigue a la del sistema', () => {
    const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const servicio = TestBed.inject(TemaService);
    expect(servicio.oscuro()).toBe(prefiereOscuro);
  });

  it('alternar cambia el signal y lo persiste', () => {
    localStorage.setItem('tallerpro-tema', 'claro');
    const servicio = TestBed.inject(TemaService);

    servicio.alternar();

    expect(servicio.oscuro()).toBe(true);
    expect(localStorage.getItem('tallerpro-tema')).toBe('oscuro');
  });

  it('alternar dos veces vuelve al punto de partida', () => {
    localStorage.setItem('tallerpro-tema', 'claro');
    const servicio = TestBed.inject(TemaService);

    servicio.alternar();
    servicio.alternar();

    expect(servicio.oscuro()).toBe(false);
    expect(localStorage.getItem('tallerpro-tema')).toBe('claro');
  });

  it('escribe data-tema en el elemento raíz solo cuando es oscuro', () => {
    localStorage.setItem('tallerpro-tema', 'claro');
    const servicio = TestBed.inject(TemaService);
    expect(document.documentElement.getAttribute('data-tema')).toBeNull();

    servicio.alternar();
    expect(document.documentElement.getAttribute('data-tema')).toBe('oscuro');
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

```bash
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: FAIL, no existe el módulo `./tema`.

- [ ] **Step 3: Escribir el servicio**

Crear `frontend/src/app/core/services/tema.ts`:

```ts
import { computed, Injectable, signal } from '@angular/core';

const CLAVE = 'tallerpro-tema';

/**
 * El tema vive aquí y en tres líneas de `index.html`, que aplican el atributo
 * antes de que Angular arranque para que no haya destello blanco al cargar en
 * oscuro. Las dos mitades comparten la clave de localStorage: si se cambia una,
 * hay que cambiar la otra.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly estado = signal<boolean>(this.preferenciaInicial());

  readonly oscuro = computed(() => this.estado());

  constructor() {
    this.aplicar(this.estado());
  }

  alternar(): void {
    const siguiente = !this.estado();
    this.estado.set(siguiente);
    localStorage.setItem(CLAVE, siguiente ? 'oscuro' : 'claro');
    this.aplicar(siguiente);
  }

  /** Lo guardado manda; si no hay nada, se sigue al sistema operativo. */
  private preferenciaInicial(): boolean {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) return guardado === 'oscuro';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private aplicar(oscuro: boolean): void {
    if (oscuro) {
      document.documentElement.setAttribute('data-tema', 'oscuro');
    } else {
      document.documentElement.removeAttribute('data-tema');
    }
  }
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

```bash
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: PASS, 5 tests. Son los primeros tests de frontend del proyecto.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/core/services/tema.ts frontend/src/app/core/services/tema.spec.ts
git commit -m "feat: servicio de tema claro y oscuro con persistencia"
```

---

### Task 3: El shell

**Files:**
- Create: `frontend/src/app/shared/shell/shell.ts`, `frontend/src/app/shared/shell/shell.html`, `frontend/src/app/shared/shell/shell.css`
- Modify: `frontend/src/app/app.ts`, `frontend/src/app/app.html`, `frontend/src/app/app.css`
- Delete: `frontend/src/app/shared/components/navbar/` (los tres archivos)

**Interfaces:**
- Consumes: `TemaService` de la Task 2; `TokenService.tieneRol()`, `.nombreCompleto()`, `.rolPrincipal()`, `.usuario()` que ya existen.
- Produces: el marco de toda la aplicación. Su área de contenido expone `--ancho-contenido` y el padding que las pantallas heredan.

**El detalle que rompe si se pasa por alto:** hoy `app.html` envuelve el `router-outlet` en `<div class="container">` de Bootstrap, y las dieciocho plantillas del proyecto están escritas contando con ese ancho máximo y ese padding. El área de contenido del shell tiene que conservarlos, o las pantallas de las entregas B y C se estiran de borde a borde.

- [ ] **Step 1: Escribir el componente**

Crear `frontend/src/app/shared/shell/shell.ts`:

```ts
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { TokenService } from '../../core/services/token';
import { TemaService } from '../../core/services/tema';
import { ROLES } from '../../core/models/estados';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly router = inject(Router);
  readonly tokenService = inject(TokenService);
  readonly temaService = inject(TemaService);

  /** Solo gobierna el cajón en móvil; en escritorio la columna está siempre. */
  readonly cajonAbierto = signal<boolean>(false);
  readonly menuUsuarioAbierto = signal<boolean>(false);

  readonly puedeCrearOrdenes = computed(() =>
    this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR),
  );

  readonly esAdministrador = computed(() =>
    this.tokenService.tieneRol(ROLES.ADMINISTRADOR),
  );

  /** Las iniciales del usuario para el avatar de la topbar. */
  readonly iniciales = computed(() => {
    const nombre = this.tokenService.nombreCompleto() ?? '';
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? '')
      .join('');
  });

  alternarCajon(): void {
    this.cajonAbierto.update((abierto) => !abierto);
  }

  cerrarCajon(): void {
    this.cajonAbierto.set(false);
  }

  alternarMenuUsuario(): void {
    this.menuUsuarioAbierto.update((abierto) => !abierto);
  }

  cerrarSesion(): void {
    this.tokenService.limpiar();
    this.router.navigate(['/auth/login']);
  }
}
```

**Antes de escribir esto, comprobar cómo cierra sesión el navbar actual** y copiar exactamente esa llamada:

```bash
grep -n "cerrarSesion" -A 5 frontend/src/app/shared/components/navbar/navbar.ts
```

Si el navbar usa otro método que `tokenService.limpiar()`, usar el suyo: el objetivo es no cambiar comportamiento, solo apariencia.

- [ ] **Step 2: Escribir la plantilla**

Crear `frontend/src/app/shared/shell/shell.html`:

```html
<div class="shell" [class.cajon-abierto]="cajonAbierto()">
  @if (cajonAbierto()) {
    <div class="velo" (click)="cerrarCajon()"></div>
  }

  <aside class="barra">
    <a class="marca" routerLink="/dashboard" (click)="cerrarCajon()">🔧 TallerPro</a>

    <nav class="nav">
      <a class="nav-item" routerLink="/dashboard" routerLinkActive="activo"
         (click)="cerrarCajon()">Inicio</a>
      <a class="nav-item" routerLink="/ordenes" routerLinkActive="activo"
         (click)="cerrarCajon()">Órdenes</a>
      @if (esAdministrador()) {
        <a class="nav-item" routerLink="/usuarios" routerLinkActive="activo"
           (click)="cerrarCajon()">Usuarios</a>
      }

      @if (puedeCrearOrdenes()) {
        <span class="nav-titulo">Acciones</span>
        <a class="nav-item" routerLink="/ordenes/nueva" routerLinkActive="activo"
           (click)="cerrarCajon()">Nueva orden</a>
      }
    </nav>
  </aside>

  <div class="principal">
    <header class="topbar">
      <button class="icono solo-movil" (click)="alternarCajon()" aria-label="Abrir el menú">☰</button>

      <span class="crece"></span>

      <button
        class="icono"
        (click)="temaService.alternar()"
        [attr.aria-label]="temaService.oscuro() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
      >
        {{ temaService.oscuro() ? '☀' : '☾' }}
      </button>

      <div class="usuario">
        <button class="avatar" (click)="alternarMenuUsuario()" aria-label="Menú de usuario">
          {{ iniciales() }}
        </button>

        @if (menuUsuarioAbierto()) {
          <div class="menu">
            <div class="menu-cabecera">
              <div class="menu-nombre">{{ tokenService.nombreCompleto() }}</div>
              <div class="menu-rol">{{ tokenService.rolPrincipal() }}</div>
            </div>
            <a class="menu-item" routerLink="/perfil/password"
               (click)="alternarMenuUsuario()">Cambiar contraseña</a>
            <button class="menu-item" (click)="cerrarSesion()">Salir</button>
          </div>
        }
      </div>
    </header>

    <main class="contenido">
      <ng-content></ng-content>
    </main>
  </div>
</div>
```

- [ ] **Step 3: Escribir los estilos del shell**

Crear `frontend/src/app/shared/shell/shell.css`:

```css
.shell { display: flex; min-height: 100vh; }

/* ─────────── barra lateral ─────────── */
.barra {
  width: var(--ancho-barra);
  flex: none;
  background: var(--superficie);
  border-right: 1px solid var(--borde);
  padding: var(--e3) var(--e2);
  display: flex;
  flex-direction: column;
  gap: var(--e1);
}

.marca {
  font-size: var(--t-titulo);
  font-weight: 700;
  color: var(--texto-primario);
  text-decoration: none;
  padding: var(--e2) var(--e2) var(--e4);
}

.nav { display: flex; flex-direction: column; gap: 2px; }

.nav-titulo {
  font-size: var(--t-etiqueta);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--texto-suave);
  padding: var(--e4) var(--e2) var(--e1);
}

.nav-item {
  font-size: var(--t-base);
  font-weight: 500;
  color: var(--texto-suave);
  text-decoration: none;
  padding: var(--e2) var(--e3);
  border-radius: var(--r-sm);
  transition:
    background var(--dur-rapida) var(--ease-suave),
    color var(--dur-rapida) var(--ease-suave);
}

.nav-item:hover { background: var(--superficie-hundida); color: var(--texto-primario); }

.nav-item.activo {
  background: var(--acento-suave);
  color: var(--acento-hover);
  font-weight: 600;
}

/* ─────────── topbar ─────────── */
.principal { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.topbar {
  height: var(--alto-topbar);
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--e2);
  padding: 0 var(--e4);
  background: var(--superficie);
  border-bottom: 1px solid var(--borde);
}

.icono {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--texto-suave);
  font-size: var(--t-titulo);
  cursor: pointer;
  transition:
    background var(--dur-rapida) var(--ease-suave),
    transform var(--dur-rapida) var(--ease-salida);
}

.icono:hover { background: var(--superficie-hundida); color: var(--texto-primario); }
.icono:active { transform: scale(0.94); }

.usuario { position: relative; }

.avatar {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--r-full);
  background: var(--acento);
  color: var(--acento-texto);
  font-size: var(--t-menor);
  font-weight: 600;
  cursor: pointer;
}

.menu {
  position: absolute;
  right: 0;
  top: calc(100% + var(--e2));
  min-width: 210px;
  background: var(--superficie-elevada);
  border: 1px solid var(--borde);
  border-radius: var(--r-md);
  box-shadow: var(--sombra-2);
  padding: var(--e1);
  z-index: 20;
  /* crece desde la esquina que lo abrió, no desde el centro de la nada */
  transform-origin: top right;
  animation: aparecer var(--dur-media) var(--ease-salida);
}

@keyframes aparecer {
  from { opacity: 0; transform: scale(0.96) translateY(-4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.menu-cabecera { padding: var(--e2) var(--e3) var(--e3); border-bottom: 1px solid var(--borde); }
.menu-nombre { font-weight: 600; font-size: var(--t-tabla); }
.menu-rol { font-size: var(--t-menor); color: var(--texto-suave); }

.menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--e2) var(--e3);
  margin-top: 2px;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--texto-primario);
  font: inherit;
  font-size: var(--t-tabla);
  text-decoration: none;
  cursor: pointer;
  transition: background var(--dur-rapida) var(--ease-suave);
}

.menu-item:hover { background: var(--superficie-hundida); }

/* ─────────── contenido ─────────── */
/*
 * Conserva el ancho máximo y el padding del `.container` de Bootstrap al que
 * reemplaza. Sin esto, las dieciocho plantillas del proyecto —escritas contando
 * con ese contenedor— se estiran de borde a borde.
 */
.contenido {
  flex: 1;
  width: 100%;
  max-width: var(--ancho-contenido);
  margin: 0 auto;
  padding: var(--e6) var(--e4);
}

/* ─────────── móvil ─────────── */
.solo-movil { display: none; }
.velo { display: none; }

@media (max-width: 767px) {
  .solo-movil { display: block; }

  .barra {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 30;
    transform: translateX(-100%);
    transition: transform var(--dur-lenta) var(--ease-salida);
  }

  .shell.cajon-abierto .barra { transform: translateX(0); }

  .velo {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 25;
    background: rgba(16, 24, 40, 0.45);
    animation: velo-entra var(--dur-media) var(--ease-suave);
  }

  @keyframes velo-entra {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .contenido { padding: var(--e4) var(--e3); }
}
```

- [ ] **Step 4: Enchufar el shell y jubilar el navbar**

Reemplazar `frontend/src/app/app.html`:

```html
@if (tokenService.estaAutenticado()) {
  <app-shell>
    <router-outlet></router-outlet>
  </app-shell>
} @else {
  <div class="sin-sesion">
    <router-outlet></router-outlet>
  </div>
}
```

Reemplazar el contenido de `frontend/src/app/app.css`:

```css
/* Login y registro: sin barra lateral, contenido centrado. */
.sin-sesion {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--e4);
  background: var(--superficie-hundida);
}
```

En `frontend/src/app/app.ts`, cambiar el import de `Navbar` por `Shell` y actualizar el array `imports`:

```ts
import { Shell } from './shared/shell/shell';
// …
  imports: [RouterOutlet, Shell],
```

Y borrar la carpeta del navbar:

```bash
rm -r frontend/src/app/shared/components/navbar
grep -rn "Navbar\|navbar" frontend/src/app --include=*.ts --include=*.html
```

Esperado del `grep`: sin resultados. Si aparece alguno, es una referencia colgando que rompe el build.

- [ ] **Step 5: Compilar**

```bash
cd frontend && npm run build
```

Esperado: compila. Un error de módulo no encontrado señala que quedó una referencia al navbar.

- [ ] **Step 6: Verificar en pantalla**

Levantar `docker compose up -d`, el backend y `npm start`. Entrar como `jefe@taller.com` / `123456` y comprobar:

| Qué | Esperado |
|---|---|
| Barra lateral | Clara, con Inicio · Órdenes · Nueva orden. Sin «Usuarios», porque el jefe no es administrador |
| Elemento activo | Fondo azul suave y texto azul, y cambia al navegar |
| Interruptor de tema | Alterna claro/oscuro al instante, y **la elección sobrevive a recargar** |
| Sin destello | Con el tema en oscuro, recargar no produce un fogonazo blanco |
| Menú de usuario | Se abre creciendo desde el avatar; muestra nombre y rol; «Salir» funciona |
| **Pantallas viejas** | Lista de órdenes y detalle se ven **como antes**, con su ancho de siempre y sin estirarse |
| Login | Sin barra lateral, centrado |
| Móvil (viewport ~400 px) | El ☰ abre el cajón, el velo lo cierra, y el fondo no se desplaza |

La fila en negrita es la que de verdad valida el diseño: si esas pantallas se estiran, el área de contenido perdió el ancho máximo.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app
git commit -m "feat: shell con barra lateral, topbar y cajón móvil"
```

---

### Task 4: Catálogo y primitivas de presentación

**Files:**
- Create: `frontend/src/app/shared/ui/boton.ts`, `pastilla.ts`, `tarjeta.ts`
- Create: `frontend/src/app/features/ui/catalogo.ts`, `catalogo.html`
- Modify: `frontend/src/app/app.routes.ts`

**Interfaces:**
- Consumes: los tokens de la Task 1.
- Produces:
  - `<app-boton [variante]="'primario'|'secundario'|'fantasma'|'peligro'" [tamano]="'sm'|'md'" [cargando]="boolean" [deshabilitado]="boolean" (pulsar)="…">`
  - `<app-pastilla [estado]="string">` — traduce el nombre del estado a su par de tokens.
  - `<app-tarjeta [titulo]="string?">` con proyección de contenido.
  - Ruta `/ui` con el catálogo.

- [ ] **Step 1: Escribir el botón**

Crear `frontend/src/app/shared/ui/boton.ts`:

```ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-boton',
  template: `
    <button
      class="b"
      [class]="variante() + ' ' + tamano()"
      [disabled]="deshabilitado() || cargando()"
      (click)="pulsar.emit()"
    >
      @if (cargando()) {
        <span class="giro" aria-hidden="true"></span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: `
    .b {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--e2);
      font-family: var(--fuente);
      font-weight: 600;
      line-height: 1;
      border: 1px solid transparent;
      border-radius: var(--r-sm);
      cursor: pointer;
      white-space: nowrap;
      /* el tacto: baja al presionar y vuelve con ease-out */
      transition:
        background var(--dur-rapida) var(--ease-suave),
        border-color var(--dur-rapida) var(--ease-suave),
        transform var(--dur-rapida) var(--ease-salida);
    }
    .b:active:not(:disabled) { transform: scale(0.97); }
    .b:disabled { opacity: 0.55; cursor: not-allowed; }

    .md { font-size: var(--t-base); padding: var(--e2) var(--e4); min-height: 36px; }
    .sm { font-size: var(--t-menor); padding: var(--e1) var(--e3); min-height: 28px; }

    .primario { background: var(--acento); color: var(--acento-texto); }
    .primario:hover:not(:disabled) { background: var(--acento-hover); }

    .secundario {
      background: var(--superficie);
      color: var(--texto-primario);
      border-color: var(--borde-fuerte);
    }
    .secundario:hover:not(:disabled) { background: var(--superficie-hundida); }

    .fantasma { background: transparent; color: var(--texto-suave); }
    .fantasma:hover:not(:disabled) {
      background: var(--superficie-hundida);
      color: var(--texto-primario);
    }

    .peligro { background: var(--error-texto); color: #fff; }
    .peligro:hover:not(:disabled) { filter: brightness(0.92); }

    .giro {
      width: 13px;
      height: 13px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: var(--r-full);
      animation: girar 700ms linear infinite;
    }
    @keyframes girar { to { transform: rotate(360deg); } }
  `,
})
export class Boton {
  readonly variante = input<'primario' | 'secundario' | 'fantasma' | 'peligro'>('primario');
  readonly tamano = input<'sm' | 'md'>('md');
  readonly cargando = input<boolean>(false);
  readonly deshabilitado = input<boolean>(false);

  readonly pulsar = output<void>();
}
```

- [ ] **Step 2: Escribir la pastilla**

Crear `frontend/src/app/shared/ui/pastilla.ts`. Es la única primitiva que conoce el dominio, y a propósito: su trabajo es traducir un estado a color y etiqueta.

```ts
import { Component, computed, input } from '@angular/core';
import { ETIQUETA_ESTADO_ORDEN, ETIQUETA_ESTADO_TRABAJO } from '../../core/models/estados';

/** Estado del dominio → sufijo del token. Los de trabajo caen en los mismos. */
const TOKEN: Record<string, string> = {
  RECIBIDA: 'recibida',
  PENDIENTE: 'recibida',
  COTIZADA: 'cotizada',
  EN_PROCESO: 'proceso',
  ESPERANDO_REPUESTO: 'espera',
  FINALIZADA: 'finalizada',
  COMPLETADO: 'finalizada',
  ENTREGADA: 'entregada',
  CANCELADA: 'cancelada',
};

@Component({
  selector: 'app-pastilla',
  template: `<span class="p" [style.background]="fondo()" [style.color]="texto()">{{ etiqueta() }}</span>`,
  styles: `
    .p {
      display: inline-block;
      font-size: var(--t-etiqueta);
      font-weight: 600;
      letter-spacing: 0.02em;
      padding: var(--e1) var(--e2);
      border-radius: var(--r-full);
      white-space: nowrap;
    }
  `,
})
export class Pastilla {
  readonly estado = input.required<string>();

  private readonly sufijo = computed(() => TOKEN[this.estado()] ?? 'recibida');

  readonly fondo = computed(() => `var(--estado-${this.sufijo()}-fondo)`);
  readonly texto = computed(() => `var(--estado-${this.sufijo()}-texto)`);

  readonly etiqueta = computed(
    () =>
      ETIQUETA_ESTADO_ORDEN[this.estado()] ??
      ETIQUETA_ESTADO_TRABAJO[this.estado()] ??
      this.estado(),
  );
}
```

- [ ] **Step 3: Escribir la tarjeta**

Crear `frontend/src/app/shared/ui/tarjeta.ts`:

```ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-tarjeta',
  template: `
    <section class="t">
      @if (titulo()) {
        <header class="cab">
          <h3 class="tit">{{ titulo() }}</h3>
          <ng-content select="[acciones]"></ng-content>
        </header>
      }
      <div class="cuerpo"><ng-content></ng-content></div>
    </section>
  `,
  styles: `
    .t {
      background: var(--superficie);
      border: 1px solid var(--borde);
      border-radius: var(--r-md);
      box-shadow: var(--sombra-1);
      overflow: hidden;
    }
    .cab {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--e3);
      padding: var(--e3) var(--e4);
      border-bottom: 1px solid var(--borde);
    }
    .tit { font-size: var(--t-titulo); font-weight: 600; }
    .cuerpo { padding: var(--e4); }
  `,
})
export class Tarjeta {
  readonly titulo = input<string>('');
}
```

- [ ] **Step 4: Crear el catálogo y su ruta**

Crear `frontend/src/app/features/ui/catalogo.ts`:

```ts
import { Component, signal } from '@angular/core';
import { Boton } from '../../shared/ui/boton';
import { Pastilla } from '../../shared/ui/pastilla';
import { Tarjeta } from '../../shared/ui/tarjeta';

@Component({
  selector: 'app-catalogo',
  imports: [Boton, Pastilla, Tarjeta],
  templateUrl: './catalogo.html',
  styles: `
    .grupo { margin-bottom: var(--e8); }
    .muestra { display: flex; flex-wrap: wrap; gap: var(--e3); align-items: center; }
  `,
})
export class Catalogo {
  readonly estados = signal<string[]>([
    'RECIBIDA',
    'COTIZADA',
    'EN_PROCESO',
    'ESPERANDO_REPUESTO',
    'FINALIZADA',
    'ENTREGADA',
    'CANCELADA',
  ]);
}
```

Crear `frontend/src/app/features/ui/catalogo.html`:

```html
<h1 style="font-size: var(--t-h1); margin-bottom: var(--e6)">Catálogo de componentes</h1>

<div class="grupo">
  <span class="etiqueta">Botones</span>
  <div class="muestra" style="margin-top: var(--e3)">
    <app-boton variante="primario">Nueva orden</app-boton>
    <app-boton variante="secundario">Filtrar</app-boton>
    <app-boton variante="fantasma">Cancelar</app-boton>
    <app-boton variante="peligro">Eliminar</app-boton>
    <app-boton variante="primario" tamano="sm">Pequeño</app-boton>
    <app-boton variante="primario" [cargando]="true">Guardando</app-boton>
    <app-boton variante="primario" [deshabilitado]="true">Deshabilitado</app-boton>
  </div>
</div>

<div class="grupo">
  <span class="etiqueta">Estados</span>
  <div class="muestra" style="margin-top: var(--e3)">
    @for (estado of estados(); track estado) {
      <app-pastilla [estado]="estado"></app-pastilla>
    }
  </div>
</div>

<div class="grupo">
  <span class="etiqueta">Tarjeta</span>
  <div style="margin-top: var(--e3); max-width: 460px">
    <app-tarjeta titulo="Orden ORD-000042">
      <app-boton acciones variante="fantasma" tamano="sm">Editar</app-boton>
      <p style="margin: 0">Kia Rio · placa MAN123</p>
      <p class="texto-suave texto-menor" style="margin: var(--e2) 0 0">
        Cliente Manual · 999000111
      </p>
    </app-tarjeta>
  </div>
</div>

<div class="grupo">
  <span class="etiqueta">Prioridad</span>
  <p class="texto-suave texto-menor" style="margin: var(--e2) 0 0">
    No es una pastilla a propósito: si lo fuera competiría con el estado en la misma tarjeta.
  </p>
  <div class="muestra" style="margin-top: var(--e3)">
    <span class="fila">
      <span class="punto" style="background: var(--prioridad-baja)"></span> Baja
    </span>
    <span class="fila">
      <span class="punto" style="background: var(--prioridad-media)"></span> Media
    </span>
    <span class="fila">
      <span class="punto" style="background: var(--prioridad-alta)"></span> Alta
    </span>
  </div>
</div>
```

El punto necesita una clase; va en los `styles` de `catalogo.ts`, junto a `.grupo` y `.muestra`:

```css
    .punto {
      width: 8px;
      height: 8px;
      border-radius: var(--r-full);
      display: inline-block;
    }
```

En `frontend/src/app/app.routes.ts`, junto a las demás rutas de `features`:

```ts
  {
    path: 'ui',
    loadComponent: () => import('./features/ui/catalogo').then((m) => m.Catalogo),
    canActivate: [authGuard],
  },
```

Usar el mismo nombre de guard que las rutas vecinas — comprobarlo con:

```bash
grep -n "canActivate" frontend/src/app/app.routes.ts | head -3
```

- [ ] **Step 5: Compilar y mirar**

```bash
cd frontend && npm run build
```

Con la app corriendo, entrar a `/ui` y comprobar, **en los dos temas**:

- Las cuatro variantes de botón se distinguen, y el primario destaca sobre el secundario.
- Al presionar cualquiera, baja un punto y vuelve — ese es el tacto.
- El botón cargando gira y no se puede pulsar.
- Las siete pastillas se distinguen entre sí de un vistazo, y **«Cotizada» y «Esperando repuesto» ya no son el mismo color**.
- La tarjeta tiene borde y sombra suave, y su botón de acciones cae a la derecha del título.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/shared/ui frontend/src/app/features/ui frontend/src/app/app.routes.ts
git commit -m "feat: botón, pastilla y tarjeta, con catálogo en /ui"
```

---

### Task 5: Primitivas de formulario

**Files:**
- Create: `frontend/src/app/shared/ui/campo.ts`, `frontend/src/app/shared/ui/select.ts`
- Modify: `frontend/src/app/features/ui/catalogo.ts`, `catalogo.html`

**Interfaces:**
- Consumes: los tokens de la Task 1; el catálogo de la Task 4.
- Produces:
  - `<app-campo [etiqueta] [ayuda] [error] [tipo] [valor] (valorCambia)>`
  - `<app-select [etiqueta] [error] [opciones] [valor] (valorCambia)>` con `interface Opcion { valor: string; texto: string }`

Los dos son componentes controlados por `valor` y `valorCambia`, no `ControlValueAccessor`. Implementar el accessor permitiría usarlos con `formControlName`, pero ninguna pantalla de esta entrega los usa dentro de un formulario reactivo: eso llega en la entrega C, y ahí se decide con la información delante.

- [ ] **Step 1: Escribir el campo**

Crear `frontend/src/app/shared/ui/campo.ts`:

```ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-campo',
  template: `
    <label class="c">
      @if (etiqueta()) {
        <span class="et">{{ etiqueta() }}</span>
      }

      <input
        class="in"
        [class.mal]="!!error()"
        [type]="tipo()"
        [value]="valor()"
        [placeholder]="marcador()"
        [disabled]="deshabilitado()"
        (input)="valorCambia.emit($any($event.target).value)"
      />

      @if (error()) {
        <span class="msg mal-texto">{{ error() }}</span>
      } @else if (ayuda()) {
        <span class="msg">{{ ayuda() }}</span>
      }
    </label>
  `,
  styles: `
    .c { display: flex; flex-direction: column; gap: var(--e1); }
    .et { font-size: var(--t-menor); font-weight: 600; color: var(--texto-primario); }

    .in {
      font-family: var(--fuente);
      font-size: var(--t-base);
      line-height: 1.4;
      color: var(--texto-primario);
      background: var(--superficie);
      border: 1px solid var(--borde-fuerte);
      border-radius: var(--r-sm);
      padding: var(--e2) var(--e3);
      min-height: 36px;
      transition: border-color var(--dur-rapida) var(--ease-suave);
    }
    .in::placeholder { color: var(--texto-suave); }
    .in:hover:not(:disabled) { border-color: var(--texto-suave); }
    .in:focus { outline: 2px solid var(--acento); outline-offset: 1px; border-color: var(--acento); }
    .in:disabled { opacity: 0.55; cursor: not-allowed; }
    .in.mal { border-color: var(--error-texto); }

    .msg { font-size: var(--t-menor); color: var(--texto-suave); }
    .mal-texto { color: var(--error-texto); }
  `,
})
export class Campo {
  readonly etiqueta = input<string>('');
  readonly ayuda = input<string>('');
  readonly error = input<string>('');
  readonly tipo = input<string>('text');
  readonly marcador = input<string>('');
  readonly valor = input<string>('');
  readonly deshabilitado = input<boolean>(false);

  readonly valorCambia = output<string>();
}
```

- [ ] **Step 2: Escribir el select**

Crear `frontend/src/app/shared/ui/select.ts`:

```ts
import { Component, input, output } from '@angular/core';

export interface Opcion {
  valor: string;
  texto: string;
}

@Component({
  selector: 'app-select',
  template: `
    <label class="c">
      @if (etiqueta()) {
        <span class="et">{{ etiqueta() }}</span>
      }

      <select
        class="in"
        [class.mal]="!!error()"
        [value]="valor()"
        [disabled]="deshabilitado()"
        (change)="valorCambia.emit($any($event.target).value)"
      >
        @if (marcador()) {
          <option value="">{{ marcador() }}</option>
        }
        @for (opcion of opciones(); track opcion.valor) {
          <option [value]="opcion.valor">{{ opcion.texto }}</option>
        }
      </select>

      @if (error()) {
        <span class="msg mal-texto">{{ error() }}</span>
      }
    </label>
  `,
  styles: `
    .c { display: flex; flex-direction: column; gap: var(--e1); }
    .et { font-size: var(--t-menor); font-weight: 600; color: var(--texto-primario); }

    .in {
      font-family: var(--fuente);
      font-size: var(--t-base);
      line-height: 1.4;
      color: var(--texto-primario);
      background: var(--superficie);
      border: 1px solid var(--borde-fuerte);
      border-radius: var(--r-sm);
      padding: var(--e2) var(--e3);
      min-height: 36px;
      cursor: pointer;
      transition: border-color var(--dur-rapida) var(--ease-suave);
    }
    .in:hover:not(:disabled) { border-color: var(--texto-suave); }
    .in:focus { outline: 2px solid var(--acento); outline-offset: 1px; border-color: var(--acento); }
    .in:disabled { opacity: 0.55; cursor: not-allowed; }
    .in.mal { border-color: var(--error-texto); }

    .msg { font-size: var(--t-menor); color: var(--texto-suave); }
    .mal-texto { color: var(--error-texto); }
  `,
})
export class Select {
  readonly etiqueta = input<string>('');
  readonly error = input<string>('');
  readonly marcador = input<string>('');
  readonly opciones = input<Opcion[]>([]);
  readonly valor = input<string>('');
  readonly deshabilitado = input<boolean>(false);

  readonly valorCambia = output<string>();
}
```

- [ ] **Step 3: Añadirlos al catálogo**

En `catalogo.ts`, importar `Campo` y `Select`, añadirlos al array `imports`, y agregar:

```ts
  readonly placa = signal<string>('');
  readonly estadoElegido = signal<string>('');

  readonly opcionesEstado = signal([
    { valor: 'RECIBIDA', texto: 'Recibida' },
    { valor: 'EN_PROCESO', texto: 'En proceso' },
    { valor: 'FINALIZADA', texto: 'Finalizada' },
  ]);
```

Y en `catalogo.html`, al final:

```html
<div class="grupo">
  <span class="etiqueta">Formulario</span>
  <div style="margin-top: var(--e3); display: grid; gap: var(--e4); max-width: 320px">
    <app-campo
      etiqueta="Placa"
      ayuda="Se guarda en mayúsculas y sin guiones"
      marcador="ABC-123"
      [valor]="placa()"
      (valorCambia)="placa.set($event)"
    ></app-campo>

    <app-campo
      etiqueta="Placa"
      error="Esa placa ya existe con otros datos"
      [valor]="'ABC123'"
    ></app-campo>

    <app-campo etiqueta="Deshabilitado" [valor]="'No editable'" [deshabilitado]="true"></app-campo>

    <app-select
      etiqueta="Estado"
      marcador="Todos los estados"
      [opciones]="opcionesEstado()"
      [valor]="estadoElegido()"
      (valorCambia)="estadoElegido.set($event)"
    ></app-select>
  </div>
</div>
```

- [ ] **Step 4: Compilar y mirar**

```bash
cd frontend && npm run build
```

En `/ui`, en los dos temas: escribir en el campo lo actualiza; el campo con error tiene el borde rojo y el mensaje rojo, y **el mensaje de error sustituye al de ayuda, no se suman**; el deshabilitado se ve apagado y no acepta foco; al tabular, el anillo de foco se ve con claridad.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/ui frontend/src/app/features/ui
git commit -m "feat: campo y select del sistema de diseño"
```

---

### Task 6: Feedback — toast, esqueleto y estado vacío

**Files:**
- Create: `frontend/src/app/shared/ui/toast.ts`, `esqueleto.ts`, `estado-vacio.ts`
- Modify: `frontend/src/app/shared/shell/shell.html`, `shell.ts`, `frontend/src/app/features/ui/catalogo.ts`, `catalogo.html`

**Interfaces:**
- Consumes: los tokens de la Task 1; el shell de la Task 3.
- Produces:
  - `ToastService.exito(texto: string)`, `.error(texto)`, `.aviso(texto)`
  - `<app-toast>` — se monta **una sola vez**, en el shell.
  - `<app-esqueleto [variante]="'texto'|'fila'|'tarjeta'" [repeticiones]="number">`
  - `<app-estado-vacio [icono] [titulo] [mensaje]>` con proyección para la acción.

- [ ] **Step 1: Escribir el toast y su servicio**

Crear `frontend/src/app/shared/ui/toast.ts`:

```ts
import { Component, inject, Injectable, signal } from '@angular/core';

export interface Aviso {
  id: number;
  texto: string;
  tipo: 'exito' | 'error' | 'aviso';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private contador = 0;
  readonly avisos = signal<Aviso[]>([]);

  exito(texto: string): void {
    this.emitir(texto, 'exito');
  }
  error(texto: string): void {
    this.emitir(texto, 'error');
  }
  aviso(texto: string): void {
    this.emitir(texto, 'aviso');
  }

  cerrar(id: number): void {
    this.avisos.update((lista) => lista.filter((a) => a.id !== id));
  }

  private emitir(texto: string, tipo: Aviso['tipo']): void {
    const id = ++this.contador;
    this.avisos.update((lista) => [...lista, { id, texto, tipo }]);
    setTimeout(() => this.cerrar(id), 5000);
  }
}

@Component({
  selector: 'app-toast',
  template: `
    <div class="zona" role="status" aria-live="polite">
      @for (aviso of servicio.avisos(); track aviso.id) {
        <div class="t" [class]="aviso.tipo" (click)="servicio.cerrar(aviso.id)">
          {{ aviso.texto }}
        </div>
      }
    </div>
  `,
  styles: `
    .zona {
      position: fixed;
      right: var(--e4);
      bottom: var(--e4);
      z-index: 60;
      display: flex;
      flex-direction: column;
      gap: var(--e2);
      pointer-events: none;
    }
    .t {
      pointer-events: auto;
      cursor: pointer;
      max-width: 340px;
      font-size: var(--t-tabla);
      font-weight: 500;
      padding: var(--e3) var(--e4);
      border-radius: var(--r-md);
      border: 1px solid var(--borde);
      box-shadow: var(--sombra-2);
      /* entra desde abajo; la salida la resuelve el borrado del signal */
      animation: entra var(--dur-media) var(--ease-salida);
    }
    @keyframes entra {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .exito { background: var(--exito-fondo); color: var(--exito-texto); }
    .error { background: var(--error-fondo); color: var(--error-texto); }
    .aviso { background: var(--aviso-fondo); color: var(--aviso-texto); }
  `,
})
export class Toast {
  readonly servicio = inject(ToastService);
}
```

- [ ] **Step 2: Montarlo en el shell**

En `shell.ts`, importar `Toast` y añadirlo al array `imports`. En `shell.html`, justo antes de cerrar el `<div class="shell">`:

```html
  <app-toast></app-toast>
```

Va en el shell y no en cada pantalla porque debe existir **una sola vez** en la aplicación: dos instancias mostrarían cada aviso por duplicado.

- [ ] **Step 3: Escribir el esqueleto**

Crear `frontend/src/app/shared/ui/esqueleto.ts`:

```ts
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-esqueleto',
  template: `
    <div class="pila-esq">
      @for (i of indices(); track i) {
        <div class="e" [class]="variante()"></div>
      }
    </div>
  `,
  styles: `
    .pila-esq { display: flex; flex-direction: column; gap: var(--e2); }
    .e {
      background: var(--borde);
      border-radius: var(--r-sm);
      animation: pulso 1.4s var(--ease-suave) infinite;
    }
    .texto   { height: 12px; width: 70%; }
    .fila    { height: 40px; width: 100%; }
    .tarjeta { height: 120px; width: 100%; border-radius: var(--r-md); }

    @keyframes pulso {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.45; }
    }
  `,
})
export class Esqueleto {
  readonly variante = input<'texto' | 'fila' | 'tarjeta'>('fila');
  readonly repeticiones = input<number>(3);

  readonly indices = computed(() => Array.from({ length: this.repeticiones() }, (_, i) => i));
}
```

- [ ] **Step 4: Escribir el estado vacío**

Crear `frontend/src/app/shared/ui/estado-vacio.ts`:

```ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-estado-vacio',
  template: `
    <div class="v">
      <div class="ic" aria-hidden="true">{{ icono() }}</div>
      <p class="ti">{{ titulo() }}</p>
      @if (mensaje()) {
        <p class="me">{{ mensaje() }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: `
    .v {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--e2);
      padding: var(--e12) var(--e4);
      text-align: center;
    }
    .ic { font-size: 30px; opacity: 0.5; }
    .ti { margin: 0; font-size: var(--t-titulo); font-weight: 600; color: var(--texto-primario); }
    .me { margin: 0; font-size: var(--t-tabla); color: var(--texto-suave); max-width: 380px; }
  `,
})
export class EstadoVacio {
  readonly icono = input<string>('📋');
  readonly titulo = input.required<string>();
  readonly mensaje = input<string>('');
}
```

- [ ] **Step 5: Añadirlos al catálogo**

En `catalogo.ts`, importar `Esqueleto`, `EstadoVacio`, `ToastService` y `Boton` (ya está), inyectar el servicio y añadir:

```ts
  readonly toast = inject(ToastService);
```

con `import { inject } from '@angular/core';`. Y en `catalogo.html`:

```html
<div class="grupo">
  <span class="etiqueta">Avisos</span>
  <div class="muestra" style="margin-top: var(--e3)">
    <app-boton variante="secundario" (pulsar)="toast.exito('Orden creada correctamente')">
      Éxito
    </app-boton>
    <app-boton variante="secundario" (pulsar)="toast.error('No se pudo guardar la orden')">
      Error
    </app-boton>
    <app-boton variante="secundario" (pulsar)="toast.aviso('El trabajo espera un repuesto')">
      Aviso
    </app-boton>
  </div>
</div>

<div class="grupo">
  <span class="etiqueta">Carga</span>
  <div style="margin-top: var(--e3); max-width: 460px">
    <app-esqueleto variante="fila" [repeticiones]="3"></app-esqueleto>
  </div>
</div>

<div class="grupo">
  <span class="etiqueta">Sin datos</span>
  <div style="margin-top: var(--e3); max-width: 460px">
    <app-estado-vacio
      icono="🔧"
      titulo="Sin trabajos todavía"
      mensaje="Agrega el primer trabajo para empezar a mover el tablero."
    >
      <app-boton variante="primario" tamano="sm">Agregar trabajo</app-boton>
    </app-estado-vacio>
  </div>
</div>
```

- [ ] **Step 6: Compilar y mirar**

```bash
cd frontend && npm run build
```

En `/ui`: los tres botones lanzan su aviso abajo a la derecha, entrando desde abajo; **se apilan** si se pulsan seguidos; se van solos a los 5 segundos y también al hacerles clic. El esqueleto pulsa suave, sin parpadear. El estado vacío queda centrado con su botón debajo.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/shared frontend/src/app/features/ui
git commit -m "feat: toast, esqueleto y estado vacío"
```

---

### Task 7: Modal y confirmación

**Files:**
- Create: `frontend/src/app/shared/ui/modal.ts`, `frontend/src/app/shared/ui/confirmar.ts`
- Modify: `frontend/src/app/features/ui/catalogo.ts`, `catalogo.html`

**Interfaces:**
- Consumes: `Boton` de la Task 4.
- Produces:
  - `<app-modal [abierto] [titulo] (cerrar)>` con proyección de cuerpo y `[pie]`.
  - `<app-confirmar [abierto] [titulo] [mensaje] [peligro] (confirmar) (cancelar)>`

Estos dos existen para jubilar los `confirm()` y `prompt()` del navegador que la aplicación usa hoy. **Esta entrega no los reemplaza todavía** —eso son pantallas, y va en la entrega B—; deja el reemplazo listo.

- [ ] **Step 1: Escribir el modal**

Crear `frontend/src/app/shared/ui/modal.ts`:

```ts
import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    @if (abierto()) {
      <div class="velo" (click)="cerrar.emit()"></div>
      <div
        class="m"
        #caja
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        (keydown.escape)="cerrar.emit()"
      >
        <header class="cab">
          <h3 class="tit">{{ titulo() }}</h3>
          <button class="x" (click)="cerrar.emit()" aria-label="Cerrar">✕</button>
        </header>
        <div class="cuerpo"><ng-content></ng-content></div>
        <footer class="pie"><ng-content select="[pie]"></ng-content></footer>
      </div>
    }
  `,
  styles: `
    .velo {
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(16, 24, 40, 0.5);
      animation: velo var(--dur-rapida) var(--ease-suave);
    }
    @keyframes velo { from { opacity: 0; } to { opacity: 1; } }

    .m {
      position: fixed;
      z-index: 51;
      top: 50%;
      left: 50%;
      width: min(460px, calc(100vw - var(--e8)));
      background: var(--superficie-elevada);
      border: 1px solid var(--borde);
      border-radius: var(--r-md);
      box-shadow: var(--sombra-3);
      animation: entra var(--dur-media) var(--ease-salida);
    }
    /* la traslación del centrado va en la animación para no pelearse con ella */
    @keyframes entra {
      from { opacity: 0; transform: translate(-50%, -50%) scale(0.98); }
      to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    .m { transform: translate(-50%, -50%); }

    .cab {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--e3);
      padding: var(--e4);
      border-bottom: 1px solid var(--borde);
    }
    .tit { font-size: var(--t-titulo); font-weight: 600; }
    .x {
      border: none;
      background: transparent;
      color: var(--texto-suave);
      font-size: var(--t-base);
      cursor: pointer;
      padding: var(--e1);
      border-radius: var(--r-sm);
    }
    .x:hover { background: var(--superficie-hundida); color: var(--texto-primario); }

    .cuerpo { padding: var(--e4); color: var(--texto-primario); }
    .pie {
      display: flex;
      justify-content: flex-end;
      gap: var(--e2);
      padding: var(--e3) var(--e4);
      border-top: 1px solid var(--borde);
    }
  `,
})
export class Modal {
  readonly abierto = input<boolean>(false);
  readonly titulo = input<string>('');

  readonly cerrar = output<void>();

  private readonly caja = viewChild<ElementRef<HTMLElement>>('caja');
  private anterior: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.abierto()) {
        // Se recuerda quién tenía el foco para devolvérselo al cerrar: si no,
        // el teclado vuelve al principio de la página y el usuario se pierde.
        this.anterior = document.activeElement as HTMLElement | null;
        queueMicrotask(() => this.caja()?.nativeElement.focus());
      } else if (this.anterior) {
        this.anterior.focus();
        this.anterior = null;
      }
    });
  }

  /**
   * Atrapa el foco dentro del diálogo. Sin esto, tabular desde el último botón
   * lleva a la página de detrás, que está tapada por el velo: el usuario de
   * teclado se queda navegando algo que no puede ver.
   */
  atrapar(evento: KeyboardEvent): void {
    const raiz = this.caja()?.nativeElement;
    if (!raiz) return;

    const enfocables = raiz.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (enfocables.length === 0) return;

    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];

    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }
}
```

Y enganchar el atrapador en la plantilla, en el mismo `<div class="m">`:

```html
        (keydown.tab)="atrapar($event)"
```

- [ ] **Step 2: Escribir la confirmación**

Crear `frontend/src/app/shared/ui/confirmar.ts`:

```ts
import { Component, input, output } from '@angular/core';
import { Boton } from './boton';
import { Modal } from './modal';

@Component({
  selector: 'app-confirmar',
  imports: [Boton, Modal],
  template: `
    <app-modal [abierto]="abierto()" [titulo]="titulo()" (cerrar)="cancelar.emit()">
      <p style="margin: 0">{{ mensaje() }}</p>

      <div pie>
        <app-boton variante="fantasma" (pulsar)="cancelar.emit()">
          {{ textoCancelar() }}
        </app-boton>
        <app-boton [variante]="peligro() ? 'peligro' : 'primario'" (pulsar)="confirmar.emit()">
          {{ textoConfirmar() }}
        </app-boton>
      </div>
    </app-modal>
  `,
})
export class Confirmar {
  readonly abierto = input<boolean>(false);
  readonly titulo = input<string>('¿Confirmar?');
  readonly mensaje = input<string>('');
  readonly peligro = input<boolean>(false);
  readonly textoConfirmar = input<string>('Confirmar');
  readonly textoCancelar = input<string>('Cancelar');

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();
}
```

- [ ] **Step 3: Añadirlos al catálogo**

En `catalogo.ts`, importar `Modal` y `Confirmar`, añadirlos a `imports` y agregar:

```ts
  readonly modalAbierto = signal<boolean>(false);
  readonly confirmarAbierto = signal<boolean>(false);
```

En `catalogo.html`:

```html
<div class="grupo">
  <span class="etiqueta">Diálogos</span>
  <div class="muestra" style="margin-top: var(--e3)">
    <app-boton variante="secundario" (pulsar)="modalAbierto.set(true)">Abrir modal</app-boton>
    <app-boton variante="peligro" (pulsar)="confirmarAbierto.set(true)">Eliminar orden</app-boton>
  </div>
</div>

<app-modal [abierto]="modalAbierto()" titulo="Detalle del trabajo" (cerrar)="modalAbierto.set(false)">
  <p style="margin: 0">Cambio de embrague · Kia Rio · MAN123</p>
  <div pie>
    <app-boton variante="fantasma" (pulsar)="modalAbierto.set(false)">Cerrar</app-boton>
  </div>
</app-modal>

<app-confirmar
  [abierto]="confirmarAbierto()"
  titulo="¿Eliminar la orden ORD-000042?"
  mensaje="Se borrarán también sus trabajos, comentarios y adjuntos. No se puede deshacer."
  [peligro]="true"
  textoConfirmar="Eliminar"
  (confirmar)="confirmarAbierto.set(false); toast.exito('Orden eliminada')"
  (cancelar)="confirmarAbierto.set(false)"
></app-confirmar>
```

- [ ] **Step 4: Compilar y mirar**

```bash
cd frontend && npm run build
```

En `/ui`: el modal entra escalando desde `.98`; **`Esc` lo cierra**; el clic en el velo lo cierra; el botón ✕ lo cierra. La confirmación muestra el botón rojo a la derecha, y al confirmar cierra y lanza el toast. Con `prefers-reduced-motion: reduce` activado en el navegador, el modal aparece sin escalar.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/ui frontend/src/app/features/ui
git commit -m "feat: modal y diálogo de confirmación propios"
```

---

### Task 8: Verificación completa y documentación

**Files:**
- Modify: `docs/contexto-core.md`, `README.md`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: nada de código.

- [ ] **Step 1: Pasar el verificador de contraste y los tests**

```bash
cd frontend && node scripts/contraste.mjs && npx ng test --watch=false --browsers=ChromeHeadless && npm run build && du -sh dist/frontend/browser
```

Esperado: contraste todo `ok`, 5 tests en verde, compila, y el `dist` por debajo de 1 MB.

- [ ] **Step 2: Comprobar que el backend sigue intacto**

```bash
cd backend && npm test && npm run test:e2e
```

Esperado: 67 unitarios y 35 e2e en verde. Esta entrega no toca `backend/`, así que cualquier fallo aquí significa que se salió del alcance.

- [ ] **Step 3: Buscar colores crudos**

```bash
grep -rn "#[0-9a-fA-F]\{3,6\}" frontend/src/app/shared/ui frontend/src/app/shared/shell
```

Esperado: solo los `rgba()` de los velos, que son negro translúcido y no colores de marca. Cualquier otro literal es un componente que se saltó los tokens y no va a funcionar en tema oscuro.

- [ ] **Step 4: Recorrido a mano**

Con la app corriendo y en **los dos temas**:

| Qué | Esperado |
|---|---|
| `/ui` | Las diez primitivas se ven bien en claro y en oscuro |
| Teclado | `Tab` recorre la aplicación entera y el foco se ve siempre |
| `Esc` | Cierra el modal y el cajón móvil |
| Movimiento reducido | Con `prefers-reduced-motion: reduce`, nada se desplaza ni escala |
| Móvil ~400 px | El cajón entra, el velo cierra, el fondo no se desplaza |
| Persistencia | El tema elegido sobrevive a recargar, sin destello |
| **Pantallas viejas** | Órdenes, detalle, formularios, usuarios y perfil se ven **como antes** |

- [ ] **Step 5: Actualizar la documentación**

En `docs/contexto-core.md`, en la sección 6 (Frontend), reemplazar el árbol y el párrafo del navbar:

```markdown
src/app/
├── core/
│   ├── guards/        authGuard (token presente), rolesGuard (data.roles)
│   ├── interceptors/  jwtInterceptor — añade Bearer solo a environment.apiUrl
│   ├── models/        interfaces + constantes de estados, etiquetas y colores
│   └── services/      auth, token, tema, orden, trabajo, comentario, adjunto, usuario, vehiculo
├── shared/
│   ├── ui/            el sistema de diseño: botón, campo, select, pastilla,
│   │                  tarjeta, toast, esqueleto, estado vacío, modal, confirmar
│   ├── shell/         barra lateral, topbar y cajón móvil
│   └── components/    spinner, badge-estado (heredados; se retiran en la entrega C)
└── features/          auth · dashboard · ordenes · trabajos · usuarios · perfil · ui
```

Y añadir a la sección 7, entre las decisiones que no se ven en el código:

```markdown
- **El color vive en `styles/tokens.css` y en ningún otro sitio.** Los tokens son
  semánticos (`--superficie`, no `--blanco`), y por eso el tema oscuro es un bloque
  de redefiniciones. Un componente que nombre un color crudo se rompe en oscuro:
  `node scripts/contraste.mjs` verifica los pares, y un `grep` de `#` sobre
  `shared/ui/` encuentra a los infractores.
- **Bootstrap y el sistema propio conviven** hasta que la entrega C del rediseño
  termine. La regla es que un componente usa uno u otro, nunca los dos.
- **La ruta `/ui` es el catálogo de componentes**, y es donde se verifica el sistema
  de diseño en ambos temas.
```

En `README.md`, añadir junto a los comandos existentes:

```markdown
- `node scripts/contraste.mjs` (en `frontend/`) — comprueba que los pares de color llegan a AA.
- `/ui` — catálogo de componentes del sistema de diseño.
```

- [ ] **Step 6: Commit**

```bash
git add docs README.md
git commit -m "docs: documentar el sistema de diseño y la ruta del catálogo"
```

---

## Cierre

Con las ocho tareas en verde, la rama `rediseno-a` está lista para mergear:

```bash
git checkout master
git merge --no-ff rediseno-a
```

La entrega B —dashboard, lista de órdenes y detalle con Kanban— arranca con su propia
spec, y ya tiene contra qué construirse.
