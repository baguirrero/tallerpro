# Rediseño · Entrega C — El cierre — Plan de implementación

> **Para quien lo ejecute con agentes:** SUB-SKILL OBLIGATORIA — usar
> `superpowers:subagent-driven-development` (recomendada) o
> `superpowers:executing-plans` para implementarlo tarea por tarea. Los pasos
> llevan casilla (`- [ ]`) para poder marcarlos.

**Objetivo:** mover al sistema de diseño las ocho pantallas que quedan y **quitar Bootstrap**, cerrando la transición que abrió la entrega A.

**Arquitectura:** solo frontend. Primero las primitivas: `app-campo` y `app-select` implementan `ControlValueAccessor` para que los seis formularios conserven sus `FormGroup` intactos, y se suman `app-area` y `app-panel`. Después las ocho pantallas, de la más simple a la más enredada. Y al final la resta: `angular.json`, `package.json` y `shared/components/`, verificada recorriendo las once rutas y no con un build en verde.

**Stack:** Angular 20 (standalone, signals, reactive forms), Karma + Jasmine, TypeScript 5.9. **No se agregan dependencias; se quita una.**

**Diseño de referencia:** [`docs/superpowers/specs/2026-08-09-rediseno-c-cierre-design.md`](../specs/2026-08-09-rediseno-c-cierre-design.md). Cuando este plan y la spec no coincidan, manda la spec.

## Restricciones globales

Valen para **todas** las tareas:

1. **No se toca `backend/`.** Al terminar, `git diff --stat master -- backend/` sale vacío.
2. **Ni una clase de Bootstrap** en los archivos que se tocan. El patrón de búsqueda lleva `\b` **a los dos lados** del grupo: sin el de cierre, `table` coincide dentro de `tablero` y `class="tablero"` se reporta como Bootstrap.
3. **Ningún color crudo.** Solo `var(--token)`; los tokens están en `frontend/src/styles/tokens.css`.
4. **Ningún endpoint nuevo, ni cambio de contrato.** Las pantallas cambian de aspecto, no de comportamiento.
5. **Mensajes:** fallo al **cargar** → bloque de error en el cuerpo; resultado de una **acción** → `ToastService`.
6. **Contenedores:** una tabla va en un `.panel` local con `.tabla-envoltura` (ambas de la entrega B); el contenido que no es tabla, en `<app-tarjeta>`.
7. **Los `FormGroup` y sus validadores no se tocan.** Cambia el markup. Si una tarea necesita cambiar un validador, es señal de que algo se entendió mal.
8. **Prettier:** `printWidth` 100, comillas simples. `npx prettier --write` sobre los archivos del commit.
9. **Castellano** en identificadores, comentarios y textos de interfaz.
10. **Los comentarios explican el porqué**, no el qué.

## Preparación (una sola vez)

Los servidores están **bajados**. Para trabajar hacen falta los tres:

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
docker compose up -d                       # PostgreSQL 5434, MinIO, pgAdmin
cd backend  && npm run start:dev           # API en http://localhost:3001
cd frontend && npm start                   # aplicación en http://localhost:4200
```

Usuarios del seed, contraseña `123456` y **se entra por correo, no por usuario**:
`admin@taller.com` · `jefe@taller.com` · `asesor@taller.com` · `mecanico@taller.com`.

Comandos que se repiten:

```bash
cd frontend
npx ng test --watch=false --browsers=ChromeHeadless   # 36 en verde hoy
npm run build
node scripts/contraste.mjs
```

**Dos trampas del entorno, comprobadas durante la entrega B:**

- **El servidor de desarrollo no detecta un `.css` nuevo.** Si se crea `x.css` y se referencia con `styleUrl` en el mismo momento, el overlay dice `NG2008: Could not find stylesheet file`. Se arregla con `touch` sobre el `.ts`. No es un error del código.
- **Leer el DOM justo después de un `dispatchEvent` da el valor viejo**, porque Angular todavía no re-renderizó. Al verificar por script hay que esperar (`await new Promise(r => setTimeout(r, 60))`) entre escribir y leer.

---

## Estructura de archivos

| Archivo | Responsabilidad | Tarea |
|---|---|---|
| `shared/ui/errores.ts` | **nuevo** — `mensajeDeError()`, el mapa único de mensajes | 1 |
| `shared/ui/errores.spec.ts` | **nuevo** — su test | 1 |
| `shared/ui/campo.ts` | pasa a `ControlValueAccessor` | 1 |
| `shared/ui/campo.spec.ts` | **nuevo** — test del CVA con un `FormControl` real | 1 |
| `shared/ui/select.ts` | pasa a `ControlValueAccessor` | 2 |
| `shared/ui/area.ts` + `.spec.ts` | **nuevo** — el `<textarea>`, también CVA | 3 |
| `shared/ui/panel.ts` + `.spec.ts` | **nuevo** — el panel lateral | 4 |
| `features/ui/catalogo.*` | suma `app-area` y `app-panel` | 3, 4 |
| `features/auth/login/*` · `registro/*` | tarjeta centrada con el sistema nuevo | 5 |
| `features/perfil/cambiar-password/*` | tarjeta angosta | 6 |
| `features/ordenes/formulario-orden/*` | el más grande: 9 controles, placa y diferencias | 7 |
| `features/trabajos/formulario-trabajo/*` | 6 controles | 8 |
| `features/trabajos/detalle-trabajo/*` | contenido del panel lateral | 9 |
| `features/ordenes/detalle-orden/*` | hospeda el `app-panel` | 9 |
| `features/usuarios/lista-usuarios/*` | tabla + confirmar | 10 |
| `features/vehiculos/ficha-vehiculo/*` | cabecera + tabla | 11 |
| `angular.json` · `package.json` | se va Bootstrap | 12 |
| `shared/components/` | se borra entero | 12 |
| `docs/contexto-core.md` | refleja el cierre | 12 |

**Orden y por qué:** las primitivas van primero porque las ocho pantallas dependen de ellas (1–4). Después las pantallas de menos a más enredo: auth y perfil son formularios chicos y sirven para descubrir problemas del CVA barato (5–6); los dos formularios grandes después (7–8); el panel lateral, que es el cambio estructural, con las primitivas ya probadas (9); las dos tablas al final porque no dependen de nada (10–11). El retiro va último (12): cuando llegue, las once rutas ya están sobre el sistema propio.

---

### Tarea 1: `mensajeDeError` y `app-campo` como `ControlValueAccessor`

Es la tarea que decide la entrega: si el CVA queda bien, las siete siguientes son markup.

**Files:**
- Create: `frontend/src/app/shared/ui/errores.ts`, `errores.spec.ts`, `campo.spec.ts`
- Modify: `frontend/src/app/shared/ui/campo.ts`

**Interfaces:**
- Consume: `ValidationErrors` de `@angular/forms`.
- Produce: `export function mensajeDeError(errores: ValidationErrors | null): string | null`, que usan las tareas 2 y 3. `Campo` conserva su selector `app-campo` y sus inputs `etiqueta`, `ayuda`, `error`, `tipo`, `marcador`, `valor`, `deshabilitado` y su output `valorCambia`; suma soporte de `formControlName`.

#### Por qué `min` y `max` son dos mensajes

Angular los emite como errores separados —`{min: 1950, actual: 1900}`— y nunca los dos a la vez, así que desde un solo error no hay de dónde sacar el otro extremo para armar un «entre X e Y». La spec lo decía mal en su primera versión y quedó corregido ahí también.

- [ ] **Paso 1: escribir el test del mapa de mensajes**

Crear `frontend/src/app/shared/ui/errores.spec.ts`:

```ts
import { mensajeDeError } from './errores';

describe('mensajeDeError', () => {
  it('sin errores, no hay mensaje', () => {
    expect(mensajeDeError(null)).toBeNull();
    expect(mensajeDeError({})).toBeNull();
  });

  it('traduce required', () => {
    expect(mensajeDeError({ required: true })).toBe('Este campo es obligatorio');
  });

  it('traduce minlength con el largo que pedía el validador', () => {
    expect(mensajeDeError({ minlength: { requiredLength: 6, actualLength: 2 } })).toBe(
      'Mínimo 6 caracteres',
    );
  });

  it('traduce email', () => {
    expect(mensajeDeError({ email: true })).toBe('Correo electrónico no válido');
  });

  it('min y max son mensajes separados: Angular nunca emite los dos juntos', () => {
    expect(mensajeDeError({ min: { min: 1950, actual: 1900 } })).toBe('El valor mínimo es 1950');
    expect(mensajeDeError({ max: { max: 2100, actual: 3000 } })).toBe('El valor máximo es 2100');
  });

  it('required gana sobre los demás: es el que hay que resolver primero', () => {
    expect(mensajeDeError({ required: true, minlength: { requiredLength: 6 } })).toBe(
      'Este campo es obligatorio',
    );
  });

  it('un error que no conocemos no deja al campo mudo', () => {
    expect(mensajeDeError({ placaDuplicada: true })).toBe('Revise este campo');
  });
});
```

- [ ] **Paso 2: correr y verlo fallar**

```bash
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: falla al compilar, `Cannot find module './errores'`.

- [ ] **Paso 3: escribir el mapa**

Crear `frontend/src/app/shared/ui/errores.ts`:

```ts
import { ValidationErrors } from '@angular/forms';

/**
 * Un solo sitio para los mensajes de validación. Antes cada plantilla escribía
 * los suyos —«La placa es obligatoria», «El modelo es obligatorio»— y decía casi
 * lo mismo de nueve maneras.
 *
 * El orden importa: `required` primero, porque cuando un campo está vacío es lo
 * único accionable; decirle a alguien que le faltan caracteres a lo que no
 * escribió es ruido.
 */
export function mensajeDeError(errores: ValidationErrors | null): string | null {
  if (!errores) return null;

  if (errores['required']) return 'Este campo es obligatorio';
  if (errores['minlength']) return `Mínimo ${errores['minlength'].requiredLength} caracteres`;
  if (errores['maxlength']) return `Máximo ${errores['maxlength'].requiredLength} caracteres`;
  if (errores['email']) return 'Correo electrónico no válido';
  // Angular emite `min` y `max` por separado y nunca juntos, así que no hay
  // forma de armar un «entre X e Y» con un solo error a la vista.
  if (errores['min']) return `El valor mínimo es ${errores['min'].min}`;
  if (errores['max']) return `El valor máximo es ${errores['max'].max}`;

  if (Object.keys(errores).length === 0) return null;
  return 'Revise este campo';
}
```

- [ ] **Paso 4: correr y verlo pasar**

Esperado: `TOTAL: 43 SUCCESS` (36 de hoy + 7 nuevos).

- [ ] **Paso 5: escribir el test del CVA, que falla**

Crear `frontend/src/app/shared/ui/campo.spec.ts`:

```ts
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Campo } from './campo';

@Component({
  imports: [ReactiveFormsModule, Campo],
  template: `<app-campo etiqueta="Placa" [formControl]="control"></app-campo>`,
})
class Anfitrion {
  readonly control = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(6)],
  });
}

@Component({
  imports: [Campo],
  template: `<app-campo [valor]="valor()" (valorCambia)="valor.set($event)"></app-campo>`,
})
class AnfitrionSuelto {
  readonly valor = signal('inicial');
}

