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
    .in::placeholder {
      color: var(--texto-suave);
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
      color: var(--texto-suave);
    }
    .mal-texto {
      color: var(--error-texto);
    }
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
