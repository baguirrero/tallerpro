import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Repuesto } from './entities/repuesto.entity';
import { Trabajo } from '../trabajos/entities/trabajo.entity';
import { CrearRepuestoDto } from './dto/crear-repuesto.dto';

@Injectable()
export class RepuestosService {
  constructor(
    @InjectRepository(Repuesto)
    private readonly repuestoRepository: Repository<Repuesto>,
    @InjectRepository(Trabajo)
    private readonly trabajoRepository: Repository<Trabajo>,
  ) {}

  async crear(trabajoId: string, dto: CrearRepuestoDto) {
    const trabajo = await this.trabajoRepository.findOne({ where: { id: trabajoId } });
    if (!trabajo) {
      throw new NotFoundException(`No existe el trabajo con id ${trabajoId}`);
    }

    // Sin precio de mano de obra el trabajo no está cotizado, y sus repuestos
    // no sumarían en ningún total: dinero invisible.
    if (trabajo.precio_mano_obra == null) {
      throw new ConflictException(
        `El trabajo "${trabajo.titulo}" todavía no tiene precio de mano de obra: ponlo primero, aunque sea 0`,
      );
    }

    const nuevo = this.repuestoRepository.create({
      descripcion: dto.descripcion,
      cantidad: dto.cantidad,
      precio_unitario: dto.precio_unitario,
      trabajo: { id: trabajoId } as any,
    });

    return await this.repuestoRepository.save(nuevo);
  }

  async eliminar(id: string) {
    const repuesto = await this.repuestoRepository.findOne({ where: { id } });
    if (!repuesto) {
      throw new NotFoundException(`No existe el repuesto con id ${id}`);
    }

    await this.repuestoRepository.remove(repuesto);
    return { mensaje: 'Repuesto eliminado correctamente' };
  }
}
