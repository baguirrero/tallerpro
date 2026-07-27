import { Mecanico } from './usuario.model';

export interface Adjunto {
  id: string;
  nombre_original: string;
  nombre_archivo: string;
  tipo_mime: string;
  tamano: number;
  created_at: string;
  subido_por: Mecanico;
}
