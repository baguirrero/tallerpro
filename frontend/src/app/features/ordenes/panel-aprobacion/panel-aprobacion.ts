import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { OrdenService } from '../../../core/services/orden';
import { TrabajoService } from '../../../core/services/trabajo';
import { Trabajo } from '../../../core/models/trabajo.model';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { Boton } from '../../../shared/ui/boton';
import { ToastService } from '../../../shared/ui/toast';

@Component({
  selector: 'app-panel-aprobacion',
  imports: [CurrencyPipe, Tarjeta, Boton],
  templateUrl: './panel-aprobacion.html',
  styleUrl: './panel-aprobacion.css',
})
export class PanelAprobacion implements OnInit {
  private readonly ordenService = inject(OrdenService);
  private readonly trabajoService = inject(TrabajoService);
  private readonly toast = inject(ToastService);

  readonly ordenId = input.required<string>();

  readonly respuestaRegistrada = output<void>();

  readonly pendientes = signal<Trabajo[]>([]);
  readonly decisiones = signal<Record<string, boolean>>({});
  readonly guardando = signal<boolean>(false);
  readonly mensajeError = signal<string | null>(null);

  ngOnInit(): void {
    this.trabajoService.obtenerPorOrden(this.ordenId()).subscribe({
      next: (todos) => {
        const esperando = todos.filter(
          (trabajo) =>
            trabajo.precio_mano_obra !== null &&
            trabajo.precio_mano_obra !== undefined &&
            (trabajo.aprobado === null || trabajo.aprobado === undefined),
        );
        this.pendientes.set(esperando);
        // Por defecto todo aprobado: es la respuesta más frecuente.
        this.decisiones.set(Object.fromEntries(esperando.map((trabajo) => [trabajo.id, true])));
      },
      error: () => this.mensajeError.set('No se pudieron cargar los trabajos'),
    });
  }

  marcar(trabajoId: string, aprobado: boolean): void {
    this.decisiones.update((actual) => ({ ...actual, [trabajoId]: aprobado }));
  }

  decision(trabajoId: string): boolean | undefined {
    return this.decisiones()[trabajoId];
  }

  registrar(): void {
    this.guardando.set(true);

    const decisiones = Object.entries(this.decisiones()).map(([trabajo_id, aprobado]) => ({
      trabajo_id,
      aprobado,
    }));

    this.ordenService.registrarAprobacion(this.ordenId(), decisiones).subscribe({
      next: () => {
        this.guardando.set(false);
        this.toast.exito('Se registró la respuesta del cliente');
        this.respuestaRegistrada.emit();
      },
      error: (error) => {
        this.guardando.set(false);
        this.toast.error(error.error?.message ?? 'No se pudo registrar la respuesta');
      },
    });
  }
}
