import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Adjunto } from './entities/adjunto.entity';
import { AdjuntosService } from './adjuntos.service';
import { AdjuntosController } from './adjuntos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Adjunto])],
  providers: [AdjuntosService],
  controllers: [AdjuntosController],
  // AdjuntosService se exporta para que Trabajos y Órdenes puedan limpiar
  // los archivos del almacenamiento antes de borrar en cascada.
  exports: [TypeOrmModule, AdjuntosService],
})
export class AdjuntosModule {}
