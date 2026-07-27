import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Adjunto } from './entities/adjunto.entity';
import { AdjuntosService } from './adjuntos.service';
import { AdjuntosController } from './adjuntos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Adjunto])],
  providers: [AdjuntosService],
  controllers: [AdjuntosController],
  exports: [TypeOrmModule],
})
export class AdjuntosModule {}
