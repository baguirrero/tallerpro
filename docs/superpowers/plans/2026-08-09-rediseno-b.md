# Rediseño · Entrega B — Pantallas núcleo — Plan de implementación

> **Para quien lo ejecute con agentes:** SUB-SKILL OBLIGATORIA — usar
> `superpowers:subagent-driven-development` (recomendada) o
> `superpowers:executing-plans` para implementarlo tarea por tarea. Los pasos
> llevan casilla (`- [ ]`) para poder marcarlos.

**Objetivo:** mover al sistema de diseño de la entrega A las tres pantallas que el taller usa a diario —dashboard, lista de órdenes y detalle de orden con su Kanban—, y retirar de ellas los `confirm()` y `prompt()` del navegador.

**Arquitectura:** solo frontend. Cada pantalla es un componente standalone de Angular con estado local en signals; se reescriben sus plantillas contra las primitivas de `shared/ui/` y los tokens de `styles/tokens.css`. La lógica que tiene casos borde —contar estados que el backend no devuelve, leer el filtro de la URL, buscar sobre lo cargado, validar un repuesto— se extrae a **funciones puras exportadas** desde el propio archivo del componente, que es lo que se prueba con Jasmine; lo visual se verifica con la aplicación corriendo.

**Stack:** Angular 20 (standalone, signals, control flow `@if`/`@for`), Karma + Jasmine, TypeScript 5.9. Sin dependencias nuevas.

**Diseño de referencia:** [`docs/superpowers/specs/2026-08-09-rediseno-b-pantallas-nucleo-design.md`](../specs/2026-08-09-rediseno-b-pantallas-nucleo-design.md). Cuando este plan y la spec no coincidan, manda la spec.

## Restricciones globales

Valen para **todas** las tareas:

1. **No se toca `backend/`.** Al terminar, `git diff --stat master -- backend/` sale vacío.
2. **Ni una clase de Bootstrap** en los archivos que se tocan. Prohibidas: `card`, `card-header`, `card-body`, `btn`, `btn-*`, `row`, `col-*`, `alert`, `alert-*`, `badge`, `table`, `table-*`, `form-control`, `form-select`, `form-label`, `text-muted`, `fw-*`, `mb-*`, `ms-*`, `mt-*`, `py-*`, `d-flex`, `g-3`, `shadow-sm`, `text-end`, `small`, `text-bg-*`, `bg-*`, `border-*`, `opacity-50`, `align-middle`, `justify-content-*`, `align-items-*`.
3. **Ningún color crudo.** Nada de `#rrggbb` ni `rgb()` en los estilos de los componentes: solo `var(--token)`. Los tokens existen en `frontend/src/styles/tokens.css`.
4. **Ningún endpoint nuevo.** Solo `GET /ordenes`, `GET /ordenes?estado=`, `GET /ordenes/estadisticas`, `GET /trabajos/mis-trabajos`, `GET /trabajos/orden/:ordenId`, y las mutaciones que los servicios ya exponen.
5. **Mensajes:** fallo al **cargar** → bloque de error en el cuerpo de la pantalla; resultado de una **acción** → `ToastService`. Nunca al revés.
6. **Contenedores:** una tabla va dentro de un `.panel` local del componente (superficie, borde, radio `--r-md`, `overflow: hidden`), para que la tabla llegue al borde; el contenido que no es tabla va en `<app-tarjeta>`. La duplicación del `.panel` entre dos pantallas es deliberada: si aparece un tercer caso en la entrega C, ahí se extrae.
7. **Prettier:** `printWidth` 100 y comillas simples, como declara `frontend/package.json`. Si se toca formato, `npx prettier --write` sobre los archivos del commit.
8. **Idioma:** identificadores, comentarios y textos de interfaz en castellano, como el resto del proyecto.
9. **Los comentarios explican el porqué**, no el qué. El proyecto no comenta lo obvio.

## Preparación (una sola vez, antes de la tarea 1)

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
docker compose up -d                       # PostgreSQL en 5434, MinIO, pgAdmin
cd backend  && npm run start:dev           # API en http://localhost:3001
cd frontend && npm start                   # aplicación en http://localhost:4200
```

Dejar los tres corriendo durante toda la implementación. **Cada tarea se verifica contra la aplicación corriendo, no se da por buena porque compile.** El usuario lo pide explícitamente: el reporte de cada tarea cita lo que se vio, no lo que se supone.

Comandos que se repiten:

```bash
cd frontend
npx ng test --watch=false --browsers=ChromeHeadless   # 5 tests en verde hoy
npm run build
```

Datos de prueba: el seed del backend crea usuarios de los cuatro roles. Para ejercitar los estados hace falta al menos una orden en `COTIZADA`, una en `ESPERANDO_REPUESTO` y una en `FINALIZADA`; se consiguen creando una orden, cotizando sus trabajos y moviendo las tarjetas del Kanban.

---

## Estructura de archivos

| Archivo | Responsabilidad | Tarea |
|---|---|---|
| `shared/ui/prioridad.ts` | **nuevo** — punto de color + etiqueta de prioridad | 1 |
| `shared/ui/prioridad.spec.ts` | **nuevo** — su test | 1 |
| `features/ui/catalogo.html` | usa el componente nuevo en vez del punto dibujado a mano | 1 |
| `features/dashboard/dashboard.ts` | `contarEstado()` + las tres cifras y la tira | 2 |
| `features/dashboard/dashboard.spec.ts` | **nuevo** — test de `contarEstado()` | 2 |
| `features/dashboard/dashboard.html` | cifras accionables, tira y tabla de trabajos | 2 |
| `features/ordenes/lista-ordenes/lista-ordenes.ts` | `estadoDesdeUrl()`, `coincide()`, filtro en la URL, buscador | 3 |
| `features/ordenes/lista-ordenes/lista-ordenes.spec.ts` | **nuevo** — sus tests | 3 |
| `features/ordenes/lista-ordenes/lista-ordenes.html` | pestañas, buscador, tabla, vacíos, confirmar | 3 |
| `features/ordenes/detalle-orden/detalle-orden.*` | cabecera compacta, franja, pestañas, confirmar de cancelar | 4 |
| `features/trabajos/tablero-kanban/tablero-kanban.ts` | `motivoLimpio()` + estado del modal | 5 |
| `features/trabajos/tablero-kanban/tablero-kanban.spec.ts` | **nuevo** — test de `motivoLimpio()` | 5 |
| `features/trabajos/tablero-kanban/tablero-kanban.html` | columnas, tarjetas y modal del motivo | 5 |
| `features/ordenes/panel-cotizacion/panel-cotizacion.ts` | `marcaDe()`, `repuestoValido()`, editor con signals | 6 |
| `features/ordenes/panel-cotizacion/panel-cotizacion.spec.ts` | **nuevo** — sus tests | 6 |
| `features/ordenes/panel-cotizacion/panel-cotizacion.html` | desglose, marcas y totales | 6 |
| `features/ordenes/panel-aprobacion/panel-aprobacion.*` | rediseño de los botones de decisión | 7 |
| `docs/contexto-core.md` | describe las pantallas nuevas | 8 |

**Orden y por qué:** la tarea 1 crea la única pieza compartida, así que va primero. Las tareas 2 y 3 son pantallas independientes. La 4 arma el armazón del detalle (cabecera y pestañas) dibujando **los paneles viejos todavía en Bootstrap** dentro de las pestañas; las tareas 5, 6 y 7 los van reemplazando de a uno. La aplicación queda usable después de cada commit.

---

### Tarea 1: `app-prioridad`, el punto de prioridad

La spec no nombra este componente, pero lo piden dos secciones: §4 (tabla del dashboard) y §7 (tarjeta del Kanban) dibujan el mismo punto de color más texto. Dos sitios de uso desde el primer día es exactamente el criterio que la §7 de la spec fija para extraer en vez de repetir. El catálogo de `/ui` ya dibuja ese punto a mano con markup suelto; pasa a usar el componente.

**Files:**
- Create: `frontend/src/app/shared/ui/prioridad.ts`
- Create: `frontend/src/app/shared/ui/prioridad.spec.ts`
- Modify: `frontend/src/app/features/ui/catalogo.html` (bloque «Prioridad»), `frontend/src/app/features/ui/catalogo.ts` (imports)

**Interfaces:**
- Consume: los tokens `--prioridad-baja`, `--prioridad-media`, `--prioridad-alta` de `styles/tokens.css`.
- Produce: `export class Prioridad` con selector `app-prioridad`, input requerido `valor: string` (`'BAJA' | 'MEDIA' | 'ALTA'` o cualquier otra cosa), y los computed públicos `etiqueta(): string` y `color(): string`. Lo usan las tareas 2 y 5.

- [ ] **Paso 1: escribir el test que falla**

Crear `frontend/src/app/shared/ui/prioridad.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { Prioridad } from './prioridad';

describe('Prioridad', () => {
  function montar(valor: string) {
    const fixture = TestBed.createComponent(Prioridad);
    fixture.componentRef.setInput('valor', valor);
    fixture.detectChanges();
    return fixture;
  }

  it('traduce la prioridad a su etiqueta en castellano', () => {
    expect(montar('ALTA').nativeElement.textContent.trim()).toBe('Alta');
  });

  it('resuelve el token de color de cada prioridad', () => {
    expect(montar('BAJA').componentInstance.color()).toBe('var(--prioridad-baja)');
    expect(montar('MEDIA').componentInstance.color()).toBe('var(--prioridad-media)');
    expect(montar('ALTA').componentInstance.color()).toBe('var(--prioridad-alta)');
  });

  it('una prioridad desconocida se muestra cruda, con el punto neutro', () => {
    const fixture = montar('URGENTISIMA');
    expect(fixture.nativeElement.textContent.trim()).toBe('URGENTISIMA');
    expect(fixture.componentInstance.color()).toBe('var(--borde-fuerte)');
  });
});
```

El color se comprueba sobre el computed y no sobre `style.background` a propósito: leer de vuelta una propiedad abreviada que contiene `var()` devuelve cadena vacía en Chrome, y el test pasaría a medir el CSSOM en vez del componente. Que el binding existe lo prueba el test de la etiqueta y, sobre todo, el paso 6.

- [ ] **Paso 2: correr el test y verlo fallar**

```bash
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: falla al compilar, `Cannot find module './prioridad'`.

- [ ] **Paso 3: escribir el componente**

Crear `frontend/src/app/shared/ui/prioridad.ts`:

```ts
import { Component, computed, input } from '@angular/core';

const ETIQUETA: Record<string, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
};

/**
 * La prioridad no es una pastilla a propósito: en la tarjeta del Kanban y en la
 * tabla del dashboard convive con la pastilla de estado, y dos pastillas juntas
 * dicen que hay dos estados donde hay uno.
 */
@Component({
  selector: 'app-prioridad',
  template: `
    <span class="p">
      <span class="punto" [style.background]="color()" aria-hidden="true"></span>
      {{ etiqueta() }}
    </span>
  `,
  styles: `
    .p {
      display: inline-flex;
      align-items: center;
      gap: var(--e2);
      font-family: var(--fuente);
      font-size: var(--t-menor);
      line-height: 1.4;
      color: var(--texto-suave);
      white-space: nowrap;
    }
    .punto {
      width: 8px;
      height: 8px;
      border-radius: var(--r-full);
      flex: none;
    }
  `,
})
export class Prioridad {
  readonly valor = input.required<string>();

  readonly etiqueta = computed(() => ETIQUETA[this.valor()] ?? this.valor());

  /** Una prioridad que no conocemos se pinta neutra en vez de romper el token. */
  readonly color = computed(() =>
    ETIQUETA[this.valor()]
      ? `var(--prioridad-${this.valor().toLowerCase()})`
      : 'var(--borde-fuerte)',
  );
}
```

- [ ] **Paso 4: correr el test y verlo pasar**

```bash
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: `TOTAL: 8 SUCCESS` (los 5 de `tema` más los 3 nuevos).

- [ ] **Paso 5: usarlo en el catálogo**

En `frontend/src/app/features/ui/catalogo.html`, reemplazar las tres muestras dibujadas a mano del bloque «Prioridad» por:

```html
  <div class="muestra" style="margin-top: var(--e3)">
    <app-prioridad valor="BAJA"></app-prioridad>
    <app-prioridad valor="MEDIA"></app-prioridad>
    <app-prioridad valor="ALTA"></app-prioridad>
  </div>
```

En `frontend/src/app/features/ui/catalogo.ts`, importar `Prioridad` y agregarlo al array `imports` del decorador. Si tras el cambio la clase `.punto` de los estilos del catálogo queda sin uso, borrarla.

- [ ] **Paso 6: verificar en la aplicación corriendo**

Abrir http://localhost:4200/ui y comprobar, **en tema claro y en tema oscuro** (interruptor de la topbar): los tres puntos se ven con su color, el texto queda alineado con el punto y nada se movió respecto de antes.

- [ ] **Paso 7: commit**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
git add frontend/src/app/shared/ui/prioridad.ts \
        frontend/src/app/shared/ui/prioridad.spec.ts \
        frontend/src/app/features/ui/catalogo.html \
        frontend/src/app/features/ui/catalogo.ts
git commit -m "feat: el punto de prioridad como componente

Lo piden el dashboard y la tarjeta del Kanban, y el catálogo ya lo
dibujaba a mano. Dos sitios de uso desde el principio es el criterio
para extraerlo en vez de repetir el markup."
```

---

### Tarea 2: Dashboard

**Files:**
- Modify: `frontend/src/app/features/dashboard/dashboard.ts`
- Modify: `frontend/src/app/features/dashboard/dashboard.html`
- Create: `frontend/src/app/features/dashboard/dashboard.spec.ts`

