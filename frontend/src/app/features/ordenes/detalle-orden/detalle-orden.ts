import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';

import { OrdenService } from '../../../core/services/orden';
import { TokenService } from '../../../core/services/token';
import { Orden } from '../../../core/models/orden.model';
import { Trabajo } from '../../../core/models/trabajo.model';
import { ROLES } from '../../../core/models/estados';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { TableroKanban } from '../../trabajos/tablero-kanban/tablero-kanban';
import { FormularioTrabajo } from '../../trabajos/formulario-trabajo/formulario-trabajo';
import { DetalleTrabajo } from '../../trabajos/detalle-trabajo/detalle-trabajo';
import { PanelCotizacion } from '../panel-cotizacion/panel-cotizacion';
import { PanelAprobacion } from '../panel-aprobacion/panel-aprobacion';

@Component({
  selector: 'app-detalle-orden',
  imports: [
    RouterLink, CurrencyPipe, DatePipe, Spinner, BadgeEstado,
    TableroKanban, FormularioTrabajo, DetalleTrabajo, PanelCotizacion, PanelAprobacion,
  ],
  templateUrl: './detalle-orden.html',
  styles: ``,
})
export class DetalleOrden implements OnInit {
  private readonly ordenService = inject(OrdenService);
  private readonly route = inject(ActivatedRoute);
  private readonly tokenService = inject(TokenService);

  private readonly tablero = viewChild(TableroKanban);

  readonly cargando = signal<boolean>(true);
  readonly mensajeError = signal<string | null>(null);
  readonly orden = signal<Orden | null>(null);
  readonly trabajoSeleccionado = signal<Trabajo | null>(null);
  readonly procesando = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarOrden(id);
    }
  }

  private cargarOrden(id: string): void {
    this.ordenService.obtenerPorId(id).subscribe({
      next: (datos) => {
        this.orden.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudo cargar la orden solicitada');
        this.cargando.set(false);
      },
    });
  }

  puedeAprobar(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR);
  }

  puedeCrearTrabajos(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER);
  }

  puedeEditar(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR);
  }

  puedeEntregar(): boolean {
    return (
      this.orden()?.estado === 'FINALIZADA' &&
      this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR)
    );
  }

  puedeCancelar(): boolean {
    const estado = this.orden()?.estado;
    return (
      estado !== undefined &&
      !['ENTREGADA', 'CANCELADA'].includes(estado) &&
      this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER)
    );
  }

  entregar(): void {
    this.ejecutarAccion(this.ordenService.entregar(this.orden()!.id));
  }

  cancelar(): void {
    if (!confirm('¿Seguro que desea cancelar esta orden? No se podrá revertir.')) return;
    this.ejecutarAccion(this.ordenService.cancelar(this.orden()!.id));
  }

  private ejecutarAccion(peticion: Observable<Orden>): void {
    this.procesando.set(true);
    this.mensajeError.set(null);

    peticion.subscribe({
      next: (actualizada) => {
        this.orden.set(actualizada);
        this.procesando.set(false);
      },
      error: (error) => {
        this.procesando.set(false);
        this.mensajeError.set(error.error?.message ?? 'No se pudo completar la acción');
      },
    });
  }

  /** El Kanban avisa cuando mueve una tarjeta: el estado de la orden
   *  lo decide el backend a partir de sus trabajos, así que se relee. */
  refrescarOrden(): void {
    const id = this.orden()?.id;
    if (id) this.cargarOrden(id);
    this.tablero()?.cargarTrabajos();
  }

  alCrearTrabajo(): void {
    this.tablero()?.cargarTrabajos();
    this.refrescarOrden();
  }

  alSeleccionarTrabajo(trabajo: Trabajo): void {
    this.trabajoSeleccionado.set(trabajo);
  }

  cerrarDetalleTrabajo(): void {
    this.trabajoSeleccionado.set(null);
  }
}
