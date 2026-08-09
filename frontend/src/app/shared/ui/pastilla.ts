import { Component, computed, input } from '@angular/core';
import { ETIQUETA_ESTADO_ORDEN, ETIQUETA_ESTADO_TRABAJO } from '../../core/models/estados';

/** Estado del dominio → sufijo del token. Los de trabajo caen en los mismos. */
const TOKEN: Record<string, string> = {
  RECIBIDA: 'recibida',
  PENDIENTE: 'recibida',
  COTIZADA: 'cotizada',
  EN_PROCESO: 'proceso',
  ESPERANDO_REPUESTO: 'espera',
  FINALIZADA: 'finalizada',
  COMPLETADO: 'finalizada',
  ENTREGADA: 'entregada',
  CANCELADA: 'cancelada',
};

@Component({
  selector: 'app-pastilla',
  template: `<span class="p" [style.background]="fondo()" [style.color]="texto()">{{
    etiqueta()
  }}</span>`,
  styles: `
    .p {
      display: inline-block;
      font-size: var(--t-etiqueta);
      font-weight: 600;
      letter-spacing: 0.02em;
      padding: var(--e1) var(--e2);
      border-radius: var(--r-full);
      white-space: nowrap;
    }
  `,
})
export class Pastilla {
  readonly estado = input.required<string>();

  private readonly sufijo = computed(() => TOKEN[this.estado()] ?? 'recibida');

  readonly fondo = computed(() => `var(--estado-${this.sufijo()}-fondo)`);
  readonly texto = computed(() => `var(--estado-${this.sufijo()}-texto)`);

  readonly etiqueta = computed(
    () =>
      ETIQUETA_ESTADO_ORDEN[this.estado()] ??
      ETIQUETA_ESTADO_TRABAJO[this.estado()] ??
      this.estado(),
  );
}