describe('Campo como ControlValueAccessor', () => {
  function montar() {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    return { fixture, input };
  }

  function escribir(input: HTMLInputElement, texto: string) {
    input.value = texto;
    input.dispatchEvent(new Event('input'));
  }

  it('el valor del control llega al input', () => {
    const { fixture, input } = montar();
    fixture.componentInstance.control.setValue('ABC123');
    fixture.detectChanges();
    expect(input.value).toBe('ABC123');
  });

  it('escribir en el input actualiza el control', () => {
    const { fixture, input } = montar();
    escribir(input, 'XYZ987');
    expect(fixture.componentInstance.control.value).toBe('XYZ987');
  });

  it('no muestra el error mientras el campo no fue tocado', () => {
    const { fixture } = montar();
    expect(fixture.componentInstance.control.invalid).toBe(true);
    expect(fixture.nativeElement.querySelector('.mal-texto')).toBeNull();
  });

  it('al perder el foco sí lo muestra', () => {
    const { fixture, input } = montar();
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mal-texto')?.textContent.trim()).toBe(
      'Este campo es obligatorio',
    );
  });

  it('el mensaje sigue al error que corresponda', () => {
    const { fixture, input } = montar();
    escribir(input, 'ABC');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mal-texto')?.textContent.trim()).toBe(
      'Mínimo 6 caracteres',
    );
  });

  it('form.disable() deshabilita el input, no solo el input deshabilitado', () => {
    const { fixture, input } = montar();
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
  });

  it('sin formControl sigue andando con valor y valorCambia', () => {
    const fixture = TestBed.createComponent(AnfitrionSuelto);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('inicial');

    input.value = 'escrito a mano';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.valor()).toBe('escrito a mano');
  });
});
```

El último test es el que protege al editor de repuestos de la entrega B, que usa la primitiva sin `FormGroup`. Si se rompe, se rompió la cotización.

- [ ] **Paso 6: correr y verlo fallar**

Esperado: los tests de `formControl` fallan con `No value accessor for form control`.

- [ ] **Paso 7: reescribir `app-campo`**

Reemplazar `frontend/src/app/shared/ui/campo.ts` por:

```ts
import { Component, inject, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { mensajeDeError } from './errores';

@Component({
  selector: 'app-campo',
  template: `
    <label class="c">
      @if (etiqueta()) {
        <span class="et">{{ etiqueta() }}</span>
      }

      <input
        class="in"
        [class.mal]="!!textoError()"
        [type]="tipo()"
        [value]="valorMostrado()"
        [placeholder]="marcador()"
        [disabled]="estaDeshabilitado()"
        (input)="alEscribir($any($event.target).value)"
        (blur)="alSalir()"
      />

      @if (textoError()) {
        <span class="msg mal-texto">{{ textoError() }}</span>
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
      width: 100%;
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
export class Campo implements ControlValueAccessor {
  /**
   * Se inyecta `NgControl` y se asigna `valueAccessor` a mano en vez de proveer
   * `NG_VALUE_ACCESSOR`. Es la única de las dos formas que deja **leer** el
   * control propio, y sin leerlo no hay manera de saber si está tocado ni qué
   * error tiene. Proveer el token además de inyectar `NgControl` es una
   * dependencia circular.
   *
   * `optional` porque la primitiva también se usa suelta, con `valor` y
   * `valorCambia`, como en el editor de repuestos de la entrega B.
   */
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  readonly etiqueta = input<string>('');
  readonly ayuda = input<string>('');
  /** Pisa al mapa de mensajes. Es la vía del error que viene del servidor. */
  readonly error = input<string>('');
  readonly tipo = input<string>('text');
  readonly marcador = input<string>('');
  readonly valor = input<string>('');
  readonly deshabilitado = input<boolean>(false);

  readonly valorCambia = output<string>();

  /** Lo que escribió el usuario o lo que mandó `writeValue`. */
  private readonly valorInterno = signal<string | null>(null);
  private readonly deshabilitadoPorFormulario = signal(false);

  private alCambiar: (valor: string) => void = () => {};
  private alTocar: () => void = () => {};

  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
  }

  valorMostrado(): string {
    return this.valorInterno() ?? this.valor();
  }

  estaDeshabilitado(): boolean {
    return this.deshabilitado() || this.deshabilitadoPorFormulario();
  }

  /**
   * No es un `computed` porque `touched` e `invalid` del control no son signals:
   * es un método que la detección de cambios vuelve a evaluar, que es como
   * Angular expone hoy el estado de un `FormControl`.
   *
   * El error solo se muestra cuando el campo fue tocado: gritarle a alguien por
   * un campo que todavía no llenó es ruido, no ayuda.
   */
  textoError(): string | null {
    if (this.error()) return this.error();
    const control = this.ngControl?.control;
    if (!control || !control.touched || control.valid) return null;
    return mensajeDeError(control.errors);
  }

  alEscribir(valor: string): void {
    this.valorInterno.set(valor);
    this.alCambiar(valor);
    this.valorCambia.emit(valor);
  }

  alSalir(): void {
    this.alTocar();
  }

  writeValue(valor: string | null): void {
    this.valorInterno.set(valor ?? '');
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.alCambiar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocar = fn;
  }

  /** Llega desde `form.disable()`, que es un camino distinto del input. */
  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitadoPorFormulario.set(deshabilitado);
  }
}
```

- [ ] **Paso 8: correr los tests**

```bash
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: `TOTAL: 50 SUCCESS` (43 + 7 del CVA).

- [ ] **Paso 9: verificar que la entrega B no se rompió**

Con la aplicación corriendo, abrir una orden con un trabajo cotizado, pestaña Cotización, «+ Repuesto». Los tres campos tienen que escribir y «Agregar» habilitarse solo con datos válidos, igual que antes. **Es el uso suelto de la primitiva y el que el paso 5 protege con un test.**

También `/ui`: el campo con `error` sigue mostrando «Esa placa ya existe con otros datos», y el deshabilitado sigue apagado.

- [ ] **Paso 10: commit**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
git add frontend/src/app/shared/ui/errores.ts frontend/src/app/shared/ui/errores.spec.ts \
        frontend/src/app/shared/ui/campo.ts frontend/src/app/shared/ui/campo.spec.ts
git commit -m "feat: app-campo se enchufa a reactive forms

Implementa ControlValueAccessor inyectando NgControl y asignando
valueAccessor a mano, que es la forma que permite leer el control propio
y por lo tanto saber si está tocado y qué error tiene.

Los mensajes salen de un mapa único en errores.ts: antes cada plantilla
escribía los suyos y decían casi lo mismo de nueve maneras. El input
error sigue existiendo y pisa al mapa, que es como llega el mensaje del
servidor.

Sigue andando con valor y valorCambia, que es como la usa el editor de
repuestos de la entrega B, y hay un test que lo protege."
```

---

### Tarea 2: `app-select` como `ControlValueAccessor`

**Files:**
- Modify: `frontend/src/app/shared/ui/select.ts`
- Create: `frontend/src/app/shared/ui/select.spec.ts`

**Interfaces:**
- Consume: `mensajeDeError()` de la tarea 1.
- Produce: `Select` conserva selector `app-select`, la interfaz `Opcion { valor: string; texto: string }`, sus inputs `etiqueta`, `error`, `marcador`, `opciones`, `valor`, `deshabilitado` y su output `valorCambia`; suma `formControlName`.

- [ ] **Paso 1: escribir el test que falla**

Crear `frontend/src/app/shared/ui/select.spec.ts`:

```ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Select } from './select';

@Component({
  imports: [ReactiveFormsModule, Select],
  template: `
    <app-select
      etiqueta="Prioridad"
      [opciones]="opciones"
      [formControl]="control"
    ></app-select>
  `,
})
class Anfitrion {
  readonly opciones = [
    { valor: 'BAJA', texto: 'Baja' },
    { valor: 'MEDIA', texto: 'Media' },
    { valor: 'ALTA', texto: 'Alta' },
  ];
  readonly control = new FormControl('', { nonNullable: true, validators: [Validators.required] });
}

describe('Select como ControlValueAccessor', () => {
  function montar() {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    return { fixture, select };
  }

  it('el valor del control selecciona la opción', () => {
    const { fixture, select } = montar();
    fixture.componentInstance.control.setValue('ALTA');
    fixture.detectChanges();
    expect(select.value).toBe('ALTA');
  });

  it('elegir una opción actualiza el control', () => {
    const { fixture, select } = montar();
    select.value = 'MEDIA';
    select.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.control.value).toBe('MEDIA');
  });

  it('muestra el error solo después de tocarlo', () => {
    const { fixture, select } = montar();
    expect(fixture.nativeElement.querySelector('.mal-texto')).toBeNull();

    select.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mal-texto')?.textContent.trim()).toBe(
      'Este campo es obligatorio',
    );
  });

  it('form.disable() lo deshabilita', () => {
    const { fixture, select } = montar();
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(select.disabled).toBe(true);
  });
});
```

- [ ] **Paso 2: correr y verlo fallar**

Esperado: `No value accessor for form control`.

- [ ] **Paso 3: reescribir `app-select`**

Reemplazar `frontend/src/app/shared/ui/select.ts` por:

```ts
import { Component, inject, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { mensajeDeError } from './errores';

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
        [class.mal]="!!textoError()"
        [value]="valorMostrado()"
        [disabled]="estaDeshabilitado()"
        (change)="alElegir($any($event.target).value)"
        (blur)="alSalir()"
      >
        @if (marcador()) {
          <option value="">{{ marcador() }}</option>
        }
        @for (opcion of opciones(); track opcion.valor) {
          <option [value]="opcion.valor">{{ opcion.texto }}</option>
        }
      </select>

      @if (textoError()) {
        <span class="msg mal-texto">{{ textoError() }}</span>
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
      width: 100%;
      cursor: pointer;
      transition: border-color var(--dur-rapida) var(--ease-suave);
    }
    .in:hover:not(:disabled) { border-color: var(--texto-suave); }
    .in:focus { outline: 2px solid var(--acento); outline-offset: 1px; border-color: var(--acento); }
    .in:disabled { opacity: 0.55; cursor: not-allowed; }
    .in.mal { border-color: var(--error-texto); }

    .msg { font-size: var(--t-menor); color: var(--error-texto); }
    .mal-texto { color: var(--error-texto); }
  `,
})
export class Select implements ControlValueAccessor {
  /** Mismo mecanismo que `app-campo`; el porqué está explicado ahí. */
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  readonly etiqueta = input<string>('');
  readonly error = input<string>('');
  readonly marcador = input<string>('');
  readonly opciones = input<Opcion[]>([]);
  readonly valor = input<string>('');
  readonly deshabilitado = input<boolean>(false);

  readonly valorCambia = output<string>();

  private readonly valorInterno = signal<string | null>(null);
  private readonly deshabilitadoPorFormulario = signal(false);

  private alCambiar: (valor: string) => void = () => {};
  private alTocar: () => void = () => {};

  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
  }

  valorMostrado(): string {
    return this.valorInterno() ?? this.valor();
  }

  estaDeshabilitado(): boolean {
    return this.deshabilitado() || this.deshabilitadoPorFormulario();
  }

  textoError(): string | null {
    if (this.error()) return this.error();
    const control = this.ngControl?.control;
    if (!control || !control.touched || control.valid) return null;
    return mensajeDeError(control.errors);
  }

  alElegir(valor: string): void {
    this.valorInterno.set(valor);
    this.alCambiar(valor);
    this.valorCambia.emit(valor);
  }

  alSalir(): void {
    this.alTocar();
  }

  writeValue(valor: string | null): void {
    this.valorInterno.set(valor ?? '');
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.alCambiar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocar = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitadoPorFormulario.set(deshabilitado);
  }
}
```

- [ ] **Paso 4: correr los tests**

Esperado: `TOTAL: 54 SUCCESS` (50 + 4).

- [ ] **Paso 5: verificar en `/ui`**

El select del catálogo sigue mostrando «Todos los estados» y las tres opciones, y sigue cambiando de valor.

- [ ] **Paso 6: commit**

```bash
git add frontend/src/app/shared/ui/select.ts frontend/src/app/shared/ui/select.spec.ts
git commit -m "feat: app-select se enchufa a reactive forms

Mismo mecanismo que app-campo: NgControl inyectado y valueAccessor
asignado a mano, para poder leer el control y mostrar su error."
```

---

### Tarea 3: `app-area`, el textarea

**Files:**
- Create: `frontend/src/app/shared/ui/area.ts`, `area.spec.ts`
- Modify: `frontend/src/app/features/ui/catalogo.html`, `catalogo.ts`

**Interfaces:**
- Consume: `mensajeDeError()` (tarea 1).
- Produce: `export class Area`, selector `app-area`, inputs `etiqueta`, `ayuda`, `error`, `marcador`, `filas` (número, por defecto 3), `valor`, `deshabilitado`; output `valorCambia`; también CVA. La usan las tareas 7 y 9.

- [ ] **Paso 1: escribir el test que falla**

Crear `frontend/src/app/shared/ui/area.spec.ts`:

```ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Area } from './area';

