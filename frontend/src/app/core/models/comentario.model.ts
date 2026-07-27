import { Mecanico } from './usuario.model';

export interface Comentario {
  id: string;
  contenido: string;
  created_at: string;
  usuario: Mecanico;
}
