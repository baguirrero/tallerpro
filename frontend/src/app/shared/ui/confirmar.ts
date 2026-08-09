import { Component, input, output } from '@angular/core';
import { Boton } from './boton';
import { Modal } from './modal';

@Component({
  selector: 'app-confirmar',
  imports: [Boton, Modal],
  template: `
    <app-modal [abierto]="abierto()" [titulo]="titulo()" (cerrar)="cancelar.emit()">
      <p style="margin: 0">{{ mensaje() }}</p>

      <div pie>
        <app-boton variante="fantasma" (pulsar)="cancelar.emit()">
          {{ textoCancelar() }}
        </app-boton>
        <app-boton [variante]="peligro() ? 'peligro' : 'primario'" (pulsar)="confirmar.emit()">
          {{ textoConfirmar() }}
        </app-boton>
      </div>
    </app-modal>
  `,
})
export class Confirmar {
  readonly abierto = input<boolean>(false);
  readonly titulo = input<string>('¿Confirmar?');
  readonly mensaje = input<string>('');
  readonly peligro = input<boolean>(false);
  readonly textoConfirmar = input<string>('Confirmar');
  readonly textoCancelar = input<string>('Cancelar');

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();
}
