import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { OrdenService } from '../../../core/services/orden';
import { Spinner } from '../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-formulario-orden',
  imports: [ReactiveFormsModule, Spinner],
  templateUrl: './formulario-orden.html',
  styles: ``,
})
export class FormularioOrden implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ordenService = inject(OrdenService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly guardando = signal<boolean>(false);
  readonly cargando = signal<boolean>(false);
  readonly mensajeError = signal<string | null>(null);
  readonly ordenId = signal<string | null>(null);

  readonly formulario = this.fb.nonNullable.group({
    descripcion: ['', [Validators.required, Validators.minLength(5)]],
    presupuesto: [0, [Validators.min(0)]],
    fecha_ingreso: ['', [Validators.required]],
    fecha_entrega: [''],
    placa: ['', [Validators.required, Validators.minLength(6)]],
    marca: ['', [Validators.required]],
    modelo: ['', [Validators.required]],
    anio: [new Date().getFullYear(), [Validators.min(1950), Validators.max(2100)]],
    cliente_nombre: ['', [Validators.required]],
    cliente_telefono: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.ordenId.set(id);
      this.cargarOrden(id);
    } else {
      const hoy = new Date().toISOString().substring(0, 10);
      this.formulario.patchValue({ fecha_ingreso: hoy });
    }
  }

  get esEdicion(): boolean {
    return this.ordenId() !== null;
  }

  private cargarOrden(id: string): void {
    this.cargando.set(true);

    this.ordenService.obtenerPorId(id).subscribe({
      next: (orden) => {
        this.formulario.patchValue({
          descripcion: orden.descripcion,
          presupuesto: orden.presupuesto ?? 0,
          fecha_ingreso: orden.fecha_ingreso?.substring(0, 10) ?? '',
          fecha_entrega: orden.fecha_entrega?.substring(0, 10) ?? '',
          placa: orden.placa,
          marca: orden.marca,
          modelo: orden.modelo,
          anio: orden.anio ?? new Date().getFullYear(),
          cliente_nombre: orden.cliente_nombre,
          cliente_telefono: orden.cliente_telefono,
        });
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudo cargar la orden');
        this.cargando.set(false);
      },
    });
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.mensajeError.set(null);

    const valores = this.formulario.getRawValue();

    const datos: any = {
      descripcion: valores.descripcion,
      fecha_ingreso: valores.fecha_ingreso,
      placa: valores.placa,
      marca: valores.marca,
      modelo: valores.modelo,
      cliente_nombre: valores.cliente_nombre,
      cliente_telefono: valores.cliente_telefono,
    };
    if (valores.presupuesto > 0) datos.presupuesto = valores.presupuesto;
    if (valores.fecha_entrega) datos.fecha_entrega = valores.fecha_entrega;
    if (valores.anio) datos.anio = valores.anio;

    const id = this.ordenId();
    if (id) {
      this.ordenService.actualizar(id, datos).subscribe({
        next: () => this.router.navigate(['/ordenes', id]),
        error: (error) => this.manejarError(error),
      });
    } else {
      this.ordenService.crear(datos).subscribe({
        next: (orden) => this.router.navigate(['/ordenes', orden.id]),
        error: (error) => this.manejarError(error),
      });
    }
  }

  private manejarError(error: any): void {
    this.guardando.set(false);
    const mensaje = error.error?.message;
    this.mensajeError.set(
      Array.isArray(mensaje) ? mensaje.join('. ') : (mensaje ?? 'No se pudo guardar la orden'),
    );
  }

  cancelar(): void {
    this.router.navigate(['/ordenes']);
  }

  tieneError(campo: string, tipoError: string): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.hasError(tipoError) && control.touched;
  }
}
