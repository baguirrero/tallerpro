import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { OrdenService } from '../../core/services/orden';
import { TrabajoService } from '../../core/services/trabajo';
import { TokenService } from '../../core/services/token';
import { Estadisticas } from '../../core/models/orden.model';
import { Trabajo } from '../../core/models/trabajo.model';
import { ETIQUETA_ESTADO_ORDEN } from '../../core/models/estados';
import { Spinner } from '../../shared/components/spinner/spinner';
import { BadgeEstado } from '../../shared/components/badge-estado/badge-estado';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, Spinner, BadgeEstado],
  templateUrl: './dashboard.html',
  styles: ``,
})
export class Dashboard implements OnInit {
  private readonly ordenService = inject(OrdenService);
  private readonly trabajoService = inject(TrabajoService);
  readonly tokenService = inject(TokenService);

  readonly cargando = signal<boolean>(true);
  readonly mensajeError = signal<string | null>(null);
  readonly estadisticas = signal<Estadisticas | null>(null);
  readonly misTrabajos = signal<Trabajo[]>([]);

  ngOnInit(): void {
    this.cargarEstadisticas();
    this.cargarMisTrabajos();
  }

  private cargarEstadisticas(): void {
    this.ordenService.obtenerEstadisticas().subscribe({
      next: (datos) => {
        this.estadisticas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudieron cargar las estadísticas');
        this.cargando.set(false);
      },
    });
  }

  private cargarMisTrabajos(): void {
    this.trabajoService.obtenerMisTrabajos().subscribe({
      next: (datos) => this.misTrabajos.set(datos),
      error: () => this.misTrabajos.set([]),
    });
  }

  obtenerEtiqueta(estado: string): string {
    return ETIQUETA_ESTADO_ORDEN[estado] ?? estado;
  }
}
