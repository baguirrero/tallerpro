import { Component, inject, signal } from '@angular/core';
import { Boton } from '../../shared/ui/boton';
import { Campo } from '../../shared/ui/campo';
import { Confirmar } from '../../shared/ui/confirmar';
import { Esqueleto } from '../../shared/ui/esqueleto';
import { EstadoVacio } from '../../shared/ui/estado-vacio';
import { Modal } from '../../shared/ui/modal';
import { Pastilla } from '../../shared/ui/pastilla';
import { Select } from '../../shared/ui/select';
import { Tarjeta } from '../../shared/ui/tarjeta';
import { ToastService } from '../../shared/ui/toast';

@Component({
  selector: 'app-catalogo',
  imports: [Boton, Campo, Confirmar, Esqueleto, EstadoVacio, Modal, Pastilla, Select, Tarjeta],
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
  readonly toast = inject(ToastService);

  readonly estados = signal<string[]>([
    'RECIBIDA',
    'COTIZADA',
    'EN_PROCESO',
    'ESPERANDO_REPUESTO',
    'FINALIZADA',
    'ENTREGADA',
    'CANCELADA',
  ]);

  readonly modalAbierto = signal<boolean>(false);
  readonly confirmarAbierto = signal<boolean>(false);

  readonly placa = signal<string>('');
  readonly estadoElegido = signal<string>('');

  readonly opcionesEstado = signal([
    { valor: 'RECIBIDA', texto: 'Recibida' },
    { valor: 'EN_PROCESO', texto: 'En proceso' },
    { valor: 'FINALIZADA', texto: 'Finalizada' },
  ]);
}
