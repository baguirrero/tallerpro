import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { TrabajoService } from '../../../core/services/trabajo';
import { TokenService } from '../../../core/services/token';
import { Trabajo } from '../../../core/models/trabajo.model';
import { ESTADOS_TRABAJO, ETIQUETA_ESTADO_TRABAJO, ROLES } from '../../../core/models/estados';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';

@Component({
  selector: 'app-tablero-kanban',
  imports: [DatePipe, Spinner, BadgeEstado],
  templateUrl: './tablero-kanban.html',
  styles: ``,
})
export class TableroKanban implements OnInit {
  private readonly trabajoService = inject(TrabajoService);
  private readonly tokenService = inject(TokenService);

  readonly ordenId = input.required<string>();

  readonly trabajoSeleccionado = output<Trabajo>();

  /** El estado de la orden se deriva de sus trabajos, así que el padre
   *  necesita recargarla cada vez que una tarjeta se mueve. */
  readonly estadoCambiado = output<void>();

  readonly cargando = signal<boolean>(true);
  readonly mensajeError = signal<string | null>(null);
  readonly trabajos = signal<Trabajo[]>([]);

  readonly columnas = ESTADOS_TRABAJO;
  readonly etiquetas = ETIQUETA_ESTADO_TRABAJO;

  ngOnInit(): void {
    this.cargarTrabajos();
  }

  cargarTrabajos(): void {
    this.cargando.set(true);

    this.trabajoService.obtenerPorOrden(this.ordenId()).subscribe({
      next: (datos) => {
        this.trabajos.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudieron cargar los trabajos');
        this.cargando.set(false);
      },
    });
  }

  trabajosDeColumna(estado: string): Trabajo[] {
    return this.trabajos().filter((trabajo) => trabajo.estado === estado);
  }

  /** Sin la aprobación del cliente no se mueve nada, ni siquiera el jefe. */
  estaAprobado(trabajo: Trabajo): boolean {
    return trabajo.aprobado === true;
  }

  puedeMover(trabajo: Trabajo): boolean {
    if (!this.estaAprobado(trabajo)) return false;
    if (this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER)) {
      return true;
    }
    return trabajo.asignado_a?.id === this.tokenService.usuario()?.id;
  }

  hayColumnaAnterior(trabajo: Trabajo): boolean {
    return this.columnas.indexOf(trabajo.estado as any) > 0;
  }

  hayColumnaSiguiente(trabajo: Trabajo): boolean {
    const posicion = this.columnas.indexOf(trabajo.estado as any);
    return posicion >= 0 && posicion < this.columnas.length - 1;
  }

  mover(trabajo: Trabajo, direccion: -1 | 1): void {
    const posicionActual = this.columnas.indexOf(trabajo.estado as any);
    const nuevaPosicion = posicionActual + direccion;

    if (nuevaPosicion < 0 || nuevaPosicion >= this.columnas.length) {
      return;
    }

    const nuevoEstado = this.columnas[nuevaPosicion];
    this.mensajeError.set(null);

    this.trabajoService.cambiarEstado(trabajo.id, nuevoEstado).subscribe({
      next: (actualizado) => {
        this.trabajos.update((lista) =>
          lista.map((item) =>
            item.id === trabajo.id ? { ...item, estado: actualizado.estado } : item,
          ),
        );
        this.estadoCambiado.emit();
      },
      error: (error) => {
        this.mensajeError.set(error.error?.message ?? 'No se pudo cambiar el estado del trabajo');
      },
    });
  }

  seleccionar(trabajo: Trabajo): void {
    this.trabajoSeleccionado.emit(trabajo);
  }
}
