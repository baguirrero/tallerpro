import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TokenService } from '../../../core/services/token';
import { AuthService } from '../../../core/services/auth';
import { ROLES } from '../../../core/models/estados';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styles: ``,
})
export class Navbar {
  readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);

  esAdministrador(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR);
  }

  puedeCrearOrdenes(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR);
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}
