import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-boton',
  template: `
    <button
      class="b"
      [class]="variante() + ' ' + tamano()"
      [class.bloque]="bloque()"
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
    .b:active:not(:disabled) {
      transform: scale(0.97);
    }
    .b:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .b.bloque {
      display: flex;
      width: 100%;
    }

    .md {
      font-size: var(--t-base);
      padding: var(--e2) var(--e4);
      min-height: 36px;
    }
    .sm {
      font-size: var(--t-menor);
      padding: var(--e1) var(--e3);
      min-height: 28px;
    }

    .primario {
      background: var(--acento);
      color: var(--acento-texto);
    }
    .primario:hover:not(:disabled) {
      background: var(--acento-hover);
    }

    .secundario {
      background: var(--superficie);
      color: var(--texto-primario);
      border-color: var(--borde-fuerte);
    }
    .secundario:hover:not(:disabled) {
      background: var(--superficie-hundida);
    }

    .fantasma {
      background: transparent;
      color: var(--texto-suave);
    }
    .fantasma:hover:not(:disabled) {
      background: var(--superficie-hundida);
      color: var(--texto-primario);
    }

    .peligro {
      background: var(--peligro-fondo);
      color: var(--peligro-texto);
    }
    .peligro:hover:not(:disabled) {
      filter: brightness(0.92);
    }

    .giro {
      width: 13px;
      height: 13px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: var(--r-full);
      animation: girar 700ms linear infinite;
    }
    @keyframes girar {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class Boton {
  readonly variante = input<'primario' | 'secundario' | 'fantasma' | 'peligro'>('primario');
  readonly tamano = input<'sm' | 'md'>('md');
  readonly cargando = input<boolean>(false);
  readonly deshabilitado = input<boolean>(false);

  /**
   * Ocupa todo el ancho disponible. Lo pide la acción principal de una tarjeta
   * de formulario —entrar, crear la cuenta—, donde un botón del ancho de su
   * texto queda suelto en la caja.
   *
   * Es un input y no una clase del que lo usa porque el `<button>` vive dentro
   * de esta plantilla: la encapsulación de Angular no deja alcanzarlo desde
   * afuera, y llegar con `::ng-deep` sería peor que una línea de API.
   */
  readonly bloque = input<boolean>(false);

  readonly pulsar = output<void>();
}