**Interfaces:**
- Consume: `Prioridad` (tarea 1); `OrdenService.obtenerEstadisticas(): Observable<Estadisticas>`; `TrabajoService.obtenerMisTrabajos(): Observable<Trabajo[]>`; `Estadisticas = { total: number; porEstado: { estado: string; cantidad: number }[] }`.
- Produce: `export function contarEstado(estadisticas: Estadisticas | null, estado: string): number`. Ninguna otra tarea depende de ella; se exporta para poder probarla.

- [ ] **Paso 1: escribir el test que falla**

Crear `frontend/src/app/features/dashboard/dashboard.spec.ts`:

```ts
import { Estadisticas } from '../../core/models/orden.model';
import { contarEstado } from './dashboard';

describe('contarEstado', () => {
  const datos: Estadisticas = {
    total: 52,
    porEstado: [
      { estado: 'EN_PROCESO', cantidad: 7 },
      { estado: 'COTIZADA', cantidad: 2 },
    ],
  };

  it('devuelve la cantidad del estado pedido', () => {
    expect(contarEstado(datos, 'COTIZADA')).toBe(2);
  });

  it('un estado que el backend no devolvió cuenta cero', () => {
    expect(contarEstado(datos, 'ESPERANDO_REPUESTO')).toBe(0);
  });

  it('sin estadísticas cargadas todo cuenta cero', () => {
    expect(contarEstado(null, 'EN_PROCESO')).toBe(0);
  });
});
```

El segundo test es el que importa: `obtenerEstadisticas` del backend es un `GROUP BY orden.estado`, así que **los estados sin ninguna orden no aparecen en la respuesta**. Si la pantalla asumiera que llegan los siete, las tres cifras mostrarían `undefined` justo cuando la noticia es buena.

- [ ] **Paso 2: correr el test y verlo fallar**

```bash
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: falla al compilar, `contarEstado` no está exportada por `./dashboard`.

- [ ] **Paso 3: escribir el componente**

Reemplazar `frontend/src/app/features/dashboard/dashboard.ts` por:

```ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { OrdenService } from '../../core/services/orden';
import { TrabajoService } from '../../core/services/trabajo';
import { TokenService } from '../../core/services/token';
import { Estadisticas } from '../../core/models/orden.model';
import { Trabajo } from '../../core/models/trabajo.model';
import { ETIQUETA_ESTADO_ORDEN } from '../../core/models/estados';
import { Pastilla } from '../../shared/ui/pastilla';
import { Prioridad } from '../../shared/ui/prioridad';
import { Esqueleto } from '../../shared/ui/esqueleto';
import { EstadoVacio } from '../../shared/ui/estado-vacio';

/**
 * El backend agrupa por estado, así que los estados sin órdenes no vienen en la
 * respuesta: lo que falta cuenta cero, no `undefined`.
 */
export function contarEstado(estadisticas: Estadisticas | null, estado: string): number {
  return estadisticas?.porEstado.find((fila) => fila.estado === estado)?.cantidad ?? 0;
}

/** Los tres estados que piden acción, con el nombre que usa quien atiende. */
const ATENCION = [
  { estado: 'ESPERANDO_REPUESTO', titulo: 'Esperando repuesto' },
  { estado: 'COTIZADA', titulo: 'Esperando al cliente' },
  { estado: 'FINALIZADA', titulo: 'Listas para entregar' },
];

const RESTO = ['RECIBIDA', 'EN_PROCESO', 'ENTREGADA', 'CANCELADA'];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, Pastilla, Prioridad, Esqueleto, EstadoVacio],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly ordenService = inject(OrdenService);
  private readonly trabajoService = inject(TrabajoService);
  readonly tokenService = inject(TokenService);

  readonly cargando = signal<boolean>(true);
  readonly mensajeError = signal<string | null>(null);
  readonly estadisticas = signal<Estadisticas | null>(null);
  readonly misTrabajos = signal<Trabajo[]>([]);

  readonly atencion = computed(() =>
    ATENCION.map((fila) => ({
      ...fila,
      cantidad: contarEstado(this.estadisticas(), fila.estado),
    })),
  );

  readonly resto = computed(() =>
    RESTO.map((estado) => ({
      estado,
      titulo: ETIQUETA_ESTADO_ORDEN[estado] ?? estado,
      cantidad: contarEstado(this.estadisticas(), estado),
    })),
  );

  readonly total = computed(() => this.estadisticas()?.total ?? 0);

  ngOnInit(): void {
    this.cargarEstadisticas();
    this.cargarMisTrabajos();
  }

  private cargarEstadisticas(): void {
    this.ordenService.obtenerEstadisticas().subscribe({
      next: (datos) => {
        this.estadisticas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudieron cargar las estadísticas');
        this.cargando.set(false);
      },
    });
  }

  /** Si los trabajos fallan, la tabla queda vacía sin tumbar el resto. */
  private cargarMisTrabajos(): void {
    this.trabajoService.obtenerMisTrabajos().subscribe({
      next: (datos) => this.misTrabajos.set(datos),
      error: () => this.misTrabajos.set([]),
    });
  }
}
```

- [ ] **Paso 4: correr el test y verlo pasar**

```bash
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: `TOTAL: 11 SUCCESS`.

- [ ] **Paso 5: escribir la plantilla**

Reemplazar `frontend/src/app/features/dashboard/dashboard.html` por:

```html
<h1 class="saludo">Hola, {{ tokenService.nombreCompleto() }}</h1>
<p class="texto-suave" style="margin-bottom: var(--e6)">Resumen del taller</p>

@if (mensajeError()) {
  <div class="bloque-error">{{ mensajeError() }}</div>
}

@if (cargando()) {
  <div class="cifras">
    @for (hueco of [1, 2, 3]; track hueco) {
      <app-esqueleto variante="tarjeta" [repeticiones]="1"></app-esqueleto>
    }
  </div>
} @else {
  <div class="cifras">
    @for (dato of atencion(); track dato.estado) {
      @if (dato.cantidad > 0) {
        <a
          class="cifra"
          [routerLink]="['/ordenes']"
          [queryParams]="{ estado: dato.estado }"
        >
          <span class="numero">{{ dato.cantidad }}</span>
          <span class="rotulo">{{ dato.titulo }}</span>
          <span class="flecha" aria-hidden="true">→</span>
        </a>
      } @else {
        <div class="cifra vacia">
          <span class="numero">0</span>
          <span class="rotulo">{{ dato.titulo }}</span>
        </div>
      }
    }
  </div>

  <p class="tira">
    @for (dato of resto(); track dato.estado) {
      <a [routerLink]="['/ordenes']" [queryParams]="{ estado: dato.estado }">
        {{ dato.titulo }} <strong>{{ dato.cantidad }}</strong>
      </a>
    }
    <a routerLink="/ordenes">Total <strong>{{ total() }}</strong></a>
  </p>
}

<div class="panel">
  <div class="panel-cab">
    <span class="etiqueta">Mis trabajos asignados</span>
    <span class="conteo">{{ misTrabajos().length }}</span>
  </div>

  @if (misTrabajos().length === 0) {
    <app-estado-vacio
      icono="🔧"
      titulo="Sin trabajos asignados"
      mensaje="Cuando le asignen un trabajo, aparecerá acá."
    ></app-estado-vacio>
  } @else {
    <table class="tabla">
      <thead>
        <tr>
          <th>Trabajo</th>
          <th>Vehículo</th>
          <th>Prioridad</th>
          <th>Estado</th>
          <th>Fecha límite</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @for (trabajo of misTrabajos(); track trabajo.id) {
          <tr>
            <td>{{ trabajo.titulo }}</td>
            <td>
              @if (trabajo.orden; as orden) {
                <span class="numero-orden">{{ orden.numero_orden }}</span>
                <div class="texto-suave texto-menor">
                  {{ orden.vehiculo.marca }} {{ orden.vehiculo.modelo }} · {{ orden.vehiculo.placa }}
                </div>
              } @else {
                <span class="texto-suave">—</span>
              }
            </td>
            <td><app-prioridad [valor]="trabajo.prioridad"></app-prioridad></td>
            <td><app-pastilla [estado]="trabajo.estado"></app-pastilla></td>
            <td class="num">
              {{ trabajo.fecha_limite ? (trabajo.fecha_limite | date: 'dd/MM/yyyy' : 'UTC') : '—' }}
            </td>
            <td class="num">
              @if (trabajo.orden; as orden) {
                <a class="enlace" [routerLink]="['/ordenes', orden.id]">Ver orden</a>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  }
</div>
```

- [ ] **Paso 6: escribir los estilos**

Crear `frontend/src/app/features/dashboard/dashboard.css`:

```css
.saludo {
  font-size: var(--t-h1);
  font-weight: 600;
  color: var(--texto-primario);
  margin-bottom: var(--e1);
}

.bloque-error {
  background: var(--error-fondo);
  color: var(--error-texto);
  border: 1px solid var(--error-texto);
  border-radius: var(--r-md);
  padding: var(--e3) var(--e4);
  margin-bottom: var(--e4);
  font-size: var(--t-tabla);
}

.cifras {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--e4);
  margin-bottom: var(--e4);
}
@media (max-width: 768px) {
  .cifras { grid-template-columns: 1fr; }
}

.cifra {
  position: relative;
  display: block;
  background: var(--superficie);
  border: 1px solid var(--borde);
  border-radius: var(--r-md);
  box-shadow: var(--sombra-1);
  padding: var(--e4);
  text-decoration: none;
  transition:
    border-color var(--dur-rapida) var(--ease-suave),
    transform var(--dur-rapida) var(--ease-salida);
}
a.cifra:hover { border-color: var(--acento); transform: translateY(-1px); }
a.cifra:focus-visible { outline: 2px solid var(--acento); outline-offset: 2px; }

.numero {
  display: block;
  font-size: var(--t-h1);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--texto-primario);
}
.rotulo {
  display: block;
  font-size: var(--t-tabla);
  color: var(--texto-suave);
}
.flecha {
  position: absolute;
  right: var(--e4);
  bottom: var(--e4);
  color: var(--acento);
}

/* En cero es una buena noticia: se apaga en vez de gritar. */
.cifra.vacia .numero { color: var(--texto-suave); }

.tira {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e4);
  margin-bottom: var(--e6);
  font-size: var(--t-tabla);
}
.tira a { color: var(--texto-suave); text-decoration: none; }
.tira a:hover { color: var(--acento); }
.tira strong { color: var(--texto-primario); font-variant-numeric: tabular-nums; }

.panel {
  background: var(--superficie);
  border: 1px solid var(--borde);
  border-radius: var(--r-md);
  box-shadow: var(--sombra-1);
  overflow: hidden;
}
.panel-cab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--e3) var(--e4);
  border-bottom: 1px solid var(--borde);
}
.conteo {
  font-size: var(--t-menor);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--texto-suave);
  background: var(--superficie-hundida);
  border-radius: var(--r-full);
  padding: var(--e1) var(--e2);
}

.numero-orden { font-weight: 600; font-variant-numeric: tabular-nums; }
.enlace { color: var(--acento); text-decoration: none; font-weight: 600; }
.enlace:hover { text-decoration: underline; }
```

- [ ] **Paso 7: verificar en la aplicación corriendo**

Con sesión iniciada, abrir http://localhost:4200/dashboard y comprobar:

1. Las tres cifras coinciden con lo que devuelve `curl -s localhost:3001/ordenes/estadisticas -H "Authorization: Bearer <token>"`.
2. Un estado en cero se ve apagado, **sin flecha y sin ser clicable**.
3. Un clic en una cifra con órdenes lleva a `/ordenes?estado=…` (por ahora la lista todavía ignora el parámetro: eso es la tarea 3; lo que se verifica acá es que la URL sale bien).
4. La tira de abajo enlaza y sus números cuadran.
5. La tabla muestra el punto de prioridad y la pastilla de estado, y las fechas quedan alineadas.
6. Recargar y mirar el esqueleto mientras carga: son tres rectángulos donde van a ir las tarjetas.
7. Todo lo anterior **en tema claro y en oscuro**.
8. Con la ventana angosta (< 768 px) las tres cifras se apilan y la tabla no desborda.

- [ ] **Paso 8: commit**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
git add frontend/src/app/features/dashboard/
git commit -m "feat: el dashboard dice qué está trancado

Ocho contadores del mismo tamaño no dicen qué hacer. Ahora manda lo que
pide acción -esperando repuesto, esperando al cliente, listas para
entregar- y cada cifra enlaza a la lista con su filtro. En cero se apaga
y deja de ser clicable: no hay nada que ir a ver."
```

---

### Tarea 3: Lista de órdenes

**Files:**
- Modify: `frontend/src/app/features/ordenes/lista-ordenes/lista-ordenes.ts`
- Modify: `frontend/src/app/features/ordenes/lista-ordenes/lista-ordenes.html`
- Create: `frontend/src/app/features/ordenes/lista-ordenes/lista-ordenes.css`
- Create: `frontend/src/app/features/ordenes/lista-ordenes/lista-ordenes.spec.ts`

**Interfaces:**
- Consume: `OrdenService.obtenerTodas(estado?: string): Observable<Orden[]>`, `OrdenService.obtenerEstadisticas()`, `OrdenService.eliminar(id: string): Observable<void>`; `contarEstado` no se reusa (vive en el dashboard); `ToastService.exito/error(texto: string)`; `Confirmar`, `Campo`, `Boton`, `Pastilla`, `Esqueleto`, `EstadoVacio`.
- Produce: `export function estadoDesdeUrl(valor: string | null): string` y `export function coincide(orden: Orden, texto: string): boolean`.

- [ ] **Paso 1: escribir los tests que fallan**

Crear `frontend/src/app/features/ordenes/lista-ordenes/lista-ordenes.spec.ts`:

```ts
import { Orden } from '../../../core/models/orden.model';
import { coincide, estadoDesdeUrl } from './lista-ordenes';

