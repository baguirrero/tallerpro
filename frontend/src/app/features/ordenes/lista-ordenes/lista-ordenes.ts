import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { OrdenService } from '../../../core/services/orden';
import { TokenService } from '../../../core/services/token';
import { Orden } from '../../../core/models/orden.model';
import { ESTADOS_ORDEN, ETIQUETA_ESTADO_ORDEN, ROLES } from '../../../core/models/estados';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';

@Component({
  selector: 'app-lista-ordenes',
  imports: [RouterLink, CurrencyPipe, DatePipe, Spinner, BadgeEstado],
  templateUrl: './lista-ordenes.html',
  styles: ``,
})
export class ListaOrdenes implements OnInit {
  private readonly ordenService = inject(OrdenService);
  private readonly tokenService = inject(TokenService);

  readonly cargando = signal<boolean>(true);
  readonly mensajeError = signal<string | null>(null);
  readonly ordenes = signal<Orden[]>([]);
  readonly filtroEstado = signal<string>('');

  readonly estadosDisponibles = ESTADOS_ORDEN;
  readonly etiquetas = ETIQUETA_ESTADO_ORDEN;

  ngOnInit(): void {
    this.cargarOrdenes();
  }

  cargarOrdenes(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.ordenService.obtenerTodas(this.filtroEstado() || undefined).subscribe({
      next: (datos) => {
        this.ordenes.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudieron cargar las órdenes');
        this.cargando.set(false);
      },
    });
  }

  cambiarFiltro(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.filtroEstado.set(valor);
    this.cargarOrdenes();
  }

  puedeEditar(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR);
  }

  puedeEliminar(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR);
  }

  eliminar(orden: Orden): void {
    const confirmado = confirm(`¿Seguro que desea eliminar la orden ${orden.numero_orden}?`);
    if (!confirmado) return;

    this.ordenService.eliminar(orden.id).subscribe({
      next: () => this.cargarOrdenes(),
      error: (error) => {
        this.mensajeError.set(error.error?.message ?? 'No se pudo eliminar la orden');
      },
    });
  }
}
