import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trabajo } from './entities/trabajo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trabajo])],
  exports: [TypeOrmModule],
})
export class TrabajosModule {}
