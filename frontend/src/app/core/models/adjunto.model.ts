import { Mecanico } from './usuario.model';

export interface Adjunto {
  id: string;
  nombre_original: string;
  /** La resuelve la API: en producción es una URL firmada de cinco minutos,
   *  así que el frontend no puede ni debe construirla. */
  url: string;
  tipo_mime: string;
  tamano: number;
  created_at: string;
  subido_por: Mecanico;
}