function orden(parcial: Partial<Orden> = {}): Orden {
  return {
    id: '1',
    numero_orden: 'ORD-2026-0042',
    descripcion: 'Cambio de aceite',
    fecha_ingreso: '2026-08-04',
    estado: 'EN_PROCESO',
    vehiculo: {
      id: 'v1',
      placa: 'ABC-123',
      marca: 'Toyota',
      modelo: 'Yaris',
      propietario_nombre: 'Juan Pérez',
      propietario_telefono: '987654321',
    },
    totales: { aprobado: 0, pendiente: 0, rechazado: 0 },
    created_at: '2026-08-04',
    ...parcial,
  };
}

describe('estadoDesdeUrl', () => {
  it('acepta un estado del dominio', () => {
    expect(estadoDesdeUrl('COTIZADA')).toBe('COTIZADA');
  });

  it('un estado inventado cae en "todas" en vez de dejar la tabla vacía', () => {
    expect(estadoDesdeUrl('MARTE')).toBe('');
  });

  it('sin parámetro, todas', () => {
    expect(estadoDesdeUrl(null)).toBe('');
  });
});

describe('coincide', () => {
  it('sin texto, pasa todo', () => {
    expect(coincide(orden(), '')).toBe(true);
    expect(coincide(orden(), '   ')).toBe(true);
  });

  it('encuentra por fragmento de placa, sin importar mayúsculas', () => {
    expect(coincide(orden(), 'abc')).toBe(true);
  });

  it('encuentra por número de orden y por propietario', () => {
    expect(coincide(orden(), '0042')).toBe(true);
    expect(coincide(orden(), 'pérez')).toBe(true);
  });

  it('encuentra por marca y modelo', () => {
    expect(coincide(orden(), 'yaris')).toBe(true);
  });

  it('ignora los espacios de los bordes', () => {
    expect(coincide(orden(), '  ABC-123  ')).toBe(true);
  });

  it('el teléfono no se busca: no está en el rótulo de la columna', () => {
    expect(coincide(orden(), '987654321')).toBe(false);
  });

  it('lo que no está, no coincide', () => {
    expect(coincide(orden(), 'nissan')).toBe(false);
  });
});
```

- [ ] **Paso 2: correr los tests y verlos fallar**

```bash
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: falla al compilar, `estadoDesdeUrl` y `coincide` no existen.

- [ ] **Paso 3: escribir el componente**

Reemplazar `frontend/src/app/features/ordenes/lista-ordenes/lista-ordenes.ts` por:

```ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { OrdenService } from '../../../core/services/orden';
import { TokenService } from '../../../core/services/token';
import { Orden, Estadisticas } from '../../../core/models/orden.model';
import { ESTADOS_ORDEN, ETIQUETA_ESTADO_ORDEN, ROLES } from '../../../core/models/estados';
import { Pastilla } from '../../../shared/ui/pastilla';
import { Boton } from '../../../shared/ui/boton';
import { Campo } from '../../../shared/ui/campo';
import { Confirmar } from '../../../shared/ui/confirmar';
import { Esqueleto } from '../../../shared/ui/esqueleto';
import { EstadoVacio } from '../../../shared/ui/estado-vacio';
import { ToastService } from '../../../shared/ui/toast';

/**
 * El estado viaja en la URL, así que puede ser cualquier cosa: un valor que no
 * es de los siete se ignora. Una tabla vacía sin explicación es peor que
 * mostrar todo.
 */
export function estadoDesdeUrl(valor: string | null): string {
  return valor && (ESTADOS_ORDEN as readonly string[]).includes(valor) ? valor : '';
}

/**
 * Busca sobre lo ya cargado, no contra la API: no hay endpoint de búsqueda. El
 * teléfono queda fuera a propósito —nadie busca un auto por el teléfono— y así
 * el rótulo «3 de 52» sigue siendo cierto para lo que se ve en pantalla.
 */
export function coincide(orden: Orden, texto: string): boolean {
  const aguja = texto.trim().toLowerCase();
  if (!aguja) return true;

  return [
    orden.numero_orden,
    orden.vehiculo.placa,
    orden.vehiculo.marca,
    orden.vehiculo.modelo,
    orden.vehiculo.propietario_nombre,
  ]
    .join(' ')
    .toLowerCase()
    .includes(aguja);
}

@Component({
  selector: 'app-lista-ordenes',
  imports: [
    RouterLink, CurrencyPipe, DatePipe,
    Pastilla, Boton, Campo, Confirmar, Esqueleto, EstadoVacio,
  ],
  templateUrl: './lista-ordenes.html',
  styleUrl: './lista-ordenes.css',
})
export class ListaOrdenes implements OnInit {
  private readonly ordenService = inject(OrdenService);
  private readonly tokenService = inject(TokenService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly cargando = signal<boolean>(true);
  readonly mensajeError = signal<string | null>(null);
  readonly ordenes = signal<Orden[]>([]);
  readonly filtroEstado = signal<string>('');
  readonly busqueda = signal<string>('');
  readonly estadisticas = signal<Estadisticas | null>(null);
  readonly ordenAEliminar = signal<Orden | null>(null);

  readonly etiquetas = ETIQUETA_ESTADO_ORDEN;

  /** «Todas» primero, después los siete estados con su conteo. */
  readonly pestanas = computed(() => {
    const datos = this.estadisticas();
    const cuenta = (estado: string) =>
      datos?.porEstado.find((fila) => fila.estado === estado)?.cantidad ?? null;

    return [
      { valor: '', texto: 'Todas', cantidad: datos?.total ?? null },
      ...ESTADOS_ORDEN.map((estado) => ({
        valor: estado as string,
        texto: ETIQUETA_ESTADO_ORDEN[estado],
        cantidad: cuenta(estado),
      })),
    ];
  });

  readonly visibles = computed(() =>
    this.ordenes().filter((orden) => coincide(orden, this.busqueda())),
  );

  readonly buscando = computed(() => this.busqueda().trim().length > 0);

  ngOnInit(): void {
    // Una sola vía: la URL manda, y navegar dispara la recarga.
    this.route.queryParamMap.subscribe((params) => {
      this.filtroEstado.set(estadoDesdeUrl(params.get('estado')));
      this.cargarOrdenes();
    });

    this.cargarEstadisticas();
  }

  private cargarOrdenes(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.ordenService.obtenerTodas(this.filtroEstado() || undefined).subscribe({
      next: (datos) => {
        this.ordenes.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudieron cargar las órdenes');
        this.cargando.set(false);
      },
    });
  }

  /** Si fallan, las pestañas se dibujan sin número: pierden dato, no función. */
  private cargarEstadisticas(): void {
    this.ordenService.obtenerEstadisticas().subscribe({
      next: (datos) => this.estadisticas.set(datos),
      error: () => this.estadisticas.set(null),
    });
  }

  cambiarEstado(estado: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: estado ? { estado } : {},
      // Tocar pestañas no debe llenar el historial de vueltas atrás.
      replaceUrl: true,
    });
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.cambiarEstado('');
  }

  puedeEditar(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR);
  }

  puedeEliminar(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR);
  }

  abrirDetalle(orden: Orden): void {
    this.router.navigate(['/ordenes', orden.id]);
  }

  confirmarEliminacion(): void {
    const orden = this.ordenAEliminar();
    if (!orden) return;

    this.ordenService.eliminar(orden.id).subscribe({
      next: () => {
        this.ordenAEliminar.set(null);
        this.toast.exito(`Se eliminó la orden ${orden.numero_orden}`);
        this.cargarOrdenes();
        this.cargarEstadisticas();
      },
      error: (error) => {
        this.ordenAEliminar.set(null);
        this.toast.error(error.error?.message ?? 'No se pudo eliminar la orden');
      },
    });
  }
}
```

- [ ] **Paso 4: correr los tests y verlos pasar**

```bash
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: `TOTAL: 21 SUCCESS`.

- [ ] **Paso 5: escribir la plantilla**

Reemplazar `frontend/src/app/features/ordenes/lista-ordenes/lista-ordenes.html` por:

```html
<div class="cabecera">
  <h1 class="titulo">Órdenes de servicio</h1>
  @if (puedeEditar()) {
    <a class="boton-nueva" routerLink="/ordenes/nueva">+ Nueva orden</a>
  }
</div>

<div class="pestanas" role="tablist">
  @for (pestana of pestanas(); track pestana.valor) {
    <button
      class="pestana"
      role="tab"
      [class.activa]="filtroEstado() === pestana.valor"
      [attr.aria-selected]="filtroEstado() === pestana.valor"
      (click)="cambiarEstado(pestana.valor)"
    >
      {{ pestana.texto }}
      @if (pestana.cantidad !== null) {
        <span class="conteo">{{ pestana.cantidad }}</span>
      }
    </button>
  }
</div>

<div class="barra-busqueda">
  <app-campo
    marcador="Buscar por n° de orden, placa o propietario"
    [valor]="busqueda()"
    (valorCambia)="busqueda.set($event)"
  ></app-campo>

  @if (buscando()) {
    <span class="texto-suave texto-menor">
      {{ visibles().length }} de {{ ordenes().length }}
    </span>
  }
</div>

@if (mensajeError()) {
  <div class="bloque-error">{{ mensajeError() }}</div>
}

@if (cargando()) {
  <div class="panel" style="padding: var(--e4)">
    <app-esqueleto variante="fila" [repeticiones]="6"></app-esqueleto>
  </div>
} @else if (visibles().length === 0) {
  <div class="panel">
    @if (buscando() || filtroEstado()) {
      <app-estado-vacio
        icono="🔍"
        titulo="Ninguna orden coincide"
        mensaje="Probá con otro texto o mirá todos los estados."
      >
        <app-boton variante="secundario" (pulsar)="limpiarFiltros()">Limpiar filtros</app-boton>
      </app-estado-vacio>
    } @else {
      <app-estado-vacio
        icono="📋"
        titulo="Todavía no hay órdenes"
        mensaje="Cuando ingrese un vehículo al taller, su orden aparecerá acá."
      >
        @if (puedeEditar()) {
          <a class="boton-nueva" routerLink="/ordenes/nueva">+ Nueva orden</a>
        }
      </app-estado-vacio>
    }
  </div>
} @else {
  <div class="panel">
    <table class="tabla">
      <thead>
        <tr>
          <th>N° Orden</th>
          <th>Vehículo</th>
          <th>Cliente</th>
          <th>Ingreso</th>
          <th class="num">Aprobado</th>
          <th>Estado</th>
          <th class="num">Acciones</th>
        </tr>
      </thead>
      <tbody>
        @for (orden of visibles(); track orden.id) {
          <tr class="clicable" (click)="abrirDetalle(orden)">
            <td>
              <!-- Enlace de verdad para que Tab lo alcance y se pueda abrir aparte;
                   el clic en la fila es una comodidad además de esto, no en su lugar. -->
              <a
                class="numero-orden"
                [routerLink]="['/ordenes', orden.id]"
                (click)="$event.stopPropagation()"
              >
                {{ orden.numero_orden }}
              </a>
            </td>
            <td>
              {{ orden.vehiculo.marca }} {{ orden.vehiculo.modelo }}
              <div class="texto-suave texto-menor">{{ orden.vehiculo.placa }}</div>
            </td>
            <td>
              {{ orden.vehiculo.propietario_nombre }}
              <div class="texto-suave texto-menor">{{ orden.vehiculo.propietario_telefono }}</div>
            </td>
            <td class="num">{{ orden.fecha_ingreso | date: 'dd/MM/yyyy' : 'UTC' }}</td>
            <td class="num">{{ orden.totales.aprobado | currency: 'PEN' : 'symbol-narrow' }}</td>
            <td><app-pastilla [estado]="orden.estado"></app-pastilla></td>
            <td class="num acciones" (click)="$event.stopPropagation()">
              @if (puedeEditar()) {
                <a class="enlace" [routerLink]="['/ordenes', orden.id, 'editar']">Editar</a>
              }
              @if (puedeEliminar()) {
                <app-boton variante="fantasma" tamano="sm" (pulsar)="ordenAEliminar.set(orden)">
                  Eliminar
                </app-boton>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>
}

<app-confirmar
  [abierto]="ordenAEliminar() !== null"
  titulo="Eliminar la orden"
  [mensaje]="
    '¿Seguro que desea eliminar la orden ' + (ordenAEliminar()?.numero_orden ?? '') + '?'
  "
  [peligro]="true"
  textoConfirmar="Eliminar"
  (confirmar)="confirmarEliminacion()"
  (cancelar)="ordenAEliminar.set(null)"
></app-confirmar>
```

- [ ] **Paso 6: escribir los estilos**

Crear `frontend/src/app/features/ordenes/lista-ordenes/lista-ordenes.css`:

```css
.cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--e3);
  margin-bottom: var(--e4);
}
.titulo { font-size: var(--t-h1); font-weight: 600; color: var(--texto-primario); }

.boton-nueva {
  display: inline-flex;
  align-items: center;
  font-size: var(--t-base);
  font-weight: 600;
  line-height: 1;
  min-height: 36px;
  padding: var(--e2) var(--e4);
  border-radius: var(--r-sm);
  background: var(--acento);
  color: var(--acento-texto);
  text-decoration: none;
  transition: background var(--dur-rapida) var(--ease-suave);
}
.boton-nueva:hover { background: var(--acento-hover); }

/* En pantallas angostas se desplaza en horizontal; plegarla en un desplegable
   sería volver al select de antes con más código. */
