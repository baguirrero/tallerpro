import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { UsuarioService } from '../../../core/services/usuario';
import { Usuario } from '../../../core/models/usuario.model';
import { Boton } from '../../../shared/ui/boton';
import { Confirmar } from '../../../shared/ui/confirmar';
import { Esqueleto } from '../../../shared/ui/esqueleto';
import { ToastService } from '../../../shared/ui/toast';

@Component({
  selector: 'app-lista-usuarios',
  imports: [DatePipe, Boton, Confirmar, Esqueleto],
  templateUrl: './lista-usuarios.html',
  styleUrl: './lista-usuarios.css',
})
export class ListaUsuarios implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly toast = inject(ToastService);

  readonly cargando = signal<boolean>(true);
  /** Solo el fallo al cargar la lista. Lo que sale mal al activar o desactivar
   *  va por toast: es el resultado de una acción, no una pantalla vacía. */
  readonly mensajeError = signal<string | null>(null);
  readonly usuarios = signal<Usuario[]>([]);
  readonly usuarioACambiar = signal<Usuario | null>(null);

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

  mensajeDeConfirmacion(): string {
    const usuario = this.usuarioACambiar();
    if (!usuario) return '';
    const accion = usuario.activo ? 'desactivar' : 'activar';
    return `¿Seguro que desea ${accion} a ${usuario.username}?`;
  }

  confirmarCambioDeEstado(): void {
    const usuario = this.usuarioACambiar();
    if (!usuario) return;

    this.usuarioACambiar.set(null);
    this.usuarioService.cambiarEstado(usuario.id, !usuario.activo).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.toast.exito(`${usuario.username} quedó ${usuario.activo ? 'inactivo' : 'activo'}`);
      },
      error: (error) => this.toast.error(error.error?.message ?? 'No se pudo cambiar el estado'),
    });
  }

  nombresRoles(usuario: Usuario): string {
    return usuario.roles.map((rol) => rol.nombre).join(', ') || 'Sin rol';
  }
}