@Component({
  imports: [ReactiveFormsModule, Area],
  template: `<app-area etiqueta="Descripción" [filas]="4" [formControl]="control"></app-area>`,
})
class Anfitrion {
  readonly control = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(5)],
  });
}

describe('Area', () => {
  function montar() {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    const area: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    return { fixture, area };
  }

  it('es un textarea, no un input', () => {
    const { fixture } = montar();
    expect(fixture.nativeElement.querySelector('textarea')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
  });

  it('respeta las filas pedidas', () => {
    expect(montar().area.rows).toBe(4);
  });

  it('el valor del control llega al textarea y vuelve', () => {
    const { fixture, area } = montar();
    fixture.componentInstance.control.setValue('Cambio de aceite');
    fixture.detectChanges();
    expect(area.value).toBe('Cambio de aceite');

    area.value = 'Revisión de frenos';
    area.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.control.value).toBe('Revisión de frenos');
  });

  it('muestra el error del mapa después de tocarlo', () => {
    const { fixture, area } = montar();
    area.value = 'abc';
    area.dispatchEvent(new Event('input'));
    area.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mal-texto')?.textContent.trim()).toBe(
      'Mínimo 5 caracteres',
    );
  });
});
```

- [ ] **Paso 2: correr y verlo fallar**

Esperado: `Cannot find module './area'`.

- [ ] **Paso 3: escribir el componente**

Crear `frontend/src/app/shared/ui/area.ts`:

```ts
import { Component, inject, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { mensajeDeError } from './errores';

/**
 * El mismo envoltorio que `app-campo` con un `<textarea>` adentro. Existe
 * porque hay dos campos que son prosa y no un renglón: la descripción del
 * servicio y el comentario de un trabajo.
 */
@Component({
  selector: 'app-area',
  template: `
    <label class="c">
      @if (etiqueta()) {
        <span class="et">{{ etiqueta() }}</span>
      }

      <textarea
        class="in"
        [class.mal]="!!textoError()"
        [rows]="filas()"
        [value]="valorMostrado()"
        [placeholder]="marcador()"
        [disabled]="estaDeshabilitado()"
        (input)="alEscribir($any($event.target).value)"
        (blur)="alSalir()"
      ></textarea>

      @if (textoError()) {
        <span class="msg mal-texto">{{ textoError() }}</span>
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
      line-height: 1.5;
      color: var(--texto-primario);
      background: var(--superficie);
      border: 1px solid var(--borde-fuerte);
      border-radius: var(--r-sm);
      padding: var(--e2) var(--e3);
      width: 100%;
      /* Vertical y nada más: a lo ancho rompería la rejilla del formulario. */
      resize: vertical;
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
export class Area implements ControlValueAccessor {
  /** Mismo mecanismo que `app-campo`; el porqué está explicado ahí. */
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  readonly etiqueta = input<string>('');
  readonly ayuda = input<string>('');
  readonly error = input<string>('');
  readonly marcador = input<string>('');
  readonly filas = input<number>(3);
  readonly valor = input<string>('');
  readonly deshabilitado = input<boolean>(false);

  readonly valorCambia = output<string>();

  private readonly valorInterno = signal<string | null>(null);
  private readonly deshabilitadoPorFormulario = signal(false);

  private alCambiar: (valor: string) => void = () => {};
  private alTocar: () => void = () => {};

  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
  }

  valorMostrado(): string {
    return this.valorInterno() ?? this.valor();
  }

  estaDeshabilitado(): boolean {
    return this.deshabilitado() || this.deshabilitadoPorFormulario();
  }

  textoError(): string | null {
    if (this.error()) return this.error();
    const control = this.ngControl?.control;
    if (!control || !control.touched || control.valid) return null;
    return mensajeDeError(control.errors);
  }

  alEscribir(valor: string): void {
    this.valorInterno.set(valor);
    this.alCambiar(valor);
    this.valorCambia.emit(valor);
  }

  alSalir(): void {
    this.alTocar();
  }

  writeValue(valor: string | null): void {
    this.valorInterno.set(valor ?? '');
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.alCambiar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocar = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitadoPorFormulario.set(deshabilitado);
  }
}
```

- [ ] **Paso 4: correr los tests**

Esperado: `TOTAL: 58 SUCCESS` (54 + 4).

- [ ] **Paso 5: agregarla al catálogo**

En `catalogo.ts`, importar `Area` y sumarla al array `imports`. En `catalogo.html`, dentro del grupo «Formulario», después del `app-select`:

```html
    <app-area
      etiqueta="Descripción del servicio"
      marcador="Detalle del trabajo solicitado por el cliente"
      ayuda="Se puede estirar hacia abajo"
      [filas]="3"
      [valor]="descripcion()"
      (valorCambia)="descripcion.set($event)"
    ></app-area>
```

Y en la clase `Catalogo`, junto a los demás signals de muestra:

```ts
  readonly descripcion = signal<string>('');
```

- [ ] **Paso 6: verificar en la aplicación**

`/ui` en claro y oscuro: el área se ve como el campo, se estira solo hacia abajo, y el foco la marca en azul.

- [ ] **Paso 7: commit**

```bash
git add frontend/src/app/shared/ui/area.ts frontend/src/app/shared/ui/area.spec.ts \
        frontend/src/app/features/ui/catalogo.html frontend/src/app/features/ui/catalogo.ts
git commit -m "feat: app-area, el textarea del sistema

Mismo envoltorio que app-campo con un textarea adentro, también CVA.
La piden la descripción del servicio y el comentario de un trabajo, que
son prosa y hoy se escriben en un renglón de una línea."
```

---

### Tarea 4: `app-panel`, el panel lateral

**Files:**
- Create: `frontend/src/app/shared/ui/panel.ts`, `panel.spec.ts`
- Modify: `frontend/src/app/features/ui/catalogo.html`, `catalogo.ts`

**Interfaces:**
- Consume: nada de tareas anteriores.
- Produce: `export class Panel`, selector `app-panel`, inputs `abierto` (booleano) y `titulo`; output `cerrar`; ranura por defecto para el contenido y `[pie]` para el pie. La usa la tarea 9.

#### La trampa del `transform`

El panel **no lleva `transform` estático**. Se anima con un `@keyframes` que va de `translateX(100%)` a `translateX(0)` sin `animation-fill-mode`, así que al terminar la animación el elemento **no tiene transform**.

Importa porque un elemento con `transform` es bloque contenedor de sus descendientes `position: fixed`. Con transform permanente, el `app-confirmar` que la tarea 9 abre **desde adentro del panel** —para borrar un adjunto— quedaría posicionado y recortado dentro del panel en vez de centrado en la pantalla.

- [ ] **Paso 1: escribir el test que falla**

Crear `frontend/src/app/shared/ui/panel.spec.ts`:

```ts
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Panel } from './panel';

@Component({
  imports: [Panel],
  template: `
    <button #disparador (click)="abierto.set(true)">Abrir</button>
    <app-panel [abierto]="abierto()" titulo="Cambio de aceite" (cerrar)="abierto.set(false)">
      <p>Contenido del trabajo</p>
    </app-panel>
  `,
})
class Anfitrion {
  readonly abierto = signal(false);
}

describe('Panel', () => {
  function montar() {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    return fixture;
  }

  it('cerrado no dibuja nada', () => {
    const fixture = montar();
    expect(fixture.nativeElement.querySelector('.p')).toBeNull();
    expect(fixture.nativeElement.querySelector('.velo')).toBeNull();
  });

  it('abierto dibuja el panel, el velo y el título', () => {
    const fixture = montar();
    fixture.componentInstance.abierto.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.velo')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.tit').textContent.trim()).toBe(
      'Cambio de aceite',
    );
    expect(fixture.nativeElement.textContent).toContain('Contenido del trabajo');
  });

  it('es un diálogo para el lector de pantalla', () => {
    const fixture = montar();
    fixture.componentInstance.abierto.set(true);
    fixture.detectChanges();

    const caja = fixture.nativeElement.querySelector('.p');
    expect(caja.getAttribute('role')).toBe('dialog');
    expect(caja.getAttribute('aria-modal')).toBe('true');
  });

  it('Escape pide cerrar', () => {
    const fixture = montar();
    fixture.componentInstance.abierto.set(true);
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector('.p')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.abierto()).toBe(false);
  });

  it('el clic en el velo pide cerrar', () => {
    const fixture = montar();
    fixture.componentInstance.abierto.set(true);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.velo').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.abierto()).toBe(false);
  });

  it('no lleva transform estático: si lo llevara, atraparía a un modal abierto adentro', () => {
    const fixture = montar();
    fixture.componentInstance.abierto.set(true);
    fixture.detectChanges();

    const caja = fixture.nativeElement.querySelector('.p');
    const transform = getComputedStyle(caja).transform;
    expect(transform === 'none' || transform === '').toBe(true);
  });
});
```

- [ ] **Paso 2: correr y verlo fallar**

Esperado: `Cannot find module './panel'`.

- [ ] **Paso 3: escribir el componente**

Crear `frontend/src/app/shared/ui/panel.ts`:

```ts
import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';

/**
 * Panel lateral. Comparte mecánica con `app-modal` —velo, Escape, trampa de
 * foco y devolución del foco al cerrar— y se diferencia en la intención: el
 * modal interrumpe para preguntar algo corto, el panel acompaña mientras se
 * sigue viendo el contexto de atrás.
 */
@Component({
  selector: 'app-panel',
  template: `
    @if (abierto()) {
      <div class="velo" (click)="cerrar.emit()"></div>
      <aside
        class="p"
        #caja
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        (keydown.escape)="cerrar.emit()"
        (keydown.tab)="atrapar($any($event))"
      >
        <header class="cab">
          <h3 class="tit">{{ titulo() }}</h3>
          <button class="x" (click)="cerrar.emit()" aria-label="Cerrar">✕</button>
        </header>

        <div class="cuerpo"><ng-content></ng-content></div>

        <footer class="pie"><ng-content select="[pie]"></ng-content></footer>
      </aside>
    }
  `,
  styles: `
    .velo {
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(16, 24, 40, 0.5);
      animation: velo var(--dur-media) var(--ease-suave);
    }
    @keyframes velo { from { opacity: 0; } to { opacity: 1; } }

    /*
     * Sin `transform` estático a propósito: un elemento con transform es bloque
     * contenedor de sus descendientes `position: fixed`, y un modal abierto
     * desde adentro del panel quedaría recortado dentro de él. La animación usa
     * keyframes sin fill-mode, así que al terminar no queda transform.
     */
    .p {
      position: fixed;
      z-index: 51;
      top: 0;
      right: 0;
      bottom: 0;
      width: min(420px, 100vw);
      display: flex;
      flex-direction: column;
      background: var(--superficie-elevada);
      border-left: 1px solid var(--borde);
      box-shadow: var(--sombra-3);
      animation: entra var(--dur-lenta) var(--ease-salida);
    }
    @keyframes entra {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }

    .cab {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--e3);
      padding: var(--e4);
      border-bottom: 1px solid var(--borde);
      flex: none;
    }
    .tit { font-size: var(--t-titulo); font-weight: 600; overflow-wrap: anywhere; }
    .x {
      border: none;
      background: transparent;
      color: var(--texto-suave);
      font-size: var(--t-base);
      cursor: pointer;
      padding: var(--e1);
      border-radius: var(--r-sm);
      flex: none;
    }
    .x:hover { background: var(--superficie-hundida); color: var(--texto-primario); }

    /* El scroll vive acá, no en la página: la cabecera queda siempre a la vista. */
    .cuerpo {
      flex: 1;
      overflow-y: auto;
      padding: var(--e4);
      color: var(--texto-primario);
    }
    .pie:not(:empty) {
      display: flex;
      justify-content: flex-end;
      gap: var(--e2);
      padding: var(--e3) var(--e4);
      border-top: 1px solid var(--borde);
      flex: none;
    }
  `,
})
export class Panel {
  readonly abierto = input<boolean>(false);
  readonly titulo = input<string>('');

  readonly cerrar = output<void>();

  private readonly caja = viewChild<ElementRef<HTMLElement>>('caja');
  private anterior: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.abierto()) {
        // Se recuerda quién tenía el foco para devolvérselo al cerrar: si no, el
        // teclado vuelve al principio de la página y quien navega así se pierde.
        this.anterior = document.activeElement as HTMLElement | null;
        queueMicrotask(() => this.caja()?.nativeElement.focus());
      } else if (this.anterior) {
        this.anterior.focus();
        this.anterior = null;
      }
    });
  }

  /** Atrapa el foco adentro: tabular hasta el final no debe llevar a la página
   *  de atrás, que está tapada por el velo. */
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

- [ ] **Paso 4: correr los tests**

Esperado: `TOTAL: 64 SUCCESS` (58 + 6).

- [ ] **Paso 5: agregarlo al catálogo**

En `catalogo.ts` importar `Panel` y sumarlo a `imports`, más el signal:

```ts
  readonly panelAbierto = signal<boolean>(false);
```

En `catalogo.html`, dentro del grupo «Diálogos», junto a los otros dos botones:

```html
    <app-boton variante="secundario" (pulsar)="panelAbierto.set(true)">Abrir panel</app-boton>
```

Y al final del archivo, junto al modal y al confirmar:

```html
<app-panel
  [abierto]="panelAbierto()"
  titulo="Cambio de aceite y filtro"
  (cerrar)="panelAbierto.set(false)"
>
  <p style="margin: 0">Acá van los comentarios y los adjuntos del trabajo.</p>
  <div pie>
    <app-boton variante="fantasma" (pulsar)="panelAbierto.set(false)">Cerrar</app-boton>
  </div>
</app-panel>
```

- [ ] **Paso 6: verificar en la aplicación**

En `/ui`, con la aplicación corriendo:

1. «Abrir panel» lo trae desde la derecha; el catálogo se sigue viendo a la izquierda bajo el velo.
2. `Esc`, el clic en el velo y la ✕ lo cierran, y **el foco vuelve al botón «Abrir panel»**.
3. `Tab` da la vuelta adentro del panel sin salirse.
4. Claro y oscuro.
5. Ventana de 375 px: ocupa el ancho completo.
6. Con `prefers-reduced-motion: reduce` en el sistema: aparece sin desplazarse.

- [ ] **Paso 7: commit**

```bash
git add frontend/src/app/shared/ui/panel.ts frontend/src/app/shared/ui/panel.spec.ts \
        frontend/src/app/features/ui/catalogo.html frontend/src/app/features/ui/catalogo.ts
git commit -m "feat: app-panel, el panel lateral

Comparte con el modal el velo, Escape, la trampa de foco y la
devolución del foco; se diferencia en la intención y en la forma.

No lleva transform estático a propósito: con uno, sería bloque
contenedor de sus descendientes fixed y el modal de confirmación que se
abre desde adentro quedaría recortado dentro del panel."
```

---

### Tarea 5: Login y registro

**Files:**
- Modify: `frontend/src/app/features/auth/login/login.html`, `login.ts`
- Modify: `frontend/src/app/features/auth/registro/registro.html`, `registro.ts`
- Create: `frontend/src/app/features/auth/auth.css` (compartida por las dos)

**Interfaces:**
- Consume: `Campo`, `Boton` (`shared/ui/`), `ToastService`.
- Produce: nada que otra tarea consuma.

No lleva test unitario: los `FormGroup` no cambian y lo que cambia es markup. La verificación es entrar con credenciales buenas y malas.

- [ ] **Paso 1: la hoja compartida**

Crear `frontend/src/app/features/auth/auth.css`:

```css
/* Las dos únicas pantallas sin shell: se centran solas. */
.pantalla {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--e4);
  background: var(--fondo);
}

.caja {
  width: 100%;
  max-width: 420px;
  background: var(--superficie);
  border: 1px solid var(--borde);
  border-radius: var(--r-md);
  box-shadow: var(--sombra-2);
  padding: var(--e6);
}

.marca {
  text-align: center;
  margin-bottom: var(--e6);
}
.marca-nombre {
  font-size: var(--t-h1);
  font-weight: 600;
  color: var(--texto-primario);
}
.marca-bajada {
  font-size: var(--t-menor);
  color: var(--texto-suave);
}

.campos {
  display: grid;
  gap: var(--e4);
  margin-bottom: var(--e6);
}
/* El registro tiene nombres y apellidos, que caben en una fila. */
.par {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--e4);
}
@media (max-width: 480px) {
  .par { grid-template-columns: 1fr; }
}

