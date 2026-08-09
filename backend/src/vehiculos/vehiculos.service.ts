import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Vehiculo } from './entities/vehiculo.entity';
import { Orden } from '../ordenes/entities/orden.entity';
import { normalizarPlaca } from './placa';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepository: Repository<Vehiculo>,
    @InjectRepository(Orden)
    private readonly ordenRepository: Repository<Orden>,
  ) {}

  async buscarPorPlaca(placa: string) {
    const normalizada = normalizarPlaca(placa);

    const vehiculo = await this.vehiculoRepository.findOne({
      where: { placa: normalizada },
    });

    if (!vehiculo) {
      throw new NotFoundException(`No hay ningún vehículo con la placa ${normalizada}`);
    }
    return vehiculo;
  }

  /**
   * El historial se consulta aparte y no con `relations`, para poder elegir
   * columnas y orden sin depender del ordenamiento de relaciones de TypeORM.
   */
  async obtenerConHistorial(id: string) {
    const vehiculo = await this.vehiculoRepository.findOne({ where: { id } });
    if (!vehiculo) {
      throw new NotFoundException(`No existe el vehículo con id ${id}`);
    }

    const ordenes = await this.ordenRepository.find({
      where: { vehiculo: { id } },
      select: {
        id: true,
        numero_orden: true,
        descripcion: true,
        estado: true,
        presupuesto: true,
        fecha_ingreso: true,
        fecha_entrega: true,
      },
      order: { created_at: 'DESC' },
    });

    return { ...vehiculo, ordenes };
  }
}
