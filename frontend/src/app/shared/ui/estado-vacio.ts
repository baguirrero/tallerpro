import { Component, input } from '@angular/core';

@Component({
  selector: 'app-estado-vacio',
  template: `
    <div class="v">
      <div class="ic" aria-hidden="true">{{ icono() }}</div>
      <p class="ti">{{ titulo() }}</p>
      @if (mensaje()) {
        <p class="me">{{ mensaje() }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: `
    .v {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--e2);
      padding: var(--e12) var(--e4);
      text-align: center;
    }
    .ic { font-size: 30px; opacity: 0.5; }
    .ti { margin: 0; font-size: var(--t-titulo); font-weight: 600; color: var(--texto-primario); }
    .me { margin: 0; font-size: var(--t-tabla); color: var(--texto-suave); max-width: 380px; }
  `,
})
export class EstadoVacio {
  readonly icono = input<string>('📋');
  readonly titulo = input.required<string>();
  readonly mensaje = input<string>('');
}