.acciones { display: grid; gap: var(--e3); }

.pie-caja {
  margin-top: var(--e4);
  text-align: center;
  font-size: var(--t-menor);
  color: var(--texto-suave);
}
.enlace { color: var(--acento); text-decoration: none; font-weight: 600; }
.enlace:hover { text-decoration: underline; }
```

- [ ] **Paso 2: reescribir el login**

`frontend/src/app/features/auth/login/login.html`:

```html
<div class="pantalla">
  <div class="caja">
    <div class="marca">
      <div class="marca-nombre">🔧 TallerPro</div>
      <div class="marca-bajada">Sistema de gestión de órdenes de servicio</div>
    </div>

    <form [formGroup]="formulario" (ngSubmit)="enviar()">
      <div class="campos">
        <app-campo
          etiqueta="Correo electrónico"
          tipo="email"
          marcador="usuario@taller.com"
          formControlName="email"
        ></app-campo>

        <app-campo etiqueta="Contraseña" tipo="password" formControlName="password"></app-campo>
      </div>

      <div class="acciones">
        <app-boton variante="primario" [cargando]="cargando()" (pulsar)="enviar()">
          Ingresar
        </app-boton>
      </div>
    </form>

    <p class="pie-caja">
      ¿No tiene cuenta? <a class="enlace" routerLink="/auth/registro">Regístrese aquí</a>
    </p>
  </div>
</div>
```

**`app-boton` no es un `<button type="submit">`**, así que el `(pulsar)` llama a `enviar()` directo. El `(ngSubmit)` del formulario se conserva para que `Enter` dentro de un campo siga enviando.

En `login.ts`: quitar el signal `mensajeError` de la plantilla y mandarlo al toast. Cambios en el decorador y en el manejo del error:

```ts
import { Campo } from '../../../shared/ui/campo';
import { Boton } from '../../../shared/ui/boton';
import { ToastService } from '../../../shared/ui/toast';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Campo, Boton],
  templateUrl: './login.html',
  styleUrl: '../auth.css',
})
```

Y en el `subscribe` del envío, reemplazar `this.mensajeError.set(...)` por:

```ts
      error: (error) => {
        this.cargando.set(false);
        this.toast.error(error.error?.message ?? 'No se pudo iniciar sesión');
      },
```

inyectando `private readonly toast = inject(ToastService);`. Si `mensajeError` queda sin uso, borrarlo.

- [ ] **Paso 3: reescribir el registro**

`frontend/src/app/features/auth/registro/registro.html` con la misma estructura: `.pantalla` → `.caja` → `.marca` → formulario. Los cinco controles con `app-campo` y `formControlName`, con `nombres` y `apellidos` dentro de un `<div class="par">`:

```html
<div class="pantalla">
  <div class="caja">
    <div class="marca">
      <div class="marca-nombre">🔧 TallerPro</div>
      <div class="marca-bajada">Crear una cuenta</div>
    </div>

    <form [formGroup]="formulario" (ngSubmit)="enviar()">
      <div class="campos">
        <div class="par">
          <app-campo etiqueta="Nombres" formControlName="nombres"></app-campo>
          <app-campo etiqueta="Apellidos" formControlName="apellidos"></app-campo>
        </div>

        <app-campo etiqueta="Nombre de usuario" formControlName="username"></app-campo>
        <app-campo etiqueta="Correo electrónico" tipo="email" formControlName="email"></app-campo>
        <app-campo etiqueta="Contraseña" tipo="password" formControlName="password"></app-campo>
      </div>

      <div class="acciones">
        <app-boton variante="primario" [cargando]="cargando()" (pulsar)="enviar()">
          Crear cuenta
        </app-boton>
      </div>
    </form>

    <p class="pie-caja">
      ¿Ya tiene cuenta? <a class="enlace" routerLink="/auth/login">Inicie sesión</a>
    </p>
  </div>
</div>
```

En `registro.ts`, los mismos cambios de decorador y toast que el login. **Si la plantilla tenía un aviso de que el registro crea un usuario con rol Mecánico, conservarlo** como `<p class="pie-caja">`: es información que el usuario necesita y no depende del aspecto.

- [ ] **Paso 4: compilar y correr los tests**

```bash
cd frontend && npx prettier --write src/app/features/auth/ && npm run build && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: build sin errores, `TOTAL: 64 SUCCESS`.

- [ ] **Paso 5: verificar en la aplicación**

1. Cerrar sesión y entrar a `/auth/login`: la caja está centrada vertical y horizontalmente.
2. Enviar vacío: los dos campos muestran «Este campo es obligatorio» **solo después de tocarlos**.
3. Un correo mal formado muestra «Correo electrónico no válido».
4. Credenciales incorrectas: **toast rojo**, no bloque.
5. `admin@taller.com` / `123456` entra al dashboard.
6. `Enter` dentro del campo de contraseña envía.
7. `/auth/registro`: nombres y apellidos en dos columnas, y en una sola por debajo de 480 px.
8. Claro y oscuro; 375 px de ancho.

- [ ] **Paso 6: commit**

```bash
git add frontend/src/app/features/auth/
git commit -m "feat: login y registro con el sistema nuevo

Conservan la tarjeta centrada, que es la forma correcta para cuatro
usuarios que entran una vez al día. Cambia el interior: tokens, Inter y
las primitivas, con los errores saliendo del mapa único.

El error de credenciales pasa a toast: es el resultado de una acción,
no un fallo de carga."
```

---

### Tarea 6: Cambiar contraseña

**Files:**
- Modify: `frontend/src/app/features/perfil/cambiar-password/cambiar-password.html`, `.ts`
- Create: `frontend/src/app/features/perfil/cambiar-password/cambiar-password.css`

**Interfaces:**
- Consume: `Campo`, `Boton`, `Tarjeta`, `ToastService`.
- Produce: nada.

El validador cruzado `noCoinciden()` **no se toca**: es lógica propia de la pantalla y no depende del markup.

- [ ] **Paso 1: reescribir la plantilla**

```html
<div class="angosto">
  <app-tarjeta titulo="Cambiar contraseña">
    <form [formGroup]="formulario" (ngSubmit)="enviar()">
      <div class="campos">
        <app-campo
          etiqueta="Contraseña actual"
          tipo="password"
          formControlName="passwordActual"
        ></app-campo>

        <app-campo
          etiqueta="Contraseña nueva"
          tipo="password"
          ayuda="Al menos 6 caracteres"
          formControlName="passwordNueva"
        ></app-campo>

        <app-campo
          etiqueta="Repetir contraseña nueva"
          tipo="password"
          [error]="noCoinciden() ? 'Las contraseñas no coinciden' : ''"
          formControlName="passwordConfirmacion"
        ></app-campo>
      </div>

      <div class="acciones">
        <app-boton variante="fantasma" (pulsar)="volver()">Volver</app-boton>
        <app-boton variante="primario" [cargando]="guardando()" (pulsar)="enviar()">
          Cambiar contraseña
        </app-boton>
      </div>
    </form>
  </app-tarjeta>
</div>
```

El `[error]` del tercer campo es exactamente para lo que existe ese input: un mensaje que no sale de los validadores del propio control.

- [ ] **Paso 2: la hoja**

Crear `cambiar-password.css`:

```css
.angosto { max-width: 480px; }
.campos { display: grid; gap: var(--e4); margin-bottom: var(--e6); }
.acciones { display: flex; justify-content: flex-end; gap: var(--e2); }
```

