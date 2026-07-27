import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Adjunto } from '../models/adjunto.model';
import { MensajeResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AdjuntoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/adjuntos`;

  obtenerPorTrabajo(trabajoId: string): Observable<Adjunto[]> {
    return this.http.get<Adjunto[]>(`${this.url}/trabajo/${trabajoId}`);
  }

  subir(trabajoId: string, archivo: File): Observable<Adjunto> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<Adjunto>(`${this.url}/trabajo/${trabajoId}`, formData);
  }

  eliminar(id: string): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.url}/${id}`);
  }

  obtenerUrl(nombreArchivo: string): string {
    return `${environment.apiUrl}/uploads/${nombreArchivo}`;
  }
}
