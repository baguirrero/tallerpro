import { Component, input } from '@angular/core';

@Component({
  selector: 'app-tarjeta',
  template: `
    <section class="t">
      @if (titulo()) {
        <header class="cab">
          <h3 class="tit">{{ titulo() }}</h3>
          <ng-content select="[acciones]"></ng-content>
        </header>
      }
      <div class="cuerpo"><ng-content></ng-content></div>
    </section>
  `,
  styles: `
    .t {
      background: var(--superficie);
      border: 1px solid var(--borde);
      border-radius: var(--r-md);
      box-shadow: var(--sombra-1);
      overflow: hidden;
    }
    .cab {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--e3);
      padding: var(--e3) var(--e4);
      border-bottom: 1px solid var(--borde);
    }
    .tit { font-size: var(--t-titulo); font-weight: 600; }
    .cuerpo { padding: var(--e4); }
  `,
})
export class Tarjeta {
  readonly titulo = input<string>('');
}