La escala de espaciado de `tokens.css` **no tiene `--e5`**: va `--e4`, `--e6`, `--e8`, `--e12`, `--e16`. Usar uno que no existe deja el `margin-bottom` en cero sin avisar.

- [ ] **Paso 3: ajustar el componente**

En `cambiar-password.ts`: `imports: [ReactiveFormsModule, Campo, Boton, Tarjeta]`, `styleUrl: './cambiar-password.css'`, e inyectar `ToastService`. Los dos mensajes de hoy —`mensajeError` y `mensajeExito`— pasan a toast:

```ts
      next: () => {
        this.guardando.set(false);
        this.toast.exito('La contraseña se cambió');
        this.volver();
      },
      error: (error) => {
        this.guardando.set(false);
        this.toast.error(error.error?.message ?? 'No se pudo cambiar la contraseña');
      },
```

Si `mensajeError` y `mensajeExito` quedan sin uso, borrarlos.

- [ ] **Paso 4: compilar y probar**

```bash
cd frontend && npx prettier --write src/app/features/perfil/ && npm run build && npx ng test --watch=false --browsers=ChromeHeadless
```

- [ ] **Paso 5: verificar en la aplicación**

En `/perfil/password`, con sesión:

1. Enviar vacío: los tres campos piden contenido después de tocarlos.
2. Contraseña nueva de 3 caracteres: «Mínimo 6 caracteres».
3. Repetir distinto: «Las contraseñas no coinciden» en el tercer campo.
4. Cambio correcto con `123456` → una nueva: **toast de éxito** y vuelve atrás. Después, volver a dejarla en `123456` para no romper el resto de la verificación.
5. Contraseña actual equivocada: toast de error.
6. Claro, oscuro y 375 px.

- [ ] **Paso 6: commit**

```bash
git add frontend/src/app/features/perfil/
git commit -m "feat: cambiar contraseña con el sistema nuevo

Los dos mensajes de la pantalla pasan a toast. El aviso de que las
contraseñas no coinciden viaja por el input error de app-campo, que
existe justamente para lo que no sale de los validadores del control."
```

---

### Tarea 7: Formulario de orden

El más grande: nueve controles y la única pantalla de las ocho con lógica que vale la pena conservar intacta.

**Files:**
- Modify: `frontend/src/app/features/ordenes/formulario-orden/formulario-orden.html`, `.ts`
- Create: `frontend/src/app/features/ordenes/formulario-orden/formulario-orden.css`

**Interfaces:**
- Consume: `Campo`, `Area` (tarea 3), `Boton`, `Tarjeta`, `Esqueleto`, `ToastService`.
- Produce: nada.

**Lo que NO se toca:** el `FormGroup`, sus validadores, la tubería de `valueChanges` de la placa, `vehiculoConocido`, `diferencias`, `confirmarActualizacionDelVehiculo()` y `descartarActualizacion()`. Si alguna de esas líneas aparece en el diff, algo se entendió mal.

- [ ] **Paso 1: reescribir la plantilla**

```html
@if (cargando()) {
  <app-esqueleto variante="fila" [repeticiones]="6"></app-esqueleto>
} @else {
  <div class="ancho">
    <app-tarjeta [titulo]="esEdicion ? 'Editar orden de servicio' : 'Nueva orden de servicio'">
      <form [formGroup]="formulario" (ngSubmit)="enviar()">
        <span class="etiqueta">Datos del vehículo</span>
        <div class="rejilla vehiculo">
          <div>
            <app-campo etiqueta="Placa" marcador="ABC-123" formControlName="placa"></app-campo>
            @if (vehiculoConocido(); as vehiculo) {
              <p class="aviso-conocido">
                Vehículo conocido ·
                <a class="enlace" [routerLink]="['/vehiculos', vehiculo.id]">ver historial</a>
              </p>
            }
          </div>

          <app-campo etiqueta="Marca" formControlName="marca"></app-campo>
          <app-campo etiqueta="Modelo" formControlName="modelo"></app-campo>
          <app-campo etiqueta="Año" tipo="number" formControlName="anio"></app-campo>
        </div>

        <span class="etiqueta">Datos del propietario</span>
        <div class="rejilla propietario">
          <app-campo
            etiqueta="Nombre del propietario"
            formControlName="propietario_nombre"
          ></app-campo>
          <app-campo etiqueta="Teléfono" formControlName="propietario_telefono"></app-campo>
        </div>

        <span class="etiqueta">Datos del servicio</span>
        <div class="rejilla servicio">
          <app-area
            etiqueta="Descripción del servicio"
            marcador="Detalle del trabajo solicitado por el cliente"
            [filas]="3"
            formControlName="descripcion"
          ></app-area>

          <div class="fechas">
            <app-campo
              etiqueta="Fecha de ingreso"
              tipo="date"
              formControlName="fecha_ingreso"
            ></app-campo>
            <app-campo
              etiqueta="Fecha de entrega"
              tipo="date"
              formControlName="fecha_entrega"
            ></app-campo>
          </div>
        </div>

        @if (diferencias().length > 0) {
          <div class="conflicto">
            <p class="conflicto-titulo">Esta placa ya está registrada con otros datos</p>
            <ul class="conflicto-lista">
              @for (diferencia of diferencias(); track diferencia.campo) {
                <li>
                  <strong>{{ diferencia.campo }}</strong>: guardado
                  <em>{{ diferencia.guardado }}</em>, escrito <em>{{ diferencia.enviado }}</em>
                </li>
              }
            </ul>
            <div class="conflicto-acciones">
              <app-boton variante="secundario" tamano="sm" (pulsar)="descartarActualizacion()">
                Corregir
              </app-boton>
              <app-boton
                variante="primario"
                tamano="sm"
                (pulsar)="confirmarActualizacionDelVehiculo()"
              >
                Actualizar el vehículo
              </app-boton>
            </div>
          </div>
        }

        <div class="acciones">
          <app-boton variante="fantasma" (pulsar)="cancelar()">Cancelar</app-boton>
          <app-boton variante="primario" [cargando]="guardando()" (pulsar)="enviar()">
            {{ esEdicion ? 'Guardar cambios' : 'Registrar orden' }}
          </app-boton>
        </div>
      </form>
    </app-tarjeta>
  </div>
}
```

Los mensajes de error se van de la plantilla: los pone la primitiva. **El método `tieneError()` de la clase queda sin uso y se borra.**

- [ ] **Paso 2: la hoja**

Crear `formulario-orden.css`:

```css
.ancho { max-width: 880px; }

.etiqueta { display: block; margin: var(--e6) 0 var(--e3); }
.etiqueta:first-of-type { margin-top: 0; }

.rejilla { display: grid; gap: var(--e4); }
.vehiculo { grid-template-columns: 1.4fr 1fr 1fr 0.7fr; align-items: start; }
.propietario { grid-template-columns: 2fr 1fr; }
.servicio { grid-template-columns: 1fr; }
.fechas { display: grid; grid-template-columns: 1fr 1fr; gap: var(--e4); max-width: 420px; }

@media (max-width: 768px) {
  .vehiculo,
  .propietario,
  .fechas {
    grid-template-columns: 1fr;
  }
}

.aviso-conocido {
  margin-top: var(--e1);
  font-size: var(--t-menor);
  color: var(--exito-texto);
}
.enlace { color: var(--acento); text-decoration: none; font-weight: 600; }
.enlace:hover { text-decoration: underline; }

/* El conflicto de placa es un aviso, no un error: el usuario puede seguir. */
.conflicto {
  background: var(--aviso-fondo);
  color: var(--aviso-texto);
  border: 1px solid var(--aviso-texto);
  border-radius: var(--r-md);
  padding: var(--e4);
  margin-top: var(--e6);
  font-size: var(--t-tabla);
}
.conflicto-titulo { font-weight: 600; margin-bottom: var(--e2); }
.conflicto-lista { margin: 0 0 var(--e3) var(--e4); }
.conflicto-acciones { display: flex; justify-content: flex-end; gap: var(--e2); }

.acciones {
  display: flex;
  justify-content: flex-end;
  gap: var(--e2);
  margin-top: var(--e6);
}
```

- [ ] **Paso 3: ajustar el componente**

En `formulario-orden.ts`:

```ts
  imports: [ReactiveFormsModule, RouterLink, Campo, Area, Boton, Tarjeta, Esqueleto],
  templateUrl: './formulario-orden.html',
  styleUrl: './formulario-orden.css',
```

Quitar el import de `Spinner`, borrar `tieneError()`, y mandar el error de guardado al toast, conservando **una excepción**: si la respuesta trae `diferencias`, eso no es un toast sino el bloque de conflicto que ya existe. Revisar el `error:` del envío y dejar el toast solo para el resto de los casos.

- [ ] **Paso 4: compilar y probar**

```bash
cd frontend && npx prettier --write src/app/features/ordenes/formulario-orden/ && npm run build && npx ng test --watch=false --browsers=ChromeHeadless
```

- [ ] **Paso 5: verificar el autocompletado por placa, que es lo delicado**

En `/ordenes/nueva`:

1. Escribir **`ABC123`** (placa que existe en los datos de prueba) y esperar: marca, modelo, año y propietario se rellenan solos, y aparece «Vehículo conocido · ver historial» en verde.
2. Escribir **`ZZZ999`** (no existe): **no** aparece ningún error. Una placa desconocida significa auto nuevo, no fallo.
3. Escribir `ABC123` y **cambiar la marca** a otra cosa; enviar: aparece el bloque ámbar con la tabla de diferencias, «Corregir» lo descarta y «Actualizar el vehículo» lo pisa y guarda.
4. Enviar el formulario vacío: cada campo obligatorio muestra su mensaje después de tocarlo; el año fuera de 1950–2100 muestra «El valor mínimo es 1950» o «El valor máximo es 2100».
5. Crear una orden completa: se guarda y navega al detalle.
6. Entrar a `/ordenes/:id/editar` de una orden existente: los nueve campos llegan cargados.
7. Claro, oscuro, y 375 px con la rejilla en una columna.

- [ ] **Paso 6: commit**

```bash
git add frontend/src/app/features/ordenes/formulario-orden/
git commit -m "feat: el formulario de orden con el sistema nuevo

Nueve controles sobre una rejilla propia. El FormGroup, sus validadores
y la tubería que autocompleta por placa quedan intactos: eso es lo que
compró volver CVA a las primitivas.

Los mensajes de error se van de la plantilla -eran nueve escritos a
mano- y los pone la primitiva desde el mapa único."
```

---

### Tarea 8: Formulario de trabajo

**Files:**
- Modify: `frontend/src/app/features/trabajos/formulario-trabajo/formulario-trabajo.html`, `.ts`
- Create: `frontend/src/app/features/trabajos/formulario-trabajo/formulario-trabajo.css`

**Interfaces:**
- Consume: `Campo`, `Select` (tarea 2), `Boton`, `Tarjeta`, `ToastService`.
- Produce: conserva el input `ordenId` y el output `trabajoCreado`, de los que depende el detalle de orden.

La descripción **se queda en una línea** (`app-campo`), como fija la §4 de la spec: su etiqueta dice «Descripción (opcional)» y se usa como rótulo corto, no como prosa.

- [ ] **Paso 1: reescribir la plantilla**

```html
<app-tarjeta titulo="Agregar trabajo a esta orden">
  <form [formGroup]="formulario" (ngSubmit)="enviar()">
    <div class="rejilla">
      <app-campo
        etiqueta="Título del trabajo"
        marcador="Ej. Cambio de pastillas de freno"
        formControlName="titulo"
      ></app-campo>

      <app-campo
        etiqueta="Mano de obra (S/)"
        tipo="number"
        marcador="Sin cotizar"
        ayuda="Déjalo vacío si todavía no cotizas. Usa 0 si no cobras mano de obra."
        formControlName="precio_mano_obra"
      ></app-campo>

      <app-select
        etiqueta="Prioridad"
        [opciones]="opcionesPrioridad()"
        formControlName="prioridad"
      ></app-select>

      <app-select
        etiqueta="Asignar a"
        marcador="Sin asignar"
        [opciones]="opcionesMecanicos()"
        formControlName="asignado_a_id"
      ></app-select>

      <app-campo etiqueta="Descripción (opcional)" formControlName="descripcion"></app-campo>

      <app-campo
        etiqueta="Fecha límite (opcional)"
        tipo="date"
        formControlName="fecha_limite"
      ></app-campo>
    </div>

    <div class="acciones">
      <app-boton variante="primario" [cargando]="guardando()" (pulsar)="enviar()">
        Agregar trabajo
      </app-boton>
    </div>
  </form>
</app-tarjeta>
```

