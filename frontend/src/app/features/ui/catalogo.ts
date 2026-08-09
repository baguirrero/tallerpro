import { Component, signal } from '@angular/core';
import { Boton } from '../../shared/ui/boton';
import { Campo } from '../../shared/ui/campo';
import { Pastilla } from '../../shared/ui/pastilla';
import { Select } from '../../shared/ui/select';
import { Tarjeta } from '../../shared/ui/tarjeta';

@Component({
  selector: 'app-catalogo',
  imports: [Boton, Campo, Pastilla, Select, Tarjeta],
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

  readonly placa = signal<string>('');
  readonly estadoElegido = signal<string>('');

  readonly opcionesEstado = signal([
    { valor: 'RECIBIDA', texto: 'Recibida' },
    { valor: 'EN_PROCESO', texto: 'En proceso' },
    { valor: 'FINALIZADA', texto: 'Finalizada' },
  ]);
}
