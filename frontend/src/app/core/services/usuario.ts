import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Mecanico, Usuario } from '../models/usuario.model';
import { MensajeResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios`;

  obtenerTodos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url);
  }

  obtenerMecanicos(): Observable<Mecanico[]> {
    return this.http.get<Mecanico[]>(`${this.url}/mecanicos`);
  }

  cambiarEstado(id: string, activo: boolean): Observable<MensajeResponse> {
    return this.http.patch<MensajeResponse>(`${this.url}/${id}/estado`, { activo });
  }
}
