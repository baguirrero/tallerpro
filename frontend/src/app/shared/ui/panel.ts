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
    @keyframes velo {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    /*
     * Sin transform estático a propósito: un elemento con transform es bloque
     * contenedor de sus descendientes position fixed, y un modal abierto desde
     * adentro del panel quedaría recortado dentro de él. La animación usa
     * keyframes sin fill-mode, así que al terminar no queda transform.
     *
     * Sin acentos graves en este comentario: vive dentro del template literal
     * de styles y lo cerrarían.
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
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }

    /* Mismo umbral que el cajón del shell: en pantalla angosta un panel de 420
       al lado de nada es peor que uno a ancho completo. */
    @media (max-width: 768px) {
      .p {
        width: 100vw;
        border-left: none;
      }
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
    .tit {
      font-size: var(--t-titulo);
      font-weight: 600;
      overflow-wrap: anywhere;
    }
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
    .x:hover {
      background: var(--superficie-hundida);
      color: var(--texto-primario);
    }

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
