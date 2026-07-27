import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Comentario } from '../models/comentario.model';

@Injectable({
  providedIn: 'root',
})
export class ComentarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/comentarios`;

  obtenerPorTrabajo(trabajoId: string): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`${this.url}/trabajo/${trabajoId}`);
  }

  crear(trabajoId: string, contenido: string): Observable<Comentario> {
    return this.http.post<Comentario>(`${this.url}/trabajo/${trabajoId}`, { contenido });
  }
}
