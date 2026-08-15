import { Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, filter, map, of, switchMap } from 'rxjs';

import { OrdenService } from '../../../core/services/orden';
import { VehiculoService } from '../../../core/services/vehiculo';
import { Diferencia, Vehiculo } from '../../../core/models/vehiculo.model';
import { Campo } from '../../../shared/ui/campo';
import { Area } from '../../../shared/ui/area';
import { Boton } from '../../../shared/ui/boton';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { Esqueleto } from '../../../shared/ui/esqueleto';
import { ToastService } from '../../../shared/ui/toast';

@Component({
  selector: 'app-formulario-orden',
  imports: [ReactiveFormsModule, RouterLink, Campo, Area, Boton, Tarjeta, Esqueleto],
  templateUrl: './formulario-orden.html',
  styleUrl: './formulario-orden.css',
})
export class FormularioOrden implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ordenService = inject(OrdenService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly toast = inject(ToastService);

  readonly guardando = signal<boolean>(false);
  readonly cargando = signal<boolean>(false);
  /** Solo el fallo al cargar la orden a editar. Lo que sale mal al guardar
   *  va por toast: es el resultado de una acción, no una pantalla vacía. */
  readonly errorDeCarga = signal<string | null>(null);
  readonly ordenId = signal<string | null>(null);
  readonly vehiculoConocido = signal<Vehiculo | null>(null);
  readonly diferencias = signal<Diferencia[]>([]);

  readonly formulario = this.fb.nonNullable.group({
    descripcion: ['', [Validators.required, Validators.minLength(5)]],
    fecha_ingreso: ['', [Validators.required]],
    fecha_entrega: [''],
    placa: ['', [Validators.required, Validators.minLength(6)]],
    marca: ['', [Validators.required]],
    modelo: ['', [Validators.required]],
    anio: [new Date().getFullYear(), [Validators.min(1950), Validators.max(2100)]],
    propietario_nombre: ['', [Validators.required]],
    propietario_telefono: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    // Al dejar de teclear la placa se busca el vehículo. El 404 de "placa
    // desconocida" no es un error que mostrar: significa que el auto es nuevo.
    this.formulario.controls.placa.valueChanges
      .pipe(
        debounceTime(400),
        map((placa) => placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase()),
        distinctUntilChanged(),
        filter((placa) => placa.length >= 6),
        switchMap((placa) =>
          this.vehiculoService.buscarPorPlaca(placa).pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((vehiculo) => {
        this.vehiculoConocido.set(vehiculo);

        if (vehiculo && !this.esEdicion) {
          this.formulario.patchValue(
            {
              marca: vehiculo.marca,
              modelo: vehiculo.modelo,
              anio: vehiculo.anio ?? new Date().getFullYear(),
              propietario_nombre: vehiculo.propietario_nombre,
              propietario_telefono: vehiculo.propietario_telefono,
            },
            { emitEvent: false },
          );
        }
      });
  }

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
          fecha_ingreso: orden.fecha_ingreso?.substring(0, 10) ?? '',
          fecha_entrega: orden.fecha_entrega?.substring(0, 10) ?? '',
          placa: orden.vehiculo.placa,
          marca: orden.vehiculo.marca,
          modelo: orden.vehiculo.modelo,
          anio: orden.vehiculo.anio ?? new Date().getFullYear(),
          propietario_nombre: orden.vehiculo.propietario_nombre,
          propietario_telefono: orden.vehiculo.propietario_telefono,
        });
        this.cargando.set(false);
      },
      error: () => {
        this.errorDeCarga.set('No se pudo cargar la orden solicitada');
        this.cargando.set(false);
      },
    });
  }

  enviar(actualizarVehiculo = false): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);

    const valores = this.formulario.getRawValue();

    const datos: any = {
      descripcion: valores.descripcion,
      fecha_ingreso: valores.fecha_ingreso,
      placa: valores.placa,
      marca: valores.marca,
      modelo: valores.modelo,
      propietario_nombre: valores.propietario_nombre,
      propietario_telefono: valores.propietario_telefono,
    };
    if (actualizarVehiculo) datos.actualizar_vehiculo = true;
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

  /** Confirma pisar los datos del vehículo y reenvía la misma orden. */
  confirmarActualizacionDelVehiculo(): void {
    this.diferencias.set([]);
    this.enviar(true);
  }

  descartarActualizacion(): void {
    this.diferencias.set([]);
  }

  private manejarError(error: any): void {
    this.guardando.set(false);

    // El 409 no es un error que mostrar: es la API pidiendo confirmación.
    if (error.status === 409 && Array.isArray(error.error?.diferencias)) {
      this.diferencias.set(error.error.diferencias);
      return;
    }

    const mensaje = error.error?.message;
    this.toast.error(
      Array.isArray(mensaje) ? mensaje.join('. ') : (mensaje ?? 'No se pudo guardar la orden'),
    );
  }

  cancelar(): void {
    this.router.navigate(['/ordenes']);
  }
}
