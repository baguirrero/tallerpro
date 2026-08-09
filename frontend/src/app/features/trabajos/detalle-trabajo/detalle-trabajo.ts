import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { ComentarioService } from '../../../core/services/comentario';
import { AdjuntoService } from '../../../core/services/adjunto';
import { TokenService } from '../../../core/services/token';
import { Comentario } from '../../../core/models/comentario.model';
import { Adjunto } from '../../../core/models/adjunto.model';
import { Trabajo } from '../../../core/models/trabajo.model';
import { ROLES } from '../../../core/models/estados';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';

@Component({
  selector: 'app-detalle-trabajo',
  imports: [ReactiveFormsModule, DatePipe, BadgeEstado],
  templateUrl: './detalle-trabajo.html',
  styles: ``,
})
export class DetalleTrabajo {
  private readonly fb = inject(FormBuilder);
  private readonly comentarioService = inject(ComentarioService);
  private readonly adjuntoService = inject(AdjuntoService);
  private readonly tokenService = inject(TokenService);

  readonly trabajo = input.required<Trabajo>();

  readonly comentarios = signal<Comentario[]>([]);
  readonly adjuntos = signal<Adjunto[]>([]);
  readonly enviandoComentario = signal<boolean>(false);
  readonly subiendoArchivo = signal<boolean>(false);
  readonly mensajeError = signal<string | null>(null);
  readonly archivoElegido = signal<File | null>(null);

  readonly formularioComentario = this.fb.nonNullable.group({
    contenido: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  constructor() {
    effect(() => {
      const trabajoActual = this.trabajo();
      if (trabajoActual) {
        this.cargarComentarios(trabajoActual.id);
        this.cargarAdjuntos(trabajoActual.id);
      }
    });
  }

  private cargarComentarios(trabajoId: string): void {
    this.comentarioService.obtenerPorTrabajo(trabajoId).subscribe({
      next: (datos) => this.comentarios.set(datos),
      error: () => this.comentarios.set([]),
    });
  }

  private cargarAdjuntos(trabajoId: string): void {
    this.adjuntoService.obtenerPorTrabajo(trabajoId).subscribe({
      next: (datos) => this.adjuntos.set(datos),
      error: () => this.adjuntos.set([]),
    });
  }

  enviarComentario(): void {
    if (this.formularioComentario.invalid) {
      this.formularioComentario.markAllAsTouched();
      return;
    }

    this.enviandoComentario.set(true);
    this.mensajeError.set(null);

    const contenido = this.formularioComentario.getRawValue().contenido;

    this.comentarioService.crear(this.trabajo().id, contenido).subscribe({
      next: (comentarioNuevo) => {
        this.comentarios.update((lista) => [...lista, comentarioNuevo]);
        this.formularioComentario.reset();
        this.enviandoComentario.set(false);
      },
      error: (error) => {
        this.enviandoComentario.set(false);
        this.mensajeError.set(error.error?.message ?? 'No se pudo publicar el comentario');
      },
    });
  }

  seleccionarArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.archivoElegido.set(input.files?.[0] ?? null);
  }

  subirArchivo(): void {
    const archivo = this.archivoElegido();
    if (!archivo) {
      this.mensajeError.set('Primero seleccione un archivo');
      return;
    }

    this.subiendoArchivo.set(true);
    this.mensajeError.set(null);

    this.adjuntoService.subir(this.trabajo().id, archivo).subscribe({
      next: () => {
        this.subiendoArchivo.set(false);
        this.archivoElegido.set(null);
        this.cargarAdjuntos(this.trabajo().id);
      },
      error: (error) => {
        this.subiendoArchivo.set(false);
        this.mensajeError.set(
          error.error?.message ?? 'No se pudo subir el archivo. Verifique el tipo y el tamaño.',
        );
      },
    });
  }

  eliminarAdjunto(adjunto: Adjunto): void {
    const confirmado = confirm(`¿Eliminar el archivo ${adjunto.nombre_original}?`);
    if (!confirmado) return;

    this.adjuntoService.eliminar(adjunto.id).subscribe({
      next: () => this.cargarAdjuntos(this.trabajo().id),
      error: (error) => {
        this.mensajeError.set(error.error?.message ?? 'No se pudo eliminar el archivo');
      },
    });
  }

  formatearTamano(bytes: number): string {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  puedeEliminarAdjuntos(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER);
  }
}