- [ ] **Paso 2: las dos listas de opciones**

`app-select` consume `Opcion[]`, no un array de strings ni la lista cruda de mecánicos. En `formulario-trabajo.ts`:

```ts
import { computed } from '@angular/core';
import { Opcion } from '../../../shared/ui/select';

  readonly opcionesPrioridad = computed<Opcion[]>(() =>
    this.prioridades.map((prioridad) => ({
      valor: prioridad,
      texto: ETIQUETA_PRIORIDAD[prioridad] ?? prioridad,
    })),
  );

  readonly opcionesMecanicos = computed<Opcion[]>(() =>
    this.mecanicos().map((mecanico) => ({
      valor: mecanico.id,
      texto: `${mecanico.nombres} ${mecanico.apellidos}`,
    })),
  );
```

**`ETIQUETA_PRIORIDAD` no existe todavía.** Hoy el `<select>` muestra `BAJA`, `MEDIA` y `ALTA` en mayúsculas crudas, que es exactamente lo que el resto del rediseño dejó de hacer. Agregarlo a `core/models/estados.ts`, junto a las otras tablas de etiquetas:

```ts
export const ETIQUETA_PRIORIDAD: Record<string, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
};
```

Y usarlo también en `shared/ui/prioridad.ts`, que hoy tiene su propia copia del mismo mapa: importar `ETIQUETA_PRIORIDAD` y borrar la constante local `ETIQUETA`, dejando `etiqueta` y `color` apoyados en la tabla compartida. **Al hacerlo, correr `prioridad.spec.ts`**: sus tres tests tienen que seguir en verde sin tocarlos.

- [ ] **Paso 3: la hoja**

Crear `formulario-trabajo.css`:

```css
.rejilla {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--e4);
  align-items: start;
}
@media (max-width: 768px) {
  .rejilla { grid-template-columns: 1fr; }
}
.acciones { display: flex; justify-content: flex-end; margin-top: var(--e6); }
```

- [ ] **Paso 4: ajustar el decorador y el error**

```ts
  imports: [ReactiveFormsModule, Campo, Select, Boton, Tarjeta],
  templateUrl: './formulario-trabajo.html',
  styleUrl: './formulario-trabajo.css',
```

El `mensajeError` de la plantilla pasa a `toast.error(...)`, y el éxito a `toast.exito('Se agregó el trabajo')`. Borrar `tieneError()` si queda sin uso.

- [ ] **Paso 5: compilar y probar**

```bash
cd frontend && npx prettier --write src/app/features/trabajos/formulario-trabajo/ src/app/core/models/estados.ts src/app/shared/ui/prioridad.ts && npm run build && npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: `TOTAL: 64 SUCCESS`, con los tres de `prioridad` entre ellos.

- [ ] **Paso 6: verificar en la aplicación**

En el detalle de una orden, pestaña Trabajos, botón «+ Trabajo»:

1. El desplegable de prioridad ahora dice **Baja / Media / Alta**, no `BAJA / MEDIA / ALTA`.
2. «Asignar a» arranca en «Sin asignar» y lista los mecánicos.
3. Título vacío: «Este campo es obligatorio» tras tocarlo; con 2 caracteres, «Mínimo 4 caracteres».
4. Crear un trabajo: **el formulario se cierra solo**, la tarjeta aparece en el tablero y sale un toast.
5. La ayuda de mano de obra sigue diciendo lo que no es obvio: vacío es sin cotizar, `0` es un precio.
6. En el Kanban, el punto de prioridad sigue mostrando Baja/Media/Alta con su color.
7. Claro, oscuro y 375 px.

- [ ] **Paso 7: commit**

```bash
git add frontend/src/app/features/trabajos/formulario-trabajo/ \
        frontend/src/app/core/models/estados.ts frontend/src/app/shared/ui/prioridad.ts
git commit -m "feat: el formulario de trabajo con el sistema nuevo

Seis controles, con los dos desplegables sobre app-select. Las
prioridades dejan de mostrarse en mayúsculas crudas: ETIQUETA_PRIORIDAD
se muda a core/models/estados.ts, junto a las otras tablas de
etiquetas, y app-prioridad deja de tener su propia copia."
```

---

### Tarea 9: El detalle de trabajo en el panel lateral

El cambio estructural de la entrega.

**Files:**
- Modify: `frontend/src/app/features/trabajos/detalle-trabajo/detalle-trabajo.html`, `.ts`
- Create: `frontend/src/app/features/trabajos/detalle-trabajo/detalle-trabajo.css`
- Modify: `frontend/src/app/features/ordenes/detalle-orden/detalle-orden.html`, `.ts`, `.css`

**Interfaces:**
- Consume: `Panel` (tarea 4), `Area` (tarea 3), `Boton`, `Pastilla`, `Confirmar`, `EstadoVacio`, `ToastService`.
- Produce: `DetalleTrabajo` conserva su input `trabajo`. Lo nuevo es que el detalle de orden lo envuelve en un `<app-panel>` en vez de dibujarlo debajo del tablero.

- [ ] **Paso 1: el detalle de orden hospeda el panel**

En `detalle-orden.html`, reemplazar el bloque que hoy dibuja el detalle bajo el tablero:

```html
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
```

por, **fuera del `@if` de la pestaña** y junto al `app-confirmar` que ya está al final de la plantilla:

```html
  <app-panel
    [abierto]="trabajoSeleccionado() !== null"
    [titulo]="trabajoSeleccionado()?.titulo ?? ''"
    (cerrar)="cerrarDetalleTrabajo()"
  >
    @if (trabajoSeleccionado(); as trabajo) {
      <app-detalle-trabajo [trabajo]="trabajo"></app-detalle-trabajo>
    }
  </app-panel>
```

Sale del `@if` de la pestaña a propósito: el panel flota sobre la pantalla y no pertenece a una pestaña. Importar `Panel` en `detalle-orden.ts` y borrar de su CSS las reglas `.detalle-trabajo` y `.detalle-cab`, que quedan sin uso.

- [ ] **Paso 2: reescribir el contenido del detalle de trabajo**

`detalle-trabajo.html` — sin tarjeta ni cabecera propias, porque las pone el panel:

```html
<div class="cabecera">
  <app-pastilla [estado]="trabajo().estado"></app-pastilla>
</div>

@if (mensajeError()) {
  <div class="bloque-error">{{ mensajeError() }}</div>
}

<section class="seccion">
  <span class="etiqueta">Comentarios ({{ comentarios().length }})</span>

  @if (comentarios().length === 0) {
    <p class="vacio">Todavía no hay comentarios en este trabajo.</p>
  } @else {
    <ul class="comentarios">
      @for (comentario of comentarios(); track comentario.id) {
        <li class="comentario">
          <div class="comentario-cab">
            <strong>{{ comentario.usuario.nombres }} {{ comentario.usuario.apellidos }}</strong>
            <span class="texto-suave texto-menor">
              {{ comentario.created_at | date: 'dd/MM/yyyy HH:mm' }}
            </span>
          </div>
          <p class="comentario-texto">{{ comentario.contenido }}</p>
        </li>
      }
    </ul>
  }

  <form [formGroup]="formularioComentario" (ngSubmit)="enviarComentario()">
    <app-area
      marcador="Escriba un comentario…"
      [filas]="2"
      formControlName="contenido"
    ></app-area>
    <div class="acciones">
      <app-boton
        variante="primario"
        tamano="sm"
        [cargando]="enviandoComentario()"
        (pulsar)="enviarComentario()"
      >
        Comentar
      </app-boton>
    </div>
  </form>
</section>

<section class="seccion">
  <span class="etiqueta">Archivos adjuntos ({{ adjuntos().length }})</span>

  @if (adjuntos().length === 0) {
    <p class="vacio">No hay archivos adjuntos.</p>
  } @else {
    <ul class="adjuntos">
      @for (adjunto of adjuntos(); track adjunto.id) {
        <li class="adjunto">
          <div class="crece">
            <a class="enlace" [href]="adjunto.url" target="_blank" rel="noopener">
              {{ adjunto.nombre_original }}
            </a>
            <p class="texto-suave texto-menor">
              {{ formatearTamano(adjunto.tamano) }} · subido por
              {{ adjunto.subido_por.nombres }} ·
              {{ adjunto.created_at | date: 'dd/MM/yyyy' }}
            </p>
          </div>
          @if (puedeEliminarAdjuntos()) {
            <app-boton variante="fantasma" tamano="sm" (pulsar)="adjuntoAEliminar.set(adjunto)">
              Eliminar
            </app-boton>
          }
        </li>
      }
    </ul>
  }

  <div class="subir">
    <input
      #selector
      class="oculto"
      type="file"
      accept=".jpg,.jpeg,.png,.pdf"
      (change)="seleccionarArchivo($event)"
    />
    <app-boton variante="secundario" tamano="sm" (pulsar)="selector.click()">
      Elegir archivo
    </app-boton>
    <span class="crece texto-suave texto-menor">{{ nombreArchivo() || 'Ningún archivo' }}</span>
    <app-boton
      variante="primario"
      tamano="sm"
      [deshabilitado]="!nombreArchivo()"
      [cargando]="subiendoArchivo()"
      (pulsar)="subirArchivo()"
    >
      Subir
    </app-boton>
  </div>
  <p class="texto-suave texto-menor">Formatos permitidos: JPG, PNG y PDF. Máximo 5 MB.</p>
</section>

<app-confirmar
  [abierto]="adjuntoAEliminar() !== null"
  titulo="Eliminar el archivo"
  [mensaje]="'¿Eliminar el archivo ' + (adjuntoAEliminar()?.nombre_original ?? '') + '?'"
  [peligro]="true"
  textoConfirmar="Eliminar"
  (confirmar)="confirmarEliminacionDeAdjunto()"
  (cancelar)="adjuntoAEliminar.set(null)"
></app-confirmar>
```

- [ ] **Paso 3: ajustar el componente**

En `detalle-trabajo.ts`:

```ts
  imports: [ReactiveFormsModule, DatePipe, Pastilla, Area, Boton, Confirmar],
  templateUrl: './detalle-trabajo.html',
  styleUrl: './detalle-trabajo.css',
```

Sumar el signal del nombre del archivo elegido y el del adjunto a borrar, y partir el borrado en dos —abrir y confirmar—, que es lo que reemplaza al `confirm()`:

```ts
  readonly nombreArchivo = signal<string>('');
  readonly adjuntoAEliminar = signal<Adjunto | null>(null);
```

En `seleccionarArchivo(evento: Event)`, además de guardar el `File` como hoy, guardar el nombre:

```ts
    this.nombreArchivo.set(archivo?.name ?? '');
```

Y reemplazar el `eliminarAdjunto(adjunto)` que hoy hace `confirm()` por:

```ts
  confirmarEliminacionDeAdjunto(): void {
    const adjunto = this.adjuntoAEliminar();
    if (!adjunto) return;

    this.adjuntoAEliminar.set(null);
    this.adjuntoService.eliminar(adjunto.id).subscribe({
      next: () => {
        this.cargarAdjuntos(this.trabajo().id);
        this.toast.exito('Se eliminó el archivo');
      },
      error: (error) => this.toast.error(error.error?.message ?? 'No se pudo eliminar el archivo'),
    });
  }
