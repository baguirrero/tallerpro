import { computed, Injectable, signal } from '@angular/core';
import { UsuarioSesion } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly CLAVE_TOKEN = 'taller_token';
  private readonly CLAVE_USUARIO = 'taller_usuario';

  private readonly _token = signal<string | null>(this.leerTokenDeStorage());
  private readonly _usuario = signal<UsuarioSesion | null>(this.leerUsuarioDeStorage());

  readonly usuario = this._usuario.asReadonly();
  readonly estaAutenticado = computed(() => this._token() !== null);
  readonly rolPrincipal = computed(() => this._usuario()?.roles[0] ?? '');
  readonly nombreCompleto = computed(() => {
    const usuario = this._usuario();
    return usuario ? `${usuario.nombres} ${usuario.apellidos}` : '';
  });

  guardarSesion(token: string, usuario: UsuarioSesion): void {
    localStorage.setItem(this.CLAVE_TOKEN, token);
    localStorage.setItem(this.CLAVE_USUARIO, JSON.stringify(usuario));
    this._token.set(token);
    this._usuario.set(usuario);
  }

  obtenerToken(): string | null {
    return this._token();
  }

  limpiarSesion(): void {
    localStorage.removeItem(this.CLAVE_TOKEN);
    localStorage.removeItem(this.CLAVE_USUARIO);
    this._token.set(null);
    this._usuario.set(null);
  }

  tieneRol(...rolesPermitidos: string[]): boolean {
    const rolesDelUsuario = this._usuario()?.roles ?? [];
    return rolesPermitidos.some((rol) => rolesDelUsuario.includes(rol));
  }

  private leerTokenDeStorage(): string | null {
    return localStorage.getItem(this.CLAVE_TOKEN);
  }

  private leerUsuarioDeStorage(): UsuarioSesion | null {
    const guardado = localStorage.getItem(this.CLAVE_USUARIO);
    return guardado ? JSON.parse(guardado) : null;
  }
}
