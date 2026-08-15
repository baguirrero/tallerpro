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
