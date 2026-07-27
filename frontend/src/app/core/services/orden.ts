import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Estadisticas, Orden, OrdenRequest } from '../models/orden.model';
import { MensajeResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class OrdenService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/ordenes`;

  obtenerTodas(estado?: string): Observable<Orden[]> {
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<Orden[]>(this.url, { params });
  }

  obtenerPorId(id: string): Observable<Orden> {
    return this.http.get<Orden>(`${this.url}/${id}`);
  }

  obtenerEstadisticas(): Observable<Estadisticas> {
    return this.http.get<Estadisticas>(`${this.url}/estadisticas`);
  }

  crear(datos: OrdenRequest): Observable<Orden> {
    return this.http.post<Orden>(this.url, datos);
  }

  actualizar(id: string, datos: Partial<OrdenRequest>): Observable<Orden> {
    return this.http.patch<Orden>(`${this.url}/${id}`, datos);
  }

  eliminar(id: string): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.url}/${id}`);
  }
}
