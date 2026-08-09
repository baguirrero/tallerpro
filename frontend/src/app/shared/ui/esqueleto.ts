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
