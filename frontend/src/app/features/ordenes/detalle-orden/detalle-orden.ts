import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

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

@Component({
  selector: 'app-detalle-orden',
  imports: [
    RouterLink, CurrencyPipe, DatePipe, Spinner, BadgeEstado,
    TableroKanban, FormularioTrabajo, DetalleTrabajo,
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

  puedeCrearTrabajos(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER);
  }

  puedeEditar(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR);
  }

  alCrearTrabajo(): void {
    this.tablero()?.cargarTrabajos();
  }

  alSeleccionarTrabajo(trabajo: Trabajo): void {
    this.trabajoSeleccionado.set(trabajo);
  }

  cerrarDetalleTrabajo(): void {
    this.trabajoSeleccionado.set(null);
  }
}
