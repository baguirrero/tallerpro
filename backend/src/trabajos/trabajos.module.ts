import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trabajo } from './entities/trabajo.entity';
import { TrabajosService } from './trabajos.service';
import { TrabajosController } from './trabajos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Trabajo])],
  providers: [TrabajosService],
  controllers: [TrabajosController],
  exports: [TypeOrmModule],
})
export class TrabajosModule {}
