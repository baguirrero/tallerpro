import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repuesto } from './entities/repuesto.entity';
import { Trabajo } from '../trabajos/entities/trabajo.entity';
import { RepuestosService } from './repuestos.service';
import { RepuestosController } from './repuestos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Repuesto, Trabajo])],
  providers: [RepuestosService],
  controllers: [RepuestosController],
  exports: [TypeOrmModule],
})
export class RepuestosModule {}
