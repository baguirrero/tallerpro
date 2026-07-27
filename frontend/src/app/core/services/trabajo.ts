import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Trabajo, TrabajoRequest } from '../models/trabajo.model';
import { MensajeResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class TrabajoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/trabajos`;

  obtenerPorOrden(ordenId: string): Observable<Trabajo[]> {
    return this.http.get<Trabajo[]>(`${this.url}/orden/${ordenId}`);
  }

  obtenerMisTrabajos(): Observable<Trabajo[]> {
    return this.http.get<Trabajo[]>(`${this.url}/mis-trabajos`);
  }

  crear(datos: TrabajoRequest): Observable<Trabajo> {
    return this.http.post<Trabajo>(this.url, datos);
  }

  actualizar(id: string, datos: Partial<TrabajoRequest>): Observable<Trabajo> {
    return this.http.patch<Trabajo>(`${this.url}/${id}`, datos);
  }

  cambiarEstado(id: string, estado: string): Observable<Trabajo> {
    return this.http.patch<Trabajo>(`${this.url}/${id}/estado`, { estado });
  }

  eliminar(id: string): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.url}/${id}`);
  }
}
