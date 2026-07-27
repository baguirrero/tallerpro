import { Component, input } from '@angular/core';
import {
  COLOR_ESTADO,
  ETIQUETA_ESTADO_ORDEN,
  ETIQUETA_ESTADO_TRABAJO,
} from '../../../core/models/estados';

@Component({
  selector: 'app-badge-estado',
  imports: [],
  templateUrl: './badge-estado.html',
  styles: ``,
})
export class BadgeEstado {
  readonly estado = input.required<string>();

  obtenerColor(): string {
    return COLOR_ESTADO[this.estado()] ?? 'secondary';
  }

  obtenerTexto(): string {
    return (
      ETIQUETA_ESTADO_ORDEN[this.estado()] ??
      ETIQUETA_ESTADO_TRABAJO[this.estado()] ??
      this.estado()
    );
  }
}
