import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync, unlinkSync } from 'fs';
import { Adjunto } from './entities/adjunto.entity';

@Injectable()
export class AdjuntosService {
  constructor(
    @InjectRepository(Adjunto)
    private readonly adjuntoRepository: Repository<Adjunto>,
  ) {}

  async guardar(archivo: Express.Multer.File, trabajoId: string, usuarioId: string) {
    const nuevoAdjunto = this.adjuntoRepository.create({
      nombre_original: archivo.originalname,
      nombre_archivo: archivo.filename,
      ruta: archivo.path,
      tipo_mime: archivo.mimetype,
      tamano: archivo.size,
      trabajo: { id: trabajoId } as any,
      subido_por: { id: usuarioId } as any,
    });

    return await this.adjuntoRepository.save(nuevoAdjunto);
  }

  async obtenerPorTrabajo(trabajoId: string) {
    return await this.adjuntoRepository.find({
      where: { trabajo: { id: trabajoId } },
      relations: { subido_por: true },
      select: {
        id: true,
        nombre_original: true,
        nombre_archivo: true,
        tipo_mime: true,
        tamano: true,
        created_at: true,
        subido_por: { id: true, username: true, nombres: true, apellidos: true },
      },
      order: { created_at: 'DESC' },
    });
  }

  async eliminar(id: string) {
    const adjunto = await this.adjuntoRepository.findOne({ where: { id } });
    if (!adjunto) {
      throw new NotFoundException(`No existe el adjunto con id ${id}`);
    }

    if (existsSync(adjunto.ruta)) {
      unlinkSync(adjunto.ruta);
    }
    await this.adjuntoRepository.remove(adjunto);

    return { mensaje: 'Adjunto eliminado correctamente' };
  }
}
