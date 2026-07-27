import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trabajo } from './entities/trabajo.entity';
import { CrearTrabajoDto } from './dto/crear-trabajo.dto';
import { ActualizarTrabajoDto } from './dto/actualizar-trabajo.dto';
import { EstadoTrabajo, NombreRol } from '../common/enums/estados.enum';

@Injectable()
export class TrabajosService {
  constructor(
    @InjectRepository(Trabajo)
    private readonly trabajoRepository: Repository<Trabajo>,
  ) {}

  async crear(dto: CrearTrabajoDto, usuarioId: string) {
    const nuevoTrabajo = this.trabajoRepository.create({
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      prioridad: dto.prioridad,
      fecha_limite: dto.fecha_limite ? new Date(dto.fecha_limite) : undefined,
      orden: { id: dto.orden_id } as any,
      asignado_a: dto.asignado_a_id ? ({ id: dto.asignado_a_id } as any) : undefined,
      creado_por: { id: usuarioId } as any,
    });

    return await this.trabajoRepository.save(nuevoTrabajo);
  }

  async obtenerPorOrden(ordenId: string) {
    return await this.trabajoRepository.find({
      where: { orden: { id: ordenId } },
      relations: { asignado_a: true, creado_por: true },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        prioridad: true,
        estado: true,
        fecha_limite: true,
        created_at: true,
        asignado_a: { id: true, username: true, nombres: true, apellidos: true },
        creado_por: { id: true, username: true },
      },
      order: { created_at: 'ASC' },
    });
  }

  async obtenerMisTrabajos(usuarioId: string) {
    return await this.trabajoRepository.find({
      where: { asignado_a: { id: usuarioId } },
      relations: { orden: true },
      select: {
        id: true,
        titulo: true,
        prioridad: true,
        estado: true,
        fecha_limite: true,
        orden: { id: true, numero_orden: true, placa: true, marca: true, modelo: true },
      },
      order: { fecha_limite: 'ASC' },
    });
  }

  async obtenerPorId(id: string) {
    const trabajo = await this.trabajoRepository.findOne({
      where: { id },
      relations: { asignado_a: true, orden: true },
    });

    if (!trabajo) {
      throw new NotFoundException(`No existe el trabajo con id ${id}`);
    }
    return trabajo;
  }

  async actualizar(id: string, dto: ActualizarTrabajoDto) {
    const trabajo = await this.obtenerPorId(id);

    if (dto.titulo !== undefined) trabajo.titulo = dto.titulo;
    if (dto.descripcion !== undefined) trabajo.descripcion = dto.descripcion;
    if (dto.prioridad !== undefined) trabajo.prioridad = dto.prioridad;
    if (dto.fecha_limite !== undefined) trabajo.fecha_limite = new Date(dto.fecha_limite);
    if (dto.asignado_a_id !== undefined) {
      trabajo.asignado_a = { id: dto.asignado_a_id } as any;
    }

    return await this.trabajoRepository.save(trabajo);
  }

  async actualizarEstado(
    id: string,
    estado: EstadoTrabajo,
    usuarioId: string,
    rolesUsuario: string[],
  ) {
    const trabajo = await this.obtenerPorId(id);

    const esSupervisor =
      rolesUsuario.includes(NombreRol.ADMINISTRADOR) ||
      rolesUsuario.includes(NombreRol.JEFE_TALLER);

    if (!esSupervisor && trabajo.asignado_a?.id !== usuarioId) {
      throw new ForbiddenException(
        'Solo puede cambiar el estado de los trabajos asignados a usted',
      );
    }

    trabajo.estado = estado;
    return await this.trabajoRepository.save(trabajo);
  }

  async eliminar(id: string) {
    const trabajo = await this.obtenerPorId(id);
    await this.trabajoRepository.remove(trabajo);
    return { mensaje: 'Trabajo eliminado correctamente' };
  }
}
