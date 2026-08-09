import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { VehiculoService } from '../../../core/services/vehiculo';
import { VehiculoConHistorial } from '../../../core/models/vehiculo.model';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';

@Component({
  selector: 'app-ficha-vehiculo',
  imports: [RouterLink, CurrencyPipe, DatePipe, Spinner, BadgeEstado],
  templateUrl: './ficha-vehiculo.html',
  styles: ``,
})
export class FichaVehiculo implements OnInit {
  private readonly vehiculoService = inject(VehiculoService);
  private readonly route = inject(ActivatedRoute);

  readonly cargando = signal<boolean>(true);
  readonly mensajeError = signal<string | null>(null);
  readonly vehiculo = signal<VehiculoConHistorial | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.vehiculoService.obtenerPorId(id).subscribe({
      next: (datos) => {
        this.vehiculo.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudo cargar el vehículo');
        this.cargando.set(false);
      },
    });
  }
}
