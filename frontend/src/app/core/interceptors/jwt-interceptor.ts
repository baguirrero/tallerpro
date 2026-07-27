import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.obtenerToken();

  if (token && req.url.startsWith(environment.apiUrl)) {
    const peticionConToken = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(peticionConToken);
  }

  return next(req);
};
