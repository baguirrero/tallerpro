import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { OrdenService } from '../../../core/services/orden';
import { TokenService } from '../../../core/services/token';
import { Estadisticas, Orden } from '../../../core/models/orden.model';
import { ESTADOS_ORDEN, ETIQUETA_ESTADO_ORDEN, ROLES } from '../../../core/models/estados';
import { Pastilla } from '../../../shared/ui/pastilla';
import { Boton } from '../../../shared/ui/boton';
import { Campo } from '../../../shared/ui/campo';
import { Confirmar } from '../../../shared/ui/confirmar';
import { Esqueleto } from '../../../shared/ui/esqueleto';
import { EstadoVacio } from '../../../shared/ui/estado-vacio';
import { ToastService } from '../../../shared/ui/toast';

/**
 * El estado viaja en la URL, así que puede ser cualquier cosa: un valor que no
 * es de los siete se ignora. Una tabla vacía sin explicación es peor que
 * mostrar todo.
 */
export function estadoDesdeUrl(valor: string | null): string {
  return valor && (ESTADOS_ORDEN as readonly string[]).includes(valor) ? valor : '';
}

/**
 * Busca sobre lo ya cargado, no contra la API: no hay endpoint de búsqueda. El
 * teléfono queda fuera a propósito —nadie busca un auto por el teléfono— y así
 * el rótulo «3 de 52» sigue siendo cierto para lo que se ve en pantalla.
 */
export function coincide(orden: Orden, texto: string): boolean {
  const aguja = texto.trim().toLowerCase();
  if (!aguja) return true;

  return [
    orden.numero_orden,
    orden.vehiculo.placa,
    orden.vehiculo.marca,
    orden.vehiculo.modelo,
    orden.vehiculo.propietario_nombre,
  ]
    .join(' ')
    .toLowerCase()
    .includes(aguja);
}

@Component({
  selector: 'app-lista-ordenes',
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    Pastilla,
    Boton,
    Campo,
    Confirmar,
    Esqueleto,
    EstadoVacio,
  ],
  templateUrl: './lista-ordenes.html',
  styleUrl: './lista-ordenes.css',
})
export class ListaOrdenes implements OnInit {
  private readonly ordenService = inject(OrdenService);
  private readonly tokenService = inject(TokenService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly cargando = signal<boolean>(true);
  readonly mensajeError = signal<string | null>(null);
  readonly ordenes = signal<Orden[]>([]);
  readonly filtroEstado = signal<string>('');
  readonly busqueda = signal<string>('');
  readonly estadisticas = signal<Estadisticas | null>(null);
  readonly ordenAEliminar = signal<Orden | null>(null);

  readonly etiquetas = ETIQUETA_ESTADO_ORDEN;

  /** «Todas» primero, después los siete estados con su conteo. */
  readonly pestanas = computed(() => {
    const datos = this.estadisticas();
    const cuenta = (estado: string) =>
      datos ? (datos.porEstado.find((fila) => fila.estado === estado)?.cantidad ?? 0) : null;

    return [
      { valor: '', texto: 'Todas', cantidad: datos?.total ?? null },
      ...ESTADOS_ORDEN.map((estado) => ({
        valor: estado as string,
        texto: ETIQUETA_ESTADO_ORDEN[estado],
        cantidad: cuenta(estado),
      })),
    ];
  });

  readonly visibles = computed(() =>
    this.ordenes().filter((orden) => coincide(orden, this.busqueda())),
  );

  readonly buscando = computed(() => this.busqueda().trim().length > 0);

  ngOnInit(): void {
    // Una sola vía: la URL manda, y navegar dispara la recarga.
    this.route.queryParamMap.subscribe((params) => {
      this.filtroEstado.set(estadoDesdeUrl(params.get('estado')));
      this.cargarOrdenes();
    });

    this.cargarEstadisticas();
  }

  private cargarOrdenes(): void {
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

  /** Si fallan, las pestañas se dibujan sin número: pierden dato, no función. */
  private cargarEstadisticas(): void {
    this.ordenService.obtenerEstadisticas().subscribe({
      next: (datos) => this.estadisticas.set(datos),
      error: () => this.estadisticas.set(null),
    });
  }

  cambiarEstado(estado: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: estado ? { estado } : {},
      // Tocar pestañas no debe llenar el historial de vueltas atrás.
      replaceUrl: true,
    });
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.cambiarEstado('');
  }

  puedeEditar(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR);
  }

  puedeEliminar(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR);
  }

  abrirDetalle(orden: Orden): void {
    this.router.navigate(['/ordenes', orden.id]);
  }

  confirmarEliminacion(): void {
    const orden = this.ordenAEliminar();
    if (!orden) return;

    this.ordenService.eliminar(orden.id).subscribe({
      next: () => {
        this.ordenAEliminar.set(null);
        this.toast.exito(`Se eliminó la orden ${orden.numero_orden}`);
        this.cargarOrdenes();
        this.cargarEstadisticas();
      },
      error: (error) => {
        this.ordenAEliminar.set(null);
        this.toast.error(error.error?.message ?? 'No se pudo eliminar la orden');
      },
    });
  }
}
