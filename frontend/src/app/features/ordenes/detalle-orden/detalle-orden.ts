import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';

import { OrdenService } from '../../../core/services/orden';
import { TokenService } from '../../../core/services/token';
import { Orden } from '../../../core/models/orden.model';
import { Trabajo } from '../../../core/models/trabajo.model';
import { ROLES } from '../../../core/models/estados';
import { Pastilla } from '../../../shared/ui/pastilla';
import { Boton } from '../../../shared/ui/boton';
import { Confirmar } from '../../../shared/ui/confirmar';
import { Panel } from '../../../shared/ui/panel';
import { Esqueleto } from '../../../shared/ui/esqueleto';
import { ToastService } from '../../../shared/ui/toast';
import { TableroKanban } from '../../trabajos/tablero-kanban/tablero-kanban';
import { FormularioTrabajo } from '../../trabajos/formulario-trabajo/formulario-trabajo';
import { DetalleTrabajo } from '../../trabajos/detalle-trabajo/detalle-trabajo';
import { PanelCotizacion } from '../panel-cotizacion/panel-cotizacion';
import { PanelAprobacion } from '../panel-aprobacion/panel-aprobacion';

type Pestana = 'trabajos' | 'cotizacion';

@Component({
  selector: 'app-detalle-orden',
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    Pastilla,
    Boton,
    Confirmar,
    Panel,
    Esqueleto,
    TableroKanban,
    FormularioTrabajo,
    DetalleTrabajo,
    PanelCotizacion,
    PanelAprobacion,
  ],
  templateUrl: './detalle-orden.html',
  styleUrl: './detalle-orden.css',
})
export class DetalleOrden implements OnInit {
  private readonly ordenService = inject(OrdenService);
  private readonly route = inject(ActivatedRoute);
  private readonly tokenService = inject(TokenService);
  private readonly toast = inject(ToastService);

  private readonly tablero = viewChild(TableroKanban);
  private readonly cotizacion = viewChild(PanelCotizacion);

  readonly cargando = signal<boolean>(true);
  readonly mensajeError = signal<string | null>(null);
  readonly orden = signal<Orden | null>(null);
  readonly trabajoSeleccionado = signal<Trabajo | null>(null);
  readonly procesando = signal<boolean>(false);

  readonly pestana = signal<Pestana>('trabajos');
  readonly formularioAbierto = signal<boolean>(false);
  readonly confirmandoCancelacion = signal<boolean>(false);

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

  /** Sin aprobación no se mueve ninguna tarjeta, así que la franja de aviso es
   *  lo único que no puede quedar escondido detrás de una pestaña. */
  hayQueAprobar(): boolean {
    return this.orden()?.estado === 'COTIZADA' && this.puedeAprobar();
  }

  irACotizacion(): void {
    this.pestana.set('cotizacion');
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
    this.ejecutarAccion(this.ordenService.entregar(this.orden()!.id), 'La orden se entregó');
  }

  confirmarCancelacion(): void {
    this.confirmandoCancelacion.set(false);
    this.ejecutarAccion(this.ordenService.cancelar(this.orden()!.id), 'La orden se canceló');
  }

  /**
   * La respuesta de entregar y cancelar es la entidad cruda: trae el estado
   * nuevo pero **no** `totales`, que solo calcula el endpoint de detalle. Poner
   * esa respuesta en el signal dejaba la cabecera a medio pintar con un
   * TypeError. Por eso se relee la orden en vez de creerle a la mutación.
   */
  private ejecutarAccion(peticion: Observable<Orden>, exito: string): void {
    this.procesando.set(true);

    peticion.subscribe({
      next: (actualizada) => {
        this.procesando.set(false);
        this.toast.exito(exito);
        this.cargarOrden(actualizada.id);
      },
      error: (error) => {
        this.procesando.set(false);
        this.toast.error(error.error?.message ?? 'No se pudo completar la acción');
      },
    });
  }

  /**
   * El Kanban avisa cuando mueve una tarjeta: el estado de la orden lo decide
   * el backend a partir de sus trabajos, así que se relee.
   *
   * Los dos paneles cargan su propia lista de trabajos, y hay que avisarles.
   * Sin esto, registrar la aprobación actualizaba los totales —que vienen de la
   * orden— pero dejaba cada línea diciendo «Esperando respuesta».
   * El `?.` cubre que solo uno de los dos esté dibujado según la pestaña.
   */
  refrescarOrden(): void {
    const id = this.orden()?.id;
    if (id) this.cargarOrden(id);
    this.tablero()?.cargarTrabajos();
    this.cotizacion()?.cargar();
  }

  alCrearTrabajo(): void {
    this.formularioAbierto.set(false);
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