.pestanas {
  display: flex;
  gap: var(--e1);
  overflow-x: auto;
  border-bottom: 1px solid var(--borde);
  margin-bottom: var(--e4);
}
.pestana {
  display: inline-flex;
  align-items: center;
  gap: var(--e2);
  font-family: var(--fuente);
  font-size: var(--t-tabla);
  font-weight: 600;
  color: var(--texto-suave);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: var(--e2) var(--e3);
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--dur-rapida) var(--ease-suave);
}
.pestana:hover { color: var(--texto-primario); }
.pestana.activa { color: var(--acento); border-bottom-color: var(--acento); }

.conteo {
  font-size: var(--t-etiqueta);
  font-variant-numeric: tabular-nums;
  color: var(--texto-suave);
  background: var(--superficie-hundida);
  border-radius: var(--r-full);
  padding: 0 var(--e2);
}
.pestana.activa .conteo { background: var(--acento-suave); color: var(--acento-hover); }

.barra-busqueda {
  display: flex;
  align-items: center;
  gap: var(--e3);
  margin-bottom: var(--e4);
}
.barra-busqueda app-campo { display: block; flex: 1; max-width: 420px; }

.bloque-error {
  background: var(--error-fondo);
  color: var(--error-texto);
  border: 1px solid var(--error-texto);
  border-radius: var(--r-md);
  padding: var(--e3) var(--e4);
  margin-bottom: var(--e4);
  font-size: var(--t-tabla);
}

.panel {
  background: var(--superficie);
  border: 1px solid var(--borde);
  border-radius: var(--r-md);
  box-shadow: var(--sombra-1);
  overflow: hidden;
}

.tabla tbody tr.clicable { cursor: pointer; }
.numero-orden {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--texto-primario);
  text-decoration: none;
}
.numero-orden:hover { color: var(--acento); text-decoration: underline; }

.acciones { display: flex; justify-content: flex-end; align-items: center; gap: var(--e3); }
.enlace { color: var(--acento); text-decoration: none; font-weight: 600; font-size: var(--t-menor); }
.enlace:hover { text-decoration: underline; }
```

- [ ] **Paso 7: verificar en la aplicación corriendo**

En http://localhost:4200/ordenes:

1. Las pestañas muestran el conteo y la activa se marca en azul.
2. Tocar una pestaña cambia la URL a `/ordenes?estado=…` **y recarga la tabla**; el botón «atrás» del navegador no queda atrapado repitiendo pestañas.
3. Pegar `http://localhost:4200/ordenes?estado=COTIZADA` en la barra y recargar: arranca en esa pestaña.
4. Pegar `http://localhost:4200/ordenes?estado=MARTE`: cae en «Todas» sin romperse.
5. **Desde el dashboard** (tarea 2), un clic en «Esperando repuesto» cae en esa pestaña.
6. Escribir un fragmento de placa en el buscador: la tabla se recorta y aparece «N de M». Escribir un teléfono: no encuentra nada, y el vacío ofrece limpiar filtros.
7. Clic en una fila → abre el detalle. Clic en «Editar» o «Eliminar» → **no** abre el detalle.
8. Como Administrador, «Eliminar» abre el modal propio (ya no el del navegador); confirmar elimina y sale un toast abajo a la derecha; `Esc` y el velo cancelan.
9. `Tab` recorre pestañas, buscador, números de orden y acciones, con el foco siempre visible.
10. Todo en tema claro y oscuro, y con la ventana angosta.

- [ ] **Paso 8: commit**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
git add frontend/src/app/features/ordenes/lista-ordenes/
git commit -m "feat: pestañas, buscador y URL con estado en la lista de órdenes

El filtro se muda a query param, que es lo que hace que el dashboard
enlace con el filtro puesto y que recargar no lo pierda. El buscador
filtra lo ya cargado y lo dice -«3 de 52»-: no hay endpoint de búsqueda
y un campo que finge buscarlo todo sería mentira.

De paso se va el confirm() del navegador al eliminar."
```

---

### Tarea 4: Detalle de orden — cabecera, franja y pestañas

Esta tarea arma el armazón. Los paneles de cotización y aprobación **siguen siendo los de Bootstrap** y se dibujan dentro de la pestaña Cotización; se rediseñan en las tareas 6 y 7. La aplicación queda usable en el medio, que es la condición de todo el rediseño.

No lleva test unitario: lo que cambia es estructura de plantilla y visibilidad condicional, y probarlo pediría montar el componente con cuatro servicios y cinco componentes hijos simulados para verificar un booleano. La spec ya fija que la verificación de lo visual es el recorrido con la aplicación corriendo.

**Files:**
- Modify: `frontend/src/app/features/ordenes/detalle-orden/detalle-orden.ts`
- Modify: `frontend/src/app/features/ordenes/detalle-orden/detalle-orden.html`
- Create: `frontend/src/app/features/ordenes/detalle-orden/detalle-orden.css`

**Interfaces:**
- Consume: `OrdenService.obtenerPorId/entregar/cancelar`; los componentes hijos ya existentes `TableroKanban` (inputs `ordenId`, outputs `trabajoSeleccionado`, `estadoCambiado`), `FormularioTrabajo` (input `ordenId`, output `trabajoCreado`), `DetalleTrabajo` (input `trabajo`), `PanelCotizacion` (inputs `ordenId`, `totales`; output `cotizacionCambiada`), `PanelAprobacion` (input `ordenId`; output `respuestaRegistrada`).
- Produce: nada que otra tarea consuma. Las tareas 6 y 7 solo necesitan saber que sus componentes se siguen instanciando con los mismos inputs y outputs.

- [ ] **Paso 1: reescribir el componente**

Reemplazar `frontend/src/app/features/ordenes/detalle-orden/detalle-orden.ts` por:

```ts
import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';

import { OrdenService } from '../../../core/services/orden';
import { TokenService } from '../../../core/services/token';
import { Orden } from '../../../core/models/orden.model';
import { Trabajo } from '../../../core/models/trabajo.model';
import { ROLES } from '../../../core/models/estados';
import { Pastilla } from '../../../shared/ui/pastilla';
import { Boton } from '../../../shared/ui/boton';
import { Confirmar } from '../../../shared/ui/confirmar';
import { Esqueleto } from '../../../shared/ui/esqueleto';
import { ToastService } from '../../../shared/ui/toast';
import { TableroKanban } from '../../trabajos/tablero-kanban/tablero-kanban';
import { FormularioTrabajo } from '../../trabajos/formulario-trabajo/formulario-trabajo';
import { DetalleTrabajo } from '../../trabajos/detalle-trabajo/detalle-trabajo';
import { PanelCotizacion } from '../panel-cotizacion/panel-cotizacion';
import { PanelAprobacion } from '../panel-aprobacion/panel-aprobacion';

type Pestana = 'trabajos' | 'cotizacion';

@Component({
  selector: 'app-detalle-orden',
  imports: [
    RouterLink, CurrencyPipe, DatePipe,
    Pastilla, Boton, Confirmar, Esqueleto,
    TableroKanban, FormularioTrabajo, DetalleTrabajo, PanelCotizacion, PanelAprobacion,
  ],
  templateUrl: './detalle-orden.html',
  styleUrl: './detalle-orden.css',
})
export class DetalleOrden implements OnInit {
  private readonly ordenService = inject(OrdenService);
  private readonly route = inject(ActivatedRoute);
  private readonly tokenService = inject(TokenService);
  private readonly toast = inject(ToastService);

  private readonly tablero = viewChild(TableroKanban);

  readonly cargando = signal<boolean>(true);
  readonly mensajeError = signal<string | null>(null);
  readonly orden = signal<Orden | null>(null);
  readonly trabajoSeleccionado = signal<Trabajo | null>(null);
  readonly procesando = signal<boolean>(false);

  readonly pestana = signal<Pestana>('trabajos');
  readonly formularioAbierto = signal<boolean>(false);
  readonly confirmandoCancelacion = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarOrden(id);
    }
  }

  private cargarOrden(id: string): void {
    this.ordenService.obtenerPorId(id).subscribe({
      next: (datos) => {
        this.orden.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudo cargar la orden solicitada');
        this.cargando.set(false);
      },
    });
  }

  /** Sin aprobación no se mueve ninguna tarjeta, así que la franja de aviso es
   *  lo único que no puede quedar escondido detrás de una pestaña. */
  hayQueAprobar(): boolean {
    return this.orden()?.estado === 'COTIZADA' && this.puedeAprobar();
  }

  irACotizacion(): void {
    this.pestana.set('cotizacion');
  }

  puedeAprobar(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR);
  }

  puedeCrearTrabajos(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER);
  }

  puedeEditar(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR);
  }

  puedeEntregar(): boolean {
    return (
      this.orden()?.estado === 'FINALIZADA' &&
      this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR)
    );
  }

  puedeCancelar(): boolean {
    const estado = this.orden()?.estado;
    return (
      estado !== undefined &&
      !['ENTREGADA', 'CANCELADA'].includes(estado) &&
      this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER)
    );
  }

  entregar(): void {
    this.ejecutarAccion(this.ordenService.entregar(this.orden()!.id), 'La orden se entregó');
  }

  confirmarCancelacion(): void {
    this.confirmandoCancelacion.set(false);
    this.ejecutarAccion(this.ordenService.cancelar(this.orden()!.id), 'La orden se canceló');
  }

  private ejecutarAccion(peticion: Observable<Orden>, exito: string): void {
    this.procesando.set(true);

    peticion.subscribe({
      next: (actualizada) => {
        this.orden.set(actualizada);
        this.procesando.set(false);
        this.toast.exito(exito);
      },
      error: (error) => {
        this.procesando.set(false);
        this.toast.error(error.error?.message ?? 'No se pudo completar la acción');
      },
    });
  }

  /** El Kanban avisa cuando mueve una tarjeta: el estado de la orden
   *  lo decide el backend a partir de sus trabajos, así que se relee. */
  refrescarOrden(): void {
    const id = this.orden()?.id;
    if (id) this.cargarOrden(id);
    this.tablero()?.cargarTrabajos();
  }

  alCrearTrabajo(): void {
    this.formularioAbierto.set(false);
    this.tablero()?.cargarTrabajos();
    this.refrescarOrden();
  }

  alSeleccionarTrabajo(trabajo: Trabajo): void {
    this.trabajoSeleccionado.set(trabajo);
  }

  cerrarDetalleTrabajo(): void {
    this.trabajoSeleccionado.set(null);
  }
}
```

- [ ] **Paso 2: reescribir la plantilla**

Reemplazar `frontend/src/app/features/ordenes/detalle-orden/detalle-orden.html` por:

```html
@if (cargando()) {
  <app-esqueleto variante="texto" [repeticiones]="3"></app-esqueleto>
} @else if (mensajeError()) {
  <div class="bloque-error">{{ mensajeError() }}</div>
  <a class="enlace" routerLink="/ordenes">← Volver al listado</a>
} @else if (orden(); as datosOrden) {
  <a class="migas" routerLink="/ordenes">← Órdenes</a>

  <div class="cabecera">
    <div class="identidad">
      <h1 class="numero">{{ datosOrden.numero_orden }}</h1>
      <app-pastilla [estado]="datosOrden.estado"></app-pastilla>
    </div>

    <div class="acciones">
      @if (puedeEditar()) {
        <a class="enlace" [routerLink]="['/ordenes', datosOrden.id, 'editar']">Editar</a>
      }
      @if (puedeEntregar()) {
        <app-boton variante="primario" tamano="sm" [cargando]="procesando()" (pulsar)="entregar()">
          Entregar
        </app-boton>
      }
      @if (puedeCancelar()) {
        <app-boton
          variante="secundario"
          tamano="sm"
          [deshabilitado]="procesando()"
          (pulsar)="confirmandoCancelacion.set(true)"
        >
          Cancelar
        </app-boton>
      }
    </div>
  </div>

  <p class="datos">
    <span>{{ datosOrden.vehiculo.marca }} {{ datosOrden.vehiculo.modelo }}</span>
    @if (datosOrden.vehiculo.anio) {
      <span>{{ datosOrden.vehiculo.anio }}</span>
    }
    <a class="enlace" [routerLink]="['/vehiculos', datosOrden.vehiculo.id]">
      {{ datosOrden.vehiculo.placa }}
    </a>
    <span>{{ datosOrden.vehiculo.propietario_nombre }}</span>
    <span>{{ datosOrden.vehiculo.propietario_telefono }}</span>
  </p>

  <p class="datos">
    <span>Ingreso <strong>{{ datosOrden.fecha_ingreso | date: 'dd/MM/yyyy' : 'UTC' }}</strong></span>
    <span>
      Entrega
      <strong>
        {{ datosOrden.fecha_entrega
            ? (datosOrden.fecha_entrega | date: 'dd/MM/yyyy' : 'UTC')
            : '—' }}
      </strong>
    </span>
    <span>
      Aprobado
      <strong>{{ datosOrden.totales.aprobado | currency: 'PEN' : 'symbol-narrow' }}</strong>
    </span>
  </p>

  @if (datosOrden.descripcion) {
    <p class="descripcion">{{ datosOrden.descripcion }}</p>
  }

  @if (hayQueAprobar()) {
    <div class="franja">
      <span>⚠ El cliente aún no responde la cotización.</span>
      <app-boton variante="secundario" tamano="sm" (pulsar)="irACotizacion()">
        Registrar respuesta
      </app-boton>
    </div>
  }

  <div class="pestanas" role="tablist">
    <button
      class="pestana"
      role="tab"
      [class.activa]="pestana() === 'trabajos'"
      [attr.aria-selected]="pestana() === 'trabajos'"
      (click)="pestana.set('trabajos')"
    >
      Trabajos
    </button>
    <button
      class="pestana"
      role="tab"
      [class.activa]="pestana() === 'cotizacion'"
      [attr.aria-selected]="pestana() === 'cotizacion'"
      (click)="pestana.set('cotizacion')"
    >
      Cotización
    </button>
  </div>

  @if (pestana() === 'trabajos') {
    @if (puedeCrearTrabajos()) {
      <div class="barra-trabajos">
        <app-boton
          variante="secundario"
          tamano="sm"
          (pulsar)="formularioAbierto.set(!formularioAbierto())"
        >
          {{ formularioAbierto() ? 'Cerrar' : '+ Trabajo' }}
        </app-boton>
      </div>

      @if (formularioAbierto()) {
        <app-formulario-trabajo
          [ordenId]="datosOrden.id"
          (trabajoCreado)="alCrearTrabajo()"
        ></app-formulario-trabajo>
      }
    }

    <app-tablero-kanban
      [ordenId]="datosOrden.id"
      (trabajoSeleccionado)="alSeleccionarTrabajo($event)"
      (estadoCambiado)="refrescarOrden()"
    ></app-tablero-kanban>

    @if (trabajoSeleccionado(); as trabajo) {
      <div class="detalle-trabajo">
        <div class="detalle-cab">
          <span class="etiqueta">Detalle del trabajo</span>
          <app-boton variante="fantasma" tamano="sm" (pulsar)="cerrarDetalleTrabajo()">
            Cerrar
          </app-boton>
        </div>
        <app-detalle-trabajo [trabajo]="trabajo"></app-detalle-trabajo>
      </div>
    }
  } @else {
    @if (hayQueAprobar()) {
      <app-panel-aprobacion
        [ordenId]="datosOrden.id"
        (respuestaRegistrada)="refrescarOrden()"
      ></app-panel-aprobacion>
    }

    <app-panel-cotizacion
      [ordenId]="datosOrden.id"
      [totales]="datosOrden.totales"
      (cotizacionCambiada)="refrescarOrden()"
    ></app-panel-cotizacion>
  }

  <app-confirmar
    [abierto]="confirmandoCancelacion()"
    titulo="Cancelar la orden"
    mensaje="¿Seguro que desea cancelar esta orden? No se podrá revertir."
    [peligro]="true"
    textoConfirmar="Cancelar la orden"
    textoCancelar="Volver"
    (confirmar)="confirmarCancelacion()"
    (cancelar)="confirmandoCancelacion.set(false)"
  ></app-confirmar>
}
```

- [ ] **Paso 3: escribir los estilos**

Crear `frontend/src/app/features/ordenes/detalle-orden/detalle-orden.css`:

```css
.migas {
  display: inline-block;
  font-size: var(--t-menor);
  color: var(--texto-suave);
  text-decoration: none;
  margin-bottom: var(--e2);
}
.migas:hover { color: var(--acento); }

.cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--e4);
  flex-wrap: wrap;
  margin-bottom: var(--e2);
}
.identidad { display: flex; align-items: center; gap: var(--e3); }
.numero {
  font-size: var(--t-h1);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--texto-primario);
}
.acciones { display: flex; align-items: center; gap: var(--e3); }

/* Los datos van sin rótulo: «ABC-123» junto a «Toyota Yaris» no necesita que le
   digan que es una placa. Los separa un punto medio, no una etiqueta. */
.datos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e3);
  font-size: var(--t-tabla);
  color: var(--texto-suave);
  margin-bottom: var(--e1);
}
.datos > * + *::before {
  content: '·';
  margin-right: var(--e3);
  color: var(--borde-fuerte);
}
.datos strong { color: var(--texto-primario); font-variant-numeric: tabular-nums; }

.descripcion {
  font-size: var(--t-tabla);
  color: var(--texto-suave);
  margin: var(--e3) 0 var(--e4);
  max-width: 70ch;
}

.franja {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--e3);
  flex-wrap: wrap;
  background: var(--aviso-fondo);
  color: var(--aviso-texto);
  border: 1px solid var(--aviso-texto);
  border-radius: var(--r-md);
  padding: var(--e3) var(--e4);
  margin-bottom: var(--e4);
  font-size: var(--t-tabla);
  font-weight: 500;
}

.bloque-error {
  background: var(--error-fondo);
  color: var(--error-texto);
  border: 1px solid var(--error-texto);
  border-radius: var(--r-md);
  padding: var(--e3) var(--e4);
  margin-bottom: var(--e4);
  font-size: var(--t-tabla);
}

.pestanas {
  display: flex;
  gap: var(--e1);
  border-bottom: 1px solid var(--borde);
  margin-bottom: var(--e4);
}
.pestana {
  font-family: var(--fuente);
  font-size: var(--t-tabla);
  font-weight: 600;
  color: var(--texto-suave);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: var(--e2) var(--e3);
  cursor: pointer;
  transition: color var(--dur-rapida) var(--ease-suave);
}
.pestana:hover { color: var(--texto-primario); }
.pestana.activa { color: var(--acento); border-bottom-color: var(--acento); }

.barra-trabajos { display: flex; justify-content: flex-end; margin-bottom: var(--e3); }

.detalle-trabajo { margin-top: var(--e6); }
.detalle-cab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--e3);
}

.enlace { color: var(--acento); text-decoration: none; font-weight: 600; font-size: var(--t-tabla); }
.enlace:hover { text-decoration: underline; }
```

- [ ] **Paso 4: compilar y correr los tests**

```bash
cd frontend && npm run build && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: build sin errores y `TOTAL: 21 SUCCESS` (esta tarea no agrega tests).

- [ ] **Paso 5: verificar en la aplicación corriendo**

Abrir una orden desde la lista y comprobar:

1. La cabecera muestra número, pastilla, vehículo, placa enlazada a su ficha, propietario, teléfono, fechas y total aprobado. Los importes y fechas quedan alineados.
2. Las pestañas cambian de contenido; «Trabajos» es la que arranca.
3. El botón «+ Trabajo» despliega y pliega el formulario, y al crear un trabajo **se cierra solo** y el tablero se refresca.
4. En una orden `COTIZADA`, con rol Asesor o Jefe: aparece la franja ámbar y su botón lleva a la pestaña Cotización, donde está el panel de aprobación. Con rol Mecánico la franja **no** aparece.
5. En una orden `FINALIZADA`: «Entregar» funciona y sale un toast de éxito.
6. «Cancelar» abre el modal propio; «Volver» no hace nada; confirmar cancela y sale el toast. Ya no aparece el diálogo del navegador.
7. Clic en «Detalle» de una tarjeta del Kanban: el panel del trabajo aparece debajo del tablero y «Cerrar» lo cierra.
8. Con una orden inexistente (`/ordenes/00000000-0000-0000-0000-000000000000`): sale el bloque de error y el enlace de vuelta.
9. Tema claro y oscuro, ventana angosta, y `Esc` cerrando el modal.

Los paneles de cotización y aprobación **todavía se ven con Bootstrap**: es lo esperado en esta tarea.

- [ ] **Paso 6: commit**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
git add frontend/src/app/features/ordenes/detalle-orden/
git commit -m "feat: cabecera y pestañas en el detalle de orden

La pantalla medía tres scrolls y había que bajar hasta el fondo para
llegar al Kanban, que es lo que el taller mira todo el día. Ahora la
cabecera es compacta y el contenido se reparte en Trabajos y Cotización,
con el tablero a ancho completo.

El formulario de trabajo se pliega, la aprobación pendiente se anuncia
en una franja que lleva a su pestaña, y el confirm() de cancelar pasa
al modal propio."
```

---

### Tarea 5: Kanban

**Files:**
- Modify: `frontend/src/app/features/trabajos/tablero-kanban/tablero-kanban.ts`
- Modify: `frontend/src/app/features/trabajos/tablero-kanban/tablero-kanban.html`
- Create: `frontend/src/app/features/trabajos/tablero-kanban/tablero-kanban.css`
- Create: `frontend/src/app/features/trabajos/tablero-kanban/tablero-kanban.spec.ts`

**Interfaces:**
- Consume: `Prioridad` (tarea 1); `TrabajoService.obtenerPorOrden(ordenId)`, `TrabajoService.cambiarEstado(id, estado, motivo?)`; `TRANSICIONES_TRABAJO`, `ACCION_TRANSICION`, `ESTADOS_TRABAJO`, `ETIQUETA_ESTADO_TRABAJO`; `Modal`, `Campo`, `Boton`, `Esqueleto`.
- Produce: `export function motivoLimpio(texto: string): string | null`. La clase `TableroKanban` conserva su API pública: input `ordenId`, outputs `trabajoSeleccionado` y `estadoCambiado`, y el método `cargarTrabajos()` que el detalle llama por `viewChild`. **No cambiarlos**: la tarea 4 depende de ellos.

- [ ] **Paso 1: escribir el test que falla**

Crear `frontend/src/app/features/trabajos/tablero-kanban/tablero-kanban.spec.ts`:

```ts
import { motivoLimpio } from './tablero-kanban';

describe('motivoLimpio', () => {
  it('devuelve el texto sin espacios en los bordes', () => {
    expect(motivoLimpio('  pastillas de freno  ')).toBe('pastillas de freno');
  });

  it('un motivo vacío no es un motivo', () => {
    expect(motivoLimpio('')).toBeNull();
  });

  it('solo espacios tampoco', () => {
    expect(motivoLimpio('    ')).toBeNull();
  });
});
```

Un motivo en blanco tiene que valer `null` porque la columna `motivo_espera` está sostenida por un `CHECK` en la base desde la fase 2b: mandar una cadena vacía sería pedirle a la API un 400 evitable.

- [ ] **Paso 2: correr el test y verlo fallar**

```bash
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: falla al compilar, `motivoLimpio` no está exportada.

- [ ] **Paso 3: reescribir el componente**

Reemplazar `frontend/src/app/features/trabajos/tablero-kanban/tablero-kanban.ts` por:

```ts
import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { TrabajoService } from '../../../core/services/trabajo';
import { TokenService } from '../../../core/services/token';
import { Trabajo } from '../../../core/models/trabajo.model';
import {
  ACCION_TRANSICION,
  ESTADOS_TRABAJO,
  ETIQUETA_ESTADO_TRABAJO,
  ROLES,
  TRANSICIONES_TRABAJO,
} from '../../../core/models/estados';
import { Prioridad } from '../../../shared/ui/prioridad';
import { Boton } from '../../../shared/ui/boton';
import { Campo } from '../../../shared/ui/campo';
import { Modal } from '../../../shared/ui/modal';
import { Esqueleto } from '../../../shared/ui/esqueleto';
import { ToastService } from '../../../shared/ui/toast';

/**
 * `motivo_espera` está sostenido por un CHECK en la base desde la fase 2b, así
 * que una cadena en blanco no es un motivo: es un 400 evitable.
 */
export function motivoLimpio(texto: string): string | null {
  const limpio = texto.trim();
  return limpio.length > 0 ? limpio : null;
}

@Component({
  selector: 'app-tablero-kanban',
  imports: [DatePipe, Prioridad, Boton, Campo, Modal, Esqueleto],
  templateUrl: './tablero-kanban.html',
  styleUrl: './tablero-kanban.css',
})
export class TableroKanban implements OnInit {
  private readonly trabajoService = inject(TrabajoService);
  private readonly tokenService = inject(TokenService);
  private readonly toast = inject(ToastService);

  readonly ordenId = input.required<string>();

  readonly trabajoSeleccionado = output<Trabajo>();

  /** El estado de la orden se deriva de sus trabajos, así que el padre
   *  necesita recargarla cada vez que una tarjeta se mueve. */
  readonly estadoCambiado = output<void>();

  readonly cargando = signal<boolean>(true);
  readonly mensajeError = signal<string | null>(null);
  readonly trabajos = signal<Trabajo[]>([]);

  /** El movimiento que espera el motivo. Mientras hay uno, el modal está abierto. */
  readonly esperandoMotivo = signal<Trabajo | null>(null);
  readonly motivo = signal<string>('');
  readonly motivoValido = computed(() => motivoLimpio(this.motivo()) !== null);

  readonly columnas = ESTADOS_TRABAJO;
  readonly etiquetas = ETIQUETA_ESTADO_TRABAJO;

  ngOnInit(): void {
    this.cargarTrabajos();
  }

  cargarTrabajos(): void {
    this.cargando.set(true);

    this.trabajoService.obtenerPorOrden(this.ordenId()).subscribe({
      next: (datos) => {
        this.trabajos.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudieron cargar los trabajos');
        this.cargando.set(false);
      },
    });
  }

  trabajosDeColumna(estado: string): Trabajo[] {
    return this.trabajos().filter((trabajo) => trabajo.estado === estado);
  }

  /** Sin la aprobación del cliente no se mueve nada, ni siquiera el jefe. */
  estaAprobado(trabajo: Trabajo): boolean {
    return trabajo.aprobado === true;
  }

  puedeMover(trabajo: Trabajo): boolean {
    if (!this.estaAprobado(trabajo)) return false;
    if (this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER)) {
      return true;
    }
    return trabajo.asignado_a?.id === this.tokenService.usuario()?.id;
  }

  /** Los destinos que el grafo permite, si además esta persona puede mover el
   *  trabajo. Cuando no puede, la lista queda vacía y no se dibuja ningún botón. */
  destinos(trabajo: Trabajo): string[] {
    if (!this.puedeMover(trabajo)) return [];
    return TRANSICIONES_TRABAJO[trabajo.estado] ?? [];
  }

  /** Si a una arista le falta la etiqueta, se muestra el nombre del estado
   *  destino: un botón sin texto sería peor que uno con el texto crudo. */
  accion(trabajo: Trabajo, destino: string): string {
    return (
      ACCION_TRANSICION[`${trabajo.estado}->${destino}`] ?? this.etiquetas[destino] ?? destino
    );
  }

  mover(trabajo: Trabajo, destino: string): void {
    if (destino === 'ESPERANDO_REPUESTO') {
      this.motivo.set('');
      this.esperandoMotivo.set(trabajo);
      return;
    }

    this.aplicar(trabajo, destino);
  }

  confirmarMotivo(): void {
    const trabajo = this.esperandoMotivo();
    const motivo = motivoLimpio(this.motivo());
    if (!trabajo || !motivo) return;

    this.cerrarMotivo();
    this.aplicar(trabajo, 'ESPERANDO_REPUESTO', motivo);
  }

  cerrarMotivo(): void {
    this.esperandoMotivo.set(null);
    this.motivo.set('');
  }

  private aplicar(trabajo: Trabajo, destino: string, motivo?: string): void {
    this.trabajoService.cambiarEstado(trabajo.id, destino, motivo).subscribe({
      next: (actualizado) => {
        this.trabajos.update((lista) =>
          lista.map((item) =>
            item.id === trabajo.id
              ? {
                  ...item,
                  estado: actualizado.estado,
                  // También el motivo: si solo se copiara el estado, la tarjeta
                  // retomada seguiría mostrando la pieza vieja hasta recargar.
                  motivo_espera: actualizado.motivo_espera,
                }
              : item,
          ),
        );
        this.estadoCambiado.emit();
      },
      error: (error) => {
        this.toast.error(error.error?.message ?? 'No se pudo cambiar el estado del trabajo');
      },
    });
  }

  seleccionar(trabajo: Trabajo): void {
    this.trabajoSeleccionado.emit(trabajo);
  }
}
```

