import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { Orden } from '../ordenes/entities/orden.entity';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo, Orden])],
  providers: [VehiculosService],
  controllers: [VehiculosController],
  exports: [TypeOrmModule, VehiculosService],
})
export class VehiculosModule {}