```

**`cargarAdjuntos` recibe el id del trabajo** —así está declarado hoy,
`private cargarAdjuntos(trabajoId: string)`— y es privado, así que la llamada va
desde dentro de la clase. **Al subir un archivo, limpiar `nombreArchivo`** para
que el rótulo no siga mostrando el anterior.

- [ ] **Paso 4: la hoja**

Crear `detalle-trabajo.css`:

```css
.cabecera { margin-bottom: var(--e4); }

.seccion { margin-bottom: var(--e6); }
.seccion:last-of-type { margin-bottom: 0; }
.seccion .etiqueta { display: block; margin-bottom: var(--e3); }

.vacio { font-size: var(--t-menor); color: var(--texto-suave); margin-bottom: var(--e3); }

.comentarios { list-style: none; display: grid; gap: var(--e2); margin-bottom: var(--e3); }
.comentario {
  background: var(--superficie-hundida);
  border-left: 3px solid var(--acento);
  border-radius: var(--r-sm);
  padding: var(--e2) var(--e3);
}
.comentario-cab {
  display: flex;
  justify-content: space-between;
  gap: var(--e2);
  font-size: var(--t-menor);
  margin-bottom: var(--e1);
}
.comentario-texto { font-size: var(--t-tabla); overflow-wrap: anywhere; }

.adjuntos { list-style: none; display: grid; gap: var(--e2); margin-bottom: var(--e3); }
.adjunto {
  display: flex;
  align-items: center;
  gap: var(--e2);
  border: 1px solid var(--borde);
  border-radius: var(--r-sm);
  padding: var(--e2) var(--e3);
}

/* El input de archivo nativo no se puede estilar; se dispara desde un botón. */
.oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.subir { display: flex; align-items: center; gap: var(--e2); margin-bottom: var(--e1); }

.acciones { display: flex; justify-content: flex-end; margin-top: var(--e2); }
.enlace { color: var(--acento); text-decoration: none; font-weight: 600; }
.enlace:hover { text-decoration: underline; }

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

- [ ] **Paso 5: compilar y probar**

```bash
cd frontend && npx prettier --write src/app/features/trabajos/detalle-trabajo/ src/app/features/ordenes/detalle-orden/ && npm run build && npx ng test --watch=false --browsers=ChromeHeadless
```

- [ ] **Paso 6: verificar en la aplicación**

En el detalle de una orden con trabajos:

1. «Detalle» en una tarjeta abre el panel desde la derecha; **el tablero se sigue viendo** bajo el velo.
2. El título del panel es el del trabajo y adentro está su pastilla de estado.
3. `Esc`, el velo y la ✕ cierran; **el foco vuelve al botón «Detalle»** de la tarjeta.
4. Escribir un comentario y pulsar «Comentar»: aparece en la lista. **`Enter` dentro del área hace salto de línea, no envía** — es la consecuencia aceptada en la §4 de la spec.
5. «Elegir archivo» abre el diálogo del sistema; al elegir uno, su nombre aparece al lado y «Subir» se habilita. Subirlo lo agrega a la lista.
6. «Eliminar» en un adjunto abre `app-confirmar` **centrado en la pantalla y por encima del panel, no recortado dentro de él** — es lo que la tarea 4 protege al no dejar `transform` estático. Confirmar lo borra con toast.
7. Con rol Mecánico, «Eliminar» no aparece.
8. Claro, oscuro, y 375 px con el panel a ancho completo.

- [ ] **Paso 7: commit**

```bash
git add frontend/src/app/features/trabajos/detalle-trabajo/ frontend/src/app/features/ordenes/detalle-orden/
git commit -m "feat: el detalle de trabajo se muda al panel lateral

Estaba debajo del tablero y había que pasar el Kanban entero para leer
un comentario. Ahora entra desde la derecha con el tablero a la vista.

El campo de comentario pasa a ser un área de dos filas: un comentario es
prosa. La consecuencia aceptada es que Enter hace salto de línea y el
envío queda en el botón.

Se va el último confirm() del navegador del proyecto, el de borrar un
adjunto."
```

---

### Tarea 10: Lista de usuarios

**Files:**
- Modify: `frontend/src/app/features/usuarios/lista-usuarios/lista-usuarios.html`, `.ts`
- Create: `frontend/src/app/features/usuarios/lista-usuarios/lista-usuarios.css`

**Interfaces:**
- Consume: `Boton`, `Confirmar`, `Esqueleto`, `ToastService`; las clases `.tabla`, `.tabla-envoltura` y `.num` de `utilidades.css`.
- Produce: nada.

- [ ] **Paso 1: reescribir la plantilla**

```html
<h1 class="titulo">Usuarios del sistema</h1>

@if (mensajeError()) {
  <div class="bloque-error">{{ mensajeError() }}</div>
}

@if (cargando()) {
  <div class="panel" style="padding: var(--e4)">
    <app-esqueleto variante="fila" [repeticiones]="5"></app-esqueleto>
  </div>
} @else {
  <div class="panel">
    <div class="tabla-envoltura">
      <table class="tabla">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Nombre completo</th>
            <th>Correo</th>
            <th>Roles</th>
            <th class="num">Registro</th>
            <th>Estado</th>
            <th class="num">Acción</th>
          </tr>
        </thead>
        <tbody>
          @for (usuario of usuarios(); track usuario.id) {
            <tr>
              <td class="usuario">{{ usuario.username }}</td>
              <td>{{ usuario.nombres }} {{ usuario.apellidos }}</td>
              <td>{{ usuario.email }}</td>
              <td class="texto-suave">{{ nombresRoles(usuario) }}</td>
              <td class="num">{{ usuario.created_at | date: 'dd/MM/yyyy' }}</td>
              <td>
                <span class="marca" [class.activo]="usuario.activo">
                  {{ usuario.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="acciones">
                  <app-boton
                    [variante]="usuario.activo ? 'fantasma' : 'secundario'"
                    tamano="sm"
                    (pulsar)="usuarioACambiar.set(usuario)"
                  >
                    {{ usuario.activo ? 'Desactivar' : 'Activar' }}
                  </app-boton>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  </div>
}

<app-confirmar
  [abierto]="usuarioACambiar() !== null"
  [titulo]="usuarioACambiar()?.activo ? 'Desactivar al usuario' : 'Activar al usuario'"
  [mensaje]="mensajeDeConfirmacion()"
  [peligro]="usuarioACambiar()?.activo ?? false"
  [textoConfirmar]="usuarioACambiar()?.activo ? 'Desactivar' : 'Activar'"
  (confirmar)="confirmarCambioDeEstado()"
  (cancelar)="usuarioACambiar.set(null)"
></app-confirmar>
```

- [ ] **Paso 2: la hoja**

Crear `lista-usuarios.css`:

```css
.titulo {
  font-size: var(--t-h1);
  font-weight: 600;
  color: var(--texto-primario);
  margin-bottom: var(--e4);
}

.panel {
  background: var(--superficie);
  border: 1px solid var(--borde);
  border-radius: var(--r-md);
  box-shadow: var(--sombra-1);
  overflow: hidden;
}

.usuario { font-weight: 600; }

/* Activo no es un estado de orden ni de trabajo, así que no es app-pastilla:
   meterlo en el diccionario de estados repetiría el error que la entrega B
   evitó con las marcas de aprobación. */
.marca {
  font-size: var(--t-etiqueta);
  font-weight: 600;
  padding: var(--e1) var(--e2);
  border-radius: var(--r-full);
  white-space: nowrap;
  background: var(--estado-cancelada-fondo);
  color: var(--estado-cancelada-texto);
}
.marca.activo {
  background: var(--estado-finalizada-fondo);
  color: var(--estado-finalizada-texto);
}

.acciones { display: flex; justify-content: flex-end; }

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

- [ ] **Paso 3: partir el cambio de estado en dos**

En `lista-usuarios.ts`, reemplazar el `cambiarEstado(usuario)` que hoy hace `confirm()` por el par abrir/confirmar:

```ts
  readonly usuarioACambiar = signal<Usuario | null>(null);

  mensajeDeConfirmacion(): string {
    const usuario = this.usuarioACambiar();
    if (!usuario) return '';
    const accion = usuario.activo ? 'desactivar' : 'activar';
    return `¿Seguro que desea ${accion} a ${usuario.username}?`;
  }

  confirmarCambioDeEstado(): void {
    const usuario = this.usuarioACambiar();
    if (!usuario) return;

    this.usuarioACambiar.set(null);
    this.usuarioService.cambiarEstado(usuario.id, !usuario.activo).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.toast.exito(`${usuario.username} quedó ${usuario.activo ? 'inactivo' : 'activo'}`);
      },
      error: (error) => this.toast.error(error.error?.message ?? 'No se pudo cambiar el estado'),
    });
  }
```

Conservando los nombres reales del servicio y del método de recarga que el archivo ya usa. Decorador:

```ts
  imports: [DatePipe, Boton, Confirmar, Esqueleto],
  templateUrl: './lista-usuarios.html',
  styleUrl: './lista-usuarios.css',
```

Quitar el import de `Spinner`.

- [ ] **Paso 4: compilar y probar**

```bash
cd frontend && npx prettier --write src/app/features/usuarios/ && npm run build && npx ng test --watch=false --browsers=ChromeHeadless
```

- [ ] **Paso 5: verificar en la aplicación**

Como Administrador, en `/usuarios`:

1. La tabla lista los usuarios con su marca verde «Activo» o roja «Inactivo».
2. «Desactivar» abre el modal en variante peligro con el nombre del usuario; «Activar» lo abre sin ella.
3. Confirmar cambia el estado, recarga la tabla y sale un toast. **Desactivar y volver a activar** al mismo usuario de prueba para dejar la base como estaba.
4. `Esc` cancela sin cambiar nada.
5. Claro, oscuro y 375 px: la tabla se desplaza dentro de su envoltura sin desbordar la página.

- [ ] **Paso 6: commit**

```bash
git add frontend/src/app/features/usuarios/
git commit -m "feat: la lista de usuarios con el sistema nuevo

Activo e inactivo se dibujan con una marca propia y no con app-pastilla:
no son estados de orden ni de trabajo, y meterlos en ese diccionario
repetiría lo que la entrega B evitó con las marcas de aprobación.

Activar y desactivar pasan por el modal propio."
```

---

### Tarea 11: Ficha de vehículo

La más simple de las ocho, y la última pantalla.

**Files:**
- Modify: `frontend/src/app/features/vehiculos/ficha-vehiculo/ficha-vehiculo.html`, `.ts`
- Create: `frontend/src/app/features/vehiculos/ficha-vehiculo/ficha-vehiculo.css`

**Interfaces:**
- Consume: `Pastilla`, `Esqueleto`, `EstadoVacio`; `.tabla`, `.tabla-envoltura`, `.num`.
- Produce: nada. **Es la última que usa `BadgeEstado`**: al terminar esta tarea, `shared/components/` queda sin consumidores y la tarea 12 puede borrarlo.

- [ ] **Paso 1: reescribir la plantilla**

```html
@if (cargando()) {
  <app-esqueleto variante="texto" [repeticiones]="3"></app-esqueleto>
} @else if (mensajeError()) {
  <div class="bloque-error">{{ mensajeError() }}</div>
  <a class="enlace" routerLink="/ordenes">← Volver al listado</a>
} @else if (vehiculo(); as datos) {
  <a class="migas" routerLink="/ordenes">← Órdenes</a>

  <h1 class="placa">{{ datos.placa }}</h1>

  <p class="datos">
    <span>{{ datos.marca }} {{ datos.modelo }}</span>
    @if (datos.anio) {
      <span>{{ datos.anio }}</span>
    }
    <span>{{ datos.propietario_nombre }}</span>
    <span>{{ datos.propietario_telefono }}</span>
  </p>

  <div class="panel">
    <div class="panel-cab">
      <span class="etiqueta">Historial</span>
      <span class="conteo">{{ datos.ordenes.length }}</span>
    </div>

    @if (datos.ordenes.length === 0) {
      <app-estado-vacio
        icono="📋"
        titulo="Sin órdenes todavía"
        mensaje="Cuando este vehículo entre al taller, su orden aparecerá acá."
      ></app-estado-vacio>
    } @else {
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead>
            <tr>
              <th>Orden</th>
              <th class="num">Ingreso</th>
              <th>Servicio</th>
              <th class="num">Aprobado</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (orden of datos.ordenes; track orden.id) {
              <tr>
                <td>
                  <a class="numero-orden" [routerLink]="['/ordenes', orden.id]">
                    {{ orden.numero_orden }}
                  </a>
                </td>
                <td class="num">{{ orden.fecha_ingreso | date: 'dd/MM/yyyy' : 'UTC' }}</td>
                <td>{{ orden.descripcion }}</td>
                <td class="num">
                  {{ orden.totales.aprobado | currency: 'PEN' : 'symbol-narrow' }}
                </td>
                <td><app-pastilla [estado]="orden.estado"></app-pastilla></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  </div>
}
```

El separador de `.datos` usa **`content: '·' / ''`**, con el texto alternativo vacío. Sin él, el lector de pantalla lee el punto como parte del dato siguiente; se descubrió verificando la entrega B.

- [ ] **Paso 2: la hoja**

Crear `ficha-vehiculo.css`:

```css
.migas {
  display: inline-block;
  font-size: var(--t-menor);
  color: var(--texto-suave);
  text-decoration: none;
  margin-bottom: var(--e2);
}
.migas:hover { color: var(--acento); }

.placa {
  font-size: var(--t-h1);
  font-weight: 600;
  color: var(--texto-primario);
  margin-bottom: var(--e2);
}

.datos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e3);
  font-size: var(--t-tabla);
  color: var(--texto-suave);
  margin-bottom: var(--e6);
}
/* El «/ ''» es el texto alternativo: sin él el lector de pantalla lee el punto
   pegado al dato siguiente. */