- [ ] **Paso 4: correr el test y verlo pasar**

```bash
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: `TOTAL: 24 SUCCESS`.

- [ ] **Paso 5: reescribir la plantilla**

Reemplazar `frontend/src/app/features/trabajos/tablero-kanban/tablero-kanban.html` por:

```html
@if (mensajeError()) {
  <div class="bloque-error">{{ mensajeError() }}</div>
}

<div class="tablero">
  @for (columna of columnas; track columna) {
    <section class="columna">
      <header class="columna-cab">
        <span class="etiqueta">{{ etiquetas[columna] }}</span>
        <span class="conteo">{{ trabajosDeColumna(columna).length }}</span>
      </header>

      @if (cargando()) {
        <app-esqueleto variante="tarjeta" [repeticiones]="1"></app-esqueleto>
      } @else if (trabajosDeColumna(columna).length === 0) {
        <p class="columna-vacia">Sin trabajos</p>
      } @else {
        @for (trabajo of trabajosDeColumna(columna); track trabajo.id) {
          <article class="tarjeta" [class.sin-aprobar]="!estaAprobado(trabajo)">
            <h4 class="titulo">{{ trabajo.titulo }}</h4>

            <app-prioridad [valor]="trabajo.prioridad"></app-prioridad>

            @if (!estaAprobado(trabajo)) {
              <p class="marca-sin-aprobar">Sin aprobar</p>
            }

            @if (trabajo.motivo_espera) {
              <p class="motivo">⏸ {{ trabajo.motivo_espera }}</p>
            }

            <p class="meta">
              {{ trabajo.asignado_a
                  ? trabajo.asignado_a.nombres + ' ' + trabajo.asignado_a.apellidos
                  : 'Sin asignar' }}
              @if (trabajo.fecha_limite) {
                · {{ trabajo.fecha_limite | date: 'dd/MM/yyyy' : 'UTC' }}
              }
            </p>

            <div class="botones">
              @for (destino of destinos(trabajo); track destino) {
                <app-boton variante="secundario" tamano="sm" (pulsar)="mover(trabajo, destino)">
                  {{ accion(trabajo, destino) }}
                </app-boton>
              }
              <app-boton variante="fantasma" tamano="sm" (pulsar)="seleccionar(trabajo)">
                Detalle
              </app-boton>
            </div>
          </article>
        }
      }
    </section>
  }
</div>

<app-modal
  [abierto]="esperandoMotivo() !== null"
  titulo="¿Qué repuesto se está esperando?"
  (cerrar)="cerrarMotivo()"
>
  <app-campo
    etiqueta="Repuesto"
    marcador="Pastillas de freno delanteras"
    ayuda="Queda anotado en la tarjeta hasta que el trabajo se retome."
    [valor]="motivo()"
    (valorCambia)="motivo.set($event)"
  ></app-campo>

  <div pie>
    <app-boton variante="fantasma" (pulsar)="cerrarMotivo()">Cancelar</app-boton>
    <app-boton
      variante="primario"
      [deshabilitado]="!motivoValido()"
      (pulsar)="confirmarMotivo()"
    >
      Marcar en espera
    </app-boton>
  </div>
</app-modal>
```

La tarjeta no lleva pastilla de estado —la columna **es** el estado, y repetirlo sería el ruido que este rediseño viene a quitar—, así que `Pastilla` no figura entre los `imports` del componente. Lo que hoy se dibuja como pastilla en la tarjeta es la **prioridad**, y eso es justo lo que pasa a ser el punto de `app-prioridad`.

- [ ] **Paso 6: escribir los estilos**

Crear `frontend/src/app/features/trabajos/tablero-kanban/tablero-kanban.css`:

```css
.tablero {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--e3);
  align-items: start;
}
@media (max-width: 900px) {
  .tablero { grid-template-columns: 1fr; }
}

.columna {
  background: var(--superficie-hundida);
  border: 1px solid var(--borde);
  border-radius: var(--r-md);
  padding: var(--e3);
  display: flex;
  flex-direction: column;
  gap: var(--e2);
  min-width: 0;
}
.columna-cab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--e2);
  margin-bottom: var(--e1);
}
.conteo {
  font-size: var(--t-etiqueta);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--texto-suave);
  background: var(--superficie);
  border: 1px solid var(--borde);
  border-radius: var(--r-full);
  padding: 0 var(--e2);
}
.columna-vacia {
  font-size: var(--t-menor);
  color: var(--texto-suave);
  text-align: center;
  padding: var(--e6) 0;
}

.tarjeta {
  background: var(--superficie);
  border: 1px solid var(--borde);
  border-radius: var(--r-md);
  box-shadow: var(--sombra-1);
  padding: var(--e3);
  display: flex;
  flex-direction: column;
  gap: var(--e2);
  min-width: 0;
}
/* Sin aprobación no se puede mover: la tarjeta se apaga para que se note. */
.tarjeta.sin-aprobar { opacity: 0.6; }

.titulo {
  font-size: var(--t-base);
  font-weight: 600;
  color: var(--texto-primario);
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.marca-sin-aprobar {
  font-size: var(--t-etiqueta);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--texto-suave);
}

.motivo {
  font-size: var(--t-menor);
  background: var(--estado-espera-fondo);
  color: var(--estado-espera-texto);
  border-radius: var(--r-sm);
  padding: var(--e1) var(--e2);
  overflow-wrap: anywhere;
}

.meta { font-size: var(--t-menor); color: var(--texto-suave); }

.botones { display: flex; flex-wrap: wrap; gap: var(--e1); margin-top: var(--e1); }

.bloque-error {
  background: var(--error-fondo);
  color: var(--error-texto);
  border: 1px solid var(--error-texto);
  border-radius: var(--r-md);
  padding: var(--e3) var(--e4);
  margin-bottom: var(--e4);
  font-size: var(--t-tabla);
}
```

Ninguna regla anima el cambio de columna, y es a propósito: la regla 4 de la §8 de la entrega A dice que lo que debe sentirse instantáneo no se anima.

- [ ] **Paso 7: verificar en la aplicación corriendo**

En el detalle de una orden con trabajos aprobados:

1. Las cuatro columnas se ven con su contador; una columna vacía dice «Sin trabajos».
2. **Las seis transiciones de la fase 2b siguen funcionando**: Iniciar, ⏸ Esperar repuesto, Completar, ← Devolver a pendiente, ▶ Retomar, ← Reabrir. Después de cada una, la tarjeta cambia de columna y el estado de la orden en la cabecera se relee.
3. «⏸ Esperar repuesto» abre el modal propio, **ya no el `prompt()` del navegador**. Con el campo vacío, «Marcar en espera» está deshabilitado. Escribir un motivo lo habilita; confirmar mueve la tarjeta y el motivo aparece en naranja dentro de ella.
4. `Esc`, el velo y «Cancelar» cierran el modal **sin mover la tarjeta**.
5. Al retomar, el motivo desaparece de la tarjeta sin recargar la página.
6. Un trabajo sin aprobar se ve apagado, dice «Sin aprobar» y **no muestra botones de transición**.
7. Con rol Mecánico, un trabajo asignado a otra persona no muestra botones.
8. Provocar un error: mover dos veces seguidas muy rápido, o cambiar el estado desde otra pestaña y después mover acá. El error sale como **toast**, no como bloque.
9. Tema claro y oscuro; ventana angosta (las columnas se apilan); `Tab` alcanza los botones de cada tarjeta y el modal atrapa el foco.

- [ ] **Paso 8: commit**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
git add frontend/src/app/features/trabajos/tablero-kanban/
git commit -m "feat: el Kanban con el sistema nuevo y sin prompt()

Columnas sobre superficie hundida, tarjetas con el punto de prioridad y
el motivo de espera en su propio color. La pastilla de estado se va de
la tarjeta: la columna ya es el estado.

El motivo de espera se pide con un modal propio, con el botón
deshabilitado mientras esté en blanco -la columna tiene un CHECK desde
la fase 2b-. Nada se anima al cambiar de columna, a propósito."
```

---

### Tarea 6: Panel de cotización

**Files:**
- Modify: `frontend/src/app/features/ordenes/panel-cotizacion/panel-cotizacion.ts`
- Modify: `frontend/src/app/features/ordenes/panel-cotizacion/panel-cotizacion.html`
- Create: `frontend/src/app/features/ordenes/panel-cotizacion/panel-cotizacion.css`
- Create: `frontend/src/app/features/ordenes/panel-cotizacion/panel-cotizacion.spec.ts`

**Interfaces:**
- Consume: `TrabajoService.obtenerPorOrden`, `RepuestoService.crear(trabajoId, RepuestoRequest)`, `RepuestoService.eliminar(id)`; `RepuestoRequest = { descripcion: string; cantidad: number; precio_unitario: number }`; `Tarjeta`, `Boton`, `Campo`.
- Produce: `export type MarcaAprobacion = 'sin-cotizar' | 'esperando' | 'aprobado' | 'rechazado'`, `export function marcaDe(trabajo: Trabajo): MarcaAprobacion`, `export interface BorradorRepuesto`, `export function repuestoValido(borrador: BorradorRepuesto): RepuestoRequest | null`. La clase conserva inputs `ordenId` y `totales` y el output `cotizacionCambiada`.

- [ ] **Paso 1: escribir los tests que fallan**

Crear `frontend/src/app/features/ordenes/panel-cotizacion/panel-cotizacion.spec.ts`:

```ts
import { Trabajo } from '../../../core/models/trabajo.model';
import { marcaDe, repuestoValido } from './panel-cotizacion';

function trabajo(parcial: Partial<Trabajo> = {}): Trabajo {
  return {
    id: 't1',
    titulo: 'Cambio de aceite',
    prioridad: 'MEDIA',
    estado: 'PENDIENTE',
    created_at: '2026-08-04',
    ...parcial,
  };
}

describe('marcaDe', () => {
  it('sin precio de mano de obra, está sin cotizar', () => {
    expect(marcaDe(trabajo({ precio_mano_obra: undefined }))).toBe('sin-cotizar');
  });

  it('precio cero sí es un precio: está cotizado', () => {
    expect(marcaDe(trabajo({ precio_mano_obra: 0 }))).toBe('esperando');
  });

  it('cotizado y sin respuesta, está esperando', () => {
    expect(marcaDe(trabajo({ precio_mano_obra: 120, aprobado: null }))).toBe('esperando');
  });

  it('cotizado y aprobado', () => {
    expect(marcaDe(trabajo({ precio_mano_obra: 120, aprobado: true }))).toBe('aprobado');
  });

  it('cotizado y rechazado', () => {
    expect(marcaDe(trabajo({ precio_mano_obra: 120, aprobado: false }))).toBe('rechazado');
  });
});

describe('repuestoValido', () => {
  it('convierte el borrador en la petición', () => {
    expect(repuestoValido({ descripcion: '  Filtro  ', cantidad: '2', precio_unitario: '35.5' }))
      .toEqual({ descripcion: 'Filtro', cantidad: 2, precio_unitario: 35.5 });
  });

  it('precio cero es válido: hay repuestos sin costo', () => {
    expect(repuestoValido({ descripcion: 'Filtro', cantidad: '1', precio_unitario: '0' }))
      .toEqual({ descripcion: 'Filtro', cantidad: 1, precio_unitario: 0 });
  });

  it('sin descripción, no va', () => {
    expect(repuestoValido({ descripcion: '   ', cantidad: '1', precio_unitario: '10' })).toBeNull();
  });

  it('cantidad cero o negativa, no va', () => {
    expect(repuestoValido({ descripcion: 'Filtro', cantidad: '0', precio_unitario: '10' })).toBeNull();
    expect(repuestoValido({ descripcion: 'Filtro', cantidad: '-1', precio_unitario: '10' })).toBeNull();
  });

  it('cantidad fraccionaria, no va: los repuestos se cuentan en unidades', () => {
    expect(repuestoValido({ descripcion: 'Filtro', cantidad: '1.5', precio_unitario: '10' })).toBeNull();
  });

  it('precio negativo, no va', () => {
    expect(repuestoValido({ descripcion: 'Filtro', cantidad: '1', precio_unitario: '-5' })).toBeNull();
  });

  it('texto que no es número, no va', () => {
    expect(repuestoValido({ descripcion: 'Filtro', cantidad: 'dos', precio_unitario: '10' })).toBeNull();
    expect(repuestoValido({ descripcion: 'Filtro', cantidad: '1', precio_unitario: '' })).toBeNull();
  });
});
```

