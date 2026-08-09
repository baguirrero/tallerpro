import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdjuntosModule } from '../adjuntos/adjuntos.module';
import { Trabajo } from './entities/trabajo.entity';
import { Repuesto } from '../repuestos/entities/repuesto.entity';
import { TrabajosService } from './trabajos.service';
import { TrabajosController } from './trabajos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Trabajo, Repuesto]), AdjuntosModule],
  providers: [TrabajosService],
  controllers: [TrabajosController],
  exports: [TypeOrmModule, TrabajosService],
})
export class TrabajosModule {}
