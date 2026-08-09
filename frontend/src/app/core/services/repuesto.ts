import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Repuesto, RepuestoRequest } from '../models/repuesto.model';
import { MensajeResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class RepuestoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/repuestos`;

  crear(trabajoId: string, datos: RepuestoRequest): Observable<Repuesto> {
    return this.http.post<Repuesto>(`${this.url}/trabajo/${trabajoId}`, datos);
  }

  eliminar(id: string): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.url}/${id}`);
  }
}