El caso de `precio_mano_obra: 0` es el que justifica el test: el código de hoy ya lleva el comentario «`null` y `undefined` son "sin cotizar"; `0` sí es un precio», y es exactamente el borde que un refactor rompe sin que nadie lo note.

- [ ] **Paso 2: correr los tests y verlos fallar**

```bash
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: falla al compilar, `marcaDe` y `repuestoValido` no existen.

- [ ] **Paso 3: reescribir el componente**

Reemplazar `frontend/src/app/features/ordenes/panel-cotizacion/panel-cotizacion.ts` por:

```ts
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { TrabajoService } from '../../../core/services/trabajo';
import { RepuestoService } from '../../../core/services/repuesto';
import { TokenService } from '../../../core/services/token';
import { Trabajo } from '../../../core/models/trabajo.model';
import { RepuestoRequest, Totales } from '../../../core/models/repuesto.model';
import { ROLES } from '../../../core/models/estados';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { Boton } from '../../../shared/ui/boton';
import { Campo } from '../../../shared/ui/campo';
import { ToastService } from '../../../shared/ui/toast';

export type MarcaAprobacion = 'sin-cotizar' | 'esperando' | 'aprobado' | 'rechazado';

/**
 * La aprobación no es `trabajo.estado`: un trabajo aprobado sigue estando
 * PENDIENTE. Por eso no se dibuja con `app-pastilla`.
 *
 * `null` y `undefined` en el precio son "sin cotizar"; `0` sí es un precio.
 */
export function marcaDe(trabajo: Trabajo): MarcaAprobacion {
  if (trabajo.precio_mano_obra === null || trabajo.precio_mano_obra === undefined) {
    return 'sin-cotizar';
  }
  if (trabajo.aprobado === true) return 'aprobado';
  if (trabajo.aprobado === false) return 'rechazado';
  return 'esperando';
}

export const ROTULO_MARCA: Record<MarcaAprobacion, string> = {
  'sin-cotizar': 'Sin cotizar',
  esperando: 'Esperando respuesta',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

/** Los tres campos del editor, tal como salen del input: texto. */
export interface BorradorRepuesto {
  descripcion: string;
  cantidad: string;
  precio_unitario: string;
}

/**
 * Devuelve la petición lista o `null` si el borrador no sirve. Se valida acá y
 * no con reactive forms porque `app-campo` no es un ControlValueAccessor: con
 * tres campos triviales, los signals son menos código que hacerla uno.
 */
export function repuestoValido(borrador: BorradorRepuesto): RepuestoRequest | null {
  const descripcion = borrador.descripcion.trim();
  if (!descripcion) return null;

  const cantidad = Number(borrador.cantidad);
  if (!Number.isInteger(cantidad) || cantidad < 1) return null;

  const precio_unitario = Number(borrador.precio_unitario);
  if (borrador.precio_unitario.trim() === '') return null;
  if (!Number.isFinite(precio_unitario) || precio_unitario < 0) return null;

  return { descripcion, cantidad, precio_unitario };
}

@Component({
  selector: 'app-panel-cotizacion',
  imports: [CurrencyPipe, Tarjeta, Boton, Campo],
  templateUrl: './panel-cotizacion.html',
  styleUrl: './panel-cotizacion.css',
})
export class PanelCotizacion implements OnInit {
  private readonly trabajoService = inject(TrabajoService);
  private readonly repuestoService = inject(RepuestoService);
  private readonly tokenService = inject(TokenService);
  private readonly toast = inject(ToastService);

  readonly ordenId = input.required<string>();
  readonly totales = input.required<Totales>();

  readonly cotizacionCambiada = output<void>();

  readonly trabajos = signal<Trabajo[]>([]);
  readonly mensajeError = signal<string | null>(null);
  readonly trabajoEnEdicion = signal<string | null>(null);

  readonly descripcion = signal<string>('');
  readonly cantidad = signal<string>('1');
  readonly precio = signal<string>('0');

  readonly rotulos = ROTULO_MARCA;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.trabajoService.obtenerPorOrden(this.ordenId()).subscribe({
      next: (datos) => this.trabajos.set(datos),
      error: () => this.mensajeError.set('No se pudieron cargar los trabajos'),
    });
  }

  marca(trabajo: Trabajo): MarcaAprobacion {
    return marcaDe(trabajo);
  }

  estaCotizado(trabajo: Trabajo): boolean {
    return marcaDe(trabajo) !== 'sin-cotizar';
  }

  puedeCotizar(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER);
  }

  abrirEditor(trabajoId: string): void {
    this.trabajoEnEdicion.set(trabajoId);
    this.descripcion.set('');
    this.cantidad.set('1');
    this.precio.set('0');
  }

  cerrarEditor(): void {
    this.trabajoEnEdicion.set(null);
  }

  borrador(): RepuestoRequest | null {
    return repuestoValido({
      descripcion: this.descripcion(),
      cantidad: this.cantidad(),
      precio_unitario: this.precio(),
    });
  }

  agregarRepuesto(): void {
    const trabajoId = this.trabajoEnEdicion();
    const peticion = this.borrador();
    if (!trabajoId || !peticion) return;

    this.repuestoService.crear(trabajoId, peticion).subscribe({
      next: () => {
        this.cerrarEditor();
        this.cargar();
        this.cotizacionCambiada.emit();
        this.toast.exito('Se agregó el repuesto');
      },
      error: (error) => this.toast.error(error.error?.message ?? 'No se pudo agregar el repuesto'),
    });
  }

  eliminarRepuesto(id: string): void {
    this.repuestoService.eliminar(id).subscribe({
      next: () => {
        this.cargar();
        this.cotizacionCambiada.emit();
        this.toast.exito('Se quitó el repuesto');
      },
      error: (error) => this.toast.error(error.error?.message ?? 'No se pudo quitar el repuesto'),
    });
  }
}
```

- [ ] **Paso 4: correr los tests y verlos pasar**

```bash
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: `TOTAL: 36 SUCCESS`.

- [ ] **Paso 5: reescribir la plantilla**

Reemplazar `frontend/src/app/features/ordenes/panel-cotizacion/panel-cotizacion.html` por:

```html
<app-tarjeta titulo="Cotización">
  @if (mensajeError()) {
    <div class="bloque-error">{{ mensajeError() }}</div>
  }

  @if (trabajos().length === 0) {
    <p class="texto-suave">Esta orden todavía no tiene trabajos.</p>
  } @else {
    @for (trabajo of trabajos(); track trabajo.id) {
      <div class="linea">
        <div class="linea-cab">
          <div class="fila">
            <strong>{{ trabajo.titulo }}</strong>
            <span class="marca" [class]="marca(trabajo)">{{ rotulos[marca(trabajo)] }}</span>
          </div>
          <strong class="importe">{{ trabajo.subtotal | currency: 'PEN' : 'symbol-narrow' }}</strong>
        </div>

        @if (estaCotizado(trabajo)) {
          <p class="detalle">
            Mano de obra: {{ trabajo.precio_mano_obra | currency: 'PEN' : 'symbol-narrow' }}
          </p>

          @for (repuesto of trabajo.repuestos ?? []; track repuesto.id) {
            <p class="detalle repuesto">
              <span>
                {{ repuesto.cantidad }} × {{ repuesto.descripcion }}
                ({{ repuesto.precio_unitario | currency: 'PEN' : 'symbol-narrow' }} c/u)
              </span>
              <span class="fila">
                <span class="importe">
                  {{ repuesto.cantidad * repuesto.precio_unitario
                      | currency: 'PEN' : 'symbol-narrow' }}
                </span>
                @if (puedeCotizar()) {
                  <app-boton
                    variante="fantasma"
                    tamano="sm"
                    (pulsar)="eliminarRepuesto(repuesto.id)"
                  >
                    quitar
                  </app-boton>
                }
              </span>
            </p>
          }

          @if (puedeCotizar()) {
            @if (trabajoEnEdicion() === trabajo.id) {
              <div class="editor">
                <app-campo
                  etiqueta="Repuesto"
                  [valor]="descripcion()"
                  (valorCambia)="descripcion.set($event)"
                ></app-campo>
                <app-campo
                  etiqueta="Cantidad"
                  tipo="number"
                  [valor]="cantidad()"
                  (valorCambia)="cantidad.set($event)"
                ></app-campo>
                <app-campo
                  etiqueta="Precio unitario"
                  tipo="number"
                  [valor]="precio()"
                  (valorCambia)="precio.set($event)"
                ></app-campo>

                <div class="editor-acciones">
                  <app-boton variante="fantasma" (pulsar)="cerrarEditor()">Cancelar</app-boton>
                  <app-boton
                    variante="primario"
                    [deshabilitado]="borrador() === null"
                    (pulsar)="agregarRepuesto()"
                  >
                    Agregar
                  </app-boton>
                </div>
              </div>
            } @else {
              <app-boton variante="secundario" tamano="sm" (pulsar)="abrirEditor(trabajo.id)">
                + Repuesto
              </app-boton>
            }
          }
        }
      </div>
    }

    <div class="totales">
      <div>
        <span class="etiqueta">Aprobado</span>
        <strong class="importe destacado">
          {{ totales().aprobado | currency: 'PEN' : 'symbol-narrow' }}
        </strong>
      </div>
      <div>
        <span class="etiqueta">Esperando respuesta</span>
        <strong class="importe">
          {{ totales().pendiente | currency: 'PEN' : 'symbol-narrow' }}
        </strong>
      </div>
      <div>
        <span class="etiqueta">Rechazado</span>
        <strong class="importe texto-suave">
          {{ totales().rechazado | currency: 'PEN' : 'symbol-narrow' }}
        </strong>
      </div>
    </div>
  }
</app-tarjeta>
```

- [ ] **Paso 6: escribir los estilos**

Crear `frontend/src/app/features/ordenes/panel-cotizacion/panel-cotizacion.css`:

```css
.linea { padding-bottom: var(--e3); margin-bottom: var(--e3); border-bottom: 1px solid var(--borde); }
.linea-cab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--e3);
  margin-bottom: var(--e2);
}

/* La aprobación no es un estado del trabajo, así que no es una pastilla; usa
   los tokens de estado que le corresponden por significado. */
.marca {
  font-size: var(--t-etiqueta);
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: var(--e1) var(--e2);
  border-radius: var(--r-full);
  white-space: nowrap;
}
.marca.aprobado { background: var(--estado-finalizada-fondo); color: var(--estado-finalizada-texto); }
.marca.rechazado { background: var(--estado-cancelada-fondo); color: var(--estado-cancelada-texto); }
.marca.esperando { background: var(--estado-cotizada-fondo); color: var(--estado-cotizada-texto); }
.marca.sin-cotizar { background: var(--estado-recibida-fondo); color: var(--estado-recibida-texto); }

.detalle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--e3);
  font-size: var(--t-menor);
  color: var(--texto-suave);
  margin-bottom: var(--e1);
}
.repuesto { padding-left: var(--e3); }

.importe { font-variant-numeric: tabular-nums; }

.editor {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--e3);
  align-items: start;
  background: var(--superficie-hundida);
  border-radius: var(--r-sm);
  padding: var(--e3);
  margin-top: var(--e2);
}
.editor-acciones {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: var(--e2);
}
@media (max-width: 640px) {
  .editor { grid-template-columns: 1fr; }
}

.totales {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--e4);
  text-align: right;
  margin-top: var(--e4);
}
.totales .etiqueta { display: block; margin-bottom: var(--e1); }
.totales .importe { font-size: var(--t-titulo); }
.destacado { color: var(--estado-finalizada-texto); }

.bloque-error {
  background: var(--error-fondo);
  color: var(--error-texto);
  border: 1px solid var(--error-texto);
  border-radius: var(--r-md);
  padding: var(--e3) var(--e4);
  margin-bottom: var(--e4);
  font-size: var(--t-tabla);
}
```

- [ ] **Paso 7: verificar en la aplicación corriendo**

En la pestaña Cotización de una orden con trabajos:

1. Cada trabajo muestra su marca correcta. Con un trabajo cotizado en `0` de mano de obra, la marca dice «Esperando respuesta» y **no** «Sin cotizar».
2. Los tres totales de abajo cuadran con la suma de los subtotales, y coinciden con el «Aprobado» de la cabecera de la orden.
3. Como Jefe de Taller: «+ Repuesto» abre el editor. Con la descripción vacía, «Agregar» está deshabilitado; con cantidad `0`, `1.5` o `-1`, también; con precio `0` se habilita.
4. Agregar un repuesto: se cierra el editor, la línea aparece, los totales se actualizan y sale un toast.
5. «quitar» borra la línea y actualiza los totales, con toast, y **sin pedir confirmación** — es el comportamiento de hoy y no cambia.
6. Con rol Asesor o Mecánico no aparece ni «+ Repuesto» ni «quitar».
7. Tema claro y oscuro; ventana angosta (el editor se apila).

- [ ] **Paso 8: commit**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
git add frontend/src/app/features/ordenes/panel-cotizacion/
git commit -m "feat: la cotización con el sistema nuevo

