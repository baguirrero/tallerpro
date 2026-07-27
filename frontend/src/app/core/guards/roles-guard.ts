import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token';

export const rolesGuard: CanActivateFn = (route) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const rolesPermitidos = (route.data['roles'] as string[]) ?? [];

  if (rolesPermitidos.length === 0 || tokenService.tieneRol(...rolesPermitidos)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
