import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { rolesGuard } from './core/guards/roles-guard';
import { ROLES } from './core/models/estados';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login').then((c) => c.Login),
  },
  {
    path: 'auth/registro',
    loadComponent: () => import('./features/auth/registro/registro').then((c) => c.Registro),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((c) => c.Dashboard),
  },
  {
    path: 'ordenes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ordenes/lista-ordenes/lista-ordenes').then((c) => c.ListaOrdenes),
  },
  {
    path: 'ordenes/nueva',
    canActivate: [authGuard, rolesGuard],
    data: { roles: [ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR] },
    loadComponent: () =>
      import('./features/ordenes/formulario-orden/formulario-orden').then((c) => c.FormularioOrden),
  },
  {
    path: 'ordenes/:id/editar',
    canActivate: [authGuard, rolesGuard],
    data: { roles: [ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR] },
    loadComponent: () =>
      import('./features/ordenes/formulario-orden/formulario-orden').then((c) => c.FormularioOrden),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
