import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { TrabajoService } from '../../../core/services/trabajo';
import { RepuestoService } from '../../../core/services/repuesto';
import { TokenService } from '../../../core/services/token';
import { Trabajo } from '../../../core/models/trabajo.model';
import { RepuestoRequest, Totales } from '../../../core/models/repuesto.model';
import { ROLES } from '../../../core/models/estados';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { Boton } from '../../../shared/ui/boton';
import { Campo } from '../../../shared/ui/campo';
import { ToastService } from '../../../shared/ui/toast';

export type MarcaAprobacion = 'sin-cotizar' | 'esperando' | 'aprobado' | 'rechazado';

/**
 * La aprobación no es `trabajo.estado`: un trabajo aprobado sigue estando
 * PENDIENTE. Por eso no se dibuja con `app-pastilla`.
 *
 * `null` y `undefined` en el precio son "sin cotizar"; `0` sí es un precio.
 */
export function marcaDe(trabajo: Trabajo): MarcaAprobacion {
  if (trabajo.precio_mano_obra === null || trabajo.precio_mano_obra === undefined) {
    return 'sin-cotizar';
  }
  if (trabajo.aprobado === true) return 'aprobado';
  if (trabajo.aprobado === false) return 'rechazado';
  return 'esperando';
}

export const ROTULO_MARCA: Record<MarcaAprobacion, string> = {
  'sin-cotizar': 'Sin cotizar',
  esperando: 'Esperando respuesta',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

/** Los tres campos del editor, tal como salen del input: texto. */
export interface BorradorRepuesto {
  descripcion: string;
  cantidad: string;
  precio_unitario: string;
}

/**
 * Devuelve la petición lista o `null` si el borrador no sirve. Se valida acá y
 * no con reactive forms porque `app-campo` no es un ControlValueAccessor: con
 * tres campos triviales, los signals son menos código que hacerla uno.
 */
export function repuestoValido(borrador: BorradorRepuesto): RepuestoRequest | null {
  const descripcion = borrador.descripcion.trim();
  if (!descripcion) return null;

  const cantidad = Number(borrador.cantidad);
  if (!Number.isInteger(cantidad) || cantidad < 1) return null;

  if (borrador.precio_unitario.trim() === '') return null;
  const precio_unitario = Number(borrador.precio_unitario);
  if (!Number.isFinite(precio_unitario) || precio_unitario < 0) return null;

  return { descripcion, cantidad, precio_unitario };
}

@Component({
  selector: 'app-panel-cotizacion',
  imports: [CurrencyPipe, Tarjeta, Boton, Campo],
  templateUrl: './panel-cotizacion.html',
  styleUrl: './panel-cotizacion.css',
})
export class PanelCotizacion implements OnInit {
  private readonly trabajoService = inject(TrabajoService);
  private readonly repuestoService = inject(RepuestoService);
  private readonly tokenService = inject(TokenService);
  private readonly toast = inject(ToastService);

  readonly ordenId = input.required<string>();
  readonly totales = input.required<Totales>();

  readonly cotizacionCambiada = output<void>();

  readonly trabajos = signal<Trabajo[]>([]);
  readonly mensajeError = signal<string | null>(null);
  readonly trabajoEnEdicion = signal<string | null>(null);

  readonly descripcion = signal<string>('');
  readonly cantidad = signal<string>('1');
  readonly precio = signal<string>('0');

  readonly rotulos = ROTULO_MARCA;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.trabajoService.obtenerPorOrden(this.ordenId()).subscribe({
      next: (datos) => this.trabajos.set(datos),
      error: () => this.mensajeError.set('No se pudieron cargar los trabajos'),
    });
  }

  marca(trabajo: Trabajo): MarcaAprobacion {
    return marcaDe(trabajo);
  }

  estaCotizado(trabajo: Trabajo): boolean {
    return marcaDe(trabajo) !== 'sin-cotizar';
  }

  puedeCotizar(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER);
  }

  abrirEditor(trabajoId: string): void {
    this.trabajoEnEdicion.set(trabajoId);
    this.descripcion.set('');
    this.cantidad.set('1');
    this.precio.set('0');
  }

  cerrarEditor(): void {
    this.trabajoEnEdicion.set(null);
  }

  borrador(): RepuestoRequest | null {
    return repuestoValido({
      descripcion: this.descripcion(),
      cantidad: this.cantidad(),
      precio_unitario: this.precio(),
    });
  }

  agregarRepuesto(): void {
    const trabajoId = this.trabajoEnEdicion();
    const peticion = this.borrador();
    if (!trabajoId || !peticion) return;

    this.repuestoService.crear(trabajoId, peticion).subscribe({
      next: () => {
        this.cerrarEditor();
        this.cargar();
        this.cotizacionCambiada.emit();
        this.toast.exito('Se agregó el repuesto');
      },
      error: (error) => this.toast.error(error.error?.message ?? 'No se pudo agregar el repuesto'),
    });
  }

  eliminarRepuesto(id: string): void {
    this.repuestoService.eliminar(id).subscribe({
      next: () => {
        this.cargar();
        this.cotizacionCambiada.emit();
        this.toast.exito('Se quitó el repuesto');
      },
      error: (error) => this.toast.error(error.error?.message ?? 'No se pudo quitar el repuesto'),
    });
  }
}
