import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, EMPTY, throwError } from 'rxjs';
import { TokenService } from '../services/token';
import { ToastService } from '../../shared/ui/toast';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const token = tokenService.obtenerToken();

  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const peticionConToken = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(peticionConToken).pipe(
    catchError((error: unknown) => {
      // El login responde 401 a las credenciales equivocadas: eso lo muestra el
      // formulario, no es una sesión que venció.
      const esLogin = req.url === `${environment.apiUrl}/auth/login`;
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || esLogin) {
        return throwError(() => error);
      }

      // Cuando vence el token fallan juntas todas las peticiones en vuelo. Solo la
      // primera encuentra su token todavía vigente, así que solo ella cierra la
      // sesión y avisa; y si mientras tanto se entró de nuevo, la sesión nueva no
      // se toca.
      if (tokenService.obtenerToken() === token) {
        tokenService.limpiarSesion();
        toast.aviso('Su sesión venció. Inicie sesión nuevamente.');
        router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
      }

      // Se completa sin error para que cada pantalla no sume su propio mensaje al
      // aviso de sesión: la navegación al login las desmonta de todos modos.
      return EMPTY;
    }),
  );
};
