import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comentario } from './entities/comentario.entity';
import { CrearComentarioDto } from './dto/crear-comentario.dto';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectRepository(Comentario)
    private readonly comentarioRepository: Repository<Comentario>,
  ) {}

  async crear(trabajoId: string, usuarioId: string, dto: CrearComentarioDto) {
    const nuevoComentario = this.comentarioRepository.create({
      contenido: dto.contenido,
      trabajo: { id: trabajoId } as any,
      usuario: { id: usuarioId } as any,
    });

    const guardado = await this.comentarioRepository.save(nuevoComentario);

    return await this.comentarioRepository.findOne({
      where: { id: guardado.id },
      relations: { usuario: true },
      select: {
        id: true,
        contenido: true,
        created_at: true,
        usuario: { id: true, username: true, nombres: true, apellidos: true },
      },
    });
  }

  async obtenerPorTrabajo(trabajoId: string) {
    return await this.comentarioRepository.find({
      where: { trabajo: { id: trabajoId } },
      relations: { usuario: true },
      select: {
        id: true,
        contenido: true,
        created_at: true,
        usuario: { id: true, username: true, nombres: true, apellidos: true },
      },
      order: { created_at: 'ASC' },
    });
  }
}
