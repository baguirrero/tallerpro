import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';

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
        (keydown.tab)="atrapar($any($event))"
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
      transform: translate(-50%, -50%);
      animation: entra var(--dur-media) var(--ease-salida);
    }
    /* la traslación del centrado va también en la animación para no pelearse con ella */
    @keyframes entra {
      from { opacity: 0; transform: translate(-50%, -50%) scale(0.98); }
      to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }

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
   * lleva a la página de detrás, que está tapada por el velo: quien navega con
   * teclado se queda moviéndose por algo que no puede ver.
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
