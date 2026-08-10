import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
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
import { Prioridad } from '../../../shared/ui/prioridad';
import { Boton } from '../../../shared/ui/boton';
import { Campo } from '../../../shared/ui/campo';
import { Modal } from '../../../shared/ui/modal';
import { Esqueleto } from '../../../shared/ui/esqueleto';
import { ToastService } from '../../../shared/ui/toast';

/**
 * `motivo_espera` está sostenido por un CHECK en la base desde la fase 2b, así
 * que una cadena en blanco no es un motivo: es un 400 evitable.
 */
export function motivoLimpio(texto: string): string | null {
  const limpio = texto.trim();
  return limpio.length > 0 ? limpio : null;
}

@Component({
  selector: 'app-tablero-kanban',
  imports: [DatePipe, Prioridad, Boton, Campo, Modal, Esqueleto],
  templateUrl: './tablero-kanban.html',
  styleUrl: './tablero-kanban.css',
})
export class TableroKanban implements OnInit {
  private readonly trabajoService = inject(TrabajoService);
  private readonly tokenService = inject(TokenService);
  private readonly toast = inject(ToastService);

  readonly ordenId = input.required<string>();

  readonly trabajoSeleccionado = output<Trabajo>();

  /** El estado de la orden se deriva de sus trabajos, así que el padre
   *  necesita recargarla cada vez que una tarjeta se mueve. */
  readonly estadoCambiado = output<void>();

  readonly cargando = signal<boolean>(true);
  readonly mensajeError = signal<string | null>(null);
  readonly trabajos = signal<Trabajo[]>([]);

  /** El movimiento que espera el motivo. Mientras hay uno, el modal está abierto. */
  readonly esperandoMotivo = signal<Trabajo | null>(null);
  readonly motivo = signal<string>('');
  readonly motivoValido = computed(() => motivoLimpio(this.motivo()) !== null);

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
    return ACCION_TRANSICION[`${trabajo.estado}->${destino}`] ?? this.etiquetas[destino] ?? destino;
  }

  mover(trabajo: Trabajo, destino: string): void {
    if (destino === 'ESPERANDO_REPUESTO') {
      this.motivo.set('');
      this.esperandoMotivo.set(trabajo);
      return;
    }

    this.aplicar(trabajo, destino);
  }

  confirmarMotivo(): void {
    const trabajo = this.esperandoMotivo();
    const motivo = motivoLimpio(this.motivo());
    if (!trabajo || !motivo) return;

    this.cerrarMotivo();
    this.aplicar(trabajo, 'ESPERANDO_REPUESTO', motivo);
  }

  cerrarMotivo(): void {
    this.esperandoMotivo.set(null);
    this.motivo.set('');
  }

  private aplicar(trabajo: Trabajo, destino: string, motivo?: string): void {
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
        this.toast.error(error.error?.message ?? 'No se pudo cambiar el estado del trabajo');
      },
    });
  }

  seleccionar(trabajo: Trabajo): void {
    this.trabajoSeleccionado.emit(trabajo);
  }
}
