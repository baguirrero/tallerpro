import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TokenService } from '../../core/services/token';
import { AuthService } from '../../core/services/auth';
import { TemaService } from '../../core/services/tema';
import { ROLES } from '../../core/models/estados';
import { Toast } from '../ui/toast';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, Toast],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly authService = inject(AuthService);
  readonly tokenService = inject(TokenService);
  readonly temaService = inject(TemaService);

  /** Solo gobierna el cajón en móvil; en escritorio la columna está siempre. */
  readonly cajonAbierto = signal<boolean>(false);
  readonly menuUsuarioAbierto = signal<boolean>(false);

  readonly puedeCrearOrdenes = computed(() =>
    this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER, ROLES.ASESOR),
  );

  readonly esAdministrador = computed(() => this.tokenService.tieneRol(ROLES.ADMINISTRADOR));

  /** Las iniciales del usuario para el avatar de la topbar. */
  readonly iniciales = computed(() => {
    const nombre = this.tokenService.nombreCompleto() ?? '';
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? '')
      .join('');
  });

  constructor() {
    // Con el cajón abierto, el fondo no se desplaza: si no, rodar la rueda
    // sobre el velo mueve la página de detrás y el cajón parece despegarse.
    effect(() => {
      document.body.style.overflow = this.cajonAbierto() ? 'hidden' : '';
    });
  }

  /** `Esc` cierra lo que esté abierto, empezando por lo más superficial. */
  @HostListener('document:keydown.escape')
  alEscape(): void {
    if (this.menuUsuarioAbierto()) {
      this.menuUsuarioAbierto.set(false);
      return;
    }
    this.cerrarCajon();
  }

  alternarCajon(): void {
    this.cajonAbierto.update((abierto) => !abierto);
  }

  cerrarCajon(): void {
    this.cajonAbierto.set(false);
  }

  alternarMenuUsuario(): void {
    this.menuUsuarioAbierto.update((abierto) => !abierto);
  }

  /** El mismo camino que usaba el navbar: limpia la sesión y navega al login. */
  cerrarSesion(): void {
    this.menuUsuarioAbierto.set(false);
    this.authService.logout();
  }
}
