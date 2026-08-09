import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Vehiculo, VehiculoConHistorial } from '../models/vehiculo.model';

@Injectable({
  providedIn: 'root',
})
export class VehiculoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/vehiculos`;

  buscarPorPlaca(placa: string): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.url}/placa/${encodeURIComponent(placa)}`);
  }

  obtenerPorId(id: string): Observable<VehiculoConHistorial> {
    return this.http.get<VehiculoConHistorial>(`${this.url}/${id}`);
  }
}
