import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenService } from './token';
import {
  CambiarPasswordRequest,
  LoginRequest,
  LoginResponse,
  MensajeResponse,
  RegistroRequest,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  private readonly url = `${environment.apiUrl}/auth`;

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.url}/login`, credenciales).pipe(
      tap((respuesta) => {
        this.tokenService.guardarSesion(respuesta.access_token, respuesta.usuario);
      }),
    );
  }

  registro(datos: RegistroRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.url}/registro`, datos);
  }

  cambiarPassword(datos: CambiarPasswordRequest): Observable<MensajeResponse> {
    return this.http.patch<MensajeResponse>(`${this.url}/cambiar-password`, datos);
  }

  logout(): void {
    this.tokenService.limpiarSesion();
    this.router.navigate(['/auth/login']);
  }
}
