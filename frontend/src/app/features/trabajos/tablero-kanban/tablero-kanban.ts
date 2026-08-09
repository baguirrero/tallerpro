import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { TrabajoService } from '../../../core/services/trabajo';
import { TokenService } from '../../../core/services/token';
import { Trabajo } from '../../../core/models/trabajo.model';
import {
  ACCION_TRANSICION,
  ESTADOS_TRABAJO,
  ETIQUETA_ESTADO_TRABAJO,
  ROLES,
  TRANSICIONES_TRABAJO,
} from '../../../core/models/estados';
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

  /** Los destinos que el grafo permite, si además esta persona puede mover el
   *  trabajo. Cuando no puede, la lista queda vacía y no se dibuja ningún botón. */
  destinos(trabajo: Trabajo): string[] {
    if (!this.puedeMover(trabajo)) return [];
    return TRANSICIONES_TRABAJO[trabajo.estado] ?? [];
  }

  /** Si a una arista le falta la etiqueta, se muestra el nombre del estado
   *  destino: un botón sin texto sería peor que uno con el texto crudo. */
  accion(trabajo: Trabajo, destino: string): string {
    return (
      ACCION_TRANSICION[`${trabajo.estado}->${destino}`] ?? this.etiquetas[destino] ?? destino
    );
  }

  mover(trabajo: Trabajo, destino: string): void {
    this.mensajeError.set(null);

    let motivo: string | undefined;
    if (destino === 'ESPERANDO_REPUESTO') {
      const respuesta = prompt('¿Qué repuesto se está esperando?')?.trim();
      if (!respuesta) return;
      motivo = respuesta;
    }

    this.trabajoService.cambiarEstado(trabajo.id, destino, motivo).subscribe({
      next: (actualizado) => {
        this.trabajos.update((lista) =>
          lista.map((item) =>
            item.id === trabajo.id
              ? {
                  ...item,
                  estado: actualizado.estado,
                  // También el motivo: si solo se copiara el estado, la tarjeta
                  // retomada seguiría mostrando la pieza vieja hasta recargar.
                  motivo_espera: actualizado.motivo_espera,
                }
              : item,
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
