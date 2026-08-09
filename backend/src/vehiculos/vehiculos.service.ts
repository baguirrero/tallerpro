import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { Vehiculo } from './entities/vehiculo.entity';
import { Orden } from '../ordenes/entities/orden.entity';
import { normalizarPlaca } from './placa';
import { calcularTotales } from '../ordenes/totales';
import { compararVehiculo } from './comparar-vehiculo';

export interface DatosVehiculoEntrantes {
  placa: string;
  marca: string;
  modelo: string;
  anio?: number;
  propietario_nombre: string;
  propietario_telefono: string;
}

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
      relations: { trabajos: { repuestos: true } },
      select: {
        id: true,
        numero_orden: true,
        descripcion: true,
        estado: true,
        fecha_ingreso: true,
        fecha_entrega: true,
        trabajos: {
          id: true,
          precio_mano_obra: true,
          aprobado: true,
          repuestos: { id: true, cantidad: true, precio_unitario: true },
        },
      },
      order: { created_at: 'DESC' },
    });

    return {
      ...vehiculo,
      ordenes: ordenes.map(({ trabajos, ...orden }) => ({
        ...orden,
        totales: calcularTotales(trabajos ?? []),
      })),
    };
  }

  /**
   * Find-or-create del vehículo de una orden. Recibe el `manager` de la
   * transacción que está escribiendo la orden, para que una orden que falla no
   * deje un vehículo huérfano.
   */
  async resolverParaOrden(
    datos: DatosVehiculoEntrantes,
    actualizar: boolean,
    manager: EntityManager,
  ): Promise<Vehiculo> {
    const placa = normalizarPlaca(datos.placa);
    const existente = await manager.findOne(Vehiculo, { where: { placa } });

    if (!existente) {
      // Campo por campo y no `{ ...datos }`: cuando esto se llama desde
      // `actualizar`, `datos` viene mezclado con el vehículo actual de la orden
      // y arrastraría su `id`, con lo que TypeORM haría un UPDATE del vehículo
      // viejo —cambiándole la placa— en vez de crear uno nuevo.
      return await manager.save(
        manager.create(Vehiculo, {
          placa,
          marca: datos.marca,
          modelo: datos.modelo,
          anio: datos.anio,
          propietario_nombre: datos.propietario_nombre,
          propietario_telefono: datos.propietario_telefono,
        }),
      );
    }

    const diferencias = compararVehiculo(existente, datos);
    if (diferencias.length === 0) {
      return existente;
    }

    if (!actualizar) {
      throw new ConflictException({
        statusCode: 409,
        message: `La placa ${placa} ya está registrada con datos distintos`,
        diferencias,
      });
    }

    for (const { campo } of diferencias) {
      existente[campo] = datos[campo];
    }
    return await manager.save(existente);
  }
}
