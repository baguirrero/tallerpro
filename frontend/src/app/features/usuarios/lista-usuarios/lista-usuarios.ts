import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { UsuarioService } from '../../../core/services/usuario';
import { Usuario } from '../../../core/models/usuario.model';
import { Spinner } from '../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-lista-usuarios',
  imports: [DatePipe, Spinner],
  templateUrl: './lista-usuarios.html',
  styles: ``,
})
export class ListaUsuarios implements OnInit {
  private readonly usuarioService = inject(UsuarioService);

  readonly cargando = signal<boolean>(true);
  readonly mensajeError = signal<string | null>(null);
  readonly usuarios = signal<Usuario[]>([]);

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  private cargarUsuarios(): void {
    this.usuarioService.obtenerTodos().subscribe({
      next: (datos) => {
        this.usuarios.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudieron cargar los usuarios');
        this.cargando.set(false);
      },
    });
  }

  cambiarEstado(usuario: Usuario): void {
    const nuevoEstado = !usuario.activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    const confirmado = confirm(`¿Desea ${accion} al usuario ${usuario.username}?`);
    if (!confirmado) return;

    this.usuarioService.cambiarEstado(usuario.id, nuevoEstado).subscribe({
      next: () => {
        this.usuarios.update((lista) =>
          lista.map((item) => (item.id === usuario.id ? { ...item, activo: nuevoEstado } : item)),
        );
      },
      error: (error) => {
        this.mensajeError.set(error.error?.message ?? 'No se pudo cambiar el estado');
      },
    });
  }

  nombresRoles(usuario: Usuario): string {
    return usuario.roles.map((rol) => rol.nombre).join(', ') || 'Sin rol';
  }
}
