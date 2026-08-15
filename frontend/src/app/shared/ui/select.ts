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

      <!--
        La selección se marca opción por opción, no con un [value] en el select.
        El select recibe su binding antes de que el @for haya creado las
        opciones, así que el navegador descarta el valor y cae en la primera:
        el control decía MEDIA y la pantalla mostraba Baja.
      -->
      <select
        class="in"
        [class.mal]="!!textoError()"
        [disabled]="estaDeshabilitado()"
        (change)="alElegir($any($event.target).value)"
        (blur)="alSalir()"
      >
        @if (marcador()) {
          <option value="" [selected]="valorMostrado() === ''">{{ marcador() }}</option>
        }
        @for (opcion of opciones(); track opcion.valor) {
          <option [value]="opcion.valor" [selected]="valorMostrado() === opcion.valor">
            {{ opcion.texto }}
          </option>
        }
      </select>

      @if (textoError()) {
        <span class="msg mal-texto">{{ textoError() }}</span>
      }
    </label>
  `,
  styles: `
    .c {
      display: flex;
      flex-direction: column;
      gap: var(--e1);
    }
    .et {
      font-size: var(--t-menor);
      font-weight: 600;
      color: var(--texto-primario);
    }

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
    .in:hover:not(:disabled) {
      border-color: var(--texto-suave);
    }
    .in:focus {
      outline: 2px solid var(--acento);
      outline-offset: 1px;
      border-color: var(--acento);
    }
    .in:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .in.mal {
      border-color: var(--error-texto);
    }

    .msg {
      font-size: var(--t-menor);
      color: var(--error-texto);
    }
    .mal-texto {
      color: var(--error-texto);
    }
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
