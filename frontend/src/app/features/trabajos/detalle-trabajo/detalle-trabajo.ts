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
import { Pastilla } from '../../../shared/ui/pastilla';
import { Area } from '../../../shared/ui/area';
import { Boton } from '../../../shared/ui/boton';
import { Confirmar } from '../../../shared/ui/confirmar';
import { ToastService } from '../../../shared/ui/toast';

@Component({
  selector: 'app-detalle-trabajo',
  imports: [ReactiveFormsModule, DatePipe, Pastilla, Area, Boton, Confirmar],
  templateUrl: './detalle-trabajo.html',
  styleUrl: './detalle-trabajo.css',
})
export class DetalleTrabajo {
  private readonly fb = inject(FormBuilder);
  private readonly comentarioService = inject(ComentarioService);
  private readonly adjuntoService = inject(AdjuntoService);
  private readonly tokenService = inject(TokenService);
  private readonly toast = inject(ToastService);

  readonly trabajo = input.required<Trabajo>();

  readonly comentarios = signal<Comentario[]>([]);
  readonly adjuntos = signal<Adjunto[]>([]);
  readonly enviandoComentario = signal<boolean>(false);
  readonly subiendoArchivo = signal<boolean>(false);
  readonly mensajeError = signal<string | null>(null);
  readonly archivoElegido = signal<File | null>(null);
  /** El input de archivo está oculto, así que el nombre elegido hay que
   *  mostrarlo aparte: sin esto no hay señal de que se eligió algo. */
  readonly nombreArchivo = signal<string>('');
  readonly adjuntoAEliminar = signal<Adjunto | null>(null);

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
    const archivo = input.files?.[0] ?? null;
    this.archivoElegido.set(archivo);
    this.nombreArchivo.set(archivo?.name ?? '');
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
        this.nombreArchivo.set('');
        this.cargarAdjuntos(this.trabajo().id);
        this.toast.exito('Se subió el archivo');
      },
      error: (error) => {
        this.subiendoArchivo.set(false);
        this.mensajeError.set(
          error.error?.message ?? 'No se pudo subir el archivo. Verifique el tipo y el tamaño.',
        );
      },
    });
  }

  confirmarEliminacionDeAdjunto(): void {
    const adjunto = this.adjuntoAEliminar();
    if (!adjunto) return;

    this.adjuntoAEliminar.set(null);
    this.adjuntoService.eliminar(adjunto.id).subscribe({
      next: () => {
        this.cargarAdjuntos(this.trabajo().id);
        this.toast.exito('Se eliminó el archivo');
      },
      error: (error) => this.toast.error(error.error?.message ?? 'No se pudo eliminar el archivo'),
    });
  }

  formatearTamano(bytes: number): string {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  puedeEliminarAdjuntos(): boolean {
    return this.tokenService.tieneRol(ROLES.ADMINISTRADOR, ROLES.JEFE_TALLER);
  }
}
