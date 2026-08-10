import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { OrdenService } from '../../core/services/orden';
import { TrabajoService } from '../../core/services/trabajo';
import { TokenService } from '../../core/services/token';
import { Estadisticas } from '../../core/models/orden.model';
import { Trabajo } from '../../core/models/trabajo.model';
import { ETIQUETA_ESTADO_ORDEN } from '../../core/models/estados';
import { Pastilla } from '../../shared/ui/pastilla';
import { Prioridad } from '../../shared/ui/prioridad';
import { Esqueleto } from '../../shared/ui/esqueleto';
import { EstadoVacio } from '../../shared/ui/estado-vacio';

/**
 * El backend agrupa por estado, así que los estados sin órdenes no vienen en la
 * respuesta: lo que falta cuenta cero, no `undefined`.
 */
export function contarEstado(estadisticas: Estadisticas | null, estado: string): number {
  return estadisticas?.porEstado.find((fila) => fila.estado === estado)?.cantidad ?? 0;
}

/** Los tres estados que piden acción, con el nombre que usa quien atiende. */
const ATENCION = [
  { estado: 'ESPERANDO_REPUESTO', titulo: 'Esperando repuesto' },
  { estado: 'COTIZADA', titulo: 'Esperando al cliente' },
  { estado: 'FINALIZADA', titulo: 'Listas para entregar' },
];

const RESTO = ['RECIBIDA', 'EN_PROCESO', 'ENTREGADA', 'CANCELADA'];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, Pastilla, Prioridad, Esqueleto, EstadoVacio],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly ordenService = inject(OrdenService);
  private readonly trabajoService = inject(TrabajoService);
  readonly tokenService = inject(TokenService);

  readonly cargando = signal<boolean>(true);
  readonly mensajeError = signal<string | null>(null);
  readonly estadisticas = signal<Estadisticas | null>(null);
  readonly misTrabajos = signal<Trabajo[]>([]);

  readonly atencion = computed(() =>
    ATENCION.map((fila) => ({
      ...fila,
      cantidad: contarEstado(this.estadisticas(), fila.estado),
    })),
  );

  readonly resto = computed(() =>
    RESTO.map((estado) => ({
      estado,
      titulo: ETIQUETA_ESTADO_ORDEN[estado] ?? estado,
      cantidad: contarEstado(this.estadisticas(), estado),
    })),
  );

  readonly total = computed(() => this.estadisticas()?.total ?? 0);

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

  /** Si los trabajos fallan, la tabla queda vacía sin tumbar el resto. */
  private cargarMisTrabajos(): void {
    this.trabajoService.obtenerMisTrabajos().subscribe({
      next: (datos) => this.misTrabajos.set(datos),
      error: () => this.misTrabajos.set([]),
    });
  }
}