.datos > * + *::before {
  content: '·' / '';
  margin-right: var(--e3);
  color: var(--borde-fuerte);
}

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

.numero-orden {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--texto-primario);
  text-decoration: none;
}
.numero-orden:hover { color: var(--acento); text-decoration: underline; }

.enlace { color: var(--acento); text-decoration: none; font-weight: 600; }
.enlace:hover { text-decoration: underline; }

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

- [ ] **Paso 3: ajustar el decorador**

```ts
  imports: [RouterLink, CurrencyPipe, DatePipe, Pastilla, Esqueleto, EstadoVacio],
  templateUrl: './ficha-vehiculo.html',
  styleUrl: './ficha-vehiculo.css',
```

Quitar los imports de `Spinner` y `BadgeEstado`.

- [ ] **Paso 4: compilar y probar**

```bash
cd frontend && npx prettier --write src/app/features/vehiculos/ && npm run build && npx ng test --watch=false --browsers=ChromeHeadless
```

- [ ] **Paso 5: verificar en la aplicación**

Desde el detalle de una orden, pulsar la placa:

1. La ficha muestra placa, vehículo, propietario y teléfono en una línea con puntos.
2. El historial lista las órdenes con su pastilla, y el número enlaza al detalle.
3. Un vehículo sin órdenes muestra el estado vacío.
4. Claro, oscuro y 375 px.

- [ ] **Paso 6: verificar que `shared/components/` quedó sin consumidores**

```bash
cd frontend/src/app && grep -rln "BadgeEstado\|app-badge-estado\|Spinner\|app-spinner" features/ shared/ | grep -v "^shared/components/"
```

Esperado: **sin resultados**. Si aparece alguno, esa pantalla se pasó por alto y hay que volver a su tarea antes de seguir.

- [ ] **Paso 7: commit**

```bash
git add frontend/src/app/features/vehiculos/
git commit -m "feat: la ficha de vehículo con el sistema nuevo

Es la última pantalla que usaba badge-estado y spinner: al terminar,
shared/components/ queda sin consumidores y se puede borrar."
```

---

### Tarea 12: El retiro de Bootstrap y el cierre

La resta. Su verificación no es un build en verde: es recorrer las once rutas.

**Files:**
- Modify: `frontend/angular.json` (líneas 28 y 32), `frontend/package.json`
- Delete: `frontend/src/app/shared/components/` entero
- Modify: `docs/contexto-core.md`

- [ ] **Paso 1: el grep que tiene que dar cero**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro/frontend/src/app
grep -rnE 'class="[^"]*\b(card|card-header|card-body|btn|btn-[a-z-]+|row|col-[a-z0-9-]+|alert|alert-[a-z]+|badge|table|table-[a-z]+|form-control|form-select|form-label|text-muted|fw-[a-z]+|mb-[0-9]|ms-[0-9]|mt-[0-9]|py-[0-9]|ps-[0-9]|d-flex|g-[0-9]|shadow-sm|text-end|text-bg-[a-z]+|bg-[a-z]+|opacity-50|align-middle|input-group|list-group|spinner-border|justify-content-[a-z]+|align-items-[a-z]+|border-start|border-[0-9])\b' features/ shared/
```

Esperado: **sin resultados**. El `\b` de cierre es obligatorio: sin él, `table` coincide dentro de `tablero` y `class="tablero"` se reporta como Bootstrap.

Si aparece algo, arreglarlo **antes** de seguir: cada línea es una pantalla que quedó a medias.

- [ ] **Paso 2: los otros dos greps de la §8 de la spec**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
echo "--- diálogos del navegador ---"
grep -rn 'confirm(\|prompt(' frontend/src/app/ && echo ">>> QUEDA UNO" || echo "OK: ninguno"

echo "--- backend intacto ---"
git diff --stat master -- backend/ && echo "(vacío = intacto)"
```

Esperado: ningún `confirm(` ni `prompt(` —el último se fue en la tarea 9— y el
diff del backend vacío.

- [ ] **Paso 3: medir el peso de antes**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro/frontend
npm run build >/dev/null 2>&1 && du -sh dist/frontend/browser
```

Anotar el número. Al final de la tarea tiene que ser **menor**.

- [ ] **Paso 4: quitar Bootstrap de la construcción**

En `frontend/angular.json`, borrar las dos líneas:

```
"node_modules/bootstrap/dist/css/bootstrap.min.css",     ← del array "styles"
"node_modules/bootstrap/dist/js/bootstrap.bundle.min.js" ← del array "scripts"
```

Si el array `scripts` queda vacío, dejarlo como `[]`. **El `.js` se va sin ceremonia**: un `grep` de `data-bs-` y de `bootstrap` sobre `src/app/` no devuelve nada, así que ningún componente usaba el JavaScript de Bootstrap.

- [ ] **Paso 5: desinstalar el paquete**

```bash
cd frontend && npm uninstall bootstrap
```

- [ ] **Paso 6: borrar los componentes heredados**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
git rm -r frontend/src/app/shared/components/
```

- [ ] **Paso 7: compilar, probar y medir**

```bash
cd frontend
npm run build && du -sh dist/frontend/browser
npx ng test --watch=false --browsers=ChromeHeadless
node scripts/contraste.mjs
```

Esperado: build sin errores; `TOTAL: 64 SUCCESS`; contraste en verde; y el `dist` **más chico** que el del paso 2. Si no bajó, Bootstrap no salió del todo.

- [ ] **Paso 8: el recorrido completo, que es la verificación de verdad**

Con la aplicación corriendo, las **once rutas**, en **claro y oscuro**:

| # | Ruta | Qué mirar |
|---|---|---|
| 1 | `/auth/login` | Caja centrada, errores, entrar |
| 2 | `/auth/registro` | Cinco campos, dos columnas arriba |
| 3 | `/dashboard` | Tres cifras, tira, tabla de trabajos |
| 4 | `/ordenes` | Pestañas, buscador, tabla, eliminar |
| 5 | `/ordenes/nueva` | Nueve campos, autocompletado por placa |
| 6 | `/ordenes/:id/editar` | Los nueve campos llegan cargados |
| 7 | `/ordenes/:id` | Cabecera, pestañas, Kanban, panel lateral |
| 8 | `/vehiculos/:id` | Cabecera e historial |
| 9 | `/usuarios` | Tabla y confirmar |
| 10 | `/perfil/password` | Tres campos y validación cruzada |
| 11 | `/ui` | Las trece primitivas |

**Qué buscar exactamente:** el riesgo no es una clase que quedó —eso lo caza el paso 1— sino un estilo base de Bootstrap que sostenía algo sin que nadie lo escribiera: el margen de un `<p>`, el `border-collapse` de una `<table>`, el tamaño de un `<h5>`. Mirar tipografías que cambiaron de tamaño, espacios que se colapsaron y tablas cuyas líneas se duplicaron.

Además, en el recorrido:

- **Teclado:** `Tab` alcanza todo con foco visible; `Esc` cierra panel, modal y cajón móvil.
- **Móvil:** 375 px en las once; ninguna desborda en horizontal.
- **Consola:** sin errores.

- [ ] **Paso 9: actualizar la documentación**

En `docs/contexto-core.md`:

**1.** En §2, la fila del frontend dice hoy:

> | Frontend | Angular 20 — standalone components, signals, rutas lazy, Bootstrap 5 |

Pasa a:

> | Frontend | Angular 20 — standalone components, signals, rutas lazy, sistema de diseño propio |

**2.** En §6, el árbol: `shared/ui/` suma `área` y `panel`, y **desaparece la línea de `components/`**:

```
├── shared/
│   ├── ui/            el sistema de diseño: botón, campo, área, select,
│   │                  pastilla, prioridad, tarjeta, toast, esqueleto,
│   │                  estado vacío, modal, panel, confirmar
│   ├── shell/         barra lateral, topbar y cajón móvil
```

**3.** En §6, reemplazar el párrafo que empieza «Las pantallas núcleo no usan Bootstrap…» por:

> **TallerPro no usa Bootstrap.** Se retiró al cerrar la entrega C del rediseño,
> junto con `spinner` y `badge-estado`, que eran lo último que lo necesitaba. No
> queda ningún diálogo del navegador: `confirm()` y `prompt()` se reemplazaron por
> el modal propio.
>
> Los formularios usan **reactive forms**, y las primitivas de entrada
> —`app-campo`, `app-select`, `app-area`— son `ControlValueAccessor`, así que
> aceptan `formControlName`. También andan sueltas con `valor` / `valorCambia`,
> que es como las usa el editor de repuestos de la cotización. Los mensajes de
> validación salen de `shared/ui/errores.ts`, en un solo sitio.

**4.** En §7, agregar a la lista de cosas que sorprenden:

> - **Un `ControlValueAccessor` que necesita leer su propio control no provee
>   `NG_VALUE_ACCESSOR`.** Inyecta `NgControl` con `self` y se asigna
>   `valueAccessor` a mano en el constructor. Hacer las dos cosas es una
>   dependencia circular, y proveer solo el token deja al componente sin forma de
>   saber si está tocado ni qué error tiene.
> - **`app-panel` no lleva `transform` estático.** Un elemento con transform es
>   bloque contenedor de sus descendientes `position: fixed`, y el modal de
>   confirmación que se abre desde adentro quedaría recortado dentro del panel.

- [ ] **Paso 10: commit**

```bash
cd /Users/brunoaguirre/Developer/DMC/TallerPro
git add frontend/angular.json frontend/package.json frontend/package-lock.json docs/contexto-core.md
git add -A frontend/src/app/shared/components/
git commit -m "feat: se retira Bootstrap

Cierra la transición que abrió la entrega A. Se van el CSS, el bundle de
JavaScript que no usaba nadie -ni un data-bs- en todo el proyecto- y el
paquete de package.json.

Con las quince pantallas sobre el sistema propio, spinner y badge-estado
se quedaron sin consumidores y se borran.

Es la primera vez en el rediseño que el dist baja de peso."
```

---

## Al terminar

TallerPro queda enteramente sobre su propio sistema de diseño: trece primitivas,
tokens con dos temas, y ninguna dependencia de framework de CSS. La aplicación
deja de estar a dos velocidades por primera vez desde que empezó el rediseño.

Lo que sigue, según el roadmap, es la **fase 3 — facturación y cobro**, que ahora
se construye sobre el sistema nuevo desde el primer día en vez de nacer
desalineada.

Para integrar la rama, usar `superpowers:finishing-a-development-branch`.
