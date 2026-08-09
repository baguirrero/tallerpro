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