Las marcas de aprobación no son pastillas: un trabajo aprobado sigue
estando PENDIENTE, así que no son estados. Llevan etiqueta propia con
los tokens que les tocan por significado.

El editor de repuestos deja los reactive forms por signals, porque
app-campo no es un ControlValueAccessor. Con tres campos triviales es
menos código que convertirla; la decisión de fondo es de la entrega C."
```

---

### Tarea 7: Panel de aprobación

**Files:**
- Modify: `frontend/src/app/features/ordenes/panel-aprobacion/panel-aprobacion.ts`
- Modify: `frontend/src/app/features/ordenes/panel-aprobacion/panel-aprobacion.html`
- Create: `frontend/src/app/features/ordenes/panel-aprobacion/panel-aprobacion.css`

**Interfaces:**
- Consume: `OrdenService.registrarAprobacion(ordenId, decisiones)`, `TrabajoService.obtenerPorOrden`; `Tarjeta`, `Boton`.
- Produce: nada nuevo. Conserva el input `ordenId` y el output `respuestaRegistrada` de los que depende la tarea 4.

No lleva test unitario: la lógica —qué trabajos esperan respuesta, cómo se acumulan las decisiones, qué se manda— **no cambia** en esta tarea, y ya está probada por el uso. Lo que cambia es la plantilla.

- [ ] **Paso 1: ajustar el componente**

En `frontend/src/app/features/ordenes/panel-aprobacion/panel-aprobacion.ts`:

1. Cambiar el decorador para usar las primitivas y una hoja propia:

```ts
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { Boton } from '../../../shared/ui/boton';
import { ToastService } from '../../../shared/ui/toast';

@Component({
  selector: 'app-panel-aprobacion',
  imports: [CurrencyPipe, Tarjeta, Boton],
  templateUrl: './panel-aprobacion.html',
  styleUrl: './panel-aprobacion.css',
})
```

2. Inyectar el toast: `private readonly toast = inject(ToastService);`

3. En `registrar()`, reemplazar el manejo de error para que use el toast, dejando `mensajeError` **solo** para el fallo de carga de `ngOnInit` (regla 5 de las restricciones globales):

```ts
  registrar(): void {
    this.guardando.set(true);

    const decisiones = Object.entries(this.decisiones()).map(([trabajo_id, aprobado]) => ({
      trabajo_id,
      aprobado,
    }));

    this.ordenService.registrarAprobacion(this.ordenId(), decisiones).subscribe({
      next: () => {
        this.guardando.set(false);
        this.toast.exito('Se registró la respuesta del cliente');
        this.respuestaRegistrada.emit();
      },
      error: (error) => {
        this.guardando.set(false);
        this.toast.error(error.error?.message ?? 'No se pudo registrar la respuesta');
      },
    });
  }
```

4. Agregar un método para leer la decisión actual sin indexar en la plantilla:

```ts
  decision(trabajoId: string): boolean | undefined {
    return this.decisiones()[trabajoId];
  }
```

- [ ] **Paso 2: reescribir la plantilla**

Reemplazar `frontend/src/app/features/ordenes/panel-aprobacion/panel-aprobacion.html` por:

```html
<app-tarjeta titulo="Respuesta del cliente">
  @if (mensajeError()) {
    <div class="bloque-error">{{ mensajeError() }}</div>
  }

  @if (pendientes().length === 0) {
    <p class="texto-suave">No hay trabajos esperando respuesta.</p>
  } @else {
    <p class="texto-suave texto-menor" style="margin-bottom: var(--e3)">
      Marque qué aprobó el cliente y registre la respuesta. Sin esto, ningún trabajo
      se puede mover en el tablero.
    </p>

    @for (trabajo of pendientes(); track trabajo.id) {
      <div class="linea">
        <span>
          {{ trabajo.titulo }}
          <span class="texto-suave importe">
            {{ trabajo.subtotal | currency: 'PEN' : 'symbol-narrow' }}
          </span>
        </span>

        <div class="decision">
          <app-boton
            [variante]="decision(trabajo.id) === true ? 'primario' : 'secundario'"
            tamano="sm"
            (pulsar)="marcar(trabajo.id, true)"
          >
            Aprueba
          </app-boton>
          <app-boton
            [variante]="decision(trabajo.id) === false ? 'peligro' : 'secundario'"
            tamano="sm"
            (pulsar)="marcar(trabajo.id, false)"
          >
            Rechaza
          </app-boton>
        </div>
      </div>
    }

    <div class="pie">
      <app-boton variante="primario" [cargando]="guardando()" (pulsar)="registrar()">
        Registrar la respuesta
      </app-boton>
    </div>
  }
</app-tarjeta>
```

- [ ] **Paso 3: escribir los estilos**

Crear `frontend/src/app/features/ordenes/panel-aprobacion/panel-aprobacion.css`:

```css
.linea {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--e3);
  flex-wrap: wrap;
  padding: var(--e2) 0;
  border-bottom: 1px solid var(--borde);
  font-size: var(--t-tabla);
}
.linea:last-of-type { border-bottom: none; }

.importe { font-variant-numeric: tabular-nums; margin-left: var(--e2); }

.decision { display: flex; gap: var(--e2); }

.pie { display: flex; justify-content: flex-end; margin-top: var(--e4); }

.bloque-error {
  background: var(--error-fondo);
  color: var(--error-texto);
  border: 1px solid var(--error-texto);
  border-radius: var(--r-md);
  padding: var(--e3) var(--e4);
  margin-bottom: var(--e4);
  font-size: var(--t-tabla);
}
```

- [ ] **Paso 4: compilar y correr los tests**

```bash
cd frontend && npm run build && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: build sin errores, `TOTAL: 36 SUCCESS`.

- [ ] **Paso 5: verificar en la aplicación corriendo**

Con una orden en `COTIZADA` y rol Asesor:

1. La franja de la cabecera lleva a la pestaña Cotización y el panel está arriba del desglose.
2. Todos los trabajos arrancan marcados como «Aprueba» —es la respuesta más frecuente y así estaba antes—; el botón marcado se ve relleno.
3. Marcar «Rechaza» en uno lo pinta en rojo y deja el otro botón secundario.
4. «Registrar la respuesta» muestra el giro mientras guarda, sale un toast de éxito, la orden pasa a `EN_PROCESO` o `RECIBIDA` según corresponda y **la franja desaparece**.
5. Después de registrar, las tarjetas aprobadas del Kanban dejan de estar apagadas y muestran sus botones.
6. Tema claro y oscuro.

- [ ] **Paso 6: commit**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
git add frontend/src/app/features/ordenes/panel-aprobacion/
git commit -m "feat: el panel de aprobación con el sistema nuevo

Vive dentro de la pestaña Cotización, encima del desglose, y la decisión
se marca por variante del botón en vez de por color de Bootstrap. El
resultado se reporta por toast, como el resto de las acciones."
```

---

### Tarea 8: Barrido final y documentación

**Files:**
- Modify: `docs/contexto-core.md` (§6 Frontend)
- Posibles retoques en los archivos de las tareas 1–7 según lo que salga del barrido

- [ ] **Paso 1: verificar que no quedó Bootstrap**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro/frontend/src/app
grep -nE 'class="[^"]*\b(card|card-header|card-body|btn|btn-[a-z-]+|row|col-[a-z0-9-]+|alert|alert-[a-z]+|badge|table|table-[a-z]+|form-control|form-select|form-label|text-muted|fw-[a-z]+|mb-[0-9]|ms-[0-9]|mt-[0-9]|py-[0-9]|d-flex|g-[0-9]|shadow-sm|text-end|text-bg-[a-z]+|bg-[a-z]+|opacity-50|align-middle)\b' \
  features/dashboard/dashboard.html \
  features/ordenes/lista-ordenes/lista-ordenes.html \
  features/ordenes/detalle-orden/detalle-orden.html \
  features/ordenes/panel-cotizacion/panel-cotizacion.html \
  features/ordenes/panel-aprobacion/panel-aprobacion.html \
  features/trabajos/tablero-kanban/tablero-kanban.html
```

Esperado: **sin resultados** (código de salida 1). Si aparece algo, corregirlo antes de seguir.

- [ ] **Paso 2: verificar que no quedaron colores crudos ni diálogos del navegador**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro/frontend/src/app
grep -rnE '#[0-9a-fA-F]{3,8}\b|rgb\(' features/dashboard features/ordenes features/trabajos shared/ui/prioridad.ts
grep -rn 'confirm(\|prompt(' features/dashboard features/ordenes features/trabajos
```

Esperado: el primero sin resultados; el segundo, **solo** `features/trabajos/detalle-trabajo/detalle-trabajo.ts:118` (el `confirm()` de borrar un adjunto, que es de la entrega C).

- [ ] **Paso 3: verificar que el backend quedó intacto**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
git diff --stat master -- backend/
```

Esperado: sin resultados.

- [ ] **Paso 4: build, tests y peso**

```bash
cd frontend
npx ng test --watch=false --browsers=ChromeHeadless
npm run build
du -sh dist
```

Esperado: `TOTAL: 36 SUCCESS`; build sin errores; el `dist` en el mismo orden de magnitud que después de la entrega A (~1 MB). Esta entrega no agrega dependencias, así que un salto grande significa que algo se coló.

- [ ] **Paso 5: recorrido completo con la aplicación corriendo**

Con los tres servicios levantados, recorrer **en tema claro y en tema oscuro**:

| Qué | Cómo se comprueba |
|---|---|
| Dashboard | Las tres cifras cuadran; en cero no enlazan; los enlaces caen en la pestaña correcta |
| Lista | Pestañas, buscador, `?estado=` al recargar, fila clicable, eliminar con modal |
| Detalle | Cabecera, franja solo en `COTIZADA`, las dos pestañas, entregar y cancelar |
| Kanban | Las seis transiciones, el modal del motivo, tarjeta sin aprobar |
| Cotización | Marcas, totales, editor de repuestos con su validación |
| Aprobación | Marcar, registrar, y que la franja desaparezca |
| Móvil | Viewport de 375 px: cifras apiladas, pestañas desplazables, Kanban en una columna, ninguna tabla desborda la pantalla |
| Teclado | `Tab` completo con foco visible; `Esc` cierra los dos modales y el cajón móvil; al cerrar, el foco vuelve al botón que abrió |
| Movimiento reducido | Con `prefers-reduced-motion: reduce` activado en el sistema, nada se desplaza ni escala |
| Pantallas de la entrega C | Formulario de orden, detalle de trabajo, usuarios, ficha de vehículo, login y cambio de contraseña **se abren y se ven como antes** |

La última fila es la que más importa: esta entrega **no** debe haber roto lo que todavía usa Bootstrap.

- [ ] **Paso 6: actualizar la documentación**

En `docs/contexto-core.md`, §6 Frontend, hacer tres reemplazos exactos.

**1.** En el árbol, estas dos líneas:

```
│   ├── ui/            el sistema de diseño: botón, campo, select, pastilla,
│   │                  tarjeta, toast, esqueleto, estado vacío, modal, confirmar
```

pasan a:

```
│   ├── ui/            el sistema de diseño: botón, campo, select, pastilla,
│   │                  prioridad, tarjeta, toast, esqueleto, estado vacío,
│   │                  modal, confirmar
```

**2.** El párrafo que empieza con «Pantallas: login, registro, dashboard…» se reemplaza por:

> Pantallas: login, registro, dashboard, lista de órdenes, formulario de orden
> (alta y edición comparten componente), detalle de orden, lista de usuarios,
> cambio de contraseña y ficha de vehículo.
>
> Desde la entrega B del rediseño, las tres que el taller usa a diario funcionan
> distinto de como se ven descritas en las fases anteriores. El **dashboard** ya
> no es un marcador de los siete estados: muestra lo que pide acción —esperando
> repuesto, esperando al cliente, listas para entregar— y cada cifra enlaza a la
> lista con el filtro puesto; en cero se apaga y deja de ser clicable. La **lista
> de órdenes** lleva el estado en un query param (`/ordenes?estado=COTIZADA`),
> que es lo que hace que ese enlace funcione y que recargar no pierda el filtro,
> y suma un buscador que filtra **en el navegador** sobre lo ya cargado —no hay
> endpoint de búsqueda— y lo declara con un «3 de 52». El **detalle de orden**
> tiene cabecera compacta y dos pestañas, Trabajos y Cotización, con el Kanban a
> ancho completo; cuando la orden está `COTIZADA` una franja de aviso lleva a la
> pestaña donde se registra la respuesta del cliente.

**3.** Después del párrafo del Kanban, agregar:

> Las pantallas núcleo no usan Bootstrap ni los diálogos del navegador: eliminar
> una orden y cancelarla pasan por el modal propio, y el motivo de espera se pide
> con un campo dentro de un modal en vez de con `prompt()`. Queda un `confirm()`
> en `detalle-trabajo`, al borrar un adjunto, que se retira en la entrega C.
> `badge-estado` y `spinner` siguen existiendo porque cuatro pantallas todavía sin
> rediseñar los usan; se van con Bootstrap al cerrar la C.

- [ ] **Paso 7: commit**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
git add docs/contexto-core.md
git commit -m "docs: documentar las pantallas núcleo rediseñadas

El contexto describía la aplicación de antes de la entrega B: contadores
en el dashboard, filtro por select en la lista y un detalle apilado."
```

---

## Al terminar

La entrega deja la aplicación a dos velocidades **al revés que antes**: lo que se usa a diario está en el sistema nuevo y lo que se usa a veces sigue con Bootstrap. Es lo previsto en la §13 de la spec y se cierra en la entrega C, que además retira Bootstrap de `angular.json` y borra `badge-estado` y `spinner`.

Para integrar la rama, usar `superpowers:finishing-a-development-branch`.
