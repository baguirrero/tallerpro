import { Component, computed, input } from '@angular/core';

const ETIQUETA: Record<string, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
};

/**
 * La prioridad no es una pastilla a propósito: en la tarjeta del Kanban y en la
 * tabla del dashboard convive con la pastilla de estado, y dos pastillas juntas
 * dicen que hay dos estados donde hay uno.
 */
@Component({
  selector: 'app-prioridad',
  template: `
    <span class="p">
      <span class="punto" [style.background]="color()" aria-hidden="true"></span>
      {{ etiqueta() }}
    </span>
  `,
  styles: `
    .p {
      display: inline-flex;
      align-items: center;
      gap: var(--e2);
      font-family: var(--fuente);
      font-size: var(--t-menor);
      line-height: 1.4;
      color: var(--texto-suave);
      white-space: nowrap;
    }
    .punto {
      width: 8px;
      height: 8px;
      border-radius: var(--r-full);
      flex: none;
    }
  `,
})
export class Prioridad {
  readonly valor = input.required<string>();

  readonly etiqueta = computed(() => ETIQUETA[this.valor()] ?? this.valor());

  /** Una prioridad que no conocemos se pinta neutra en vez de romper el token. */
  readonly color = computed(() =>
    ETIQUETA[this.valor()]
      ? `var(--prioridad-${this.valor().toLowerCase()})`
      : 'var(--borde-fuerte)',
  );
}
