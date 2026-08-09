import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdjuntosModule } from '../adjuntos/adjuntos.module';
import { VehiculosModule } from '../vehiculos/vehiculos.module';
import { TrabajosModule } from '../trabajos/trabajos.module';
import { Orden } from './entities/orden.entity';
import { OrdenesService } from './ordenes.service';
import { OrdenesController } from './ordenes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Orden]), AdjuntosModule, VehiculosModule, TrabajosModule],
  providers: [OrdenesService],
  controllers: [OrdenesController],
  exports: [TypeOrmModule],
})
export class OrdenesModule {}
