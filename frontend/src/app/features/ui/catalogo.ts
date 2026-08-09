import { Component, signal } from '@angular/core';
import { Boton } from '../../shared/ui/boton';
import { Pastilla } from '../../shared/ui/pastilla';
import { Tarjeta } from '../../shared/ui/tarjeta';

@Component({
  selector: 'app-catalogo',
  imports: [Boton, Pastilla, Tarjeta],
  templateUrl: './catalogo.html',
  styles: `
    .grupo { margin-bottom: var(--e8); }
    .muestra { display: flex; flex-wrap: wrap; gap: var(--e3); align-items: center; }
    .punto {
      width: 8px;
      height: 8px;
      border-radius: var(--r-full);
      display: inline-block;
    }
  `,
})
export class Catalogo {
  readonly estados = signal<string[]>([
    'RECIBIDA',
    'COTIZADA',
    'EN_PROCESO',
    'ESPERANDO_REPUESTO',
    'FINALIZADA',
    'ENTREGADA',
    'CANCELADA',
  ]);
}
