import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

import { TrabajoService } from '../../../core/services/trabajo';
import { RepuestoService } from '../../../core/services/repuesto';
import { TokenService } from '../../../core/services/token';
import { Trabajo } from '../../../core/models/trabajo.model';
import { Totales } from '../../../core/models/repuesto.model';
import { ROLES } from '../../../core/models/estados';

@Component({
  selector: 'app-panel-cotizacion',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './panel-cotizacion.html',
  styles: ``,
})
export class PanelCotizacion implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly trabajoService = inject(TrabajoService);
  private readonly repuestoService = inject(RepuestoService);
  private readonly tokenService = inject(TokenService);

  readonly ordenId = input.required<string>();
  readonly totales = input.required<Totales>();

  readonly cotizacionCambiada = output<void>();

  readonly trabajos = signal<Trabajo[]>([]);
  readonly mensajeError = signal<string | null>(null);
  readonly trabajoEnEdicion = signal<string | null>(null);

  readonly formularioRepuesto = this.fb.nonNullable.group({
    descripcion: ['', [Validators.required]],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    precio_unitario: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.trabajoService.obtenerPorOrden(this.ordenId()).subscribe({
      next: (datos) => this.trabajos.set(datos),
      error: () => this.mensajeError.set('No se pudieron cargar los trabajos'),
    });
  }

  /** `null` y `undefined` son "sin cotizar"; `0` sí es un precio. */
  estaCotizado(trabajo: Trabajo): boolean {
    return trabajo.precio_mano_obra !== null && trabajo.precio_mano_obra !== undefined;
  }

  puedeCotizar(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER);
  }

  abrirEditor(trabajoId: string): void {
    this.trabajoEnEdicion.set(trabajoId);
    this.formularioRepuesto.reset({ descripcion: '', cantidad: 1, precio_unitario: 0 });
  }

  cerrarEditor(): void {
    this.trabajoEnEdicion.set(null);
  }

  agregarRepuesto(): void {
    const trabajoId = this.trabajoEnEdicion();
    if (!trabajoId || this.formularioRepuesto.invalid) {
      this.formularioRepuesto.markAllAsTouched();
      return;
    }

    this.mensajeError.set(null);

    this.repuestoService.crear(trabajoId, this.formularioRepuesto.getRawValue()).subscribe({
      next: () => {
        this.cerrarEditor();
        this.cargar();
        this.cotizacionCambiada.emit();
      },
      error: (error) => this.mensajeError.set(error.error?.message ?? 'No se pudo agregar'),
    });
  }

  eliminarRepuesto(id: string): void {
    this.repuestoService.eliminar(id).subscribe({
      next: () => {
        this.cargar();
        this.cotizacionCambiada.emit();
      },
      error: (error) => this.mensajeError.set(error.error?.message ?? 'No se pudo eliminar'),
    });
  }
}
